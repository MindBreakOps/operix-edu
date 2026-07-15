import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, Landmark, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function Debts() {
  const { workspace } = useTenant();
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
	entity_type: 'جهة خارجية / مورد',
	entity_name: '', // Added text field for dynamic entity names since they vary widely
	loan_amount: 0,
	paid_amount: 0,
	due_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
	if (!workspace) return;
	setIsLoading(true);
	const { data } = await supabase
	  .from('finance_loans')
	  .select('*')
	  .eq('workspace_id', workspace.id)
	  .order('due_date', { ascending: true });

	if (data) setLoans(data);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	// Using entity_id as a text storage for entity_name to match our SQL without needing complex joins for external vendors
	const payload = {
	  workspace_id: workspace?.id,
	  entity_type: formData.entity_type,
	  entity_id: null, 
	  loan_amount: formData.loan_amount,
	  paid_amount: formData.paid_amount,
	  due_date: formData.due_date,
	  // Workaround: We are going to hijack 'entity_type' to store "Type - Name" for simplicity if schema isn't altered
	  // But standard approach: let's store it securely. We will bundle it in entity_type for display purposes.
	};

	// Note: For best practice, we'll prefix entity_type with the name since the original schema uses UUID for entity_id
	payload.entity_type = `${formData.entity_type} - ${formData.entity_name}`;

	const { error } = await supabase.from('finance_loans').insert([payload]);
	
	if (!error) {
	  setIsModalOpen(false);
	  fetchData();
	  setFormData({ entity_type: 'جهة خارجية / مورد', entity_name: '', loan_amount: 0, paid_amount: 0, due_date: new Date().toISOString().split('T')[0] });
	} else {
	  alert('حدث خطأ أثناء حفظ القرض.');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
	await supabase.from('finance_loans').delete().eq('id', id);
	fetchData();
  };

  return (
	<PageShell
	  title="الديون والقروض"
	  subtitle="إدارة المستحقات والديون الخارجية على المدرسة"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> تسجيل قرض/دين
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>جاري جلب السجلات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الجهة الدائنة</th>
			  <th style={styles.th}>المبلغ الكلي</th>
			  <th style={styles.th}>المدفوع</th>
			  <th style={styles.th}>المتبقي</th>
			  <th style={styles.th}>تاريخ الاستحقاق</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{loans.map(l => {
			  const remaining = Number(l.loan_amount) - Number(l.paid_amount);
			  return (
				<tr key={l.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					  <Landmark size={16} color="var(--color-danger)" />
					  {l.entity_type}
					</div>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace', color: 'var(--color-navy)' }} dir="ltr">
					{Number(l.loan_amount).toLocaleString()}
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace', color: 'var(--color-success)' }} dir="ltr">
					{Number(l.paid_amount).toLocaleString()}
				  </td>
				  <td style={{ ...styles.td, fontWeight: 900, color: remaining > 0 ? 'var(--color-danger)' : 'var(--color-success)' }} dir="ltr">
					{remaining.toLocaleString()}
				  </td>
				  <td style={styles.td}>
					<span style={{ backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
					  {l.due_date}
					</span>
				  </td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					  <Trash2 size={16} />
					</button>
				  </td>
				</tr>
			  );
			})}
			{loans.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد ديون أو قروض مسجلة.</td></tr>}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>تسجيل دين / قرض جديد</h2>
			<form onSubmit={handleSave}>
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>نوع الجهة الدائنة</label>
				  <select required style={styles.input} value={formData.entity_type} onChange={e => setFormData({...formData, entity_type: e.target.value})}>
					<option>جهة خارجية / مورد</option>
					<option>سلفة موظف</option>
					<option>جهة حكومية</option>
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 2 }}>
				  <label style={styles.label}>اسم الجهة / الشخص</label>
				  <input required style={styles.input} value={formData.entity_name} onChange={e => setFormData({...formData, entity_name: e.target.value})} placeholder="مثال: شركة التجهيزات" />
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>المبلغ الكلي (SAR)</label>
				  <input type="number" step="0.01" min="1" required style={styles.input} value={formData.loan_amount} onChange={e => setFormData({...formData, loan_amount: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>المدفوع مقدماً (إن وجد)</label>
				  <input type="number" step="0.01" min="0" style={styles.input} value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: parseFloat(e.target.value)})} />
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>تاريخ الاستحقاق (تاريخ السداد)</label>
				<input type="date" required style={styles.input} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>تسجيل الدين</button>
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