import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Search, Printer, Plus, Edit, UsersRound, Link as LinkIcon } from 'lucide-react';

export default function ParentsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [guardians, setGuardians] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Aligned strictly with the public.guardians_edu schema
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', email: '' });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace || !portalType) return;
	  setIsLoading(true);
	  
	  // 1. Fetch REAL Students mapped to this portal_type
	  try {
		const { data: studentsData } = await supabase
		  .from('students_edu')
		  .select('id, full_name, guardian_id')
		  .eq('workspace_id', workspace.id)
		  .eq('portal_type', portalType)
		  .order('full_name');
		  
		setStudents(studentsData || []);
	  } catch (err) {
		console.error("Error fetching students:", err);
	  }

	  // 2. Fetch guardians and join their children using the foreign key
	  try {
		let query = supabase
		  .from('guardians_edu')
		  .select('*, children:students_edu(id, full_name)')
		  .eq('workspace_id', workspace.id)
		  .order('full_name');

		if (searchTerm.trim()) {
		  query = query.or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`).limit(20);
		} else {
		  query = query.limit(15);
		}

		const { data: guardiansData, error } = await query;
		if (!error && guardiansData) setGuardians(guardiansData);
	  } catch (err) {
		console.error("Error fetching guardians:", err);
	  }
	  
	  setIsLoading(false);
	};

	const delay = setTimeout(() => fetchData(), 500);
	return () => clearTimeout(delay);
  }, [searchTerm, workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	
	// Construct payload mapped exactly to guardians_edu columns
	const payload = { 
	  full_name: formData.full_name,
	  phone_number: formData.phone_number,
	  email: formData.email,
	  workspace_id: workspace?.id,
	};

	let savedGuardianId = editingId;

	// 1. Save or Update the Guardian
	if (editingId) {
	  await supabase.from('guardians_edu').update(payload).eq('id', editingId);
	} else {
	  const { data } = await supabase.from('guardians_edu').insert([payload]).select('id').single();
	  if (data) savedGuardianId = data.id;
	}

	// 2. Update the linked students in students_edu
	if (savedGuardianId) {
	  // Detach any students currently linked to this guardian
	  await supabase.from('students_edu').update({ guardian_id: null }).eq('guardian_id', savedGuardianId);
	  
	  // Attach the newly selected students
	  if (selectedStudentIds.length > 0) {
		await supabase.from('students_edu').update({ guardian_id: savedGuardianId }).in('id', selectedStudentIds);
	  }
	}

	setIsModalOpen(false);
	setSearchTerm(''); 
  };

  const openModal = (guardian: any = null) => {
	if (guardian) {
	  setEditingId(guardian.id);
	  setFormData({ 
		full_name: guardian.full_name || '', 
		phone_number: guardian.phone_number || '', 
		email: guardian.email || '' 
	  });
	  setSelectedStudentIds(guardian.children?.map((c: any) => c.id) || []);
	} else {
	  setEditingId(null);
	  setFormData({ full_name: '', phone_number: '', email: '' });
	  setSelectedStudentIds([]);
	}
	setIsModalOpen(true);
  };

  const toggleStudentSelection = (studentId: string) => {
	if (selectedStudentIds.includes(studentId)) {
	  setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
	} else {
	  setSelectedStudentIds([...selectedStudentIds, studentId]);
	}
  };

  return (
	<div>
	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>سجل أولياء الأمور</h1>
		  <p style={styles.subtitle}>إدارة بيانات التواصل والارتباط بالطلاب</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}>
			<Printer size={18} /> طباعة الكشف
		  </button>
		  <button style={styles.btnPrimary} onClick={() => openModal()}>
			<Plus size={18} /> إضافة ولي أمر
		  </button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		<div className="no-print" style={styles.controlBar}>
		  <div style={styles.searchBox}>
			<Search size={18} color="var(--color-text-muted)" />
			<input 
			  type="text" 
			  placeholder="بحث بالاسم أو رقم الجوال..." 
			  style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--color-text-dark)', backgroundColor: 'transparent' }}
			  value={searchTerm}
			  onChange={(e) => setSearchTerm(e.target.value)}
			/>
		  </div>
		</div>

		{isLoading ? (
		  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
			جاري جلب البيانات...
		  </div>
		) : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>الاسم الرباعي</th>
				<th style={styles.th}>رقم الجوال</th>
				<th style={styles.th}>البريد الإلكتروني</th>
				<th style={styles.th}>الأبناء المرتبطين</th>
				<th className="no-print" style={styles.th}>إجراءات</th>
			  </tr>
			</thead>
			<tbody>
			  {guardians.map(g => (
				<tr key={g.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-royal)' }}>
						<UsersRound size={16} />
					  </div>
					  {g.full_name}
					</div>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }} dir="ltr">{g.phone_number || '—'}</td>
				  <td style={styles.td}>{g.email || '—'}</td>
				  <td style={styles.td}>
					{g.children && g.children.length > 0 ? (
					  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
						{g.children.map((child: any) => (
						  <span key={child.id} style={{ backgroundColor: '#f1f5f9', color: 'var(--color-navy)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
							<LinkIcon size={12} /> {child.full_name}
						  </span>
						))}
					  </div>
					) : (
					  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>لا يوجد أبناء مرتبطين</span>
					)}
				  </td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => openModal(g)} style={{ background: 'none', border: 'none', color: 'var(--color-royal)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
					  <Edit size={14} /> تعديل
					</button>
				  </td>
				</tr>
			  ))}
			  {guardians.length === 0 && (
				<tr>
				  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
					لا توجد بيانات تطابق بحثك.
				  </td>
				</tr>
			  )}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>
			  {editingId ? 'تعديل بيانات ولي الأمر' : 'إضافة ولي أمر'}
			</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الاسم الرباعي</label>
				<input required style={styles.input} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
			  </div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>رقم الجوال</label>
				  <input required type="tel" dir="ltr" style={styles.input} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="+966..." />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>البريد الإلكتروني</label>
				  <input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} dir="ltr" placeholder="email@example.com" />
				</div>
			  </div>

			  {/* ─── REAL STUDENT SELECTOR ─── */}
			  <div style={styles.inputGroup}>
				<label style={styles.label}>ربط الأبناء (الطلاب)</label>
				<div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
				  {students.length === 0 ? (
					<p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '10px 0', fontWeight: 600 }}>لا يوجد طلاب متاحين في هذه البوابة. قم بإضافة طلاب أولاً.</p>
				  ) : (
					students.map(s => {
					  const isSelected = selectedStudentIds.includes(s.id);
					  return (
						<label 
						  key={s.id} 
						  style={{ 
							display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', cursor: 'pointer', 
							backgroundColor: isSelected ? '#e0e7ff' : '#ffffff', 
							border: `1px solid ${isSelected ? '#818cf8' : '#e2e8f0'}`,
							borderRadius: '8px', transition: 'all 0.2s' 
						  }}
						>
						  <input 
							type="checkbox" 
							checked={isSelected}
							onChange={() => toggleStudentSelection(s.id)}
							style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-royal)' }}
						  />
						  <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#3730a3' : 'var(--color-navy)' }}>
							{s.full_name}
						  </span>
						</label>
					  );
					})
				  )}
				</div>
				<span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '4px' }}>
				  اختر الطلاب المرتبطين بولي الأمر هذا لتسهيل المتابعة.
				</span>
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

const styles: { [key: string]: React.CSSProperties } = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 },
  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  controlBar: { display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fcfcfd' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 16px', width: '300px' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600 },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: { fontWeight: 800, color: 'var(--color-navy)', fontSize: '0.9rem' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, backgroundColor: 'var(--color-white)', color: 'var(--color-text-dark)' }
};