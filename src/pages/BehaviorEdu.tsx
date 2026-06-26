import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Plus, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', 
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b',
  success: '#10b981', danger: '#ef4444'
};

export default function BehaviorEdu() {
  const { workspace } = useTenant();
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', record_type: 'تميز', points: 0, description: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
	if (!workspace) return;
	setIsLoading(true);
	
	// جلب سجلات السلوك مع اسم الطالب
	const { data: bData } = await supabase
	  .from('behavior_edu')
	  .select('*, students_edu(full_name, grade_level)')
	  .eq('workspace_id', workspace.id)
	  .order('date', { ascending: false });

	// جلب الطلاب للقائمة المنسدلة
	const { data: sData } = await supabase.from('students_edu').select('id, full_name').eq('workspace_id', workspace.id);

	if (bData) setRecords(bData);
	if (sData) setStudents(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

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
	  fetchData();
	} else {
	  alert('حدث خطأ أثناء الحفظ');
	}
  };

  const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
	title: { fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0', letterSpacing: '-0.5px' },
	subtitle: { fontSize: '0.95rem', color: theme.textMuted, margin: 0 },
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	btnSecondary: { backgroundColor: theme.white, color: theme.navy, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	th: { backgroundColor: theme.slate, color: theme.textMuted, fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right' as const, borderBottom: `1px solid ${theme.border}` },
	td: { padding: '16px', borderBottom: `1px solid ${theme.border}`, color: theme.textDark, fontWeight: 600 },
	modalOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
	inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '16px' },
	input: { padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600 }
  };

  return (
	<div>
	  <style>{`
		@media print {
		  body * { visibility: hidden; }
		  #printable-area, #printable-area * { visibility: visible; }
		  #printable-area { position: absolute; left: 0; top: 0; width: 100%; direction: rtl; }
		  .no-print { display: none !important; }
		}
	  `}</style>

	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>السلوك والمواظبة</h1>
		  <p style={styles.subtitle}>سجل المخالفات والإنجازات السلوكية للطلاب</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة التقرير</button>
		  <button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}><Plus size={18} /> رصد حالة</button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		{isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontWeight: 800 }}>جاري جلب السجلات...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>التاريخ</th>
				<th style={styles.th}>اسم الطالب</th>
				<th style={styles.th}>النوع</th>
				<th style={styles.th}>التفاصيل</th>
				<th style={styles.th}>النقاط</th>
			  </tr>
			</thead>
			<tbody>
			  {records.map(r => (
				<tr key={r.id}>
				  <td style={{ ...styles.td, color: theme.textMuted, fontSize: '0.85rem' }}>{r.date}</td>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}>
					{r.students_edu?.full_name}
					<div style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: '4px' }}>{r.students_edu?.grade_level}</div>
				  </td>
				  <td style={styles.td}>
					{r.record_type === 'تميز' ? 
					  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: theme.success, backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}><TrendingUp size={14} /> تميز</span> : 
					  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: theme.danger, backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}><TrendingDown size={14} /> مخالفة</span>
					}
				  </td>
				  <td style={styles.td}>{r.description}</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: r.points > 0 ? theme.success : theme.danger }} dir="ltr">
					{r.points > 0 ? `+${r.points}` : r.points}
				  </td>
				</tr>
			  ))}
			  {records.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontWeight: 800 }}>لا توجد سجلات سلوكية.</td></tr>}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
			<h2 style={{ margin: '0 0 24px 0', color: theme.navy, fontSize: '1.4rem', fontWeight: 900 }}>رصد حالة سلوكية</h2>
			<form onSubmit={handleSave}>
			  
			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الطالب</label>
				<select required style={styles.input} value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
				  <option value="" disabled>اختر الطالب...</option>
				  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
				</select>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>نوع الحالة</label>
				  <select style={styles.input} value={formData.record_type} onChange={e => setFormData({...formData, record_type: e.target.value})}>
					<option>تميز</option>
					<option>مخالفة</option>
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>النقاط</label>
				  <input type="number" min="1" required style={styles.input} value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} />
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>وصف الحالة</label>
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
	</div>
  );
}