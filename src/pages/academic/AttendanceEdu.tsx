import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Printer, Save, CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendanceEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace || !portalType) return;
	  setIsLoading(true);

	  // 1. Fetch Students Strictly Isolated by Portal
	  const { data: studentsData } = await supabase
		.from('students_edu')
		.select('id, full_name, stage, grade_level, section')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', portalType)
		.order('full_name');

	  if (studentsData) setStudents(studentsData);

	  // 2. Fetch Existing Attendance Records for this Date & Portal
	  const { data: attData } = await supabase
		.from('attendance_edu')
		.select('student_id, status')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', portalType)
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
  }, [workspace, portalType, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
	setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
	if (!workspace || !portalType) return;
	setIsSaving(true);

	const payload = Object.keys(attendance).map(studentId => ({
	  workspace_id: workspace.id,
	  portal_type: portalType, // Ensuring record isolation
	  student_id: studentId,
	  date: selectedDate,
	  status: attendance[studentId]
	}));

	// Upsert against student_id + date constraint
	const { error } = await supabase.from('attendance_edu').upsert(payload, { onConflict: 'student_id,date' });
	
	setIsSaving(false);
	if (error) alert('حدث خطأ أثناء الحفظ. الرجاء المحاولة مجدداً.');
	else alert('تم حفظ سجل الحضور بنجاح للطلاب.');
  };

  const getStatusButton = (currentStatus: string, targetStatus: string, label: string, colorVariable: string, icon: React.ReactNode) => {
	const isActive = currentStatus === targetStatus;
	return (
	  <button
		onClick={() => handleStatusChange('', targetStatus)} 
		style={{
		  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
		  borderRadius: '6px', 
		  border: `1px solid ${isActive ? `var(${colorVariable})` : 'var(--color-border)'}`,
		  backgroundColor: isActive ? `var(${colorVariable})` : 'var(--color-white)',
		  color: isActive ? 'var(--color-white)' : 'var(--color-text-muted)',
		  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
		}}
	  >
		{icon} {label}
	  </button>
	);
  };

  return (
	<div>
	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>سجل الحضور والغياب</h1>
		  <p style={styles.subtitle}>الرصد اليومي لطلاب {portalType === 'kindergarten' ? 'رياض الأطفال' : 'الفصول'}</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}>
			<Printer size={18} /> طباعة الكشف
		  </button>
		  <button style={styles.btnPrimary} onClick={saveAttendance} disabled={isSaving}>
			<Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ السجل'}
		  </button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		<div className="no-print" style={styles.controlBar}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			<CalendarDays size={20} color="var(--color-navy)" />
			<span style={{ fontWeight: 800, color: 'var(--color-navy)' }}>تاريخ السجل:</span>
			<input 
			  type="date" 
			  value={selectedDate} 
			  onChange={(e) => setSelectedDate(e.target.value)}
			  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 700, color: 'var(--color-text-dark)' }}
			/>
		  </div>
		</div>

		{isLoading ? (
		  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
			جاري تحميل كشف البوابة...
		  </div>
		) : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>#</th>
				<th style={styles.th}>اسم الطالب</th>
				<th style={styles.th}>الصف والشعبة</th>
				<th style={styles.th}>تسجيل الحالة</th>
			  </tr>
			</thead>
			<tbody>
			  {students.map((s, index) => {
				const currentStatus = attendance[s.id] || '';
				return (
				  <tr key={s.id}>
					<td style={{ ...styles.td, color: 'var(--color-text-muted)' }}>{index + 1}</td>
					<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>{s.full_name}</td>
					<td style={styles.td}>
					  <span style={{ backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
						{s.grade_level} - {s.section}
					  </span>
					</td>
					<td className="no-print" style={styles.td}>
					  <div style={{ display: 'flex', gap: '8px' }}>
						{React.cloneElement(getStatusButton(currentStatus, 'حاضر', 'حاضر', '--color-success', <CheckCircle size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'حاضر') })}
						{React.cloneElement(getStatusButton(currentStatus, 'غائب', 'غائب', '--color-danger', <XCircle size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'غائب') })}
						{React.cloneElement(getStatusButton(currentStatus, 'متأخر', 'متأخر', '--color-warning', <Clock size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'متأخر') })}
						{React.cloneElement(getStatusButton(currentStatus, 'بعذر', 'مستأذن', '--color-royal', <CalendarDays size={14} />) as React.ReactElement, { onClick: () => handleStatusChange(s.id, 'بعذر') })}
					  </div>
					  
					  {/* Browser Natively Handles This via the global print engine in index.css */}
					  <span className="print-only" style={{ fontWeight: 800, color: 'var(--color-navy)' }}>
						{currentStatus || '—'}
					  </span>
					</td>
				  </tr>
				);
			  })}
			  {students.length === 0 && (
				<tr>
				  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
					لا يوجد طلاب مسجلين في هذه المرحلة التعليمية.
				  </td>
				</tr>
			  )}
			</tbody>
		  </table>
		)}
	  </div>
	</div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 },
  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fcfcfd' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600 },
};