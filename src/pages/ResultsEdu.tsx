import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Award } from 'lucide-react';
import { toPng } from 'html-to-image';

const theme = { navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b' };

export default function ResultsEdu() {
  const { workspace } = useTenant();
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [selectedStudent, setSelectedStudent] = useState('');
  // New state for Term/Year selection
  const [certPeriod, setCertPeriod] = useState('term'); 

  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace) return;
	  setIsLoading(true);
	  
	  const { data: sData } = await supabase.from('students_edu').select('*').eq('workspace_id', workspace.id).order('full_name');
	  const { data: rData } = await supabase.from('results_edu').select('*, subjects_edu(name)').eq('workspace_id', workspace.id);

	  if (sData) setStudents(sData);
	  if (rData) setResults(rData);
	  setIsLoading(false);
	};
	fetchData();
  }, [workspace]);

  // DOX STUDIO: إنشاء شهادة مدرسية رسمية وطباعتها كصورة
  const exportCertificate = (studentId: string) => {
	if (!studentId) return alert('الرجاء اختيار طالب أولاً');
	const student = students.find(s => s.id === studentId);
	if (!student) return;

	setIsExporting(true);
	const studentResults = results.filter(r => r.student_id === studentId);
	let totalMarks = 0;
	
	const rowsHTML = studentResults.map(r => {
	  totalMarks += r.marks_obtained || 0;
	  return `
		<tr>
		  <td style="padding: 12px; border: 1px solid #1e293b; font-weight: bold; color: #0f172a;">${r.subjects_edu?.name}</td>
		  <td style="padding: 12px; border: 1px solid #1e293b; font-weight: bold; text-align: center;">${r.marks_obtained}</td>
		  <td style="padding: 12px; border: 1px solid #1e293b; text-align: center;">${r.marks_obtained >= 50 ? 'ناجح' : 'راسب'}</td>
		</tr>
	  `;
	}).join('');

	// Dynamically set the subtitle based on user selection
	const certSubtitle = certPeriod === 'term' ? 'الفصل الدراسي - العام الحالي' : 'نهاية العام الدراسي الحالي';

	const container = document.createElement('div');
	container.style.position = 'fixed';
	container.style.top = '0'; container.style.left = '0';
	container.style.width = '1123px'; container.style.minHeight = '794px';
	container.style.backgroundColor = '#ffffff';
	container.style.zIndex = '-9999'; container.style.direction = 'rtl';
	container.style.padding = '60px'; container.style.boxSizing = 'border-box';
	container.style.fontFamily = '"Tajawal", "Arial", sans-serif';

	container.innerHTML = `
	  <div style="border: 4px double #0f172a; padding: 40px; height: 100%; position: relative;">
		<div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px;">
		  <div style="text-align: right;">
			<h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 900;">${workspace?.name}</h2>
			<p style="margin: 5px 0 0 0; color: #64748b; font-size: 16px;">إدارة الشؤون الأكاديمية والامتحانات</p>
		  </div>
		  <div style="text-align: left;">
			<h2 style="margin: 0; color: #2563eb; font-size: 24px; font-weight: 900;">Dox Studio</h2>
			<p style="margin: 5px 0 0 0; color: #64748b; font-size: 16px;">OPERIX Edu Systems</p>
		  </div>
		</div>

		<div style="text-align: center; margin-bottom: 40px;">
		  <h1 style="font-size: 36px; color: #0f172a; margin: 0; text-decoration: underline;">شهادة إشعار درجات</h1>
		  <h3 style="font-size: 22px; color: #2563eb; margin: 10px 0 0 0;">${certSubtitle}</h3>
		</div>

		<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; font-size: 18px;">
		  <strong>اسم الطالب:</strong> ${student.full_name} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
		  <strong>المرحلة والصف:</strong> ${student.stage || '---'} - ${student.grade_level || '---'} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
		  <strong>رقم الهوية:</strong> ${student.national_id || '---'}
		</div>

		<table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 18px;">
		  <thead>
			<tr style="background-color: #0f172a; color: #ffffff;">
			  <th style="padding: 12px; border: 1px solid #1e293b; text-align: right;">المادة الدراسية</th>
			  <th style="padding: 12px; border: 1px solid #1e293b; text-align: center;">الدرجة المكتسبة</th>
			  <th style="padding: 12px; border: 1px solid #1e293b; text-align: center;">التقدير / الحالة</th>
			</tr>
		  </thead>
		  <tbody>
			${rowsHTML}
			<tr style="background-color: #f1f5f9; font-weight: 900;">
			  <td style="padding: 12px; border: 1px solid #1e293b; text-align: left;">المجموع الكلي:</td>
			  <td style="padding: 12px; border: 1px solid #1e293b; text-align: center; color: #2563eb;">${totalMarks}</td>
			  <td style="padding: 12px; border: 1px solid #1e293b;"></td>
			</tr>
		  </tbody>
		</table>

		<div style="display: flex; justify-content: space-between; margin-top: 80px; font-size: 20px; font-weight: bold; color: #0f172a;">
		  <div style="text-align: center; border-top: 2px dashed #94a3b8; padding-top: 10px; width: 250px;">توقيع مدير المدرسة</div>
		  <div style="text-align: center; border-top: 2px dashed #94a3b8; padding-top: 10px; width: 250px;">الختم الرسمي</div>
		</div>
	  </div>
	`;

	document.body.appendChild(container);

	setTimeout(async () => {
	  try {
		void container.offsetHeight;
		const config = { pixelRatio: 2, backgroundColor: '#ffffff', width: 1123, height: container.scrollHeight };
		
		await toPng(container, config); // Double invocation for font loading[cite: 3]
		const dataUrl = await toPng(container, config); //[cite: 3]
		
		const link = document.createElement('a');
		link.download = `شهادة_${student.full_name.replace(/\s+/g, '_')}.png`;
		link.href = dataUrl;
		link.click();
	  } catch (error) {
		console.error("Error generating Dox Studio Certificate:", error);
		alert("حدث خطأ أثناء استخراج الشهادة.");
	  } finally {
		if (document.body.contains(container)) document.body.removeChild(container);
		setIsExporting(false);
	  }
	}, 1500);
  };

  const styles = {
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	select: { padding: '10px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 800, color: theme.navy, width: '250px' }
  };

  return (
	<div>
	  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
		<div>
		  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>النتائج و Dox Studio</h1>
		  <p style={{ fontSize: '0.95rem', color: theme.textMuted, margin: 0 }}>نظام استخراج الشهادات وكشوف الدرجات الأكاديمية[cite: 3]</p>
		</div>
	  </div>

	  <div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
		<Award size={64} color={theme.royal} style={{ marginBottom: '16px' }} />
		<h2 style={{ color: theme.navy, margin: '0 0 16px 0' }}>أداة استخراج الشهادات (Dox Studio)</h2>
		<p style={{ color: theme.textMuted, marginBottom: '32px' }}>الرجاء اختيار الطالب ونوع الشهادة لاستخراج وطباعة كشف الدرجات الرسمي.</p>
		
		<div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
		  
		  <select style={styles.select} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
			<option value="">-- اختر الطالب --</option>
			{students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade_level})</option>)}
		  </select>

		  {/* New Selection for Term or Year */}
		  <select style={styles.select} value={certPeriod} onChange={e => setCertPeriod(e.target.value)}>
			<option value="term">شهادة فصل دراسي</option>
			<option value="year">شهادة نهاية العام</option>
		  </select>

		  <button style={{ ...styles.btnPrimary, opacity: isExporting ? 0.7 : 1 }} onClick={() => exportCertificate(selectedStudent)} disabled={isExporting}>
			<Printer size={18} /> {isExporting ? 'جاري تجهيز الشهادة...' : 'استخراج الشهادة'}
		  </button>
		  
		</div>
	  </div>
	</div>
  );
}