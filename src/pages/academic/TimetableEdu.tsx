import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, TableProperties, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// دالة مساعدة لتحديد الصفوف الدراسية المتاحة بناءً على البوابة الحالية
const getGradesForPortal = (portal?: string) => {
  switch(portal) {
	case 'kindergarten': return ['روضة أولى', 'روضة ثانية', 'تمهيدي'];
	case 'elementary': return ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];
	case 'intermediate': return ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'];
	case 'secondary': return ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];
	default: return ['الصف الأول'];
  }
};

export default function TimetableEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // الخيارات الديناميكية للصفوف
  const availableGrades = getGradesForPortal(portalType);

  const [formData, setFormData] = useState({
	day_of_week: 0, 
	period_number: 1, 
	grade_level: availableGrades[0], // تعيين أول صف كقيمة افتراضية
	section: 'أ', 
	teacher_id: '', 
	subject_id: ''
  });

  const fetchTimetable = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// Strict Data Isolation: Fetch timetable with joined tables, filtered by portal
	const { data, error } = await supabase
	  .from('timetable_edu')
	  .select(`
		*,
		profiles:teacher_id (full_name),
		subjects_edu!inner(name, portal_type)
	  `)
	  .eq('workspace_id', workspace.id)
	  .eq('subjects_edu.portal_type', portalType)
	  .order('day_of_week')
	  .order('period_number');

	if (!error && data) setTimetable(data);
	setIsLoading(false);
  };

  const fetchDropdownData = async () => {
	if (!workspace || !portalType) return;
	
	// Teachers span across portals, but Subjects must be strictly isolated
	const { data: tData } = await supabase
	  .from('profiles')
	  .select('id, full_name')
	  .eq('workspace_id', workspace.id);
	  
	const { data: sData } = await supabase
	  .from('subjects_edu')
	  .select('id, name')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType);

	if (tData) setTeachers(tData);
	if (sData) setSubjects(sData);
  };

  useEffect(() => {
	fetchTimetable();
	fetchDropdownData();
  }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!formData.teacher_id || !formData.subject_id) {
	  alert('الرجاء التأكد من وجود معلمين ومواد مسجلة في النظام');
	  return;
	}

	const payload = {
	  workspace_id: workspace?.id,
	  portal_type: portalType,
	  teacher_id: formData.teacher_id,
	  subject_id: formData.subject_id,
	  grade_level: formData.grade_level,
	  section: formData.section,
	  day_of_week: formData.day_of_week,
	  period_number: formData.period_number
	};

	const { error } = await supabase.from('timetable_edu').insert([payload]);
	
	if (error) {
	  console.error("السبب الحقيقي لرفض قاعدة البيانات:", error);
	  alert(`تعذر الحفظ: ${error.message}`); 
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

  // وظيفة فتح المودال مع تحديث الصف الافتراضي بناءً على البوابة
  const handleOpenModal = () => {
	setFormData({ ...formData, grade_level: availableGrades[0] });
	setIsModalOpen(true);
  };

  return (
	<PageShell
	  title="الجدول المدرسي"
	  subtitle="إدارة توزيع الحصص على الفصول والمعلمين للبوابة الحالية"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={handleOpenModal}>
		  <Plus size={18} /> إضافة حصة
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
		  جاري جلب الجدول...
		</div>
	  ) : (
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
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<TableProperties size={16} color="var(--color-royal)" />
					{daysOfWeek[t.day_of_week]}
				  </div>
				</td>
				<td style={styles.td}>
				  <span style={{ backgroundColor: 'var(--color-slate)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
					الحصة {t.period_number}
				  </span>
				</td>
				<td style={styles.td}>{t.grade_level} - {t.section}</td>
				<td style={styles.td}>{t.subjects_edu?.name || '—'}</td>
				<td style={styles.td}>{t.profiles?.full_name || '—'}</td>
				<td className="no-print" style={styles.td}>
				  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					<Trash2 size={16} />
				  </button>
				</td>
			  </tr>
			))}
			{timetable.length === 0 && (
			  <tr>
				<td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				  لا توجد حصص مسجلة في جدول هذه البوابة.
				</td>
			  </tr>
			)}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>تسكين حصة جديدة</h2>
			<form onSubmit={handleSave}>
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>اليوم</label>
				  <select style={styles.input} value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: parseInt(e.target.value)})}>
					{daysOfWeek.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>رقم الحصة</label>
				  <input type="number" min="1" max="8" required style={styles.input} value={formData.period_number} onChange={e => setFormData({...formData, period_number: parseInt(e.target.value)})} />
				</div>
			  </div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الصف</label>
				  {/* هنا تم تحويل الحقل إلى قائمة منسدلة ذكية */}
				  <select required style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})}>
					{availableGrades.map((grade, idx) => (
					  <option key={idx} value={grade}>{grade}</option>
					))}
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الشعبة</label>
				  <input required style={styles.input} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="مثال: أ" />
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>المعلم</label>
				<select required style={styles.input} value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
				  <option value="" disabled>اختر المعلم...</option>
				  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
				</select>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>المادة (مواد هذه البوابة فقط)</label>
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