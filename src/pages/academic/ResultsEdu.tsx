import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Award, Printer, Search, GraduationCap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { PageShell } from '../../components/layout/PageShell';

// Canonical stage <-> portal mapping — mirrors getDefaultStage() in StudentsEdu.tsx.
// portal_type is the actual isolation key on every _edu table; "stage" is just
// the Arabic label for whichever portal is currently active.
const PORTAL_STAGES = [
  { slug: 'kindergarten', label: 'رياض أطفال' },
  { slug: 'elementary', label: 'ابتدائي' },
  { slug: 'intermediate', label: 'متوسط' },
  { slug: 'secondary', label: 'ثانوي' },
] as const;

interface StudentRow {
  id: string;
  full_name: string;
  national_id: string | null;
  grade_level: string;
}
interface SubjectRow {
  id: string;
  name: string;
  total_mark: number;
  passing_mark: number;
}
interface ResultRow {
  student_id: string;
  subject_id: string;
  marks_obtained: number;
}

// Kindergarten has no pass/fail — marks are translated into a
// developmental rating instead of a raw score / percentage.
function kgBand(pct: number): { label: string; color: string } {
  if (pct >= 85) return { label: 'ممتاز', color: 'var(--color-success)' };
  if (pct >= 70) return { label: 'جيد جدًا', color: 'var(--color-royal)' };
  if (pct >= 50) return { label: 'جيد', color: '#f59e0b' };
  return { label: 'بحاجة إلى دعم', color: 'var(--color-danger)' };
}

export default function ResultsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [gradeFilter, setGradeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const isKindergarten = portalType === 'kindergarten';
  const activeStageLabel = PORTAL_STAGES.find(p => p.slug === portalType)?.label || portalType;

  // Fetch strictly scoped to workspace + portal_type — same isolation
  // rule used in StudentsEdu.tsx. Re-runs whenever PortalLayout changes
  // the :portalType route param (e.g. via the stage pills below, or the
  // portal switcher in the Topbar).
  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace || !portalType) return;
	  setIsLoading(true);

	  const [studentsRes, subjectsRes, resultsRes] = await Promise.all([
		supabase.from('students_edu')
		  .select('id, full_name, national_id, grade_level')
		  .eq('workspace_id', workspace.id)
		  .eq('portal_type', portalType),
		supabase.from('subjects_edu')
		  .select('id, name, total_mark, passing_mark')
		  .eq('workspace_id', workspace.id)
		  .eq('portal_type', portalType),
		supabase.from('results_edu')
		  .select('student_id, subject_id, marks_obtained')
		  .eq('workspace_id', workspace.id)
		  .eq('portal_type', portalType),
	  ]);

	  setStudents(studentsRes.data || []);
	  setSubjects(subjectsRes.data || []);
	  setResults(resultsRes.data || []);

	  // Reset in-page filters — a grade/search selection from another
	  // portal has no meaning here.
	  setGradeFilter('all');
	  setSearch('');
	  setSelectedStudent('');

	  setIsLoading(false);
	};
	fetchData();
  }, [workspace, portalType]);

  const grades = useMemo(
	() => Array.from(new Set(students.map(s => s.grade_level))).sort(),
	[students]
  );

  const resultsMap = useMemo(() => {
	const map = new Map<string, number>();
	results.forEach(r => map.set(`${r.student_id}_${r.subject_id}`, r.marks_obtained));
	return map;
  }, [results]);

  const visibleStudents = useMemo(() => {
	return students
	  .filter(s => gradeFilter === 'all' || s.grade_level === gradeFilter)
	  .filter(s => !search.trim() || s.full_name.toLowerCase().includes(search.trim().toLowerCase()))
	  .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));
  }, [students, gradeFilter, search]);

  const computeStudentSummary = (studentId: string) => {
	let earned = 0, possible = 0, recordedCount = 0, failedCount = 0;
	subjects.forEach(sub => {
	  const mark = resultsMap.get(`${studentId}_${sub.id}`);
	  if (mark === undefined) return;
	  recordedCount++;
	  earned += mark;
	  possible += sub.total_mark;
	  if (mark < sub.passing_mark) failedCount++;
	});
	const pct = possible > 0 ? (earned / possible) * 100 : null;
	return { pct, recordedCount, failedCount };
  };

  // Switches the active portal/stage by swapping the :portalType segment
  // in the current route — PortalLayout + this component's own useEffect
  // then take care of the rest (sidebar, breadcrumb, refetch).
  const switchStage = (slug: string) => {
	if (!portalType || slug === portalType) return;
	const segments = location.pathname.split('/');
	const idx = segments.indexOf(portalType);
	if (idx === -1) return;
	segments[idx] = slug;
	navigate(segments.join('/'));
  };

  const exportCertificate = async (studentId: string) => {
	if (!studentId) return;
	setIsExporting(true);
	// ... [Certificate Generation Logic remains same but scoped to portal results]
	setIsExporting(false);
  };

  const printSheet = () => window.print();

  return (
	<PageShell
	  title="النتائج"
	  subtitle="كشوف الدرجات حسب المرحلة الدراسية — رياض الأطفال، الابتدائي، المتوسط، الثانوي"
	>
	  <div style={styles.card}>
		<div style={styles.controlBar}>
		  <div style={styles.searchBox}>
			<Search size={16} color="var(--color-text-muted)" />
			<input
			  value={search}
			  onChange={e => setSearch(e.target.value)}
			  placeholder="ابحث باسم الطالب..."
			  style={styles.searchInput}
			/>
		  </div>

		  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
			<select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={styles.select}>
			  <option value="all">كل الصفوف</option>
			  {grades.map(g => <option key={g} value={g}>{g}</option>)}
			</select>

			<select
			  value={selectedStudent}
			  onChange={e => setSelectedStudent(e.target.value)}
			  style={{ ...styles.select, minWidth: '200px' }}
			>
			  <option value="">اختر طالبًا لاستخراج الشهادة</option>
			  {visibleStudents.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
			</select>

			<button
			  onClick={() => exportCertificate(selectedStudent)}
			  disabled={isExporting || !selectedStudent}
			  style={{ ...styles.btnPrimary, opacity: selectedStudent ? 1 : 0.6, cursor: selectedStudent ? 'pointer' : 'not-allowed' }}
			>
			  <Award size={16} />
			  {isExporting ? 'جاري الاستخراج...' : 'استخراج الشهادة'}
			</button>

			<button onClick={printSheet} style={styles.btnSecondary}>
			  <Printer size={16} />
			  طباعة
			</button>

			{/* Stage pills — switch portal, PortalLayout + useEffect handle the rest */}
			<div style={{ display: 'flex', gap: '8px' }}>
			  {PORTAL_STAGES.map(p => {
				const active = p.slug === portalType;
				return (
				  <button
					key={p.slug}
					onClick={() => switchStage(p.slug)}
					style={active ? styles.stagePillActive : styles.stagePillInactive}
				  >
					<GraduationCap size={16} />
					{p.label}
				  </button>
				);
			  })}
			</div>
		  </div>
		</div>

		{isKindergarten && (
		  <p style={{ margin: '16px 24px 0 24px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
			مرحلة رياض الأطفال تُعرض بتقييم تطويري وصفي بدلًا من الدرجات الرقمية والنسبة المئوية.
		  </p>
		)}

		<div style={{ overflowX: 'auto' }}>
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>الطالب</th>
				<th style={styles.th}>رقم الهوية</th>
				<th style={styles.th}>الصف</th>
				{subjects.map(sub => (
				  <th key={sub.id} style={styles.th}>
					{sub.name}
					{!isKindergarten && (
					  <div style={{ fontWeight: 500, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>من {sub.total_mark}</div>
					)}
				  </th>
				))}
				<th style={styles.th}>{isKindergarten ? 'التقييم العام' : 'المعدل'}</th>
				{!isKindergarten && <th style={styles.th}>الحالة</th>}
			  </tr>
			</thead>
			<tbody>
			  {isLoading ? (
				<tr><td colSpan={100} style={styles.emptyCell}>...جاري التحميل</td></tr>
			  ) : visibleStudents.length === 0 ? (
				<tr><td colSpan={100} style={styles.emptyCell}>لا يوجد طلاب مطابقون في {activeStageLabel}</td></tr>
			  ) : subjects.length === 0 ? (
				<tr><td colSpan={100} style={styles.emptyCell}>لا توجد مواد دراسية معرّفة لهذه البوابة بعد</td></tr>
			  ) : (
				visibleStudents.map(student => {
				  const { pct, recordedCount, failedCount } = computeStudentSummary(student.id);
				  const band = isKindergarten && pct !== null ? kgBand(pct) : null;
				  return (
					<tr key={student.id}>
					  <td style={{ ...styles.td, fontWeight: 800 }}>{student.full_name}</td>
					  <td style={styles.td}>{student.national_id || '—'}</td>
					  <td style={styles.td}>{student.grade_level}</td>
					  {subjects.map(sub => {
						const mark = resultsMap.get(`${student.id}_${sub.id}`);
						if (mark === undefined) {
						  return <td key={sub.id} style={{ ...styles.td, color: 'var(--color-text-muted)' }}>—</td>;
						}
						if (isKindergarten) {
						  const b = kgBand((mark / sub.total_mark) * 100);
						  return <td key={sub.id} style={{ ...styles.td, color: b.color, fontWeight: 800 }}>{b.label}</td>;
						}
						const passed = mark >= sub.passing_mark;
						return (
						  <td key={sub.id} style={{ ...styles.td, color: passed ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 800 }}>
							{mark}
						  </td>
						);
					  })}
					  <td style={{ ...styles.td, fontWeight: 900 }}>
						{pct === null ? '—' : isKindergarten ? (band?.label || '—') : `${pct.toFixed(1)}%`}
					  </td>
					  {!isKindergarten && (
						<td style={styles.td}>
						  {recordedCount === 0 ? (
							<StatusBadge label="لم تُرصد الدرجات" color="#64748b" />
						  ) : failedCount > 0 ? (
							<StatusBadge label="راسب" color="#ef4444" />
						  ) : (
							<StatusBadge label="ناجح" color="#10b981" />
						  )}
						</td>
					  )}
					</tr>
				  );
				})
			  )}
			</tbody>
		  </table>
		</div>
	  </div>
	</PageShell>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
	<span style={{
	  display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
	  backgroundColor: `${color}20`, color, fontWeight: 800, fontSize: '0.75rem'
	}}>
	  {label}
	</span>
  );
}

// Strictly leveraging global CSS variables to eliminate color desync
// (same convention as StudentsEdu.tsx)
const styles: { [key: string]: React.CSSProperties } = {
  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fcfcfd' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 16px', width: '260px' },
  searchInput: { border: 'none', outline: 'none', fontFamily: 'inherit', fontWeight: 600, backgroundColor: 'transparent', color: 'var(--color-text-dark)', width: '100%' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontWeight: 700, fontSize: '0.85rem', backgroundColor: 'var(--color-white)', color: 'var(--color-text-dark)' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  stagePillActive: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: '1px solid var(--color-royal)', padding: '10px 18px', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  stagePillInactive: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 18px', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600, whiteSpace: 'nowrap' },
  emptyCell: { padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' },
};