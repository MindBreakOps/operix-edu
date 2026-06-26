import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Plus, Edit, BookOpen, Trash2 } from 'lucide-react';

const theme = { navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b', success: '#10b981' };

export default function SubjectsEdu() {
  const { workspace } = useTenant();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', stage: 'ابتدائي', total_mark: 100, passing_mark: 50 });

  const fetchSubjects = async () => {
	if (!workspace) return;
	setIsLoading(true);
	const { data } = await supabase.from('subjects_edu').select('*').eq('workspace_id', workspace.id).order('stage').order('name');
	if (data) setSubjects(data);
	setIsLoading(false);
  };

  useEffect(() => { fetchSubjects(); }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { ...formData, workspace_id: workspace?.id };

	if (editingId) {
	  await supabase.from('subjects_edu').update(payload).eq('id', editingId);
	} else {
	  await supabase.from('subjects_edu').insert([payload]);
	}
	setIsModalOpen(false);
	fetchSubjects();
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع درجات الطلاب المرتبطة بها!')) return;
	await supabase.from('subjects_edu').delete().eq('id', id);
	fetchSubjects();
  };

  const openModal = (subject: any = null) => {
	if (subject) {
	  setEditingId(subject.id);
	  setFormData({ name: subject.name, stage: subject.stage, total_mark: subject.total_mark, passing_mark: subject.passing_mark });
	} else {
	  setEditingId(null);
	  setFormData({ name: '', stage: 'ابتدائي', total_mark: 100, passing_mark: 50 });
	}
	setIsModalOpen(true);
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
	  <style>{`@media print { body * { visibility: hidden; } #printable-area, #printable-area * { visibility: visible; } #printable-area { position: absolute; left: 0; top: 0; width: 100%; direction: rtl; } .no-print { display: none !important; } }`}</style>
	  
	  <div className="no-print" style={styles.header}>
		<div><h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>المواد الدراسية</h1><p style={{ margin: 0, color: theme.textMuted }}>إعداد المقررات ودرجات النجاح</p></div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة</button>
		  <button style={styles.btnPrimary} onClick={() => openModal()}><Plus size={18} /> إضافة مادة</button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		{isLoading ? <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead><tr><th style={styles.th}>المادة</th><th style={styles.th}>المرحلة</th><th style={styles.th}>الدرجة العظمى</th><th style={styles.th}>درجة النجاح</th><th className="no-print" style={styles.th}>إجراءات</th></tr></thead>
			<tbody>
			  {subjects.map(s => (
				<tr key={s.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={16} color={theme.royal} /> {s.name}</div></td>
				  <td style={styles.td}><span style={{ backgroundColor: theme.slate, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: `1px solid ${theme.border}` }}>{s.stage}</span></td>
				  <td style={{ ...styles.td, fontWeight: 900 }}>{s.total_mark}</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: theme.success }}>{s.passing_mark}</td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => openModal(s)} style={{ background: 'none', border: 'none', color: theme.royal, cursor: 'pointer', marginLeft: '12px' }}><Edit size={16} /></button>
					<button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
				  </td>
				</tr>
			  ))}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
		  <div style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
			<h2 style={{ margin: '0 0 24px 0', color: theme.navy }}>{editingId ? 'تعديل مادة' : 'إضافة مادة'}</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}><label style={{ fontWeight: 800 }}>اسم المادة</label><input required style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
			  <div style={styles.inputGroup}><label style={{ fontWeight: 800 }}>المرحلة</label><select style={styles.input} value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}><option>ابتدائي</option><option>متوسط</option><option>ثانوي</option></select></div>
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={styles.inputGroup}><label style={{ fontWeight: 800 }}>الدرجة العظمى</label><input type="number" required style={styles.input} value={formData.total_mark} onChange={e => setFormData({...formData, total_mark: parseInt(e.target.value)})} /></div>
				<div style={styles.inputGroup}><label style={{ fontWeight: 800 }}>درجة النجاح</label><input type="number" required style={styles.input} value={formData.passing_mark} onChange={e => setFormData({...formData, passing_mark: parseInt(e.target.value)})} /></div>
			  </div>
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