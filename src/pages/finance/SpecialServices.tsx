import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, Star, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function SpecialServices() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
	student_id: '', 
	amount: 0, 
	currency: 'SAR', 
	service_type: 'دروس تقوية إضافية', 
	status: 'غير مدفوع', 
	due_date: new Date().toISOString().split('T')[0] 
  });

  const specialServiceTypes = [
	'دروس تقوية إضافية',
	'جلسات تخاطب ونطق',
	'رعاية ذوي الاحتياجات الخاصة',
	'الأندية والأنشطة اللامنهجية',
	'الرعاية النفسية والإرشادية'
  ];

  const fetchData = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// We isolate to the active portal, but filter specifically for special services using a keyword search
	const { data: fData } = await supabase
	  .from('fees_edu')
	  .select('*, students_edu!inner(full_name, grade_level, portal_type)')
	  .eq('workspace_id', workspace.id)
	  .eq('students_edu.portal_type', portalType)
	  .like('description', 'خدمات خاصة:%')
	  .order('created_at', { ascending: false });

	const { data: sData } = await supabase
	  .from('students_edu')
	  .select('id, full_name, grade_level')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType)
	  .order('full_name');

	if (fData) setFees(fData);
	if (sData) setStudents(sData);
	setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = {
	  workspace_id: workspace?.id,
	  portal_type: portalType,
	  student_id: formData.student_id,
	  amount: formData.amount,
	  currency: formData.currency,
	  description: `خدمات خاصة: ${formData.service_type}`, // Tagging it for DB retrieval
	  status: formData.status,
	  due_date: formData.due_date
	};

	const { error } = await supabase.from('fees_edu').insert([payload]);
	if (!error) {
	  setIsModalOpen(false);
	  fetchData();
	  setFormData({ student_id: '', amount: 0, currency: 'SAR', service_type: 'دروس تقوية إضافية', status: 'غير مدفوع', due_date: new Date().toISOString().split('T')[0] });
	} else {
	  alert('حدث خطأ أثناء حفظ رسوم الخدمة الخاصة');
	}
  };

  const updateStatus = async (id: string, newStatus: string) => {
	await supabase.from('fees_edu').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذه الرسوم؟')) return;
	await supabase.from('fees_edu').delete().eq('id', id);
	fetchData();
  };

  const getStatusBadge = (status: string) => {
	switch (status) {
	  case 'مدفوع': return <span style={{ backgroundColor: '#ecfdf5', color: 'var(--color-success)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> مدفوع</span>;
	  case 'غير مدفوع': return <span style={{ backgroundColor: '#fef2f2', color: 'var(--color-danger)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> غير مدفوع</span>;
	  default: return <span style={{ backgroundColor: '#fffbeb', color: 'var(--color-warning)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> متأخر</span>;
	}
  };

  return (
	<PageShell
	  title="الخدمات الخاصة"
	  subtitle="إدارة رسوم الأنشطة الإضافية، الرعاية، والدروس الخاصة لطلاب البوابة"
	  onPrint={() => window.print()}
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> تسجيل خدمة للطالب
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>جاري جلب سجلات الخدمات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الطالب المستفيد</th>
			  <th style={styles.th}>نوع الخدمة</th>
			  <th style={styles.th}>التكلفة</th>
			  <th style={styles.th}>تاريخ الاستحقاق</th>
			  <th style={styles.th}>الحالة</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{fees.map(f => {
			  // Strip out the tag prefix for display
			  const cleanDescription = f.description.replace('خدمات خاصة: ', '');
			  return (
				<tr key={f.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					  <Star size={16} color="#f59e0b" />
					  {f.students_edu?.full_name}
					</div>
					<div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{f.students_edu?.grade_level}</div>
				  </td>
				  <td style={{ ...styles.td, fontWeight: 800 }}>{cleanDescription}</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-navy)' }} dir="ltr">
					{Number(f.amount).toLocaleString()} {f.currency || 'SAR'}
				  </td>
				  <td style={{ ...styles.td, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{f.due_date}</td>
				  <td style={styles.td}>{getStatusBadge(f.status)}</td>
				  <td className="no-print" style={styles.td}>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					  <select 
						value={f.status} 
						onChange={(e) => updateStatus(f.id, e.target.value)}
						style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'transparent', color: 'var(--color-navy)' }}
					  >
						<option value="غير مدفوع">غير مدفوع</option>
						<option value="مدفوع">مدفوع</option>
						<option value="متأخر">متأخر</option>
					  </select>
					  <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
						<Trash2 size={16} />
					  </button>
					</div>
				  </td>
				</tr>
			  );
			})}
			{fees.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد خدمات خاصة مسجلة حالياً.</td></tr>}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>تسجيل خدمة إضافية للطالب</h2>
			<form onSubmit={handleSave}>
			  
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الطالب المستفيد</label>
				<select required style={styles.input} value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
				  <option value="" disabled>اختر الطالب...</option>
				  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade_level})</option>)}
				</select>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>نوع الخدمة الخاصة</label>
				<select required style={styles.input} value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
				  {specialServiceTypes.map(type => <option key={type} value={type}>{type}</option>)}
				  <option value="خدمة أخرى (تتطلب تدوين)">خدمة أخرى</option>
				</select>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 2 }}>
				  <label style={styles.label}>التكلفة / الرسوم</label>
				  <input type="number" step="0.01" min="1" required style={styles.input} value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>العملة</label>
				  <select required style={styles.input} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
					<option value="SAR">SAR</option>
					<option value="USD">USD</option>
				  </select>
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>تاريخ الاستحقاق</label>
				  <input type="date" required style={styles.input} value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>حالة الدفع</label>
				  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
					<option>غير مدفوع</option>
					<option>مدفوع</option>
				  </select>
				</div>
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>تسجيل الخدمة</button>
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