import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { PageShell } from '../../components/layout/PageShell';
import { 
  Users, Plus, Search, PenTool, X, UploadCloud, 
  Camera, HeartPulse, MapPin, BookOpen, AlertCircle, CheckCircle2, Download, Trash2,
  FileSpreadsheet, FileText, File as FileIcon
} from 'lucide-react';

// ==========================================
// ⚠️ ضع رابط الـ Google Apps Script الخاص بك هنا ⚠️
// ==========================================
const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbypUKtMYXnWhIC4egXFR9HHyvIDVqQ-dNsOZvAd9XqlSmBYjc5i0EgnDmhHGh0Fs97kMw/exec";

export default function StudentsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams();
  const [stagedImports, setStagedImports] = useState<any[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'health' | 'documents'>('personal');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
	full_name: '', national_id: '', dob: '', gender: 'ذكر', photo_url: '',
	student_number: '', grade_level: '', section: '', enrollment_date: '', status: 'نشط', behavior_score: 100,
	residence_address: '', city: '', emergency_contact_name: '', emergency_contact_phone: '',
	blood_type: '', medical_conditions: '', health_record_url: '',
	birth_certificate_url: '', previous_school_record_url: ''
  });

const fetchStudents = async () => {
	  if (!workspace || !portalType) return;
	  setIsLoading(true);
  
	  const { data, error } = await supabase
		.from('students_edu')
		.select('*')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', portalType)
		.order('created_at', { ascending: false })
		.limit(10); // <-- Fetches only 10 rows to prevent high bandwidth egress
  
	  if (error) console.error("Fetch Error:", error.message);
	  if (data) setStudents(data);
	  
	  setIsLoading(false);
	};

  useEffect(() => { fetchStudents(); }, [workspace, portalType]);

  const fileToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
	  const reader = new FileReader();
	  reader.readAsDataURL(file);
	  reader.onload = () => resolve((reader.result as string).split(',')[1]);
	  reader.onerror = error => reject(error);
	});
  };

// 1. Triggered when a file is selected
	const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
	  const file = e.target.files?.[0];
	  if (!file) return;
  
	  if (type === 'excel') {
		const reader = new FileReader();
		
		reader.onload = (event) => {
		  try {
			const binaryStr = event.target?.result;
			// Parse the raw binary into an Excel workbook
			const workbook = XLSX.read(binaryStr, { type: 'binary' });
			
			// Grab the very first sheet inside the file
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			
			// Convert that sheet into a neat array of JavaScript objects
			const rawJson = XLSX.utils.sheet_to_json(worksheet);
			
			// Map the Excel columns to your database schema
			// (Make sure the Arabic/English column headers match exactly what's in your template!)
			const mappedData = rawJson.map((row: any, index: number) => ({
			  id: `temp_${index}_${Date.now()}`,
			  full_name: row['اسم الطالب'] || row['Name'] || '',
			  national_id: row['رقم الهوية'] || row['ID'] || '',
			  grade_level: row['الصف الدراسي'] || row['Grade'] || '',
			  status: 'نشط'
			}));
  
			setStagedImports(mappedData);
			setIsPreviewModalOpen(true);
		  } catch (error) {
			console.error("Error parsing Excel file:", error);
			alert("حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel صالح.");
		  }
		};
  
		// Read the file as a binary string so the parser can understand it
		reader.readAsBinaryString(file);
	  } else {
		// PDF and Word fallback
		alert("عذراً، قراءة ملفات Word و PDF تتطلب إعدادات متقدمة في الخادم (Backend). يرجى استخدام قالب Excel حالياً لاستيراد البيانات.");
	  }
  
	  // Reset input so you can select the same file again if needed
	  e.target.value = ''; 
	};
const confirmImport = async () => {
		if (!workspace || !portalType) return;
		setIsUploading(true);
		
		// Map the staged data into the exact schema your database expects
		const payload = stagedImports.map(row => ({
		  workspace_id: workspace.id,
		  portal_type: portalType,
		  full_name: row.full_name || 'بدون اسم',
		  national_id: row.national_id || null,
		  grade_level: row.grade_level || 'غير محدد',
		  status: row.status || 'نشط',
		  behavior_score: 100 // Default value required by your schema
		}));
	
		// Execute bulk insert into Supabase
		const { error } = await supabase.from('students_edu').insert(payload);
		
		if (error) {
		  console.error("Import Error:", error.message);
		  alert("حدث خطأ أثناء حفظ البيانات المستوردة في قاعدة البيانات.");
		} else {
		  // Clear the staging area and refresh the table
		  setStagedImports([]);
		  setIsPreviewModalOpen(false);
		  await fetchStudents();
		}
		
		setIsUploading(false);
	  };
 
 
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
	const file = e.target.files?.[0];
	if (!file || !GAS_WEBHOOK_URL.includes('script.google.com')) return;

	setIsUploading(true);
	try {
	  const base64Data = await fileToBase64(file);
	  const payload = {
		fileName: `${fieldName}_${formData.full_name || 'student'}_${Date.now()}`,
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
		setFormData(prev => ({ ...prev, [fieldName]: result.downloadUrl }));
	  } else {
		alert("فشل الرفع: " + result.error);
	  }
	} catch (err) {
	  alert("خطأ في الاتصال بخادم الملفات.");
	} finally {
	  setIsUploading(false);
	}
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!workspace || !portalType) return;
	setIsUploading(true);
	
	const payload = { ...formData, workspace_id: workspace.id, portal_type: portalType };

	if (selectedStudent) {
	  await supabase.from('students_edu').update(payload).eq('id', selectedStudent.id); // FIX: Changed selectedEmployee to selectedStudent
	} else {
	  await supabase.from('students_edu').insert([payload]);
	}

	await fetchStudents();
	setIsModalOpen(false);
	setIsUploading(false);
  };

  const openModal = (student: any = null) => {
	setSelectedStudent(student);
	setActiveTab('personal');
	if (student) {
	  setFormData(student);
	} else {
	  setFormData({
		full_name: '', national_id: '', dob: '', gender: 'ذكر', photo_url: '',
		student_number: '', grade_level: '', section: '', enrollment_date: new Date().toISOString().split('T')[0], status: 'نشط', behavior_score: 100,
		residence_address: '', city: '', emergency_contact_name: '', emergency_contact_phone: '',
		blood_type: '', medical_conditions: '', health_record_url: '',
		birth_certificate_url: '', previous_school_record_url: ''
	  });
	}
	setIsModalOpen(true);
  };

const filteredStudents = students.filter(s => 
	  (s.full_name || '').includes(search) || 
	  (s.national_id || '').includes(search)
	);

  return (
	<PageShell 
	  title="سجل الطلاب الشامل" 
	  subtitle="إدارة بيانات الطلاب، السجلات الصحية، الملفات، والسلوك"
	  onPrint={() => window.print()}
	  actionButton={<button onClick={() => openModal()} style={styles.btnAdd}><Plus size={18} /> تسجيل طالب جديد</button>}
	>
	  {/* شريط البحث وأدوات الاستيراد - FIX: Cleaned up broken comments */}
	  <div className="no-print" style={{ 
		padding: '20px', 
		borderBottom: '1px solid var(--color-border)', 
		backgroundColor: '#f8fafc',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		flexWrap: 'wrap'
	  }}>
		{/* حقل البحث */}
		<div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
		  <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
		  <input 
			type="text" 
			placeholder="بحث باسم الطالب أو رقم الهوية..." 
			value={search} 
			onChange={e => setSearch(e.target.value)} 
			style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }} 
		  />
		</div>
	  
		{/* أدوات الاستيراد والقوالب */}
		<div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
		  
		  <a href="/templates/students_import_template.xlsx" download style={{...styles.btnImport, backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginRight: 'auto'}}>
			<Download size={16} color="var(--color-royal)" /> تحميل قالب البيانات
		  </a>
	
		  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 8px' }} />
	
		  <button style={styles.btnImport} onClick={() => document.getElementById('import-excel')?.click()}>
			<FileSpreadsheet size={16} color="#10b981" /> استيراد Excel
			<input type="file" id="import-excel" hidden accept=".xlsx, .xls, .csv" onChange={(e) => handleFileImport(e, 'excel')} />
		  </button>

		  {/* FIX: Restored Word and PDF buttons */}
		  <button style={styles.btnImport} onClick={() => document.getElementById('import-word')?.click()}>
			<FileText size={16} color="var(--color-royal)" /> استيراد Word
			<input type="file" id="import-word" hidden accept=".doc, .docx" onChange={(e) => handleFileImport(e, 'word')} />
		  </button>
		  
		  <button style={styles.btnImport} onClick={() => document.getElementById('import-pdf')?.click()}>
			<FileIcon size={16} color="var(--color-danger)" /> استيراد PDF
			<input type="file" id="import-pdf" hidden accept=".pdf" onChange={(e) => handleFileImport(e, 'pdf')} />
		  </button>
		</div>
	  </div>

	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', fontWeight: 800 }}>جاري تحميل البيانات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الطالب</th>
			  <th style={styles.th}>الصف والشعبة</th>
			  <th style={styles.th}>الحالة الأكاديمية</th>
			  <th style={styles.th}>السلوك</th>
			  <th style={styles.th}>الإجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{filteredStudents.map(s => (
			  <tr key={s.id}>
				<td style={{ ...styles.td, fontWeight: 800 }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					{s.photo_url ? (
					  <img src={s.photo_url} alt="Student" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
					) : (
					  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color="var(--color-royal)" /></div>
					)}
					<div style={{ display: 'flex', flexDirection: 'column' }}>
					  <span>{s.full_name}</span>
					  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>رقم: {s.student_number || '---'}</span>
					</div>
				  </div>
				</td>
				<td style={styles.td}>
				  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
					<span style={{ fontWeight: 800, color: 'var(--color-navy)' }}>{s.grade_level || 'غير محدد'}</span>
					<span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>شعبة: {s.section || '---'}</span>
				  </div>
				</td>
				<td style={styles.td}>
				  {s.status === 'نشط' ? <span style={styles.badgeSuccess}>نشط</span> : 
				   s.status === 'انتظار' ? <span style={styles.badgeWarning}>قيد الانتظار (Standby)</span> : 
				   <span style={styles.badgeDanger}>{s.status}</span>}
				</td>
				<td style={styles.td}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900, color: s.behavior_score < 70 ? 'var(--color-danger)' : 'var(--color-success)' }}>
					<AlertCircle size={16} /> {s.behavior_score}/100
				  </div>
				</td>
				<td style={styles.td}>
				  <button onClick={() => openModal(s)} style={styles.editBtn}><PenTool size={14} /> إدارة الملف</button>
				</td>
			  </tr>
			))}
		  </tbody>
		</table>
	  )}

	  {/* 🚀 نافذة معاينة الاستيراد (Staging Area) */}
	  {isPreviewModalOpen && (
		<div style={styles.modalOverlay}>
		  <div style={styles.modalContent}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
			  <div>
				<h2 style={{ margin: 0, color: 'var(--color-navy)' }}>معاينة البيانات المستوردة</h2>
				<p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
				  يرجى مراجعة البيانات وحذف الصفوف غير الصالحة قبل تأكيد الحفظ.
				</p>
			  </div>
			  <button onClick={() => setIsPreviewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
			</div>
	
			<div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
			  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
				<thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
				  <tr>
					<th style={styles.th}>اسم الطالب</th>
					<th style={styles.th}>رقم الهوية</th>
					<th style={styles.th}>الصف الدراسي</th>
					<th style={{...styles.th, textAlign: 'center'}}>إزالة</th>
				  </tr>
				</thead>
				<tbody>
				  {stagedImports.length === 0 ? (
					<tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', fontWeight: 800 }}>لا توجد بيانات صالحة للاستيراد</td></tr>
				  ) : (
					stagedImports.map((row, idx) => (
					  <tr key={row.id || idx} style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
						<td style={styles.td}>{row.full_name || <span style={{color: '#ef4444'}}>فارغ</span>}</td>
						<td style={styles.td}>{row.national_id || '-'}</td>
						<td style={styles.td}>{row.grade_level || '-'}</td>
						<td style={{...styles.td, textAlign: 'center'}}>
						  <button onClick={() => removeStagedItem(row.id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex' }}>
							<Trash2 size={16} color="#ef4444" />
						  </button>
						</td>
					  </tr>
					))
				  )}
				</tbody>
			  </table>
			</div>
	
			  {/* أزرار الحفظ والإلغاء */}
			  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
				<button type="button" onClick={() => setIsPreviewModalOpen(false)} style={styles.btnSecondary} disabled={isUploading}>إلغاء الأمر</button>
				<button type="button" onClick={confirmImport} style={{...styles.btnPrimary, backgroundColor: '#10b981'}} disabled={isUploading || stagedImports.length === 0}>
				  {isUploading ? 'جاري الحفظ...' : `تأكيد استيراد (${stagedImports.length}) طالب`}
				</button>
			  </div>
		  </div>
		</div>
	  )}

	  {/* 🚀 نافذة السجل الشامل (Modal with Tabs) */}
	  {isModalOpen && (
		<div style={styles.modalOverlay}>
		  <div style={styles.modalContent}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
			  <h2 style={{ margin: 0, color: 'var(--color-navy)' }}>{selectedStudent ? 'ملف الطالب الشامل' : 'تسجيل طالب جديد'}</h2>
			  <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
			</div>

			{/* أزرار التبويبات */}
			<div style={styles.tabsContainer}>
			  <button type="button" onClick={() => setActiveTab('personal')} style={activeTab === 'personal' ? styles.tabActive : styles.tab}><Users size={16}/> شخصي وسكن</button>
			  <button type="button" onClick={() => setActiveTab('academic')} style={activeTab === 'academic' ? styles.tabActive : styles.tab}><BookOpen size={16}/> أكاديمي وسلوك</button>
			  <button type="button" onClick={() => setActiveTab('health')} style={activeTab === 'health' ? styles.tabActive : styles.tab}><HeartPulse size={16}/> السجل الصحي</button>
			  <button type="button" onClick={() => setActiveTab('documents')} style={activeTab === 'documents' ? styles.tabActive : styles.tab}><UploadCloud size={16}/> الوثائق الرسمية</button>
			</div>

			<form onSubmit={handleSaveStudent}>
			  <div style={styles.tabContent}>
				
				{/* --- التبويب الأول: شخصي وسكن --- */}
				{activeTab === 'personal' && (
				  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<div style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
					  <div style={{ position: 'relative' }}>
						<img src={formData.photo_url || 'https://via.placeholder.com/80'} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
						<label style={{ position: 'absolute', bottom: '-10px', right: '-10px', backgroundColor: 'var(--color-royal)', padding: '6px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
						  <Camera size={14} />
						  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'photo_url')} accept="image/*" />
						</label>
					  </div>
					  <div style={{ flex: 1 }}>
						<label style={styles.label}>الاسم الرباعي</label>
						<input required style={styles.input} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
					  </div>
					</div>

					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					  <div><label style={styles.label}>رقم الهوية / الإقامة</label><input required style={styles.input} value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} /></div>
					  <div><label style={styles.label}>تاريخ الميلاد</label><input type="date" style={styles.input} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
					</div>

					<h4 style={{ margin: '16px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18}/> بيانات السكن والتواصل</h4>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					  <div style={{ gridColumn: 'span 2' }}><label style={styles.label}>العنوان الوطني / السكن</label><input style={styles.input} value={formData.residence_address} onChange={e => setFormData({...formData, residence_address: e.target.value})} /></div>
					  <div><label style={styles.label}>اسم جهة الاتصال للطوارئ</label><input style={styles.input} value={formData.emergency_contact_name} onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})} /></div>
					  <div><label style={styles.label}>رقم الاتصال للطوارئ</label><input style={styles.input} value={formData.emergency_contact_phone} onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})} /></div>
					</div>
				  </div>
				)}

				{/* --- التبويب الثاني: أكاديمي وسلوك --- */}
				{activeTab === 'academic' && (
				  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					  <div>
						<label style={styles.label}>الرقم الأكاديمي</label>
						<input 
						  style={{ 
							...styles.input, 
							backgroundColor: '#f1f5f9', 
							color: 'var(--color-text-muted)',
							cursor: 'not-allowed' 
						  }} 
						  value={formData.student_number || ''} 
						  disabled 
						  placeholder="سيتم التوليد تلقائياً عند الحفظ..." 
						/>
						<span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
						  يُصدر النظام هذا الرقم آلياً لضمان عدم التكرار.
						</span>
					  </div>
					  <div>
						<label style={styles.label}>تاريخ التسجيل</label>
						<input type="date" style={styles.input} value={formData.enrollment_date} onChange={e => setFormData({...formData, enrollment_date: e.target.value})} />
					  </div>
					</div>
					
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					  <div><label style={styles.label}>الصف الدراسي</label><input style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} placeholder="مثال: الأول الابتدائي" /></div>
					  <div><label style={styles.label}>الشعبة</label><input style={styles.input} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="مثال: أ" /></div>
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
					  <div>
						<label style={styles.label}>حالة القيد</label>
						<select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
						  <option value="نشط">نشط</option>
						  <option value="انتظار">على قائمة الانتظار (Standby)</option>
						  <option value="مفصول">مفصول</option>
						  <option value="منسحب">منسحب</option>
						</select>
					  </div>
					  <div>
						<label style={styles.label}>نقاط السلوك والمواظبة (من 100)</label>
						<input type="number" max="100" min="0" style={styles.input} value={formData.behavior_score} onChange={e => setFormData({...formData, behavior_score: parseInt(e.target.value)})} />
					  </div>
					</div>
				  </div>
				)}

				{/* --- التبويب الثالث: السجل الصحي --- */}
				{activeTab === 'health' && (
				  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<div>
					  <label style={styles.label}>فصيلة الدم</label>
					  <select style={styles.input} value={formData.blood_type} onChange={e => setFormData({...formData, blood_type: e.target.value})}>
						<option value="">غير محدد</option><option value="O+">O+</option><option value="O-">O-</option>
						<option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="AB+">AB+</option>
					  </select>
					</div>
					<div>
					  <label style={styles.label}>الأمراض المزمنة أو الحساسية (إن وجدت)</label>
					  <textarea rows={4} style={{...styles.input, resize: 'none'}} value={formData.medical_conditions} onChange={e => setFormData({...formData, medical_conditions: e.target.value})} placeholder="سجل أي ملاحظات طبية هامة هنا..." />
					</div>
					<div style={{ marginTop: '12px' }}>
					  <label style={styles.label}>ملف التقرير الطبي الشامل (PDF/Image)</label>
					  <label style={styles.uploadBox}>
						<input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'health_record_url')} disabled={isUploading} />
						{formData.health_record_url ? <CheckCircle2 size={24} color="#10b981" /> : <HeartPulse size={24} color="var(--color-danger)" />}
						<span style={{ fontWeight: 800, marginTop: '8px', color: formData.health_record_url ? '#10b981' : 'inherit' }}>
						  {formData.health_record_url ? 'تم رفع السجل الطبي بنجاح ✓' : 'انقر لرفع التقرير الطبي للطالب'}
						</span>
					  </label>
					</div>
				  </div>
				)}

				{/* --- التبويب الرابع: الوثائق والملفات --- */}
				{activeTab === 'documents' && (
				  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					<div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
					  <label style={styles.label}>شهادة الميلاد أو الهوية</label>
					  <label style={styles.uploadBox}>
						<input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'birth_certificate_url')} disabled={isUploading} />
						{formData.birth_certificate_url ? <CheckCircle2 size={24} color="#10b981" /> : <UploadCloud size={24} color="var(--color-royal)" />}
						<span style={{ fontWeight: 800, marginTop: '8px' }}>{formData.birth_certificate_url ? 'تم رفع الشهادة بنجاح ✓' : 'رفع شهادة الميلاد'}</span>
					  </label>
					</div>
					<div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
					  <label style={styles.label}>السجل الأكاديمي السابق (الشهادات السابقة)</label>
					  <label style={styles.uploadBox}>
						<input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'previous_school_record_url')} disabled={isUploading} />
						{formData.previous_school_record_url ? <CheckCircle2 size={24} color="#10b981" /> : <UploadCloud size={24} color="var(--color-royal)" />}
						<span style={{ fontWeight: 800, marginTop: '8px' }}>{formData.previous_school_record_url ? 'تم رفع السجل بنجاح ✓' : 'رفع شهادات المدرسة السابقة'}</span>
					  </label>
					</div>
				  </div>
				)}
			  </div>

			  {/* أزرار الحفظ والإلغاء */}
			  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary} disabled={isUploading}>إلغاء</button>
				<button type="submit" style={styles.btnPrimary} disabled={isUploading}>
				  {isUploading ? 'جاري المعالجة...' : 'حفظ بيانات الطالب'}
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
  editBtn: { backgroundColor: 'var(--color-navy)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' },
  
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 },
  badgeWarning: { backgroundColor: '#fffbeb', color: '#d97706', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 },
  badgeDanger: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '750px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  
  tabsContainer: { display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-border)', paddingBottom: '12px', marginBottom: '24px', overflowX: 'auto' },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontWeight: 800, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', borderRadius: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', whiteSpace: 'nowrap' },
  tabContent: { minHeight: '300px' },

  label: { display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '8px' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box' },
  uploadBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', border: '2px dashed #bfdbfe', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', transition: 'all 0.2s', textAlign: 'center' },
  
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' },
  btnSecondary: { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' },
  btnImport: { 
	backgroundColor: '#fff', 
	color: 'var(--color-navy)', 
	border: '1px solid var(--color-border)', 
	padding: '8px 16px', 
	borderRadius: '8px', 
	fontWeight: 800, 
	cursor: 'pointer', 
	display: 'flex', 
	alignItems: 'center', 
	gap: '8px', 
	fontSize: '0.85rem',
	transition: 'all 0.2s ease',
	boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  }
};