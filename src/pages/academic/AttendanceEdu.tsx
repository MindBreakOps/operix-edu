import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import {
  Printer, Save, CalendarDays, CheckCircle, XCircle, Clock, FileText,
  Search, Paperclip, X, Image as ImageIcon, ChevronDown, ClipboardList, FolderOpen
} from 'lucide-react';

// نقطة النهاية الخاصة بـ Google Apps Script (doPost) — تدعم action: "uploadPhoto"
const GAS_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbzjTJlwBLti7MFzQJq119h0tvYJcqV0YbJUmyz-hDgYC8oXgLg1LONUBsabOJnNZYKZ2A/exec';

interface StudentRow {
  id: string;
  full_name: string;
  stage: string;
  grade_level: string;
  section: string;
}

interface AttendanceEntry {
  status: string;
  note: string;
  image_url: string | null;
  dirty: boolean;
}

interface ExcuseRow {
  id: string;
  student_id: string;
  date: string;
  status: string;
  note: string | null;
  image_url: string | null;
  full_name: string;
  grade_level: string;
  section: string;
}

const STATUS_OPTIONS = [
  { value: 'حاضر', label: 'حاضر', color: '--color-success', icon: CheckCircle },
  { value: 'غائب', label: 'غائب', color: '--color-danger', icon: XCircle },
  { value: 'متأخر', label: 'متأخر', color: '--color-warning', icon: Clock },
  { value: 'بعذر', label: 'مستأذن', color: '--color-royal', icon: FileText },
];

// الحالات التي تتطلب مرفقاً/ملاحظة (عذر) — غياب أو تأخر أو استئذان
const REQUIRES_EXCUSE = new Set(['غائب', 'متأخر', 'بعذر']);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve((reader.result as string).split(',')[1]);
	reader.onerror = reject;
	reader.readAsDataURL(file);
  });
}

// يرفع صورة العذر عبر GAS مطابقاً لتوقيع doPost الفعلي: { action: "uploadPhoto", base64, mimeType, fileName }
// ملاحظة: الرابط الذي يُعيده الخادم بصيغة "thumbnail?...&sz=w1000" هو رابط مصغّر مخصص للعرض السريع في
// شبكات المنتجات؛ لأعذار الحضور نحتاج رابطاً كامل الدقة، لذا نبني رابط عرض من fileId بدلاً من استخدام
// حقل url المرتجع كما هو. نستخدم تحديداً صيغة lh3.googleusercontent.com/d/ وليس
// drive.google.com/uc?export=view، لأن الصيغة الأخيرة تُعرض أحياناً كصفحة HTML وسيطة بدل الصورة
// الفعلية عند تحميلها داخل وسم <img>، فتظهر كأيقونة صورة معطوبة.
async function uploadExcuseImage(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const res = await fetch(GAS_UPLOAD_URL, {
	method: 'POST',
	headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // يتفادى preflight CORS مع Apps Script
	body: JSON.stringify({
	  action: 'uploadPhoto',
	  base64,
	  mimeType: file.type || 'image/jpeg',
	  fileName: `excuse_${Date.now()}.jpg`,
	}),
  });

  if (!res.ok) throw new Error('فشل الاتصال بخادم الرفع');
  const data = await res.json();
  if (!data?.success || !data?.fileId) throw new Error(data?.error || 'لم يتم استلام معرّف الملف من الخادم');

  return `https://lh3.googleusercontent.com/d/${data.fileId}`;
}

// يطبّع أي رابط Google Drive قديم أو جديد إلى صيغة عرض صالحة داخل <img>. يُطبَّق عند القراءة من قاعدة
// البيانات حتى تُعرض الصور المحفوظة سابقاً بالصيغة المعطوبة (uc?export=view) بشكل صحيح أيضاً، دون أي
// تعديل يدوي على البيانات المخزّنة
function toDriveViewableUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
}

export default function AttendanceEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();

  const [activeTab, setActiveTab] = useState<'register' | 'excuses'>('register');

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<{ [studentId: string]: AttendanceEntry }>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState<{ total: number } | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // ---------- فلاتر تبويب السجل اليومي (الصف ← الشعبة فقط، فالمرحلة ثابتة داخل هذه البوابة) ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // ---------- معاينة الصورة ----------
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [studentId: string]: HTMLInputElement | null }>({});

  // ---------- بيانات تبويب الأعذار والملاحظات ----------
  const [excuseRows, setExcuseRows] = useState<ExcuseRow[]>([]);
  const [excuseLoading, setExcuseLoading] = useState(false);
  const [excuseFrom, setExcuseFrom] = useState(() => {
	const d = new Date(); d.setDate(1);
	return d.toISOString().split('T')[0];
  });
  const [excuseTo, setExcuseTo] = useState(new Date().toISOString().split('T')[0]);
  const [excuseStatusFilter, setExcuseStatusFilter] = useState('all');
  const [excuseGradeFilter, setExcuseGradeFilter] = useState('all');
  const [excuseSearch, setExcuseSearch] = useState('');
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const excuseFileInputRefs = useRef<{ [rowId: string]: HTMLInputElement | null }>({});

  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace || !portalType) return;
	  setIsLoading(true);

	  const { data: studentsData } = await supabase
		.from('students_edu')
		.select('id, full_name, stage, grade_level, section')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', portalType)
		.order('grade_level')
		.order('section')
		.order('full_name');

	  if (studentsData) setStudents(studentsData);

	  const { data: attData } = await supabase
		.from('attendance_edu')
		.select('student_id, status, image_url, note')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', portalType)
		.eq('date', selectedDate);

	  const attMap: { [key: string]: AttendanceEntry } = {};
	  if (attData) {
		attData.forEach((record: any) => {
		  attMap[record.student_id] = {
			status: record.status || '',
			note: record.note || '',
			image_url: toDriveViewableUrl(record.image_url),
			dirty: false,
		  };
		});
	  }
	  setAttendance(attMap);
	  setIsLoading(false);
	};

	fetchData();
  }, [workspace, portalType, selectedDate]);

  // ---------- جلب سجل الأعذار والملاحظات (تبويب منفصل، مدى زمني وليس يوماً واحداً) ----------
  const fetchExcuses = async () => {
	if (!workspace || !portalType) return;
	setExcuseLoading(true);

	const { data, error } = await supabase
	  .from('attendance_edu')
	  .select('id, student_id, date, status, note, image_url, students_edu(full_name, grade_level, section)')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType)
	  .in('status', ['غائب', 'متأخر', 'بعذر'])
	  .gte('date', excuseFrom)
	  .lte('date', excuseTo)
	  .order('date', { ascending: false });

	if (!error && data) {
	  const rows: ExcuseRow[] = (data as any[]).map(r => ({
		id: r.id,
		student_id: r.student_id,
		date: r.date,
		status: r.status,
		note: r.note,
		image_url: r.image_url,
		full_name: r.students_edu?.full_name || '—',
		grade_level: r.students_edu?.grade_level || '—',
		section: r.students_edu?.section || '—',
	  }));
	  setExcuseRows(rows);
	} else if (error) {
	  console.error(error);
	}
	setExcuseLoading(false);
  };

  useEffect(() => {
	if (activeTab === 'excuses') fetchExcuses();
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, workspace, portalType, excuseFrom, excuseTo]);

  // ---------- خيارات الفلاتر: الصف ثم الشعبة (مشتقة من طلاب هذه البوابة فقط) ----------
  const grades = useMemo(() => Array.from(new Set(students.map(s => s.grade_level).filter(Boolean))), [students]);
  const sections = useMemo(() => {
	const pool = gradeFilter === 'all' ? students : students.filter(s => s.grade_level === gradeFilter);
	return Array.from(new Set(pool.map(s => s.section).filter(Boolean)));
  }, [students, gradeFilter]);

  useEffect(() => { setSectionFilter('all'); }, [gradeFilter]);

  const filteredStudents = useMemo(() => {
	const q = searchQuery.trim().toLowerCase();
	return students.filter(s => {
	  if (gradeFilter !== 'all' && s.grade_level !== gradeFilter) return false;
	  if (sectionFilter !== 'all' && s.section !== sectionFilter) return false;
	  if (q && !s.full_name.toLowerCase().includes(q)) return false;
	  return true;
	});
  }, [students, searchQuery, gradeFilter, sectionFilter]);

  const groupedStudents = useMemo(() => {
	const groups: { key: string; grade: string; section: string; rows: StudentRow[] }[] = [];
	filteredStudents.forEach(s => {
	  const key = `${s.grade_level}__${s.section}`;
	  let group = groups.find(g => g.key === key);
	  if (!group) {
		group = { key, grade: s.grade_level, section: s.section, rows: [] };
		groups.push(group);
	  }
	  group.rows.push(s);
	});
	return groups;
  }, [filteredStudents]);

  const summary = useMemo(() => {
	const counts = { حاضر: 0, غائب: 0, متأخر: 0, بعذر: 0, unmarked: 0 };
	filteredStudents.forEach(s => {
	  const st = attendance[s.id]?.status;
	  if (st && st in counts) (counts as any)[st]++;
	  else counts.unmarked++;
	});
	return counts;
  }, [filteredStudents, attendance]);

  // إحصائيات تبويب الأعذار، لعرض ملخص سريع أعلى الجدول
  const excuseGrades = useMemo(() => Array.from(new Set(excuseRows.map(r => r.grade_level).filter(Boolean))), [excuseRows]);
  const filteredExcuseRows = useMemo(() => {
	const q = excuseSearch.trim().toLowerCase();
	return excuseRows.filter(r => {
	  if (excuseStatusFilter !== 'all' && r.status !== excuseStatusFilter) return false;
	  if (excuseGradeFilter !== 'all' && r.grade_level !== excuseGradeFilter) return false;
	  if (q && !r.full_name.toLowerCase().includes(q)) return false;
	  return true;
	});
  }, [excuseRows, excuseStatusFilter, excuseGradeFilter, excuseSearch]);

  const handleStatusChange = (studentId: string, status: string) => {
	setAttendance(prev => {
	  const existing = prev[studentId] || { status: '', note: '', image_url: null, dirty: false };
	  const clearsExcuse = !REQUIRES_EXCUSE.has(status);
	  return {
		...prev,
		[studentId]: {
		  ...existing,
		  status,
		  image_url: clearsExcuse ? null : existing.image_url,
		  note: clearsExcuse ? '' : existing.note,
		  dirty: true,
		},
	  };
	});
  };

  const handleNoteChange = (studentId: string, note: string) => {
	setAttendance(prev => ({
	  ...prev,
	  [studentId]: { ...(prev[studentId] || { status: '', image_url: null, dirty: false }), note, dirty: true },
	}));
  };

  const handleExcuseFile = async (studentId: string, file: File | null) => {
	if (!file) return;
	if (!file.type.startsWith('image/')) { alert('الرجاء اختيار ملف صورة فقط.'); return; }
	setUploadingFor(studentId);
	try {
	  const url = await uploadExcuseImage(file);
	  setAttendance(prev => ({
		...prev,
		[studentId]: { ...(prev[studentId] || { status: '', note: '', dirty: false }), image_url: url, dirty: true },
	  }));
	} catch (err: any) {
	  console.error(err);
	  alert(`فشل رفع صورة العذر: ${err.message || 'خطأ غير معروف'}`);
	} finally {
	  setUploadingFor(null);
	}
  };

  const removeExcuseImage = (studentId: string) => {
	setAttendance(prev => ({
	  ...prev,
	  [studentId]: { ...(prev[studentId] || { status: '', note: '', dirty: false }), image_url: null, dirty: true },
	}));
  };

  const markAllVisiblePresent = () => {
	setAttendance(prev => {
	  const next = { ...prev };
	  filteredStudents.forEach(s => {
		const existing = next[s.id] || { status: '', note: '', image_url: null, dirty: false };
		if (!existing.status) next[s.id] = { ...existing, status: 'حاضر', dirty: true };
	  });
	  return next;
	});
  };

  const saveAttendance = async () => {
	if (!workspace || !portalType) return;

	// نحفظ فقط سجلات الطلاب الذين لديهم حالة محددة فعلياً وبمعرّف طالب صالح
	const entries = Object.entries(attendance).filter(([studentId, entry]) => studentId && entry.status);

	if (entries.length === 0) { alert('لا توجد أي حالات محددة للحفظ.'); return; }

	setIsSaving(true);
	setSavingProgress({ total: entries.length });

	const payload = entries.map(([studentId, entry]) => ({
	  workspace_id: workspace.id,
	  portal_type: portalType,
	  student_id: studentId,
	  date: selectedDate,
	  status: entry.status,
	  image_url: entry.image_url,
	  note: entry.note || null,
	}));

	const { error } = await supabase
	  .from('attendance_edu')
	  .upsert(payload, { onConflict: 'workspace_id,student_id,portal_type,date' });

	setIsSaving(false);
	setSavingProgress(null);

	if (error) {
	  console.error(error);
	  alert(`حدث خطأ أثناء الحفظ: ${error.message}`);
	} else {
	  setAttendance(prev => {
		const next = { ...prev };
		entries.forEach(([studentId]) => { next[studentId] = { ...next[studentId], dirty: false }; });
		return next;
	  });
	  alert(`تم حفظ سجل الحضور بنجاح لـ ${entries.length} طالب.`);
	}
  };

  // ---------- تحديث مباشر من جدول الأعذار (حالة/ملاحظة) ----------
  const updateExcuseRow = async (rowId: string, patch: { status?: string; note?: string; image_url?: string | null }) => {
	setSavingRowId(rowId);
	setExcuseRows(prev => prev.map(r => (r.id === rowId ? { ...r, ...patch } : r)));
	const { error } = await supabase.from('attendance_edu').update(patch).eq('id', rowId);
	setSavingRowId(null);
	if (error) {
	  console.error(error);
	  alert(`تعذّر حفظ التعديل: ${error.message}`);
	  fetchExcuses(); // استرجاع الحالة الصحيحة من القاعدة عند الفشل
	}
  };

  const handleExcuseRowFile = async (rowId: string, file: File | null) => {
	if (!file) return;
	if (!file.type.startsWith('image/')) { alert('الرجاء اختيار ملف صورة فقط.'); return; }
	setSavingRowId(rowId);
	try {
	  const url = await uploadExcuseImage(file);
	  await updateExcuseRow(rowId, { image_url: url });
	} catch (err: any) {
	  console.error(err);
	  alert(`فشل رفع صورة العذر: ${err.message || 'خطأ غير معروف'}`);
	} finally {
	  setSavingRowId(null);
	}
  };

  return (
	<div>
	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>سجل الحضور والغياب</h1>
		  <p style={styles.subtitle}>الرصد اليومي لطلاب {portalType === 'kindergarten' ? 'رياض الأطفال' : 'الفصول'}</p>
		</div>
		{activeTab === 'register' && (
		  <div style={{ display: 'flex', gap: '12px' }}>
			<button style={styles.btnSecondary} onClick={() => window.print()}>
			  <Printer size={18} /> طباعة الكشف
			</button>
			<button style={styles.btnPrimary} onClick={saveAttendance} disabled={isSaving}>
			  <Save size={18} />
			  {isSaving ? `جاري الحفظ${savingProgress ? ` (${savingProgress.total})` : '...'}` : 'حفظ السجل'}
			</button>
		  </div>
		)}
	  </div>

	  {/* ---------- تبويبات ---------- */}
	  <div className="no-print" style={styles.tabBar}>
		<button
		  onClick={() => setActiveTab('register')}
		  style={{ ...styles.tabBtn, ...(activeTab === 'register' ? styles.tabBtnActive : {}) }}
		>
		  <ClipboardList size={16} /> تسجيل الحضور اليومي
		</button>
		<button
		  onClick={() => setActiveTab('excuses')}
		  style={{ ...styles.tabBtn, ...(activeTab === 'excuses' ? styles.tabBtnActive : {}) }}
		>
		  <FolderOpen size={16} /> الأعذار والملاحظات
		</button>
	  </div>

	  {activeTab === 'register' ? (
		<>
		  {/* ---------- شريط الفلاتر: الصف ← الشعبة (المرحلة ثابتة داخل هذه البوابة) ---------- */}
		  <div className="no-print" style={styles.filterBar}>
			<div style={styles.searchBox}>
			  <Search size={16} color="var(--color-text-muted)" />
			  <input
				type="text"
				placeholder="ابحث باسم الطالب…"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				style={styles.searchInput}
			  />
			</div>

			<FilterSelect label="الصف" value={gradeFilter} onChange={setGradeFilter} options={grades} />
			<FilterSelect label="الشعبة" value={sectionFilter} onChange={setSectionFilter} options={sections} />

			<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
			  <CalendarDays size={18} color="var(--color-navy)" />
			  <input
				type="date"
				value={selectedDate}
				onChange={(e) => setSelectedDate(e.target.value)}
				style={styles.dateInput}
			  />
			</div>
		  </div>

		  {!isLoading && (
			<div className="no-print" style={styles.summaryRow}>
			  <SummaryChip label="حاضر" count={summary.حاضر} color="--color-success" />
			  <SummaryChip label="غائب" count={summary.غائب} color="--color-danger" />
			  <SummaryChip label="متأخر" count={summary.متأخر} color="--color-warning" />
			  <SummaryChip label="مستأذن" count={summary.بعذر} color="--color-royal" />
			  <SummaryChip label="غير مسجّل" count={summary.unmarked} color="--color-text-muted" />
			  <button style={styles.quickFillBtn} onClick={markAllVisiblePresent}>تحديد الجميع كحاضر</button>
			</div>
		  )}

		  <div id="printable-area" style={styles.card}>
			{isLoading ? (
			  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				جاري تحميل كشف البوابة...
			  </div>
			) : filteredStudents.length === 0 ? (
			  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				لا يوجد طلاب مطابقين لمعايير البحث/الفلترة الحالية.
			  </div>
			) : (
			  groupedStudents.map(group => (
				<div key={group.key} style={styles.groupBlock}>
				  <div style={styles.groupHeader}>
					<span style={{ fontWeight: 800, color: 'var(--color-navy)' }}>الصف {group.grade}</span>
					<span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>شعبة {group.section}</span>
					<span style={styles.groupCount}>{group.rows.length} طالب</span>
				  </div>

				  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
					  <tr>
						<th style={{ ...styles.th, width: '48px' }}>#</th>
						<th style={styles.th}>اسم الطالب</th>
						<th style={styles.th}>تسجيل الحالة</th>
						<th className="no-print" style={styles.th}>العذر / المرفق</th>
					  </tr>
					</thead>
					<tbody>
					  {group.rows.map((s, index) => {
						const entry = attendance[s.id];
						const currentStatus = entry?.status || '';
						const needsExcuse = REQUIRES_EXCUSE.has(currentStatus);
						const isUploading = uploadingFor === s.id;

						return (
						  <tr key={s.id}>
							<td style={{ ...styles.td, color: 'var(--color-text-muted)' }}>{index + 1}</td>
							<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>{s.full_name}</td>
							<td className="no-print" style={styles.td}>
							  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
								{STATUS_OPTIONS.map(opt => {
								  const Icon = opt.icon;
								  const isActive = currentStatus === opt.value;
								  return (
									<button
									  key={opt.value}
									  onClick={() => handleStatusChange(s.id, opt.value)}
									  style={{
										display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
										borderRadius: '6px',
										border: `1px solid ${isActive ? `var(${opt.color})` : 'var(--color-border)'}`,
										backgroundColor: isActive ? `var(${opt.color})` : 'var(--color-white)',
										color: isActive ? 'var(--color-white)' : 'var(--color-text-muted)',
										fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
									  }}
									>
									  <Icon size={14} /> {opt.label}
									</button>
								  );
								})}
							  </div>
							  <span className="print-only" style={{ fontWeight: 800, color: 'var(--color-navy)' }}>
								{currentStatus || '—'}
							  </span>
							</td>
							<td className="no-print" style={styles.td}>
							  {!needsExcuse ? (
								<span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>—</span>
							  ) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
								  <input
									type="text"
									placeholder="ملاحظة العذر (اختياري)"
									value={entry?.note || ''}
									onChange={(e) => handleNoteChange(s.id, e.target.value)}
									style={styles.noteInput}
								  />
								  <input
									ref={(el) => { fileInputRefs.current[s.id] = el; }}
									type="file"
									accept="image/*"
									style={{ display: 'none' }}
									onChange={(e) => handleExcuseFile(s.id, e.target.files?.[0] || null)}
								  />
								  {entry?.image_url ? (
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									  <button type="button" onClick={() => setPreviewUrl(entry.image_url)} style={styles.attachedChip}>
										<ImageIcon size={13} /> عرض المرفق
									  </button>
									  <button type="button" onClick={() => removeExcuseImage(s.id)} style={styles.removeAttachBtn}>
										<X size={13} />
									  </button>
									</div>
								  ) : (
									<button
									  type="button"
									  disabled={isUploading}
									  onClick={() => fileInputRefs.current[s.id]?.click()}
									  style={styles.attachBtn}
									>
									  <Paperclip size={13} /> {isUploading ? 'جاري الرفع...' : 'إرفاق صورة العذر'}
									</button>
								  )}
								</div>
							  )}
							</td>
						  </tr>
						);
					  })}
					</tbody>
				  </table>
				</div>
			  ))
			)}
		  </div>
		</>
	  ) : (
		<>
		  {/* ---------- تبويب الأعذار والملاحظات: جدول ذكي مرتبط بجدول الحضور وبيانات الطلاب ---------- */}
		  <div className="no-print" style={styles.filterBar}>
			<div style={styles.searchBox}>
			  <Search size={16} color="var(--color-text-muted)" />
			  <input
				type="text"
				placeholder="ابحث باسم الطالب…"
				value={excuseSearch}
				onChange={(e) => setExcuseSearch(e.target.value)}
				style={styles.searchInput}
			  />
			</div>

			<FilterSelect
			  label="الحالة"
			  value={excuseStatusFilter}
			  onChange={setExcuseStatusFilter}
			  options={['غائب', 'متأخر', 'بعذر']}
			/>
			<FilterSelect label="الصف" value={excuseGradeFilter} onChange={setExcuseGradeFilter} options={excuseGrades} />

			<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
			  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>من</span>
			  <input type="date" value={excuseFrom} onChange={(e) => setExcuseFrom(e.target.value)} style={styles.dateInput} />
			  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>إلى</span>
			  <input type="date" value={excuseTo} onChange={(e) => setExcuseTo(e.target.value)} style={styles.dateInput} />
			</div>
		  </div>

		  <div style={styles.card}>
			{excuseLoading ? (
			  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				جاري تحميل سجل الأعذار...
			  </div>
			) : filteredExcuseRows.length === 0 ? (
			  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				لا توجد حالات غياب/تأخر/استئذان ضمن هذا المدى الزمني والفلاتر الحالية.
			  </div>
			) : (
			  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
				<thead>
				  <tr>
					<th style={styles.th}>التاريخ</th>
					<th style={styles.th}>الطالب</th>
					<th style={styles.th}>الصف / الشعبة</th>
					<th style={styles.th}>الحالة</th>
					<th style={styles.th}>الملاحظة</th>
					<th style={styles.th}>المرفق</th>
				  </tr>
				</thead>
				<tbody>
				  {filteredExcuseRows.map(row => {
					const isRowSaving = savingRowId === row.id;
					return (
					  <tr key={row.id}>
						<td style={styles.td}>{row.date}</td>
						<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>{row.full_name}</td>
						<td style={styles.td}>
						  <span style={{ backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
							{row.grade_level} - {row.section}
						  </span>
						</td>
						<td style={styles.td}>
						  <select
							value={row.status}
							disabled={isRowSaving}
							onChange={(e) => updateExcuseRow(row.id, { status: e.target.value })}
							style={styles.rowStatusSelect}
						  >
							{STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
						  </select>
						</td>
						<td style={styles.td}>
						  <input
							type="text"
							defaultValue={row.note || ''}
							placeholder="إضافة ملاحظة…"
							disabled={isRowSaving}
							onBlur={(e) => { if (e.target.value !== (row.note || '')) updateExcuseRow(row.id, { note: e.target.value }); }}
							style={styles.noteInput}
						  />
						</td>
						<td style={styles.td}>
						  <input
							ref={(el) => { excuseFileInputRefs.current[row.id] = el; }}
							type="file"
							accept="image/*"
							style={{ display: 'none' }}
							onChange={(e) => handleExcuseRowFile(row.id, e.target.files?.[0] || null)}
						  />
						  {row.image_url ? (
							<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
							  <button type="button" onClick={() => setPreviewUrl(row.image_url)} style={styles.attachedChip}>
								<ImageIcon size={13} /> عرض
							  </button>
							  <button
								type="button"
								disabled={isRowSaving}
								onClick={() => excuseFileInputRefs.current[row.id]?.click()}
								style={styles.removeAttachBtn}
								title="استبدال الصورة"
							  >
								<Paperclip size={13} />
							  </button>
							</div>
						  ) : (
							<button
							  type="button"
							  disabled={isRowSaving}
							  onClick={() => excuseFileInputRefs.current[row.id]?.click()}
							  style={styles.attachBtn}
							>
							  <Paperclip size={13} /> {isRowSaving ? 'جاري الرفع...' : 'إرفاق'}
							</button>
						  )}
						</td>
					  </tr>
					);
				  })}
				</tbody>
			  </table>
			)}
		  </div>
		</>
	  )}

	  {previewUrl && (
		<div className="no-print" style={styles.previewOverlay} onClick={() => setPreviewUrl(null)}>
		  <div style={styles.previewCard} onClick={(e) => e.stopPropagation()}>
			<button style={styles.previewClose} onClick={() => setPreviewUrl(null)}><X size={18} /></button>
			<img src={previewUrl} alt="مرفق العذر" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px' }} />
		  </div>
		</div>
	  )}
	</div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
	<div style={{ position: 'relative' }}>
	  <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.filterSelect}>
		<option value="all">{label}: الكل</option>
		{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
	  </select>
	  <ChevronDown size={14} style={styles.filterChevron} />
	</div>
  );
}

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
	<div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', backgroundColor: 'var(--color-slate)', border: '1px solid var(--color-border)' }}>
	  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: `var(${color})` }} />
	  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>{label}</span>
	  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--color-navy)' }}>{count}</span>
	</div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 },

  tabBar: { display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)' },
  tabBtn: {
	display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px 8px 0 0',
	border: 'none', borderBottom: '2px solid transparent', backgroundColor: 'transparent',
	color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
  },
  tabBtnActive: { color: 'var(--color-royal)', borderBottom: '2px solid var(--color-royal)' },

  filterBar: {
	display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px',
	backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
	borderRadius: '12px', padding: '14px 18px', marginBottom: '14px',
  },
  searchBox: {
	display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-slate)',
	border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 12px', minWidth: '220px',
  },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, width: '100%', color: 'var(--color-text-dark)' },
  filterSelect: {
	appearance: 'none', padding: '9px 30px 9px 12px', borderRadius: '8px',
	border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)',
	fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-dark)', cursor: 'pointer',
  },
  filterChevron: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' },
  dateInput: { padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 700, color: 'var(--color-text-dark)' },

  summaryRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' },
  quickFillBtn: {
	marginRight: 'auto', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
	color: 'var(--color-navy)', padding: '7px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
  },

  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },

  groupBlock: { borderBottom: '1px solid var(--color-border)' },
  groupHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', backgroundColor: '#fcfcfd', borderBottom: '1px solid var(--color-border)' },
  groupCount: { marginRight: 'auto', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-slate)', padding: '2px 10px', borderRadius: '999px' },

  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600, verticalAlign: 'top' },

  noteInput: { padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dark)', width: '100%' },
  rowStatusSelect: {
	padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', outline: 'none',
	fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dark)', backgroundColor: 'var(--color-white)', cursor: 'pointer',
  },
  attachBtn: {
	display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
	border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)',
	fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', width: 'fit-content',
  },
  attachedChip: {
	display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
	border: '1px solid var(--color-success)', backgroundColor: '#e6f6ec', color: 'var(--color-success)',
	fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
  },
  removeAttachBtn: {
	display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px',
	borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)',
	color: 'var(--color-text-muted)', cursor: 'pointer',
  },

  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },

  previewOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(19,27,46,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  previewCard: { position: 'relative', backgroundColor: 'var(--color-white)', padding: '16px', borderRadius: '12px' },
  previewClose: { position: 'absolute', top: '-14px', left: '-14px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};