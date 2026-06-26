import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Plus, Wallet, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const theme = { 
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', 
  border: '#e2e8f0', textDark: '#1e293b', textMuted: '#94a3b8',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444' 
};

export default function FeesEdu() {
  const { workspace } = useTenant();
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
	student_id: '', amount: 0, currency: 'SAR', description: '', status: 'غير مدفوع', due_date: new Date().toISOString().split('T')[0] 
  });

  const fetchData = async () => {
	if (!workspace) return;
	setIsLoading(true);
	
	// جلب الرسوم مع بيانات الطالب
	const { data: fData } = await supabase
	  .from('fees_edu')
	  .select('*, students_edu(full_name, grade_level)')
	  .eq('workspace_id', workspace.id)
	  .order('created_at', { ascending: false });

	// جلب الطلاب للقائمة المنسدلة
	const { data: sData } = await supabase
	  .from('students_edu')
	  .select('id, full_name, grade_level')
	  .eq('workspace_id', workspace.id)
	  .order('full_name');

	if (fData) setFees(fData);
	if (sData) setStudents(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = {
	  workspace_id: workspace?.id,
	  student_id: formData.student_id,
	  amount: formData.amount,
	  currency: formData.currency,
	  description: formData.description,
	  status: formData.status,
	  due_date: formData.due_date
	};

	const { error } = await supabase.from('fees_edu').insert([payload]);
	if (!error) {
	  setIsModalOpen(false);
	  fetchData();
	  // إعادة تعيين النموذج بعد الحفظ
	  setFormData({ student_id: '', amount: 0, currency: 'SAR', description: '', status: 'غير مدفوع', due_date: new Date().toISOString().split('T')[0] });
	} else {
	  alert('حدث خطأ أثناء حفظ الفاتورة');
	}
  };

  const updateStatus = async (id: string, newStatus: string) => {
	await supabase.from('fees_edu').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذا السجل المالي؟')) return;
	await supabase.from('fees_edu').delete().eq('id', id);
	fetchData();
  };

  const getStatusBadge = (status: string) => {
	switch (status) {
	  case 'مدفوع': return <span style={{ backgroundColor: '#ecfdf5', color: theme.success, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> مدفوع</span>;
	  case 'غير مدفوع': return <span style={{ backgroundColor: '#fef2f2', color: theme.danger, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> غير مدفوع</span>;
	  default: return <span style={{ backgroundColor: '#fffbeb', color: theme.warning, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> متأخر</span>;
	}
  };

  const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
	title: { fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' },
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
		  <h1 style={styles.title}>الرسوم المالية</h1>
		  <p style={{ margin: 0, color: '#64748b' }}>إدارة الفواتير والمستحقات الدراسية</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة التقرير</button>
		  <button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}><Plus size={18} /> إنشاء فاتورة</button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		{isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 800 }}>جاري جلب السجلات المالية...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>الطالب</th>
				<th style={styles.th}>الوصف</th>
				<th style={styles.th}>المبلغ والعملة</th>
				<th style={styles.th}>تاريخ الاستحقاق</th>
				<th style={styles.th}>الحالة</th>
				<th className="no-print" style={styles.th}>إجراءات</th>
			  </tr>
			</thead>
			<tbody>
			  {fees.map(f => (
				<tr key={f.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					  <Wallet size={16} color={theme.royal} />
					  {f.students_edu?.full_name}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{f.students_edu?.grade_level}</div>
				  </td>
				  <td style={styles.td}>{f.description}</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: theme.navy }} dir="ltr">
					{Number(f.amount).toLocaleString()} {f.currency || 'SAR'}
				  </td>
				  <td style={{ ...styles.td, color: '#64748b', fontSize: '0.85rem' }}>{f.due_date}</td>
				  <td style={styles.td}>{getStatusBadge(f.status)}</td>
				  <td className="no-print" style={styles.td}>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					  <select 
						value={f.status} 
						onChange={(e) => updateStatus(f.id, e.target.value)}
						style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.border}`, outline: 'none', fontSize: '0.75rem', fontWeight: 700 }}
					  >
						<option value="غير مدفوع">غير مدفوع</option>
						<option value="مدفوع">مدفوع</option>
						<option value="متأخر">متأخر</option>
					  </select>
					  <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer' }}>
						<Trash2 size={16} />
					  </button>
					</div>
				  </td>
				</tr>
			  ))}
			  {fees.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 800 }}>لا توجد سجلات مالية.</td></tr>}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
		  <div style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px' }}>
			<h2 style={{ margin: '0 0 24px 0', color: theme.navy, fontSize: '1.4rem', fontWeight: 900 }}>إنشاء فاتورة جديدة</h2>
			<form onSubmit={handleSave}>
			  
			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>الطالب</label>
				<select required style={styles.input} value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
				  <option value="" disabled>اختر الطالب...</option>
				  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade_level})</option>)}
				</select>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>وصف الرسوم</label>
				<input required style={styles.input} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="مثال: القسط الأول للعام الدراسي" />
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 2 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>المبلغ</label>
				  <input type="number" step="0.01" min="1" required style={styles.input} value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>العملة</label>
				  <select required style={styles.input} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
					<option value="SAR">SAR (ريال سعودي)</option>
					<option value="SDG">SDG (جنيه سوداني)</option>
					<option value="USD">USD (دولار أمريكي)</option>
				  </select>
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>تاريخ الاستحقاق</label>
				  <input type="date" required style={styles.input} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.9rem' }}>حالة الدفع الأولية</label>
				  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
					<option>غير مدفوع</option>
					<option>مدفوع</option>
				  </select>
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>حفظ الفاتورة</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</div>
  );
}