import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import {
  Users, UsersRound, CalendarCheck, FileSignature, Wallet,
  CalendarDays, AlertTriangle, Clock, BookOpenCheck
} from 'lucide-react';
// استيراد الشعار
import logo from '../../assets/logo.png';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc',
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444', purple: '#8b5cf6', cyan: '#0ea5e9'
};

const STATUS = { PRESENT: 'حاضر', ABSENT: 'غائب', LATE: 'متأخر', PAID: 'مدفوع', UNPAID: 'غير مدفوع', OVERDUE: 'متأخر' };

const todayISO = () => new Date().toISOString().split('T')[0];

const currencyFmt = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
const formatCurrency = (n: number) => currencyFmt.format(n || 0);
const formatShortDate = (d: string) => new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
const weekdayLabel = (d: string) => new Date(d).toLocaleDateString('ar-SA', { weekday: 'short' });

interface Stats {
  students: number;
  guardians: number;
  attendanceToday: number;
  activeAssignments: number;
  outstandingFees: number;
  overdueFees: number;
  upcomingEventsCount: number;
}

interface AttendanceDay { date: string; present: number; absent: number; late: number; }
interface AssignmentRow { id: string; title: string; due_date: string; grade_level: string; subjects_edu?: { name: string } | null; }
interface EventRow { id: string; title: string; event_date: string; is_public: boolean; }

export default function Dashboard() {
  const { workspace } = useTenant();
  const [stats, setStats] = useState<Stats>({
	students: 0, guardians: 0, attendanceToday: 0, activeAssignments: 0,
	outstandingFees: 0, overdueFees: 0, upcomingEventsCount: 0
  });
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceDay[]>([]);
  const [feesBreakdown, setFeesBreakdown] = useState({ paid: 0, unpaid: 0, overdue: 0 });
  const [upcomingAssignments, setUpcomingAssignments] = useState<AssignmentRow[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
	const fetchDashboard = async () => {
	  if (!workspace) return;
	  setIsLoading(true);

	  const today = todayISO();
	  const last7Days = Array.from({ length: 7 }).map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return d.toISOString().split('T')[0];
	  });
	  const startDate = last7Days[0];

	  const [
		studentsRes,
		guardiansRes,
		attendanceTodayRes,
		assignmentsActiveRes,
		feesRes,
		eventsUpcomingRes,
		attendanceWeekRes,
		assignmentsDueRes
	  ] = await Promise.all([
		supabase.from('students_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
		supabase.from('guardians_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
		supabase.from('attendance_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).eq('date', today).eq('status', STATUS.PRESENT),
		supabase.from('assignments_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).gte('due_date', today),
		supabase.from('fees_edu').select('amount, status, due_date').eq('workspace_id', workspace.id),
		supabase.from('events_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).gte('event_date', today),
		supabase.from('attendance_edu').select('date, status').eq('workspace_id', workspace.id).gte('date', startDate).lte('date', today),
		supabase.from('assignments_edu').select('id, title, due_date, grade_level, subjects_edu(name)').eq('workspace_id', workspace.id).gte('due_date', today).order('due_date', { ascending: true }).limit(5),
	  ]);

	  const events = await supabase.from('events_edu').select('id, title, event_date, is_public')
		.eq('workspace_id', workspace.id).gte('event_date', today).order('event_date', { ascending: true }).limit(5);

	  // Fees breakdown
	  let paid = 0, unpaid = 0, overdue = 0;
	  (feesRes.data || []).forEach((f: any) => {
		const isOverdue = f.status === STATUS.OVERDUE || (f.status !== STATUS.PAID && f.due_date < today);
		if (f.status === STATUS.PAID) paid += Number(f.amount) || 0;
		else if (isOverdue) overdue += Number(f.amount) || 0;
		else unpaid += Number(f.amount) || 0;
	  });
	  setFeesBreakdown({ paid, unpaid, overdue });

	  // Attendance trend (last 7 days)
	  const map: Record<string, AttendanceDay> = {};
	  last7Days.forEach(d => { map[d] = { date: d, present: 0, absent: 0, late: 0 }; });
	  (attendanceWeekRes.data || []).forEach((r: any) => {
		if (!map[r.date]) return;
		if (r.status === STATUS.PRESENT) map[r.date].present++;
		else if (r.status === STATUS.ABSENT) map[r.date].absent++;
		else if (r.status === STATUS.LATE) map[r.date].late++;
	  });
	  setAttendanceTrend(last7Days.map(d => map[d]));

	  setUpcomingAssignments((assignmentsDueRes.data as any) || []);
	  setUpcomingEvents((events.data as any) || []);

	  setStats({
		students: studentsRes.count || 0,
		guardians: guardiansRes.count || 0,
		attendanceToday: attendanceTodayRes.count || 0,
		activeAssignments: assignmentsActiveRes.count || 0,
		outstandingFees: unpaid + overdue,
		overdueFees: overdue,
		upcomingEventsCount: eventsUpcomingRes.count || 0
	  });

	  setIsLoading(false);
	};

	fetchDashboard();
  }, [workspace]);

  const attendanceRate = useMemo(() => {
	if (!stats.students) return 0;
	return Math.round((stats.attendanceToday / stats.students) * 100);
  }, [stats.students, stats.attendanceToday]);

  const StatCard = ({ title, value, icon, color, subtitle }: { title: string, value: number | string, icon: React.ReactNode, color: string, subtitle?: string }) => (
	<div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
	  <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
		{icon}
	  </div>
	  <div>
		<p style={{ margin: '0 0 4px 0', color: theme.textMuted, fontSize: '0.9rem', fontWeight: 800 }}>{title}</p>
		<h3 style={{ margin: 0, color: theme.navy, fontSize: '1.7rem', fontWeight: 900 }}>{isLoading ? '...' : value}</h3>
		{subtitle && !isLoading && <p style={{ margin: '4px 0 0 0', color: theme.textMuted, fontSize: '0.78rem', fontWeight: 700 }}>{subtitle}</p>}
	  </div>
	</div>
  );

  const Card = ({ title, children, style }: { title: string, children: React.ReactNode, style?: React.CSSProperties }) => (
	<div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px', ...style }}>
	  <h3 style={{ margin: '0 0 20px 0', color: theme.navy, fontSize: '1.05rem', fontWeight: 900 }}>{title}</h3>
	  {children}
	</div>
  );

  const maxAttendance = Math.max(1, ...attendanceTrend.map(d => d.present + d.absent + d.late));
  const totalFees = feesBreakdown.paid + feesBreakdown.unpaid + feesBreakdown.overdue;

  return (
	<div>
	  <div style={{ marginBottom: '32px' }}>
		<h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>لوحة القيادة</h1>
		<p style={{ fontSize: '0.95rem', color: theme.textMuted, margin: 0 }}>مرحباً بك في النظام المدرسي. إليك نظرة عامة على إحصائيات اليوم.</p>
	  </div>

	  {!isLoading && stats.overdueFees > 0 && (
		<div style={{ marginBottom: '24px', backgroundColor: '#fef2f2', border: `1px solid ${theme.danger}30`, borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
		  <AlertTriangle size={22} color={theme.danger} style={{ flexShrink: 0 }} />
		  <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', fontWeight: 700 }}>
			يوجد رسوم متأخرة السداد بقيمة {formatCurrency(stats.overdueFees)} تحتاج للمتابعة.
		  </p>
		</div>
	  )}

	  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
		<StatCard title="إجمالي الطلاب" value={stats.students} icon={<Users size={26} />} color={theme.royal} />
		<StatCard title="أولياء الأمور" value={stats.guardians} icon={<UsersRound size={26} />} color={theme.cyan} />
		<StatCard title="الحضور اليوم" value={`${stats.attendanceToday} (${attendanceRate}%)`} icon={<CalendarCheck size={26} />} color={theme.success} subtitle={`من أصل ${stats.students} طالب`} />
		<StatCard title="الواجبات النشطة" value={stats.activeAssignments} icon={<FileSignature size={26} />} color={theme.purple} />
		<StatCard title="رسوم مستحقة" value={formatCurrency(stats.outstandingFees)} icon={<Wallet size={26} />} color={theme.warning} subtitle={stats.overdueFees > 0 ? `منها ${formatCurrency(stats.overdueFees)} متأخرة` : undefined} />
		<StatCard title="فعاليات قادمة" value={stats.upcomingEventsCount} icon={<CalendarDays size={26} />} color={theme.navy} />
	  </div>

	  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
		<Card title="الحضور خلال آخر 7 أيام">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : (
			<div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px' }}>
			  {attendanceTrend.map(day => {
				const total = day.present + day.absent + day.late;
				const heightPct = total === 0 ? 3 : Math.max(6, (total / maxAttendance) * 100);
				return (
				  <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '100%', height: '140px', display: 'flex', flexDirection: 'column-reverse', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
					  <div style={{ height: `${heightPct}%`, display: 'flex', flexDirection: 'column-reverse' }} title={`حاضر: ${day.present} • غائب: ${day.absent} • متأخر: ${day.late}`}>
						{day.present > 0 && <div style={{ flex: day.present, backgroundColor: theme.success, minHeight: '3px' }} />}
						{day.late > 0 && <div style={{ flex: day.late, backgroundColor: theme.warning, minHeight: '3px' }} />}
						{day.absent > 0 && <div style={{ flex: day.absent, backgroundColor: theme.danger, minHeight: '3px' }} />}
					  </div>
					</div>
					<span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.textMuted }}>{weekdayLabel(day.date)}</span>
				  </div>
				);
			  })}
			</div>
		  )}
		  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
			<Legend color={theme.success} label="حاضر" />
			<Legend color={theme.warning} label="متأخر" />
			<Legend color={theme.danger} label="غائب" />
		  </div>
		</Card>

		<Card title="حالة الرسوم">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : totalFees === 0 ? (
			<p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>لا توجد سجلات رسوم بعد.</p>
		  ) : (
			<>
			  <div style={{ height: '18px', borderRadius: '9px', overflow: 'hidden', display: 'flex', backgroundColor: '#f1f5f9' }}>
				<div style={{ width: `${(feesBreakdown.paid / totalFees) * 100}%`, backgroundColor: theme.success }} />
				<div style={{ width: `${(feesBreakdown.unpaid / totalFees) * 100}%`, backgroundColor: theme.warning }} />
				<div style={{ width: `${(feesBreakdown.overdue / totalFees) * 100}%`, backgroundColor: theme.danger }} />
			  </div>
			  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<FeesRow color={theme.success} label="مدفوعة" amount={feesBreakdown.paid} />
				<FeesRow color={theme.warning} label="غير مدفوعة" amount={feesBreakdown.unpaid} />
				<FeesRow color={theme.danger} label="متأخرة" amount={feesBreakdown.overdue} />
			  </div>
			</>
		  )}
		</Card>
	  </div>

	  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
		<Card title="واجبات مستحقة قريباً">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : upcomingAssignments.length === 0 ? (
			<EmptyState icon={<BookOpenCheck size={22} />} text="لا توجد واجبات مستحقة قريباً" />
		  ) : (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
			  {upcomingAssignments.map(a => (
				<ListRow
				  key={a.id}
				  icon={<FileSignature size={16} />}
				  color={theme.purple}
				  title={a.title}
				  subtitle={`${a.subjects_edu?.name || ''} • الصف ${a.grade_level}`}
				  meta={formatShortDate(a.due_date)}
				/>
			  ))}
			</div>
		  )}
		</Card>

		<Card title="الفعاليات القادمة">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : upcomingEvents.length === 0 ? (
			<EmptyState icon={<Clock size={22} />} text="لا توجد فعاليات قادمة" />
		  ) : (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
			  {upcomingEvents.map(e => (
				<ListRow
				  key={e.id}
				  icon={<CalendarDays size={16} />}
				  color={theme.cyan}
				  title={e.title}
				  subtitle={e.is_public ? 'فعالية عامة' : 'فعالية داخلية'}
				  meta={formatShortDate(e.event_date)}
				/>
			  ))}
			</div>
		  )}
		</Card>
	  </div>

	  <div style={{ marginTop: '20px', backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
		<img src={logo} alt="OPERIX Edu" style={{ height: '32px', objectFit: 'contain' }} />
		<p style={{ color: theme.textMuted, margin: 0, fontSize: '0.85rem' }}>نظام OPERIX Edu — إدارة الشؤون الأكاديمية والمالية لمؤسستك.</p>
	  </div>
	</div>
  );
}

function Legend({ color, label }: { color: string, label: string }) {
  return (
	<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
	  <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color, display: 'inline-block' }} />
	  <span style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 700 }}>{label}</span>
	</div>
  );
}

function FeesRow({ color, label, amount }: { color: string, label: string, amount: number }) {
  return (
	<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
	  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
		<span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color, display: 'inline-block' }} />
		<span style={{ fontSize: '0.85rem', color: theme.textDark, fontWeight: 700 }}>{label}</span>
	  </div>
	  <span style={{ fontSize: '0.85rem', color: theme.navy, fontWeight: 900 }}>{formatCurrency(amount)}</span>
	</div>
  );
}

function ListRow({ icon, color, title, subtitle, meta }: { icon: React.ReactNode, color: string, title: string, subtitle: string, meta: string }) {
  return (
	<div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
	  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
		{icon}
	  </div>
	  <div style={{ flex: 1, minWidth: 0 }}>
		<p style={{ margin: 0, color: theme.textDark, fontSize: '0.88rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
		<p style={{ margin: '2px 0 0 0', color: theme.textMuted, fontSize: '0.78rem' }}>{subtitle}</p>
	  </div>
	  <span style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 800, flexShrink: 0 }}>{meta}</span>
	</div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 0', color: theme.textMuted }}>
	  {icon}
	  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{text}</span>
	</div>
  );
}