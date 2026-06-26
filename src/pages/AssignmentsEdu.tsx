import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Plus, Edit, FileSignature, Trash2 } from 'lucide-react';

const theme = { navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b' };

export default function AssignmentsEdu() {
  const { workspace } = useTenant();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', subject_id: '', teacher_id: '', grade_level: '', due_date: '', full_mark: 10 });

  const fetchData = async () => {
	if (!workspace) return;
	setIsLoading(true);
	
	const { data: aData } = await supabase.from('assignments_edu')
	  .select('*, subjects_edu(name), profiles(full_name)')
	  .eq('workspace_id', workspace.id).order('due_date', { ascending: false });

	const { data: tData } = await supabase.from('profiles').select('id, full_name').eq('workspace_id', workspace.id);
	const { data: sData } = await supabase.from('subjects_edu').select('id, name').eq('workspace_id', workspace.id);

	if (aData) setAssignments(aData);
	if (tData) setTeachers(tData);
	if (sData) setSubjects(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { ...formData, workspace_id: workspace?.id };
	const { error } = await supabase.from('assignments_edu').insert([payload]);
	if (!error) { setIsModalOpen(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('تأكيد حذف هذا الواجب؟')) return;
	await supabase.from('assignments_edu').delete().eq('id', id);
	fetchData();
  };

  const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	btnSecondary: { backgroundColor: theme.white, color: theme.navy, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	th: { backgroundColor: theme.slate, color: theme.textMuted, fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right' as const, borderBottom: `1px solid ${theme.border}` },
	td: { padding: '16px', borderBottom: `1px solid ${theme.border}`, color: theme.textDark, fontWeight: 600 },
	inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '16px' },
	input: { padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600 }
  };

  return (
	<div>
	  <div style={styles.header}>
		<div><h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>الواجبات والاختبارات</h1></div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}><Plus size={18} /> إضافة مهمة</button>
		</div>
	  </div>

	  <div style={styles.card}>
		{isLoading ? <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr><th style={styles.th}>العنوان</th><th style={styles.th}>المادة / المعلم</th><th style={styles.th}>الصف</th><th style={styles.th}>الدرجة</th><th style={styles.th}>تاريخ التسليم</th><th style={styles.th}>إجراءات</th></tr>
			</thead>
			<tbody>
			  {assignments.map(a => (
				<tr key={a.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}><FileSignature size={14} style={{marginLeft: '6px', color: theme.royal}}/> {a.title}</td>
				  <td style={styles.td}><div>{a.subjects_edu?.name}</div><div style={{fontSize: '0.75rem', color: theme.textMuted}}>{a.profiles?.full_name}</div></td>
				  <td style={styles.td}>{a.grade_level}</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: theme.royal }}>{a.full_mark}</td>
				  <td style={styles.td}>{a.due_date}</td>
				  <td style={styles.td}><button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
				</tr>
			  ))}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
		  <div style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
			<h2 style={{ margin: '0 0 24px 0', color: theme.navy, fontSize: '1.4rem', fontWeight: 900 }}>إضافة مهمة أكاديمية</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}><label style={{ fontWeight: 800 }}>عنوان المهمة</label><input required style={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}><label style={{ fontWeight: 800 }}>المادة</label><select required style={styles.input} value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}><option value="">اختر...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
				<div style={{ ...styles.inputGroup, flex: 1 }}><label style={{ fontWeight: 800 }}>المعلم</label><select required style={styles.input} value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}><option value="">اختر...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}><label style={{ fontWeight: 800 }}>تاريخ التسليم</label><input type="date" required style={styles.input} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} /></div>
				<div style={{ ...styles.inputGroup, flex: 1 }}><label style={{ fontWeight: 800 }}>الدرجة الكلية</label><input type="number" required style={styles.input} value={formData.full_mark} onChange={e => setFormData({...formData, full_mark: parseInt(e.target.value)})} /></div>
			  </div>

			  <div style={styles.inputGroup}><label style={{ fontWeight: 800 }}>الصف المستهدف</label><input required style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} placeholder="الصف الأول الثانوي" /></div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>حفظ</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</div>
  );
}