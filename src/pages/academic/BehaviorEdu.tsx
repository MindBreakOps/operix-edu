import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function BehaviorEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
	student_id: '', 
	record_type: 'تميز', 
	points: 0, 
	description: '', 
	date: new Date().toISOString().split('T')[0] 
  });

  const fetchData = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// Strict Data Isolation: Fetch behavior records ONLY for this portal
	const { data: bData } = await supabase
	  .from('behavior_edu')
	  .select('*, students_edu!inner(full_name, grade_level, portal_type)')
	  .eq('workspace_id', workspace.id)
	  .eq('students_edu.portal_type', portalType)
	  .order('date', { ascending: false });

	// Fetch students strictly isolated by portal for the dropdown
	const { data: sData } = await supabase
	  .from('students_edu')
	  .select('id, full_name')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType);

	if (bData) setRecords(bData);
	if (sData) setStudents(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = {
	  workspace_id: workspace?.id,
	  student_id: formData.student_id,
	  record_type: formData.record_type,
	  points: formData.record_type === 'مخالفة' ? -Math.abs(formData.points) : Math.abs(formData.points),
	  description: formData.description,
	  date: formData.date
	};

	const { error } = await supabase.from('behavior_edu').insert([payload]);
	if (!error) {
	  setIsModalOpen(false);
	  setFormData({ student_id: '', record_type: 'تميز', points: 0, description: '', date: new Date().toISOString().split('T')[0] });
	  fetchData();
	} else {
	  alert('حدث خطأ أثناء الحفظ');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
	await supabase.from('behavior_edu').delete().eq('id', id);
	fetchData();
  };

  return (
	<PageShell
	  title="السلوك والمواظبة"
	  subtitle="سجل المخالفات والإنجازات السلوكية لطلاب هذه البوابة"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> رصد حالة
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
		  جاري جلب السجلات...
		</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>التاريخ</th>
			  <th style={styles.th}>اسم الطالب</th>
			  <th style={styles.th}>النوع</th>
			  <th style={styles.th}>التفاصيل</th>
			  <th style={styles.th}>النقاط</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{records.map(r => (
			  <tr key={r.id}>
				<td style={{ ...styles.td, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{r.date}</td>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  {r.students_edu?.full_name}
				  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
					{r.students_edu?.grade_level}
				  </div>
				</td>
				<td style={styles.td}>
				  {r.record_type === 'تميز' ? 
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
					  <TrendingUp size={14} /> تميز
					</span> : 
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
					  <TrendingDown size={14} /> مخالفة
					</span>
				  }
				</td>
				<td style={styles.td}>{r.description}</td>
				<td style={{ ...styles.td, fontWeight: 900, color: r.points > 0 ? 'var(--color-success)' : 'var(--color-danger)' }} dir="ltr">
				  {r.points > 0 ? `+${r.points}` : r.points}
				</td>
				<td className="no-print" style={styles.td}>
				  <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					<Trash2 size={16} />
				  </button>
				</td>
			  </tr>
			))}
			{records.length === 0 && (
			  <tr>
				<td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				  لا توجد سجلات سلوكية في هذه البوابة.
				</td>
			  </tr>
			)}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>رصد حالة سلوكية</h2>
			<form onSubmit={handleSave}>
			  
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الطالب</label>
				<select required style={styles.input} value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
				  <option value="" disabled>اختر الطالب...</option>
				  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
				</select>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>نوع الحالة</label>
				  <select style={styles.input} value={formData.record_type} onChange={e => setFormData({...formData, record_type: e.target.value})}>
					<option>تميز</option>
					<option>مخالفة</option>
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>النقاط</label>
				  <input type="number" min="1" required style={styles.input} value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} />
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>وصف الحالة</label>
				<textarea required rows={3} style={{...styles.input, resize: 'vertical'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="اكتب تفاصيل الموقف هنا..." />
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>اعتماد الرصد</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</PageShell>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600 },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: { fontWeight: 800, color: 'var(--color-navy)', fontSize: '0.9rem' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, backgroundColor: 'var(--color-white)', color: 'var(--color-text-dark)' }
};