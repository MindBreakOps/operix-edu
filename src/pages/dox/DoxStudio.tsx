import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { useOutletContext } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { 
  FileSignature, Printer, FileText, Hash, AlertTriangle, 
  FileWarning, Edit3, Upload, Loader2, Download, Award, 
  Clock, Activity, UserX 
} from 'lucide-react';
import { toPng } from 'html-to-image';

export default function StandaloneDoxStudio() {
  const { workspace } = useTenant();
  const outletContext = useOutletContext();
  const isDark = outletContext && typeof outletContext === 'object' && 'isDark' in outletContext 
	? (outletContext as any).isDark 
	: false;
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [docType, setDocType] = useState('summons');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [docTitle, setDocTitle] = useState('استدعاء ولي أمر');
  const [refNumber, setRefNumber] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Core Theme Colors mapping your dark/light modes
  const theme = {
	textMain: isDark ? '#ffffff' : '#0f172a',
	textMuted: isDark ? '#9ca3af' : '#64748b',
	cardBg: isDark ? '#0f0f11' : '#ffffff',
	border: isDark ? '#1f2937' : '#e2e8f0',
	inputBg: isDark ? '#1a1a1e' : '#f8fafc',
	hoverBg: isDark ? '#1a1a1e' : '#f1f5f9',
	gold: '#9a6f28',
	navy: '#0f172a',
	blue: '#2563eb'
  };

  const documentTypes = [
	{ id: 'summons', title: 'استدعاء ولي أمر', icon: AlertTriangle },
	{ id: 'pledge', title: 'تعهد خطي للطالب', icon: FileSignature },
	{ id: 'absence', title: 'إشعار غياب', icon: UserX },
	{ id: 'tardiness', title: 'إشعار تأخر صباحي', icon: Clock },
	{ id: 'medical', title: 'تحويل للوحدة الصحية', icon: Activity },
	{ id: 'appreciation', title: 'شهادة شكر وتقدير', icon: Award },
	{ id: 'enrollment', title: 'إفادة انتظام بالدراسة', icon: FileText },
	{ id: 'exam', title: 'نموذج اختبار / ورقة عمل', icon: Edit3 },
	{ id: 'incident', title: 'تقرير واقعة طلابية', icon: FileWarning },
	{ id: 'report', title: 'خطاب / تقرير عام', icon: FileText }
  ];

  useEffect(() => {
	async function init() {
	  setLoading(true);
	  if (workspace) {
		const { data } = await supabase
		  .from('students_edu')
		  .select('*')
		  .eq('workspace_id', workspace.id)
		  .order('full_name');
		if (data) setStudents(data);
	  }
	  generateRefNumber();
	  setLoading(false);
	}
	init();
  }, [workspace]);

  const generateRefNumber = () => {
	const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 8);
	const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
	setRefNumber(`EDU-${dateStr.substring(0,4)}-${rand}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
	const file = e.target.files?.[0];
	if (file) {
	  const reader = new FileReader();
	  reader.onload = (event) => setLogoBase64(event.target?.result as string);
	  reader.readAsDataURL(file);
	}
  };

  useEffect(() => {
	if (!editorRef.current) return;
	
	const student = students.find(s => s.id === selectedStudentId) || {};
	const date = new Date().toLocaleDateString('ar-SA');

	const commonHeader = `
	  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 40px; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; direction: rtl;">
		<tr>
		  <td width="33%" style="text-align: right; vertical-align: top;">
			<h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: 900;">${docTitle}</h2>
			<p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">الرقم المرجعي: ${refNumber}</p>
			<p style="margin: 0; color: #64748b; font-size: 14px;">التاريخ: ${date}</p>
		  </td>
		  <td width="34%" style="text-align: center; vertical-align: top;">
			<div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">بسم الله الرحمن الرحيم</div>
			<div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">وزارة التعليم</div>
			<div style="font-size: 16px; font-weight: bold; color: #0f172a;">${workspace?.name || 'اسم المدرسة'}</div>
		  </td>
		  <td width="33%" style="text-align: left; vertical-align: top;">
			 ${logoBase64 
			   ? `<img src="${logoBase64}" style="max-height: 80px; max-width: 120px; object-fit: contain; float: left;" />` 
			   : `<div style="float: left; width: 100px; height: 80px; line-height: 80px; text-align: center; color: #94a3b8; font-size: 12px; border: 2px dashed #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-weight: bold;">مكان الشعار</div>`
			 }
		  </td>
		</tr>
	  </table>`;

	const footer = `
	  <div style="margin-top: 60px; font-size: 14px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 15px; color: #64748b;">
		تعتمد هذه الوثيقة من قبل إدارة المدرسة والختم الرسمي | تاريخ الإصدار: ${date}
	  </div>`;

	const bodyStyle = "font-size: 18px; line-height: 2; color: #1e293b; min-height: 700px;";
	let html = '';

	switch (docType) {
	  case 'summons':
		html = `${commonHeader}
		  <div style="${bodyStyle}">
			<p><strong>المكرم ولي أمر الطالب/ة:</strong> ${student.parent_name || '..............................'} المحترم</p>
			<p>السلام عليكم ورحمة الله وبركاته، وبعد...</p>
			<p>نأمل منكم التكرم بمراجعة إدارة المدرسة في أقرب وقت ممكن بخصوص ابنكم/ابنتكم الطالب/ة: <strong>${student.full_name || '..............................'}</strong> المقيد في الصف <strong>${student.grade_level || '....................'}</strong>.</p>
			<p>للتواصل العاجل، رقمكم المسجل لدينا: <span style="direction: ltr; display: inline-block;">${student.parent_phone || '....................'}</span></p>
			<div style="margin-top: 30px; padding: 20px; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 8px; min-height: 200px;">
			  <strong>تفاصيل وأسباب الاستدعاء (اضغط هنا للكتابة):</strong><br/><br/>
			</div>
			<div style="display: flex; justify-content: space-between; margin-top: 100px; text-align: center; font-weight: bold;">
			  <div style="width: 250px; border-top: 1px dashed #000; padding-top: 10px;">المرشد الطلابي / المعلم</div>
			  <div style="width: 250px; border-top: 1px dashed #000; padding-top: 10px;">مدير المدرسة</div>
			</div>
		  </div>${footer}`;
		break;
	  
	  case 'pledge':
		html = `${commonHeader}
		  <div style="${bodyStyle}">
			<h3 style="text-align: center; text-decoration: underline; margin-bottom: 40px;">نموذج تعهد والتزام</h3>
			<p>أتعهد أنا الطالب / <strong>${student.full_name || '..............................'}</strong> المقيد بالصف <strong>${student.grade_level || '....................'}</strong>.</p>
			<p>وبعلم وموافقة ولي أمري المكرم / <strong>${student.parent_name || '..............................'}</strong>.</p>
			<div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; min-height: 150px;">
			  <strong>نص التعهد (اضغط هنا للتعديل):</strong><br/><br/>
			  أقر بالالتزام التام بكافة اللوائح والأنظمة المدرسية، والمحافظة على السلوك والمواظبة.
			</div>
			<div style="display: flex; justify-content: space-between; margin-top: 100px; text-align: center; font-weight: bold;">
			  <div>توقيع الطالب<br/><br/>...................</div>
			  <div>توقيع ولي الأمر<br/><br/>...................</div>
			  <div>الختم الرسمي<br/><br/>...................</div>
			</div>
		  </div>${footer}`;
		break;

	  default:
		html = `${commonHeader}
		  <div style="${bodyStyle}">
			<p><strong>إلى من يهمه الأمر،</strong></p><br/>
			<div style="min-height: 400px;">(اضغط هنا لكتابة التفاصيل...)</div>
		  </div>${footer}`;
	}

	editorRef.current.innerHTML = html;
  }, [docType, selectedStudentId, docTitle, refNumber, students, logoBase64, workspace]);

  const exportAsImage = async () => {
	if (!editorRef.current) return;
	setIsExporting(true);
	try {
	  const config = { pixelRatio: 2, backgroundColor: '#ffffff' };
	  await toPng(editorRef.current, config);
	  const dataUrl = await toPng(editorRef.current, config);
	  
	  const link = document.createElement('a');
	  const studentName = students.find(s => s.id === selectedStudentId)?.full_name || 'Document';
	  link.download = `${docTitle}_${studentName}.png`;
	  link.href = dataUrl;
	  link.click();
	} catch (err) {
	  alert("حدث خطأ أثناء تصدير الوثيقة كصورة.");
	} finally {
	  setIsExporting(false);
	}
  };

  const printDocument = () => {
	if (!editorRef.current) return;
	const printWindow = window.open('', '_blank');
	if (printWindow) {
	  printWindow.document.write(`
		<html dir="rtl">
		  <head>
			<title>${docTitle}</title>
			<style>
			  body { font-family: "Tajawal", "Arial", sans-serif; margin: 0; background: #fff; }
			  @media print { 
				@page { size: A4 portrait; margin: 10mm; } 
				body { padding: 0; }
			  }
			</style>
		  </head>
		  <body>${editorRef.current.innerHTML}</body>
		</html>
	  `);
	  printWindow.document.close();
	  printWindow.focus();
	  setTimeout(() => {
		printWindow.print();
		printWindow.close();
	  }, 500);
	}
  };

  // ----------------------------------------------------------------------
  // PURE INLINE STYLES DEFINITION (No CSS Framework Required)
  // ----------------------------------------------------------------------
  const styles: { [key: string]: React.CSSProperties } = {
	container: { maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', direction: 'rtl', fontFamily: '"Tajawal", "Arial", sans-serif' },
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 },
	mainGrid: { display: 'flex', flex: 1, gap: '24px', minHeight: '0', overflow: 'hidden' }, // Ensures flex-1 and no overflow
	
	// Left Sidebar Configuration Panel
	sidebar: { 
	  width: '400px', flexShrink: 0, borderRadius: '16px', padding: '24px', 
	  display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', 
	  backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
	},
	
	// Inner Form Elements
	refBox: { padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
	inputLabel: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.textMuted, marginBottom: '8px' },
	inputElement: { width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.textMain, outline: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '14px' },
	button: { width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' },
	
	// Right Canvas Editor Area
	editorWrapper: { 
	  flex: 1, borderRadius: '16px', padding: '32px', display: 'flex', justifyContent: 'center', 
	  backgroundColor: isDark ? '#1a1a1e' : '#e2e8f0', border: `1px solid ${theme.border}`, 
	  overflowY: 'auto', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' 
	},
	canvas: { 
	  width: '794px', minHeight: '1123px', padding: '60px', backgroundColor: '#ffffff', 
	  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '4px', outline: 'none', 
	  color: '#0f172a', direction: 'rtl' 
	},
	tooltip: { 
	  position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', 
	  backgroundColor: isDark ? theme.gold : theme.navy, color: isDark ? '#000' : '#fff', 
	  padding: '12px 24px', borderRadius: '50px', fontSize: '12px', fontWeight: 'bold', 
	  pointerEvents: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
	}
  };

  return (
	<div style={styles.container}>
	  
	  {/* TOP HEADER */}
	  <div style={styles.header}>
		<div>
		  <h1 style={{ fontSize: '28px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', color: theme.textMain, margin: '0 0 8px 0' }}>
			<FileSignature size={28} color={isDark ? theme.gold : theme.blue} /> Dox Studio (Edu)
		  </h1>
		  <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted }}>المنصة الاحترافية لتوليد النماذج والوثائق المدرسية الرسمية.</p>
		</div>
	  </div>

	  {/* MAIN LAYOUT: SIDEBAR + EDITOR */}
	  <div style={styles.mainGrid}>
		
		{/* LEFT PANEL: CONFIGURATION */}
		<div style={styles.sidebar}>
		  
		  <div style={styles.refBox}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isDark ? `${theme.gold}22` : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Hash size={20} color={isDark ? theme.gold : theme.blue} />
			  </div>
			  <div>
				<span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: theme.textMuted }}>الرقم المرجعي</span>
				<span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '16px', color: theme.textMain }}>{refNumber}</span>
			  </div>
			</div>
			
			<label style={{ cursor: 'pointer', border: `1px solid ${theme.border}`, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: theme.textMain }}>
			  <Upload size={14}/> إدراج شعار
			  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
			</label>
		  </div>

		  <div>
			<label style={styles.inputLabel}>نوع النموذج (Template)</label>
			<select 
			  value={docType} 
			  onChange={e => {
				setDocType(e.target.value);
				setDocTitle(documentTypes.find(t => t.id === e.target.value)?.title || '');
			  }} 
			  style={styles.inputElement}
			>
			  {documentTypes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
			</select>
		  </div>

		  <div>
			<label style={styles.inputLabel}>عنوان الوثيقة</label>
			<input 
			  required 
			  value={docTitle} 
			  onChange={e => setDocTitle(e.target.value)} 
			  style={styles.inputElement}
			/>
		  </div>

		  <div>
			<label style={styles.inputLabel}>استهداف طالب (للتعبئة التلقائية)</label>
			<div style={{ position: 'relative' }}>
			  <select 
				disabled={loading} 
				value={selectedStudentId} 
				onChange={e => setSelectedStudentId(e.target.value)} 
				style={{ ...styles.inputElement, opacity: loading ? 0.5 : 1 }}
			  >
				<option value="">-- نموذج فارغ (بدون بيانات طالب) --</option>
				{students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade_level})</option>)}
			  </select>
			</div>
			<p style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px' }}>يتم جلب اسم ولي الأمر ورقم الجوال تلقائياً من قاعدة البيانات.</p>
		  </div>

		  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px' }}>
			<button 
			  onClick={printDocument} 
			  style={{ ...styles.button, backgroundColor: isDark ? theme.gold : theme.navy, color: isDark ? '#000' : '#fff' }}
			>
			  <Printer size={18}/> طباعة فورية (PDF)
			</button>
			<button 
			  onClick={exportAsImage} 
			  disabled={isExporting} 
			  style={{ ...styles.button, backgroundColor: 'transparent', border: `2px solid ${theme.border}`, color: theme.textMain, opacity: isExporting ? 0.6 : 1 }}
			>
			  {isExporting ? <Loader2 size={18} /> : <Download size={18}/>} تصدير كصورة (PNG)
			</button>
		  </div>
		</div>

		{/* RIGHT PANEL: LIVE EDITOR */}
		<div style={styles.editorWrapper}>
		  <div 
			ref={editorRef} 
			contentEditable 
			suppressContentEditableWarning
			style={styles.canvas}
		  />
		  <div style={styles.tooltip}>
			✍️ قم بالنقر المباشر على الورقة البيضاء لتعديل أي نص أو كتابة التفاصيل
		  </div>
		</div>

	  </div>
	</div>
  );
}