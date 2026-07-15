import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, Package, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function Logistics() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  const [logistics, setLogistics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
	category: 'المقصف',
	item_name: '',
	amount: 0,
	transaction_type: 'إيراد',
	transaction_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	const { data } = await supabase
	  .from('finance_logistics')
	  .select('*')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType)
	  .order('transaction_date', { ascending: false });

	if (data) setLogistics(data);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { ...formData, workspace_id: workspace?.id, portal_type: portalType };
	const { error } = await supabase.from('finance_logistics').insert([payload]);
	
	if (!error) {
	  setIsModalOpen(false);
	  fetchData();
	  setFormData({ category: 'المقصف', item_name: '', amount: 0, transaction_type: 'إيراد', transaction_date: new Date().toISOString().split('T')[0] });
	} else {
	  alert('حدث خطأ أثناء حفظ السجل.');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
	await supabase.from('finance_logistics').delete().eq('id', id);
	fetchData();
  };

  return (
	<PageShell
	  title="المقصف واللوجستيات"
	  subtitle="إدارة إيرادات ومصروفات اللوجستيات للبوابة الحالية"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> إضافة عملية
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>جاري جلب السجلات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>التاريخ</th>
			  <th style={styles.th}>التصنيف</th>
			  <th style={styles.th}>البيان</th>
			  <th style={styles.th}>النوع</th>
			  <th style={styles.th}>المبلغ</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{logistics.map(l => (
			  <tr key={l.id}>
				<td style={{ ...styles.td, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{l.transaction_date}</td>
				<td style={styles.td}>
				  <span style={{ backgroundColor: 'var(--color-slate)', color: 'var(--color-navy)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 800 }}>
					{l.category}
				  </span>
				</td>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<Package size={16} color="var(--color-royal)" />
					{l.item_name}
				  </div>
				</td>
				<td style={styles.td}>
				  {l.transaction_type === 'إيراد' ? 
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 800, fontSize: '0.85rem' }}><ArrowUpRight size={16} /> إيراد</span> : 
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 800, fontSize: '0.85rem' }}><ArrowDownRight size={16} /> منصرف</span>
				  }
				</td>
				<td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-navy)' }} dir="ltr">
				  {Number(l.amount).toLocaleString()} SAR
				</td>
				<td className="no-print" style={styles.td}>
				  <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					<Trash2 size={16} />
				  </button>
				</td>
			  </tr>
			))}
			{logistics.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد عمليات لوجستية مسجلة.</td></tr>}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>تسجيل عملية مالية</h2>
			<form onSubmit={handleSave}>
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>التصنيف</label>
				  <select required style={styles.input} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
					<option>المقصف</option>
					<option>مستلزمات مدرسية</option>
					<option>صيانة ونظافة</option>
					<option>أخرى</option>
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>نوع العملية</label>
				  <select required style={styles.input} value={formData.transaction_type} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
					<option>إيراد</option>
					<option>منصرف</option>
				  </select>
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>البيان / التفاصيل</label>
				<input required style={styles.input} value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder="مثال: مبيعات المقصف الأسبوعية" />
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>المبلغ</label>
				  <input type="number" step="0.01" min="1" required style={styles.input} value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>التاريخ</label>
				  <input type="date" required style={styles.input} value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} />
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>حفظ السجل</button>
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