import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function AssignmentsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
	subject_id: '', 
	title: '', 
	description: '', 
	grade_level: 'الصف الأول', 
	due_date: new Date().toISOString().split('T')[0],
	full_mark: 10
  });

  const fetchData = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// Strict Portal Isolation for Assignments
	const { data: aData } = await supabase
	  .from('assignments_edu')
	  .select('*, subjects_edu!inner(name, portal_type), profiles(full_name)')
	  .eq('workspace_id', workspace.id)
	  .eq('subjects_edu.portal_type', portalType)
	  .order('due_date', { ascending: false });

	// Fetch subjects limited to this portal
	const { data: sData } = await supabase
	  .from('subjects_edu')
	  .select('id, name')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType);

	if (aData) setAssignments(aData);
	if (sData) setSubjects(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	
	// Determine teacher (Using the currently logged in user as the creator/teacher)
	const { data: userProfile } = await supabase.auth.getUser();
	if (!userProfile.user) return;

	const payload = {
	  workspace_id: workspace?.id,
	  portal_type: portalType,
	  teacher_id: userProfile.user.id,
	  subject_id: formData.subject_id,
	  title: formData.title,
	  description: formData.description,
	  grade_level: formData.grade_level,
	  due_date: formData.due_date,
	  full_mark: formData.full_mark
	};

	const { error } = await supabase.from('assignments_edu').insert([payload]);
	if (!error) {
	  setIsModalOpen(false);
	  setFormData({ subject_id: '', title: '', description: '', grade_level: 'الصف الأول', due_date: new Date().toISOString().split('T')[0], full_mark: 10 });
	  fetchData();
	} else {
	  alert('حدث خطأ أثناء حفظ الواجب.');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
	await supabase.from('assignments_edu').delete().eq('id', id);
	fetchData();
  };

  return (
	<PageShell
	  title="الواجبات والمهام"
	  subtitle="إدارة الواجبات والأنشطة الأكاديمية لطلاب البوابة"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> إضافة واجب
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
		  جاري جلب البيانات...
		</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>تاريخ التسليم</th>
			  <th style={styles.th}>عنوان الواجب</th>
			  <th style={styles.th}>المادة والصف</th>
			  <th style={styles.th}>المعلم</th>
			  <th style={styles.th}>الدرجة</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{assignments.map(a => (
			  <tr key={a.id}>
				<td style={{ ...styles.td, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{a.due_date}</td>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  {a.title}
				  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
					{a.description}
				  </div>
				</td>
				<td style={styles.td}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<BookOpen size={14} color="var(--color-royal)" />
					<span style={{ fontWeight: 800 }}>{a.subjects_edu?.name}</span>
				  </div>
				  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{a.grade_level}</div>
				</td>
				<td style={styles.td}>{a.profiles?.full_name || '—'}</td>
				<td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-navy)' }}>{a.full_mark}</td>
				<td className="no-print" style={styles.td}>
				  <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					<Trash2 size={16} />
				  </button>
				</td>
			  </tr>
			))}
			{assignments.length === 0 && (
			  <tr>
				<td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				  لا توجد واجبات مسجلة.
				</td>
			  </tr>
			)}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>إضافة واجب جديد</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>عنوان الواجب</label>
				<input required style={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: حل التمارين ص 45" />
			  </div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>المادة</label>
				  <select required style={styles.input} value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}>
					<option value="" disabled>اختر المادة...</option>
					{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الصف</label>
				  <input required style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} />
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>تاريخ التسليم</label>
				  <input type="date" required style={styles.input} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الدرجة</label>
				  <input type="number" min="1" required style={styles.input} value={formData.full_mark} onChange={e => setFormData({...formData, full_mark: parseInt(e.target.value)})} />
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>الوصف (اختياري)</label>
				<textarea rows={2} style={{...styles.input, resize: 'vertical'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>حفظ التكليف</button>
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