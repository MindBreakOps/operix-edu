import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, Banknote, Trash2, CheckCircle, Clock } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function Salaries() {
  const { workspace } = useTenant();
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
	teacher_id: '',
	base_salary: 0,
	incentives: 0,
	deductions: 0,
	payment_month: new Date().toISOString().split('T')[0].substring(0, 7), // YYYY-MM format
	status: 'معلق'
  });

  const fetchData = async () => {
	if (!workspace) return;
	setIsLoading(true);

	const { data: salData } = await supabase
	  .from('finance_salaries')
	  .select('*, profiles(full_name)')
	  .eq('workspace_id', workspace.id)
	  .order('payment_month', { ascending: false });

	const { data: tData } = await supabase
	  .from('profiles')
	  .select('id, full_name')
	  .eq('workspace_id', workspace.id);

	if (salData) setSalaries(salData);
	if (tData) setTeachers(tData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = {
	  ...formData,
	  workspace_id: workspace?.id,
	  payment_month: `${formData.payment_month}-01` // Append day for strict DATE column compatibility
	};

	const { error } = await supabase.from('finance_salaries').insert([payload]);
	if (!error) {
	  setIsModalOpen(false);
	  fetchData();
	  setFormData({ teacher_id: '', base_salary: 0, incentives: 0, deductions: 0, payment_month: new Date().toISOString().split('T')[0].substring(0, 7), status: 'معلق' });
	} else {
	  alert('حدث خطأ أثناء الحفظ.');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
	await supabase.from('finance_salaries').delete().eq('id', id);
	fetchData();
  };

  const updateStatus = async (id: string, newStatus: string) => {
	await supabase.from('finance_salaries').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  return (
	<PageShell
	  title="الرواتب والحوافز"
	  subtitle="إدارة مسيرات الرواتب، البدلات، والخصومات للهيئة التعليمية"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> إضافة مسير راتب
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>جاري جلب السجلات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الموظف / المعلم</th>
			  <th style={styles.th}>شهر الاستحقاق</th>
			  <th style={styles.th}>الراتب الأساسي</th>
			  <th style={styles.th}>الصافي (بعد البدلات والخصم)</th>
			  <th style={styles.th}>الحالة</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{salaries.map(s => {
			  const netSalary = (Number(s.base_salary) + Number(s.incentives)) - Number(s.deductions);
			  return (
				<tr key={s.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					  <Banknote size={16} color="var(--color-royal)" />
					  {s.profiles?.full_name}
					</div>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }}>{s.payment_month.substring(0, 7)}</td>
				  <td style={{ ...styles.td, color: 'var(--color-text-muted)' }} dir="ltr">{Number(s.base_salary).toLocaleString()} SAR</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-success)' }} dir="ltr">
					{netSalary.toLocaleString()} SAR
				  </td>
				  <td style={styles.td}>
					{s.status === 'مدفوع' ? 
					  <span style={{ backgroundColor: '#ecfdf5', color: 'var(--color-success)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> مدفوع</span> : 
					  <span style={{ backgroundColor: '#fffbeb', color: 'var(--color-warning)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> معلق</span>
					}
				  </td>
				  <td className="no-print" style={styles.td}>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					  <select 
						value={s.status} 
						onChange={(e) => updateStatus(s.id, e.target.value)}
						style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'transparent', color: 'var(--color-navy)' }}
					  >
						<option value="معلق">معلق</option>
						<option value="مدفوع">مدفوع</option>
					  </select>
					  <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
						<Trash2 size={16} />
					  </button>
					</div>
				  </td>
				</tr>
			  );
			})}
			{salaries.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد سجلات رواتب.</td></tr>}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>تسجيل مسير راتب</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>المعلم / الموظف</label>
				<select required style={styles.input} value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
				  <option value="" disabled>اختر الموظف...</option>
				  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
				</select>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الراتب الأساسي</label>
				  <input type="number" step="0.01" required style={styles.input} value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>شهر الاستحقاق</label>
				  <input type="month" required style={styles.input} value={formData.payment_month} onChange={e => setFormData({...formData, payment_month: e.target.value})} />
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الحوافز / البدلات (+)</label>
				  <input type="number" step="0.01" style={styles.input} value={formData.incentives} onChange={e => setFormData({...formData, incentives: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الخصومات (-)</label>
				  <input type="number" step="0.01" style={styles.input} value={formData.deductions} onChange={e => setFormData({...formData, deductions: parseFloat(e.target.value)})} />
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>اعتماد السجل</button>
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