import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, FileSpreadsheet, Award, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';

const theme = { navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b' };

export default function DoxStudio() {
  const { workspace } = useTenant();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [docType, setDocType] = useState('transcript'); // transcript, excellence, enrollment
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
	const fetchStudents = async () => {
	  if (!workspace) return;
	  const { data } = await supabase.from('students_edu').select('*').eq('workspace_id', workspace.id).order('full_name');
	  if (data) setStudents(data);
	};
	fetchStudents();
  }, [workspace]);

  const generateDocument = async () => {
	if (!selectedStudent) return alert('الرجاء تحديد الطالب');
	const student = students.find(s => s.id === selectedStudent);
	if (!student) return;

	setIsExporting(true);

	const container = document.createElement('div');
	container.style.position = 'fixed'; container.style.top = '0'; container.style.left = '0';
	container.style.width = '1123px'; container.style.minHeight = '794px'; // A4 Landscape
	container.style.backgroundColor = '#ffffff'; container.style.zIndex = '-9999';
	container.style.direction = 'rtl'; container.style.padding = '60px';
	container.style.boxSizing = 'border-box'; container.style.fontFamily = '"Tajawal", "Arial", sans-serif';

	// القوالب المختلفة
	if (docType === 'enrollment') {
	  container.innerHTML = `
		<div style="border: 2px solid ${theme.navy}; padding: 60px; height: 100%; text-align: center;">
		  <h1 style="color: ${theme.navy}; font-size: 32px; margin-bottom: 50px;">إفادة تسجيل منتظم</h1>
		  <p style="font-size: 24px; line-height: 2;">
			تشهد إدارة <strong>${workspace?.name}</strong> بأن الطالب(ة): <br/>
			<span style="font-size: 30px; font-weight: bold; color: ${theme.royal};">${student.full_name}</span> <br/>
			المسجل برقم الهوية: <strong>${student.national_id || '---'}</strong> <br/>
			مقيد(ة) لدينا ومنتظم(ة) بالدراسة في المرحلة <strong>${student.stage}</strong> - <strong>${student.grade_level}</strong> للعام الدراسي الحالي.
		  </p>
		  <p style="font-size: 20px; margin-top: 50px;">وبناءً على طلب ولي الأمر أعطيت له هذه الإفادة لتقديمها لمن يهمه الأمر.</p>
		  <div style="margin-top: 100px; display: flex; justify-content: space-around;">
			<div><strong>شؤون الطلاب</strong></div>
			<div><strong>مدير المدرسة</strong></div>
		  </div>
		</div>
	  `;
	} else if (docType === 'excellence') {
	  container.innerHTML = `
		<div style="border: 10px solid #fef08a; padding: 20px; height: 100%; background-color: #fefce8; text-align: center; position: relative;">
		  <div style="border: 2px solid #ca8a04; padding: 40px; height: 100%;">
			<h1 style="color: #ca8a04; font-size: 40px; margin-bottom: 20px;">شكر وتقدير</h1>
			<h2 style="color: ${theme.navy}; font-size: 28px;">إلى الطالب المتميز / ${student.full_name}</h2>
			<p style="font-size: 24px; line-height: 1.8; margin-top: 40px; color: #422006;">
			  يسر إدارة ${workspace?.name} أن تتقدم بخالص الشكر والتقدير للطالب لتميزه الأكاديمي والسلوكي.<br/>
			  متمنين له دوام التوفيق والنجاح.
			</p>
			<div style="position: absolute; bottom: 80px; left: 80px;"><strong>الختم المعتمد</strong></div>
		  </div>
		</div>
	  `;
	} else {
	  // إشعار الدرجات (Transcript) يحتاج جلب الدرجات أولاً
	  const { data: results } = await supabase.from('results_edu').select('*, subjects_edu(name)').eq('student_id', student.id);
	  const rows = (results || []).map(r => `
		<tr>
		  <td style="border: 1px solid #cbd5e1; padding: 12px; font-weight: bold;">${r.subjects_edu?.name}</td>
		  <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">${r.marks_obtained}</td>
		  <td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">${r.marks_obtained >= 50 ? 'ناجح' : 'راسب'}</td>
		</tr>
	  `).join('');

	  container.innerHTML = `
		<div style="border: 4px double ${theme.navy}; padding: 40px; height: 100%;">
		  <div style="display: flex; justify-content: space-between; border-bottom: 2px solid ${theme.royal}; padding-bottom: 20px; margin-bottom: 40px;">
			<div><h2 style="margin:0; color: ${theme.navy};">${workspace?.name}</h2><p style="margin:0;">الشؤون الأكاديمية</p></div>
			<div style="text-align: left;"><h2 style="margin:0; color: ${theme.royal};">Dox Studio</h2></div>
		  </div>
		  <h2 style="text-align: center; text-decoration: underline;">كشف درجات الطالب</h2>
		  <div style="background: ${theme.slate}; padding: 20px; border-radius: 8px; margin-bottom: 30px; font-size: 18px; display: flex; justify-content: space-between;">
			<div><strong>الاسم:</strong> ${student.full_name}</div>
			<div><strong>الصف:</strong> ${student.grade_level}</div>
		  </div>
		  <table style="width: 100%; border-collapse: collapse; font-size: 18px;">
			<thead><tr style="background: ${theme.navy}; color: white;"><th style="padding: 12px; border: 1px solid ${theme.navy};">المادة</th><th style="padding: 12px; border: 1px solid ${theme.navy};">الدرجة</th><th style="padding: 12px; border: 1px solid ${theme.navy};">النتيجة</th></tr></thead>
			<tbody>${rows || '<tr><td colspan="3" style="text-align:center; padding: 20px;">لا توجد درجات مرصودة</td></tr>'}</tbody>
		  </table>
		</div>
	  `;
	}

	document.body.appendChild(container);

	setTimeout(async () => {
	  try {
		void container.offsetHeight; // إجبار المتصفح على رسم العناصر
		const config = { pixelRatio: 2, backgroundColor: '#ffffff', width: 1123, height: container.scrollHeight, cacheBust: true };
		
		await toPng(container, config); // استدعاء مزدوج لضمان تحميل الخطوط
		const dataUrl = await toPng(container, config);
		
		const link = document.createElement('a');
		link.download = `وثيقة_${student.full_name}.png`;
		link.href = dataUrl;
		link.click();
	  } catch (err) {
		alert("حدث خطأ أثناء التوليد");
	  } finally {
		if (document.body.contains(container)) document.body.removeChild(container);
		setIsExporting(false);
	  }
	}, 1000);
  };

  const OptionCard = ({ type, title, desc, icon: IconComponent }: any) => (
	<div 
	  onClick={() => setDocType(type)}
	  style={{ border: `2px solid ${docType === type ? theme.royal : theme.border}`, borderRadius: '12px', padding: '24px', cursor: 'pointer', backgroundColor: docType === type ? '#eff6ff' : theme.white, transition: 'all 0.2s', flex: 1 }}
	>
	  <IconComponent size={32} color={docType === type ? theme.royal : theme.textMuted} style={{ marginBottom: '12px' }} />
	  <h3 style={{ margin: '0 0 8px 0', color: theme.navy }}>{title}</h3>
	  <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMuted }}>{desc}</p>
	</div>
  );

  return (
	<div>
	  <div style={{ marginBottom: '32px' }}>
		<h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>Dox Studio</h1>
		<p style={{ margin: 0, color: theme.textMuted }}>منصة الاستخراج والطباعة الرسمية للوثائق</p>
	  </div>

	  <div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '32px' }}>
		<div style={{ marginBottom: '32px' }}>
		  <label style={{ fontWeight: 800, color: theme.navy, display: 'block', marginBottom: '8px' }}>تحديد الطالب المستهدف</label>
		  <select 
			style={{ width: '100%', maxWidth: '400px', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 800 }}
			value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
		  >
			<option value="">-- اختر الطالب --</option>
			{students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade_level})</option>)}
		  </select>
		</div>

		<h3 style={{ color: theme.navy, marginBottom: '16px' }}>اختيار قالب الوثيقة</h3>
		<div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
		  <OptionCard type="transcript" title="إشعار الدرجات" desc="كشف تفصيلي بدرجات الطالب في جميع المواد." icon={FileSpreadsheet} />
		  <OptionCard type="enrollment" title="إفادة تسجيل" desc="إثبات انتظام الطالب في المدرسة لتقديمه للجهات الرسمية." icon={FileText} />
		  <OptionCard type="excellence" title="شهادة تفوق" desc="شهادة شكر وتقدير للطلاب المتميزين." icon={Award} />
		</div>

		<button 
		  onClick={generateDocument} 
		  disabled={isExporting}
		  style={{ backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '16px 32px', borderRadius: '8px', fontWeight: 900, cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'center', fontSize: '1.1rem' }}
		>
		  <Printer size={24} /> {isExporting ? 'جاري تجهيز وبناء الوثيقة...' : 'توليد واستخراج الوثيقة (PNG)'}
		</button>
	  </div>
	</div>
  );
}