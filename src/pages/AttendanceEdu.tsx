import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, Save, CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', 
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b',
  success: '#10b981', danger: '#ef4444', warning: '#f59e0b'
};

export default function AttendanceEdu() {
  const { workspace } = useTenant();
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace) return;
	  setIsLoading(true);

	  // 1. جلب الطلاب
	  const { data: studentsData } = await supabase
		.from('students_edu')
		.select('id, full_name, stage, grade_level, section')
		.eq('workspace_id', workspace.id)
		.order('full_name');

	  if (studentsData) setStudents(studentsData);

	  // 2. جلب سجلات الحضور لهذا اليوم إن وجدت
	  const { data: attData } = await supabase
		.from('attendance_edu')
		.select('student_id, status')
		.eq('workspace_id', workspace.id)
		.eq('date', selectedDate);

	  const attMap: { [key: string]: string } = {};
	  if (attData) {
		attData.forEach(record => {
		  attMap[record.student_id] = record.status;
		});
	  }
	  setAttendance(attMap);
	  setIsLoading(false);
	};

	fetchData();
  }, [workspace, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
	setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
	if (!workspace) return;
	setIsSaving(true);

	const payload = Object.keys(attendance).map(studentId => ({
	  workspace_id: workspace.id,
	  student_id: studentId,
	  date: selectedDate,
	  status: attendance[studentId],
	  // افترضنا هنا وجود term_id افتراضي، في الأنظمة المتقدمة يتم سحبه من إعدادات السنة الدراسية
	  term_id: '00000000-0000-0000-0000-000000000000' 
	}));

	// حفظ البيانات في السيرفر (Upsert: تحديث إذا كان موجود، إدراج إذا كان جديد)
	const { error } = await supabase.from('attendance_edu').upsert(payload, { onConflict: 'student_id,date' });
	
	setIsSaving(false);
	if (error) alert('حدث خطأ أثناء الحفظ');
	else alert('تم حفظ سجل الحضور بنجاح');
  };

  const getStatusButton = (currentStatus: string, targetStatus: string, label: string, color: string, icon: React.ReactNode) => {
	const isActive = currentStatus === targetStatus;
	return (
	  <button
		onClick={() => handleStatusChange('', targetStatus)} // We will wrap this in a closure below
		style={{
		  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
		  borderRadius: '6px', border: `1px solid ${isActive ? color : theme.border}`,
		  backgroundColor: isActive ? `${color}15` : theme.white,
		  color: isActive ? color : theme.textMuted,
		  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
		}}
	  >
		{icon} {label}
	  </button>
	);
  };

  const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
	title: { fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0', letterSpacing: '-0.5px' },
	subtitle: { fontSize: '0.95rem', color: theme.textMuted, margin: 0 },
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
	controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: '#fcfcfd' },
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	btnSecondary: { backgroundColor: theme.white, color: theme.navy, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	th: { backgroundColor: theme.slate, color: theme.textMuted, fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right' as const, borderBottom: `1px solid ${theme.border}` },
	td: { padding: '16px', borderBottom: `1px solid ${theme.border}`, color: theme.textDark, fontWeight: 600 },
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
		  <h1 style={styles.title}>سجل الحضور والغياب</h1>
		  <p style={styles.subtitle}>رصد الحضور اليومي للطلاب في الفصول</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة الكشف</button>
		  <button style={styles.btnPrimary} onClick={saveAttendance} disabled={isSaving}>
			<Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ السجل'}
		  </button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		<div className="no-print" style={styles.controlBar}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			<CalendarDays size={20} color={theme.navy} />
			<span style={{ fontWeight: 800, color: theme.navy }}>تاريخ السجل:</span>
			<input 
			  type="date" 
			  value={selectedDate} 
			  onChange={(e) => setSelectedDate(e.target.value)}
			  style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 700 }}
			/>
		  </div>
		</div>

		{isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontWeight: 800 }}>جاري تحميل الكشف...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>#</th>
				<th style={styles.th}>اسم الطالب</th>
				<th style={styles.th}>الصف الدراسي</th>
				<th style={styles.th}>تسجيل الحالة</th>
			  </tr>
			</thead>
			<tbody>
			  {students.map((s, index) => {
				const currentStatus = attendance[s.id] || '';
				return (
				  <tr key={s.id}>
					<td style={{ ...styles.td, color: theme.textMuted }}>{index + 1}</td>
					<td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}>{s.full_name}</td>
					<td style={styles.td}>
					  <span style={{ backgroundColor: theme.slate, color: theme.textMuted, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: `1px solid ${theme.border}` }}>
						{s.grade_level} - {s.section}
					  </span>
					</td>
					<td className="no-print" style={styles.td}>
					  <div style={{ display: 'flex', gap: '8px' }}>
						{React.cloneElement(getStatusButton(currentStatus, 'حاضر', 'حاضر', theme.success, <CheckCircle size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'حاضر') })}
						{React.cloneElement(getStatusButton(currentStatus, 'غائب', 'غائب', theme.danger, <XCircle size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'غائب') })}
						{React.cloneElement(getStatusButton(currentStatus, 'متأخر', 'متأخر', theme.warning, <Clock size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'متأخر') })}
						{React.cloneElement(getStatusButton(currentStatus, 'بعذر', 'مستأذن', theme.royal, <CalendarDays size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'بعذر') })}
					  </div>
					  
					  {/* For Print Only */}
					  <span className="print-only" style={{ display: 'none', fontWeight: 800 }}>{currentStatus || '—'}</span>
					</td>
				  </tr>
				);
			  })}
			  {students.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontWeight: 800 }}>لا يوجد طلاب مسجلين في هذا النظام بعد.</td></tr>}
			</tbody>
		  </table>
		)}
	  </div>
	</div>
  );
}