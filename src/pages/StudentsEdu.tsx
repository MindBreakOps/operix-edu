import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Search, Printer, Plus, Edit, User } from 'lucide-react';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', 
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b'
};

export default function StudentsEdu() {
  const { workspace } = useTenant();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ full_name: '', national_id: '', stage: 'ابتدائي', grade_level: 'الصف الأول', section: 'أ' });

  // جلب حقيقي للبيانات مع Debounce للبحث
  useEffect(() => {
	const fetchStudents = async () => {
	  if (!workspace) return;
	  setIsLoading(true);
	  
	  let query = supabase.from('students_edu').select('*').eq('workspace_id', workspace.id).order('enrollment_date', { ascending: false });

	  if (searchTerm.trim()) {
		query = query.or(`full_name.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`).limit(20);
	  } else {
		query = query.limit(10); // عرض أحدث 10 افتراضياً
	  }

	  const { data, error } = await query;
	  if (!error && data) setStudents(data);
	  setIsLoading(false);
	};

	const delay = setTimeout(() => fetchStudents(), 500);
	return () => clearTimeout(delay);
  }, [searchTerm, workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { ...formData, workspace_id: workspace?.id };

	if (editingId) {
	  await supabase.from('students_edu').update(payload).eq('id', editingId);
	} else {
	  await supabase.from('students_edu').insert([payload]);
	}
	setIsModalOpen(false);
	setSearchTerm(''); // Trigger re-fetch
  };

  const openModal = (student: any = null) => {
	if (student) {
	  setEditingId(student.id);
	  setFormData({ full_name: student.full_name, national_id: student.national_id || '', stage: student.stage, grade_level: student.grade_level, section: student.section || 'أ' });
	} else {
	  setEditingId(null);
	  setFormData({ full_name: '', national_id: '', stage: 'ابتدائي', grade_level: 'الصف الأول', section: 'أ' });
	}
	setIsModalOpen(true);
  };

  const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
	title: { fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0', letterSpacing: '-0.5px' },
	subtitle: { fontSize: '0.95rem', color: theme.textMuted, margin: 0 },
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
	controlBar: { display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: '#fcfcfd' },
	searchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 16px', width: '300px' },
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
		  <h1 style={styles.title}>سجل الطلاب</h1>
		  <p style={styles.subtitle}>إدارة بيانات الطلاب الأكاديمية والأساسية</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة الكشف</button>
		  <button style={styles.btnPrimary} onClick={() => openModal()}><Plus size={18} /> تسجيل طالب</button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		<div className="no-print" style={styles.controlBar}>
		  <div style={styles.searchBox}>
			<Search size={18} color={theme.textMuted} />
			<input 
			  type="text" 
			  placeholder="بحث بالاسم أو رقم الهوية..." 
			  style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem' }}
			  value={searchTerm}
			  onChange={(e) => setSearchTerm(e.target.value)}
			/>
		  </div>
		</div>

		{isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontWeight: 800 }}>جاري جلب البيانات...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>الاسم الرباعي</th>
				<th style={styles.th}>رقم الهوية / الإقامة</th>
				<th style={styles.th}>المرحلة</th>
				<th style={styles.th}>الصف الدراسي</th>
				<th style={styles.th}>الشعبة</th>
				<th className="no-print" style={styles.th}>إجراءات</th>
			  </tr>
			</thead>
			<tbody>
			  {students.map(s => (
				<tr key={s.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.royal }}><User size={16} /></div>
					  {s.full_name}
					</div>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }}>{s.national_id || '—'}</td>
				  <td style={styles.td}>
					<span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>{s.stage}</span>
				  </td>
				  <td style={styles.td}>{s.grade_level}</td>
				  <td style={styles.td}>{s.section}</td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => openModal(s)} style={{ background: 'none', border: 'none', color: theme.royal, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
					  <Edit size={14} /> تعديل
					</button>
				  </td>
				</tr>
			  ))}
			  {students.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontWeight: 800 }}>لا توجد بيانات تطابق بحثك.</td></tr>}
			</tbody>
		  </table>
		)}
	  </div>

	  {/* Modal */}
	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: theme.navy, fontSize: '1.4rem', fontWeight: 900 }}>
			  {editingId ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}
			</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الاسم الرباعي</label>
				<input required style={styles.input} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
			  </div>
			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>رقم الهوية / الإقامة</label>
				<input style={styles.input} value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} />
			  </div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>المرحلة الدراسية</label>
				  <select style={styles.input} value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
					<option>ابتدائي</option><option>متوسط</option><option>ثانوي</option>
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الصف</label>
				  <input required style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} placeholder="مثال: الصف الأول" />
				</div>
			  </div>
			  
			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الشعبة / الفصل</label>
				<input style={styles.input} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="مثال: أ أو 1" />
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>حفظ البيانات</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</div>
  );
}