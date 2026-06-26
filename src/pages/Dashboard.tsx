import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Users, UsersRound, CalendarCheck, FileSignature, TrendingUp } from 'lucide-react';
// استيراد الشعار
import logo from '../assets/logo.png';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', 
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b'
};

export default function Dashboard() {
  const { workspace } = useTenant();
  const [stats, setStats] = useState({ students: 0, parents: 0, attendanceToday: 0, assignments: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
	const fetchStats = async () => {
	  if (!workspace) return;
	  setIsLoading(true);

	  const today = new Date().toISOString().split('T')[0];

	  const [studentsRes, parentsRes, attendanceRes, assignmentsRes] = await Promise.all([
		supabase.from('students_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
		supabase.from('guardians_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
		supabase.from('attendance_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).eq('date', today).eq('status', 'حاضر'),
		supabase.from('assignments_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id)
	  ]);

	  setStats({
		students: studentsRes.count || 0,
		parents: parentsRes.count || 0,
		attendanceToday: attendanceRes.count || 0,
		assignments: assignmentsRes.count || 0
	  });

	  setIsLoading(false);
	};

	fetchStats();
  }, [workspace]);

  const StatCard = ({ title, value, icon, color }: { title: string, value: number | string, icon: React.ReactNode, color: string }) => (
	<div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
	  <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
		{icon}
	  </div>
	  <div>
		<p style={{ margin: '0 0 4px 0', color: theme.textMuted, fontSize: '0.9rem', fontWeight: 800 }}>{title}</p>
		<h3 style={{ margin: 0, color: theme.navy, fontSize: '2rem', fontWeight: 900 }}>{isLoading ? '...' : value}</h3>
	  </div>
	</div>
  );

  return (
	<div>
	  <div style={{ marginBottom: '32px' }}>
		<h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>لوحة القيادة</h1>
		<p style={{ fontSize: '0.95rem', color: theme.textMuted, margin: 0 }}>مرحباً بك في النظام المدرسي. إليك نظرة عامة على إحصائيات اليوم.</p>
	  </div>

	  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
		<StatCard title="إجمالي الطلاب" value={stats.students} icon={<Users size={28} />} color={theme.royal} />
		<StatCard title="أولياء الأمور" value={stats.parents} icon={<UsersRound size={28} />} color="#0ea5e9" />
		<StatCard title="الحضور اليوم" value={stats.attendanceToday} icon={<CalendarCheck size={28} />} color="#10b981" />
		<StatCard title="الواجبات النشطة" value={stats.assignments} icon={<FileSignature size={28} />} color="#8b5cf6" />
	  </div>

	  <div style={{ marginTop: '32px', backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
		{/* استبدال الأيقونة المؤقتة بالشعار الفعلي لإظهار جاهزية النظام */}
		<img src={logo} alt="OPERIX Edu" style={{ height: '60px', objectFit: 'contain', marginBottom: '24px' }} />
		
		<h2 style={{ color: theme.navy, margin: '0 0 8px 0' }}>مساحة العمل متصلة وتعمل بنجاح</h2>
		<p style={{ color: theme.textMuted, margin: 0 }}>نظام OPERIX Edu جاهز لإدارة الشؤون الأكاديمية والمالية لمؤسستك.</p>
	  </div>
	</div>
  );
}