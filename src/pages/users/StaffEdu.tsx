import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Briefcase, ShieldCheck, PenTool, UploadCloud, X, Users, Plus, CheckCircle2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

// ==========================================
// ⚠️ ضع رابط الـ Web App URL (GAS) الخاص بك هنا ⚠️
// ==========================================
const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbypUKtMYXnWhIC4egXFR9HHyvIDVqQ-dNsOZvAd9XqlSmBYjc5i0EgnDmhHGh0Fs97kMw/exec";

export default function StaffEdu() {
  const { workspace } = useTenant();
  const [staff, setStaff] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null); 
  const [formData, setFormData] = useState({
	full_name: '',
	profile_id: '',
	job_title: 'معلم',
	department: 'الشؤون الأكاديمية',
	national_id: '',
	specialization: '',
	qualification: '',
	pdf_url: '',
	cert_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
	if (!workspace) return;
	setIsLoading(true);
	
	// جلب جميع الموظفين من جدول employees_edu (من ضمنهم العمال)
	const { data: staffData } = await supabase
	  .from('employees_edu')
	  .select('*, profiles(email)')
	  .eq('workspace_id', workspace.id)
	  .order('created_at', { ascending: false });
	  
	// جلب جميع الحسابات (profiles) للربط الاختياري
	const { data: profilesData } = await supabase
	  .from('profiles')
	  .select('id, full_name, email')
	  .eq('workspace_id', workspace.id);

	if (staffData) setStaff(staffData);
	if (profilesData) setProfiles(profilesData);
	
	setIsLoading(false);
  };

  useEffect(() => {
	fetchData();
  }, [workspace]);

  const fileToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
	  const reader = new FileReader();
	  reader.readAsDataURL(file);
	  reader.onload = () => resolve((reader.result as string).split(',')[1]);
	  reader.onerror = error => reject(error);
	});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf_url' | 'cert_url') => {
	const file = e.target.files?.[0];
	if (!file) return;

	if (!GAS_WEBHOOK_URL.includes('script.google.com/macros')) {
	  alert("تنبيه: لم تقم بإضافة رابط Google Apps Script في الكود.");
	  return;
	}

	setIsUploading(true);
	try {
	  const base64Data = await fileToBase64(file);
	  const payload = {
		fileName: `${type}_${formData.full_name || 'employee'}_${Date.now()}`,
		mimeType: file.type,
		fileBase64: base64Data
	  };

	  const response = await fetch(GAS_WEBHOOK_URL, { 
		method: 'POST', 
		headers: { 'Content-Type': 'text/plain;charset=utf-8' },
		body: JSON.stringify(payload) 
	  });
	  
	  const result = await response.json();
	  
	  if (result.success) {
		setFormData(prev => ({ ...prev, [type]: result.downloadUrl }));
	  } else {
		alert("فشل الرفع إلى جوجل درايف. تأكد من صحة الـ Folder ID في السكربت.");
	  }
	} catch (err) {
	  alert("خطأ في الاتصال بالخادم. تأكد من إعدادات الـ Deploy في جوجل (Anyone).");
	} finally {
	  setIsUploading(false);
	}
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!workspace) return;
	setIsUploading(true);
	
	const payload = {
	  workspace_id: workspace.id,
	  full_name: formData.full_name,
	  profile_id: formData.profile_id || null, 
	  department: formData.department,
	  job_title: formData.job_title,
	  national_id: formData.national_id,
	  specialization: formData.specialization,
	  qualification: formData.qualification,
	  pdf_url: formData.pdf_url,
	  cert_url: formData.cert_url
	};

	if (selectedEmployee) {
	  const { error } = await supabase.from('employees_edu').update(payload).eq('id', selectedEmployee.id);
	  if (error) alert("فشل تحديث البيانات.");
	} else {
	  const { error } = await supabase.from('employees_edu').insert([payload]);
	  if (error) alert("فشل إضافة الموظف.");
	}

	await fetchData();
	setIsModalOpen(false);
	setIsUploading(false);
  };

  const openAddModal = () => {
	setSelectedEmployee(null);
	setFormData({
	  full_name: '', profile_id: '', job_title: '', department: 'الشؤون الأكاديمية',
	  national_id: '', specialization: '', qualification: '', pdf_url: '', cert_url: ''
	});
	setIsModalOpen(true);
  };

  const openEditModal = (employee: any) => {
	setSelectedEmployee(employee);
	setFormData({
	  full_name: employee.full_name || '',
	  profile_id: employee.profile_id || '',
	  job_title: employee.job_title || '',
	  department: employee.department || 'الشؤون الأكاديمية',
	  national_id: employee.national_id || '',
	  specialization: employee.specialization || '',
	  qualification: employee.qualification || '',
	  pdf_url: employee.pdf_url || '',
	  cert_url: employee.cert_url || ''
	});
	setIsModalOpen(true);
  };

  return (
	<PageShell 
	  title="شؤون الموظفين (HR)" 
	  subtitle="إدارة الهيئة التعليمية والإدارية والعمال، وحفظ المستندات"
	  onPrint={() => window.print()}
	  actionButton={
		<button onClick={openAddModal} style={styles.btnAdd}>
		  <Plus size={18} /> إضافة موظف جديد
		</button>
	  }
	>
	  <div className="no-print" style={styles.infoBanner}>
		<ShieldCheck size={20} />
		<p style={{ margin: 0, fontSize: '0.9rem' }}>
		  يمكنك إضافة أي موظف بالمنشأة (العمال والأمن) لتشمله مسيرات الرواتب. إذا كان معلماً أو مديراً، يمكنك ربط ملفه الوظيفي بحسابه في النظام من القائمة.
		</p>
	  </div>

	  {isLoading ? (
		<div style={styles.loadingState}>جاري تحميل البيانات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الموظف</th>
			  <th style={styles.th}>القسم والمسمى الوظيفي</th>
			  <th style={styles.th}>ملفات الـ HR</th>
			  <th style={styles.th}>الإجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{staff.map(emp => (
			  <tr key={emp.id}>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<div style={styles.avatar}>
					  <Briefcase size={18} />
					</div>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
					  <span>{emp.full_name}</span>
					  {emp.profiles?.email ? (
						<span style={styles.linkedBadge}>
						  <CheckCircle2 size={12} /> مرتبط بحساب النظام
						</span>
					  ) : (
						<span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>بدون حساب نظام</span>
					  )}
					</div>
				  </div>
				</td>
				<td style={styles.td}>
				  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
					<span style={styles.badgeSuccess}>{emp.department}</span>
					<span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-navy)' }}>{emp.job_title}</span>
				  </div>
				</td>
				<td style={styles.td}>
				  <div style={{ display: 'flex', gap: '8px' }}>
					{emp.pdf_url ? <a href={emp.pdf_url} target="_blank" rel="noopener noreferrer" style={styles.badgeFile}>الـ CV / العقد</a> : <span style={styles.badgeMuted}>لا يوجد عقد</span>}
					{emp.cert_url ? <a href={emp.cert_url} target="_blank" rel="noopener noreferrer" style={styles.badgeFile}>الشهادات</a> : <span style={styles.badgeMuted}>لا توجد شهادة</span>}
				  </div>
				</td>
				<td style={styles.td}>
				  <button onClick={() => openEditModal(emp)} style={styles.editBtn}>
					<PenTool size={14} /> إدارة الملف
				  </button>
				</td>
			  </tr>
			))}
			{staff.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد سجلات موظفين.</td></tr>}
		  </tbody>
		</table>
	  )}

	  {/* Modal */}
	  {isModalOpen && (
		<div style={styles.modalOverlay}>
		  <div style={styles.modalContent}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
			  <h3 style={{ margin: 0, color: 'var(--color-navy)' }}>{selectedEmployee ? 'تحديث بيانات الموظف' : 'تسجيل موظف جديد'}</h3>
			  <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
			</div>

			<form onSubmit={handleSaveProfile}>
			  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
				<div style={{ flex: 1 }}>
				  <label style={styles.label}>الاسم الرباعي (إلزامي)</label>
				  <input required style={styles.input} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="الاسم كاملاً" />
				</div>
				<div style={{ flex: 1 }}>
				  <label style={styles.label}>الربط بحساب النظام (اختياري)</label>
				  <select style={styles.input} value={formData.profile_id} onChange={e => setFormData({...formData, profile_id: e.target.value})}>
					<option value="">-- عامل / موظف بدون حساب --</option>
					{profiles.map(p => (
					  <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
					))}
				  </select>
				</div>
			  </div>

			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
				<div>
				  <label style={styles.label}>القسم / الإدارة</label>
				  <select style={styles.input} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
					<option value="الشؤون الأكاديمية">الشؤون الأكاديمية</option>
					<option value="الإدارة العليا">الإدارة العليا</option>
					<option value="الإرشاد الطلابي">الإرشاد الطلابي</option>
					<option value="المالية والحسابات">المالية والحسابات</option>
					<option value="الخدمات المساندة">الخدمات المساندة (عمال/أمن)</option>
				  </select>
				</div>
				<div>
				  <label style={styles.label}>المسمى الوظيفي</label>
				  <input required style={styles.input} value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} placeholder="مدير، وكيل، حارس..." />
				</div>
			  </div>

			  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div><label style={styles.label}>رقم الهوية / الإقامة</label><input style={styles.input} value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} /></div>
				
				{formData.department === 'الشؤون الأكاديمية' && (
				  <div><label style={styles.label}>التخصص التدريسي</label><input style={styles.input} value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="مثال: رياضيات" /></div>
				)}
				
				<div><label style={styles.label}>المؤهل العلمي</label><input style={styles.input} value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} placeholder="مثال: بكالوريوس" /></div>
				
				<div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
				  <div style={{ flex: 1 }}>
					<label style={styles.label}>عقد العمل / CV</label>
					<label style={{ ...styles.uploadBox, borderColor: formData.pdf_url ? '#10b981' : '#bfdbfe', backgroundColor: formData.pdf_url ? '#ecfdf5' : '#f8fafc' }}>
					  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'pdf_url')} accept=".pdf,.doc,.docx" disabled={isUploading} />
					  {formData.pdf_url ? <CheckCircle2 size={24} color="#10b981" /> : <UploadCloud size={24} color="var(--color-royal)" />}
					  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.pdf_url ? '#047857' : 'var(--color-navy)' }}>
						{formData.pdf_url ? 'تم رفع الملف ✓' : 'انقر للرفع لجوجل درايف'}
					  </span>
					</label>
				  </div>
				  <div style={{ flex: 1 }}>
					<label style={styles.label}>الشهادات والاعتمادات</label>
					<label style={{ ...styles.uploadBox, borderColor: formData.cert_url ? '#10b981' : '#bfdbfe', backgroundColor: formData.cert_url ? '#ecfdf5' : '#f8fafc' }}>
					  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cert_url')} accept=".pdf,.jpg,.png" disabled={isUploading} />
					  {formData.cert_url ? <CheckCircle2 size={24} color="#10b981" /> : <UploadCloud size={24} color="var(--color-royal)" />}
					  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.cert_url ? '#047857' : 'var(--color-navy)' }}>
						{formData.cert_url ? 'تم رفع الشهادة ✓' : 'انقر للرفع لجوجل درايف'}
					  </span>
					</label>
				  </div>
				</div>
			  </div>

			  <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary} disabled={isUploading}>إلغاء</button>
				<button type="submit" style={styles.btnPrimary} disabled={isUploading}>
				  {isUploading ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
				</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</PageShell>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600, verticalAlign: 'middle' },
  btnAdd: { backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  infoBanner: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px', color: '#1e3a8a', fontWeight: 800 },
  loadingState: { padding: '40px', textAlign: 'center', fontWeight: 800, color: 'var(--color-text-muted)' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-royal)' },
  linkedBadge: { fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' },
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block' },
  badgeFile: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', display: 'inline-block', border: '1px solid #bfdbfe' },
  badgeMuted: { backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block' },
  editBtn: { backgroundColor: 'var(--color-navy)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '8px' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box' },
  uploadBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', border: '2px dashed #bfdbfe', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' },
  btnSecondary: { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }
};