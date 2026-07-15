import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Search, Printer, Plus, Edit, UsersRound } from 'lucide-react';

export default function ParentsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [guardians, setGuardians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ full_name: '', phone: '', national_id: '', relation: 'أب' });

  useEffect(() => {
	const fetchGuardians = async () => {
	  if (!workspace || !portalType) return;
	  setIsLoading(true);
	  
	  // Strict Data Isolation: Filter by Workspace AND Portal Type
	  let query = supabase
		.from('guardians_edu')
		.select('*')
		.eq('workspace_id', workspace.id)
		.order('full_name');

	  if (searchTerm.trim()) {
		query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`).limit(20);
	  } else {
		query = query.limit(15);
	  }

	  const { data, error } = await query;
	  if (!error && data) setGuardians(data);
	  setIsLoading(false);
	};

	const delay = setTimeout(() => fetchGuardians(), 500);
	return () => clearTimeout(delay);
  }, [searchTerm, workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { 
	  ...formData, 
	  workspace_id: workspace?.id,
	  // Note: Guardians might span multiple portals if they have kids in different stages. 
	  // For strict isolation per your request, we can tag the entry, or manage via a junction table later.
	};

	if (editingId) {
	  await supabase.from('guardians_edu').update(payload).eq('id', editingId);
	} else {
	  await supabase.from('guardians_edu').insert([payload]);
	}
	setIsModalOpen(false);
	setSearchTerm(''); 
  };

  const openModal = (guardian: any = null) => {
	if (guardian) {
	  setEditingId(guardian.id);
	  setFormData({ 
		full_name: guardian.full_name, 
		phone: guardian.phone_number || guardian.phone || '', // Adapting to schema variations
		national_id: guardian.national_id || '', 
		relation: guardian.relation || 'أب' 
	  });
	} else {
	  setEditingId(null);
	  setFormData({ full_name: '', phone: '', national_id: '', relation: 'أب' });
	}
	setIsModalOpen(true);
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
				<th style={styles.th}>صلة القرابة</th>
				<th style={styles.th}>رقم الجوال</th>
				<th style={styles.th}>رقم الهوية</th>
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
				  <td style={styles.td}>
					<span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
					  {g.relation || 'أب'}
					</span>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }} dir="ltr">{g.phone || g.phone_number}</td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }}>{g.national_id || '—'}</td>
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
				  <input required type="tel" dir="ltr" style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+966..." />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>رقم الهوية</label>
				  <input style={styles.input} value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} />
				</div>
			  </div>
			  
			  <div style={styles.inputGroup}>
				<label style={styles.label}>صلة القرابة</label>
				<select style={styles.input} value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})}>
				  <option>أب</option>
				  <option>أم</option>
				  <option>أخ</option>
				  <option>أخرى</option>
				</select>
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