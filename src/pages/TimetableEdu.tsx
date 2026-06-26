import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Plus, TableProperties, Clock, Trash2 } from 'lucide-react';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', 
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b'
};

const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function TimetableEdu() {
  const { workspace } = useTenant();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
	day_of_week: 0, period_number: 1, grade_level: 'الصف الأول', section: 'أ', teacher_id: '', subject_id: ''
  });

  const fetchTimetable = async () => {
	if (!workspace) return;
	setIsLoading(true);
	
	// جلب الجدول مع بيانات المعلم والمادة
	const { data, error } = await supabase
	  .from('timetable_edu')
	  .select(`
		*,
		profiles:teacher_id (full_name),
		subjects_edu:subject_id (name)
	  `)
	  .eq('workspace_id', workspace.id)
	  .order('day_of_week')
	  .order('period_number');

	if (!error && data) setTimetable(data);
	setIsLoading(false);
  };

  const fetchDropdownData = async () => {
	if (!workspace) return;
	const { data: tData } = await supabase.from('profiles').select('id, full_name').eq('workspace_id', workspace.id);
	const { data: sData } = await supabase.from('subjects_edu').select('id, name').eq('workspace_id', workspace.id);
	if (tData) setTeachers(tData);
	if (sData) setSubjects(sData);
  };

  useEffect(() => {
	fetchTimetable();
	fetchDropdownData();
  }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!formData.teacher_id || !formData.subject_id) {
	  alert('الرجاء التأكد من وجود معلمين ومواد مسجلة في النظام');
	  return;
	}

	const payload = {
	  workspace_id: workspace?.id,
	  teacher_id: formData.teacher_id,
	  subject_id: formData.subject_id,
	  grade_level: formData.grade_level,
	  section: formData.section,
	  day_of_week: formData.day_of_week,
	  period_number: formData.period_number,
	  // افتراض ID وهمي للفصل الدراسي لحين برمجة صفحة الفصول
	  term_id: '00000000-0000-0000-0000-000000000000' 
	};

	const { error } = await supabase.from('timetable_edu').insert([payload]);
	if (error) {
	  alert('حدث خطأ. قد يكون هناك تعارض في حصص المعلم.');
	} else {
	  setIsModalOpen(false);
	  fetchTimetable();
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
	await supabase.from('timetable_edu').delete().eq('id', id);
	fetchTimetable();
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
		  <h1 style={styles.title}>الجدول المدرسي</h1>
		  <p style={styles.subtitle}>إدارة توزيع الحصص على الفصول والمعلمين</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة الجدول</button>
		  <button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}><Plus size={18} /> إضافة حصة</button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		{isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontWeight: 800 }}>جاري جلب الجدول...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>اليوم</th>
				<th style={styles.th}>الحصة</th>
				<th style={styles.th}>الصف والشعبة</th>
				<th style={styles.th}>المادة</th>
				<th style={styles.th}>المعلم</th>
				<th className="no-print" style={styles.th}>إجراءات</th>
			  </tr>
			</thead>
			<tbody>
			  {timetable.map(t => (
				<tr key={t.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					  <TableProperties size={16} color={theme.royal} />
					  {daysOfWeek[t.day_of_week]}
					</div>
				  </td>
				  <td style={styles.td}>
					<span style={{ backgroundColor: theme.slate, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: `1px solid ${theme.border}` }}>
					  الحصة {t.period_number}
					</span>
				  </td>
				  <td style={styles.td}>{t.grade_level} - {t.section}</td>
				  <td style={styles.td}>{t.subjects_edu?.name || '—'}</td>
				  <td style={styles.td}>{t.profiles?.full_name || '—'}</td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
					  <Trash2 size={16} />
					</button>
				  </td>
				</tr>
			  ))}
			  {timetable.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontWeight: 800 }}>لا توجد حصص مسجلة في الجدول.</td></tr>}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
			<h2 style={{ margin: '0 0 24px 0', color: theme.navy, fontSize: '1.4rem', fontWeight: 900 }}>تسكين حصة جديدة</h2>
			<form onSubmit={handleSave}>
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>اليوم</label>
				  <select style={styles.input} value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: parseInt(e.target.value)})}>
					{daysOfWeek.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>رقم الحصة</label>
				  <input type="number" min="1" max="8" required style={styles.input} value={formData.period_number} onChange={e => setFormData({...formData, period_number: parseInt(e.target.value)})} />
				</div>
			  </div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الصف</label>
				  <input required style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الشعبة</label>
				  <input required style={styles.input} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>المعلم</label>
				<select required style={styles.input} value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
				  <option value="" disabled>اختر المعلم...</option>
				  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
				</select>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>المادة</label>
				<select required style={styles.input} value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}>
				  <option value="" disabled>اختر المادة...</option>
				  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
				</select>
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>تسكين الحصة</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</div>
  );
}