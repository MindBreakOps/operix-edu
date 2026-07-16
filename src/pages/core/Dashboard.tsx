import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import {
  Users, CheckCircle2, UsersRound, XCircle, FileSignature, Wallet,
  Bell, ArrowUpRight, ArrowDownRight, CalendarDays, Landmark
} from 'lucide-react';

/**
 * NewDashboardDesign — OPERIX Edu
 * ------------------------------------------------------------
 * Every figure on this dashboard is fetched from real Supabase tables.
 * No hardcoded/mock numbers. Panels that had no matching column in the
 * schema (peak-hour heatmap, subject engagement ranking, curriculum
 * completion gauge) were removed rather than faked — replaced with a
 * currency-split fees panel and a loans/debts summary, both backed by
 * real columns (fees_edu.currency, finance_loans).
 * ------------------------------------------------------------
 */

const theme = {
  navy: '#131b2e', royal: '#4f7df3', slate: '#f5f7fb',
  white: '#ffffff', border: '#e4e8f0', textDark: '#1e293b', textMuted: '#64748b',
  success: '#16a34a', successBg: '#e6f6ec',
  danger: '#ef4444', dangerBg: '#fdeceb',
  warning: '#d97706', warningBg: '#fdf1e0',
  purple: '#8b5cf6', purpleBg: '#efe9fe',
  cyan: '#0ea5e9', cyanBg: '#e3f4fd',
  pink: '#ec4899', pinkBg: '#fce8f3',
};

const STATUS = { PRESENT: 'حاضر', ABSENT: 'غائب', LATE: 'متأخر' };
const FEE_STATUS = { PAID: 'مدفوع', UNPAID: 'غير مدفوع', OVERDUE: 'متأخر' };

// currency-aware formatters — SAR and SDG are tracked separately, never summed together
const fmtBy = (currency: string) =>
  new Intl.NumberFormat(currency === 'SDG' ? 'ar-SD' : 'ar-SA', { maximumFractionDigits: 0 });
const currencySuffix = (currency: string) => (currency === 'SDG' ? 'ج.س' : '﷼');

const todayISO = () => new Date().toISOString().split('T')[0];
const weekdayLabel = (d: string) => new Date(d).toLocaleDateString('ar-SA', { weekday: 'short' });
const formatShortDate = (d: string) => new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });

interface CoreStats {
  totalStudents: number;
  activeGuardians: number;
  attendanceToday: number;
  absentToday: number;
  lateToday: number;
  activeAssignments: number;
  upcomingEventsCount: number;
}

interface FeesByCurrency {
  currency: string;
  paid: number;
  unpaid: number;
  overdue: number;
}

interface LoanSummary {
  currency: string;
  outstanding: number;
  count: number;
}

interface AttendanceDay { date: string; present: number; absent: number; late: number; }
interface EventRow { id: string; title: string; event_date: string; is_public: boolean; }

export default function NewDashboardDesign() {
  const { workspace } = useTenant();

  const [stats, setStats] = useState<CoreStats>({
	totalStudents: 0, activeGuardians: 0, attendanceToday: 0, absentToday: 0,
	lateToday: 0, activeAssignments: 0, upcomingEventsCount: 0,
  });
  const [feesByCurrency, setFeesByCurrency] = useState<FeesByCurrency[]>([]);
  const [loansByCurrency, setLoansByCurrency] = useState<LoanSummary[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceDay[]>([]);
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
		eventsUpcomingRes,
		attendanceWeekRes,
		feesRes,
		loansRes,
		eventsRes,
	  ] = await Promise.all([
		supabase.from('students_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
		supabase.from('guardians_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
		supabase.from('attendance_edu').select('status').eq('workspace_id', workspace.id).eq('date', today),
		supabase.from('assignments_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).gte('due_date', today),
		supabase.from('events_edu').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).gte('event_date', today),
		supabase.from('attendance_edu').select('date, status').eq('workspace_id', workspace.id).gte('date', startDate).lte('date', today),
		supabase.from('fees_edu').select('amount, currency, status, due_date').eq('workspace_id', workspace.id),
		supabase.from('finance_loans').select('entity_type, loan_amount, paid_amount, due_date').eq('workspace_id', workspace.id),
		supabase.from('events_edu').select('id, title, event_date, is_public').eq('workspace_id', workspace.id).gte('event_date', today).order('event_date', { ascending: true }).limit(5),
	  ]);

	  // --- today's attendance breakdown ---
	  let present = 0, absent = 0, late = 0;
	  (attendanceTodayRes.data || []).forEach((r: any) => {
		if (r.status === STATUS.PRESENT) present++;
		else if (r.status === STATUS.ABSENT) absent++;
		else if (r.status === STATUS.LATE) late++;
	  });

	  // --- fees, split by currency (SAR / SDG kept separate, never summed together) ---
	  const feesMap: Record<string, FeesByCurrency> = {};
	  (feesRes.data || []).forEach((f: any) => {
		const currency = f.currency || 'SAR';
		if (!feesMap[currency]) feesMap[currency] = { currency, paid: 0, unpaid: 0, overdue: 0 };
		const isOverdue = f.status === FEE_STATUS.OVERDUE || (f.status !== FEE_STATUS.PAID && f.due_date < today);
		if (f.status === FEE_STATUS.PAID) feesMap[currency].paid += Number(f.amount) || 0;
		else if (isOverdue) feesMap[currency].overdue += Number(f.amount) || 0;
		else feesMap[currency].unpaid += Number(f.amount) || 0;
	  });
	  setFeesByCurrency(Object.values(feesMap));

	  // --- outstanding loans (finance_loans has no currency column in the schema —
	  //     grouped by entity_type instead; amounts assumed SAR until a currency
	  //     column is added here too) ---
	  const loanMap: Record<string, LoanSummary> = {};
	  (loansRes.data || []).forEach((l: any) => {
		const key = l.entity_type || 'أخرى';
		if (!loanMap[key]) loanMap[key] = { currency: key, outstanding: 0, count: 0 };
		const outstanding = (Number(l.loan_amount) || 0) - (Number(l.paid_amount) || 0);
		loanMap[key].outstanding += outstanding;
		loanMap[key].count += 1;
	  });
	  setLoansByCurrency(Object.values(loanMap));

	  // --- 7-day attendance trend ---
	  const dayMap: Record<string, AttendanceDay> = {};
	  last7Days.forEach(d => { dayMap[d] = { date: d, present: 0, absent: 0, late: 0 }; });
	  (attendanceWeekRes.data || []).forEach((r: any) => {
		if (!dayMap[r.date]) return;
		if (r.status === STATUS.PRESENT) dayMap[r.date].present++;
		else if (r.status === STATUS.ABSENT) dayMap[r.date].absent++;
		else if (r.status === STATUS.LATE) dayMap[r.date].late++;
	  });
	  setAttendanceTrend(last7Days.map(d => dayMap[d]));

	  setUpcomingEvents((eventsRes.data as any) || []);

	  setStats({
		totalStudents: studentsRes.count || 0,
		activeGuardians: guardiansRes.count || 0,
		attendanceToday: present,
		absentToday: absent,
		lateToday: late,
		activeAssignments: assignmentsActiveRes.count || 0,
		upcomingEventsCount: eventsUpcomingRes.count || 0,
	  });

	  setIsLoading(false);
	};

	fetchDashboard();
  }, [workspace]);

  const attendanceRate = useMemo(() => {
	if (!stats.totalStudents) return 0;
	return Math.round((stats.attendanceToday / stats.totalStudents) * 100);
  }, [stats.totalStudents, stats.attendanceToday]);

  const maxAttendance = useMemo(() => {
	return Math.max(1, ...attendanceTrend.map(d => d.present + d.absent + d.late));
  }, [attendanceTrend]);

  return (
	<div style={{ direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif" }}>

	  {/* ===================== STAT CARDS (all real) ===================== */}
	  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '20px' }}>
		<StatCard
		  label="إجمالي الطلاب" value={isLoading ? '···' : stats.totalStudents.toLocaleString('ar-SA')}
		  icon={<Users size={16} />} color={theme.cyan} bg={theme.cyanBg}
		/>
		<StatCard
		  label="نسبة الحضور اليوم" value={isLoading ? '···' : `${attendanceRate}%`}
		  icon={<CheckCircle2 size={16} />} color={theme.success} bg={theme.successBg}
		  trendText={isLoading ? undefined : `${stats.attendanceToday} من ${stats.totalStudents} طالب`}
		/>
		<StatCard
		  label="أولياء الأمور" value={isLoading ? '···' : stats.activeGuardians.toLocaleString('ar-SA')}
		  icon={<UsersRound size={16} />} color={theme.purple} bg={theme.purpleBg}
		/>
		<StatCard
		  label="غياب اليوم" value={isLoading ? '···' : stats.absentToday.toString()}
		  icon={<XCircle size={16} />} color={theme.danger} bg={theme.dangerBg}
		  trendUp={false} trendText={isLoading ? undefined : `${stats.lateToday} حالة تأخر`}
		/>
		<StatCard
		  label="الواجبات النشطة" value={isLoading ? '···' : stats.activeAssignments.toString()}
		  icon={<FileSignature size={16} />} color={theme.warning} bg={theme.warningBg}
		/>
		<StatCard
		  label="فعاليات قادمة" value={isLoading ? '···' : stats.upcomingEventsCount.toString()}
		  icon={<CalendarDays size={16} />} color={theme.royal} bg="rgba(79,125,243,0.12)"
		/>
	  </div>

	  {/* ===================== ROW: attendance trend / fees by currency / events ===================== */}
	  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
		<Panel title="الحضور خلال آخر 7 أيام">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : (
			<div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px' }}>
			  {attendanceTrend.map(day => {
				const total = day.present + day.absent + day.late;
				const heightPct = total === 0 ? 3 : Math.max(6, (total / maxAttendance) * 100);
				return (
				  <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '100%', height: '140px', display: 'flex', flexDirection: 'column-reverse', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
					  <div style={{ height: `${heightPct}%`, display: 'flex', flexDirection: 'column-reverse' }} title={`حاضر: ${day.present} • غائب: ${day.absent} • متأخر: ${day.late}`}>
						{day.present > 0 && <div style={{ flex: day.present, backgroundColor: theme.royal, minHeight: '3px' }} />}
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
		  <div style={{ display: 'flex', gap: '16px', marginTop: '14px', justifyContent: 'center' }}>
			<Legend color={theme.royal} label="حاضر" />
			<Legend color={theme.warning} label="متأخر" />
			<Legend color={theme.danger} label="غائب" />
		  </div>
		</Panel>

		<Panel title="الرسوم حسب العملة">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : feesByCurrency.length === 0 ? (
			<p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>لا توجد سجلات رسوم بعد.</p>
		  ) : (
			feesByCurrency.map(fc => {
			  const total = fc.paid + fc.unpaid + fc.overdue || 1;
			  const fmt = fmtBy(fc.currency);
			  return (
				<div key={fc.currency} style={{ marginBottom: '16px' }}>
				  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
					<span style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.navy }}>{fc.currency}</span>
					<span style={{ fontSize: '0.76rem', color: theme.textMuted, fontWeight: 700 }}>
					  {fmt.format(fc.paid + fc.unpaid + fc.overdue)} {currencySuffix(fc.currency)}
					</span>
				  </div>
				  <div style={{ height: '10px', borderRadius: '99px', overflow: 'hidden', display: 'flex', backgroundColor: '#f1f5f9' }}>
					<div style={{ width: `${(fc.paid / total) * 100}%`, backgroundColor: theme.success }} />
					<div style={{ width: `${(fc.unpaid / total) * 100}%`, backgroundColor: theme.warning }} />
					<div style={{ width: `${(fc.overdue / total) * 100}%`, backgroundColor: theme.danger }} />
				  </div>
				  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
					<MiniKv color={theme.success} label="مدفوعة" value={`${fmt.format(fc.paid)}`} />
					<MiniKv color={theme.warning} label="غير مدفوعة" value={`${fmt.format(fc.unpaid)}`} />
					<MiniKv color={theme.danger} label="متأخرة" value={`${fmt.format(fc.overdue)}`} />
				  </div>
				</div>
			  );
			})
		  )}
		</Panel>

		<Panel title="الفعاليات القادمة" action={<a href="#" style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.royal, textDecoration: 'none' }}>عرض الكل</a>}>
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : upcomingEvents.length === 0 ? (
			<EmptyState icon={<CalendarDays size={22} />} text="لا توجد فعاليات قادمة" />
		  ) : (
			upcomingEvents.map(e => (
			  <ActivityRow
				key={e.id}
				icon={<CalendarDays size={15} />} color={theme.cyan} bg={theme.cyanBg}
				title={e.title}
				time={formatShortDate(e.event_date)}
				badge={e.is_public ? 'عامة' : 'داخلية'}
				badgeColor={e.is_public ? theme.pink : theme.purple}
				badgeBg={e.is_public ? theme.pinkBg : theme.purpleBg}
			  />
			))
		  )}
		</Panel>
	  </div>

	  {/* ===================== ROW: loans/debts (real, replaces the fabricated heatmap/ranking/gauge) ===================== */}
	  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
		<Panel title="المديونيات القائمة">
		  {isLoading ? (
			<p style={{ color: theme.textMuted }}>...جاري التحميل</p>
		  ) : loansByCurrency.length === 0 ? (
			<p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>لا توجد مديونيات مسجّلة.</p>
		  ) : (
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
			  {loansByCurrency.map(l => (
				<div key={l.currency} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: theme.slate, border: `1px solid ${theme.border}` }}>
				  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: theme.warningBg, color: theme.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
					<Landmark size={16} />
				  </div>
				  <div>
					<div style={{ fontSize: '0.76rem', color: theme.textMuted, fontWeight: 700 }}>{l.currency} — {l.count} سجل</div>
					<div style={{ fontSize: '0.95rem', fontWeight: 800, color: theme.navy }}>
					  {fmtBy('SAR').format(l.outstanding)} ﷼
					</div>
				  </div>
				</div>
			  ))}
			</div>
		  )}
		</Panel>
	  </div>

	  {/* ===================== FOOTER STAT STRIP (real) ===================== */}
	  <div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(19,27,46,0.04)', flexWrap: 'wrap', gap: '16px' }}>
		<FooterStat icon={<Users size={16} />} color={theme.cyan} bg={theme.cyanBg} label="إجمالي الطلاب" value={isLoading ? '···' : stats.totalStudents.toLocaleString('ar-SA')} />
		<FooterStat icon={<CheckCircle2 size={16} />} color={theme.success} bg={theme.successBg} label="حاضرون اليوم" value={isLoading ? '···' : stats.attendanceToday.toLocaleString('ar-SA')} badge={isLoading ? undefined : `${attendanceRate}%`} />
		<FooterStat icon={<FileSignature size={16} />} color={theme.purple} bg={theme.purpleBg} label="الواجبات النشطة" value={isLoading ? '···' : stats.activeAssignments.toString()} />
		<FooterStat icon={<Bell size={16} />} color={theme.warning} bg={theme.warningBg} label="فعاليات قادمة" value={isLoading ? '···' : stats.upcomingEventsCount.toString()} />
		{feesByCurrency.map(fc => (
		  <FooterStat
			key={fc.currency}
			icon={<Wallet size={16} />} color={theme.royal} bg="rgba(79,125,243,0.12)"
			label={`رسوم مستحقة (${fc.currency})`}
			value={`${fmtBy(fc.currency).format(fc.unpaid + fc.overdue)} ${currencySuffix(fc.currency)}`}
		  />
		))}
		<FooterStat icon={<UsersRound size={16} />} color={theme.pink} bg={theme.pinkBg} label="أولياء أمور" value={isLoading ? '···' : stats.activeGuardians.toLocaleString('ar-SA')} />
	  </div>
	</div>
  );
}

// ---------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
	<div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '20px 22px', boxShadow: '0 1px 2px rgba(19,27,46,0.04)' }}>
	  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
		<h3 style={{ margin: 0, color: theme.navy, fontSize: '0.98rem', fontWeight: 800 }}>{title}</h3>
		{action}
	  </div>
	  {children}
	</div>
  );
}

function StatCard({ label, value, icon, color, bg, trendUp, trendText }: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string; trendUp?: boolean; trendText?: string;
}) {
  return (
	<div style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(19,27,46,0.04)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
	  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
		<span style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 700 }}>{label}</span>
		<div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
		  {icon}
		</div>
	  </div>
	  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.navy, letterSpacing: '-0.3px' }}>{value}</span>
	  {trendText && (
		<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: trendUp === false ? theme.danger : theme.textMuted }}>
		  {trendUp === false ? <ArrowDownRight size={12} /> : trendUp === true ? <ArrowUpRight size={12} /> : null}
		  <span>{trendText}</span>
		</div>
	  )}
	</div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
	<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
	  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: color, display: 'inline-block' }} />
	  <span style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 700 }}>{label}</span>
	</div>
  );
}

function MiniKv({ color, label, value }: { color: string; label: string; value: string }) {
  return (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
	  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
		<span style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: color, display: 'inline-block' }} />
		<span style={{ fontSize: '0.68rem', color: theme.textMuted, fontWeight: 700 }}>{label}</span>
	  </div>
	  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: theme.navy }}>{value}</span>
	</div>
  );
}

function ActivityRow({ icon, color, bg, title, time, badge, badgeColor, badgeBg }: {
  icon: React.ReactNode; color: string; bg: string; title: string; time: string; badge: string; badgeColor: string; badgeBg: string;
}) {
  return (
	<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: `1px solid #f1f4f9` }}>
	  <div style={{ width: '32px', height: '32px', borderRadius: '9px', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
		{icon}
	  </div>
	  <div style={{ flex: 1, minWidth: 0 }}>
		<p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: theme.textDark, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
		<p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: theme.textMuted }}>{time}</p>
	  </div>
	  <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: '99px', backgroundColor: badgeBg, color: badgeColor, flexShrink: 0 }}>
		{badge}
	  </span>
	</div>
  );
}

function FooterStat({ icon, color, bg, label, value, badge }: { icon: React.ReactNode; color: string; bg: string; label: string; value: string; badge?: string }) {
  return (
	<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
	  <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
		{icon}
	  </div>
	  <div>
		<div style={{ fontSize: '0.74rem', color: theme.textMuted, fontWeight: 700 }}>{label}</div>
		<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
		  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: theme.navy }}>{value}</span>
		  {badge && <span style={{ fontSize: '0.66rem', fontWeight: 800, color: theme.success, backgroundColor: theme.successBg, padding: '2px 6px', borderRadius: '99px' }}>{badge}</span>}
		</div>
	  </div>
	</div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
	<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 0', color: theme.textMuted }}>
	  {icon}
	  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{text}</span>
	</div>
  );
}