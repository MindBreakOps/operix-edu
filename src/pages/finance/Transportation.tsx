import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, Bus, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function Transportation() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
	student_id: '',
	route_name: '',
	monthly_fee: 0,
	driver_name: '',
	status: 'نشط'
  });

  const fetchData = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);

	const { data: subData } = await supabase
	  .from('transport_subscriptions')
	  .select('*, students_edu!inner(full_name, grade_level, portal_type)')
	  .eq('workspace_id', workspace.id)
	  .eq('students_edu.portal_type', portalType)
	  .order('created_at', { ascending: false });

	const { data: sData } = await supabase
	  .from('students_edu')
	  .select('id, full_name, grade_level')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType);

	if (subData) setSubscriptions(subData);
	if (sData) setStudents(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { ...formData, workspace_id: workspace?.id };
	const { error } = await supabase.from('transport_subscriptions').insert([payload]);
	
	if (!error) {
	  setIsModalOpen(false);
	  fetchData();
	  setFormData({ student_id: '', route_name: '', monthly_fee: 0, driver_name: '', status: 'نشط' });
	} else {
	  alert('حدث خطأ أثناء حفظ الاشتراك.');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
	await supabase.from('transport_subscriptions').delete().eq('id', id);
	fetchData();
  };

  const updateStatus = async (id: string, newStatus: string) => {
	await supabase.from('transport_subscriptions').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  return (
	<PageShell
	  title="الترحيل والمواصلات"
	  subtitle="إدارة اشتراكات النقل المدرسي لطلاب البوابة"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> اشتراك جديد
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>جاري جلب الاشتراكات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الطالب</th>
			  <th style={styles.th}>خط السير (المسار)</th>
			  <th style={styles.th}>السائق المخصص</th>
			  <th style={styles.th}>الرسوم الشهرية</th>
			  <th style={styles.th}>الحالة</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{subscriptions.map(sub => (
			  <tr key={sub.id}>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<Bus size={16} color="var(--color-royal)" />
					{sub.students_edu?.full_name}
				  </div>
				  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{sub.students_edu?.grade_level}</div>
				</td>
				<td style={styles.td}>{sub.route_name}</td>
				<td style={styles.td}>{sub.driver_name || '—'}</td>
				<td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-navy)' }} dir="ltr">
				  {Number(sub.monthly_fee).toLocaleString()} SAR
				</td>
				<td style={styles.td}>
				   <select 
					  value={sub.status} 
					  onChange={(e) => updateStatus(sub.id, e.target.value)}
					  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.75rem', fontWeight: 800, backgroundColor: sub.status === 'نشط' ? '#ecfdf5' : '#fef2f2', color: sub.status === 'نشط' ? 'var(--color-success)' : 'var(--color-danger)' }}
					>
					  <option value="نشط">نشط</option>
					  <option value="متوقف">متوقف</option>
					</select>
				</td>
				<td className="no-print" style={styles.td}>
				  <button onClick={() => handleDelete(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					<Trash2 size={16} />
				  </button>
				</td>
			  </tr>
			))}
			{subscriptions.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد اشتراكات نقل.</td></tr>}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>تسجيل اشتراك نقل</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الطالب</label>
				<select required style={styles.input} value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
				  <option value="" disabled>اختر الطالب...</option>
				  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade_level})</option>)}
				</select>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>خط السير (المسار أو الحي)</label>
				<input required style={styles.input} value={formData.route_name} onChange={e => setFormData({...formData, route_name: e.target.value})} placeholder="مثال: حي الياسمين - حافلة 3" />
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الرسوم الشهرية (SAR)</label>
				  <input type="number" step="0.01" min="0" required style={styles.input} value={formData.monthly_fee} onChange={e => setFormData({...formData, monthly_fee: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>اسم السائق المخصص</label>
				  <input style={styles.input} value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} />
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>اعتماد الاشتراك</button>
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