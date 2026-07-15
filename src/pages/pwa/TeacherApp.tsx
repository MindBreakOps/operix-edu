import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  WifiOff, CloudUpload, CheckSquare, Users, BookOpen, Clock,
  Lock, Mail, ArrowRight, ShieldCheck, KeyRound, Globe, LogOut,
  Plus, Search, Calendar as CalendarIcon, CheckCircle2, XCircle,
  ClipboardList, GraduationCap, Sparkles, Phone, X, AlertCircle, Save,
  ExternalLink, LifeBuoy, Building2, FileText, Paperclip, Image as ImageIcon,
  CalendarDays, ChevronDown, Filter, ChevronLeft, MoreHorizontal
} from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';

const DAYS_OF_WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PORTALS = [
  { id: 'kindergarten', name: 'رياض الأطفال' },
  { id: 'elementary', name: 'الابتدائي' },
  { id: 'intermediate', name: 'المتوسط' },
  { id: 'secondary', name: 'الثانوي' }
];
const BEHAVIOR_TYPES = [
  { value: 'إيجابي', color: '#059669', bg: '#d1fae5' },
  { value: 'سلبي', color: '#dc2626', bg: '#fee2e2' },
  { value: 'ملاحظة', color: '#d97706', bg: '#fef3c7' }
];

// معلومات النظام الرئيسي والدعم الفني — يظهر في شاشة الدخول لأن هذا التطبيق هو
// بوابة المعلمين المحمولة التابعة لنظام OPERIX Edu الرئيسي
const SUPPORT_EMAIL = 'support@operix-solutions.com';
const MAIN_WEBSITE_URL = 'https://www.operix-solutions.com';
const MAIN_WEBSITE_LABEL = 'www.operix-solutions.com';
const MAIN_SYSTEM_URL = 'https://www.edu.operix-solutions.online';
const MAIN_SYSTEM_LABEL = 'www.edu.operix-solutions.online';

// ---------- خيارات حالة الحضور (مطابقة لتبويب الحضور في نظام OPERIX Edu الرئيسي) ----------
const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'حاضر', label: 'حاضر', color: '#059669', bg: '#d1fae5', icon: CheckCircle2 },
  { value: 'غائب', label: 'غائب', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
  { value: 'متأخر', label: 'متأخر', color: '#d97706', bg: '#fef3c7', icon: Clock },
  { value: 'بعذر', label: 'مستأذن', color: '#4f46e5', bg: '#e0e7ff', icon: FileText },
];

// الحالات التي تتطلب مرفقاً/ملاحظة عذر — غياب أو تأخر أو استئذان
const REQUIRES_EXCUSE = new Set(['غائب', 'متأخر', 'بعذر']);

// نقطة النهاية الخاصة برفع صور الأعذار (نفس خدمة الرفع المستخدمة في تبويب الحضور بالنظام الرئيسي)
const GAS_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbzjTJlwBLti7MFzQJq119h0tvYJcqV0YbJUmyz-hDgYC8oXgLg1LONUBsabOJnNZYKZ2A/exec';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve((reader.result as string).split(',')[1]);
	reader.onerror = reject;
	reader.readAsDataURL(file);
  });
}

async function uploadExcuseImage(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const res = await fetch(GAS_UPLOAD_URL, {
	method: 'POST',
	headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

function toDriveViewableUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
}

// ==============================================================
// 1. MOBILE LOGIN (SEMI-NATIVE PWA EXPERIENCE) — unchanged
// ==============================================================
const PWALogin = () => {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setError('');
	setIsSubmitting(true);
	try {
	  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
	  if (signInError) throw new Error('بيانات الدخول غير صحيحة.');

	  const localDeviceId = localStorage.getItem('opx_device_id');
	  if (localDeviceId) {
		const { data: device } = await supabase.from('trusted_devices').select('id').eq('device_identifier', localDeviceId).single();
		if (device) return;
	  }
	  await supabase.auth.signOut();
	  const { error: otpError } = await supabase.auth.signInWithOtp({ email });
	  if (otpError) throw new Error('فشل إرسال رمز التحقق.');
	  setStep(3);
	} catch (err: any) {
	  setError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setError('');
	setIsSubmitting(true);
	try {
	  const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
	  if (verifyError || !data.user) throw new Error('الرمز غير صحيح.');
	  const newDeviceId = crypto.randomUUID();
	  await supabase.from('trusted_devices').insert([{ user_id: data.user.id, device_identifier: newDeviceId, browser_info: 'Mobile PWA App' }]);
	  localStorage.setItem('opx_device_id', newDeviceId);
	} catch (err: any) {
	  setError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const stepLabels = ['نطاق المدرسة', 'بيانات الدخول', 'توثيق الجهاز'];

  return (
	<div style={styles.loginContainer}>
	  <div style={styles.loginScroll}>
		{step > 1 && <button onClick={() => setStep(step - 1)} style={styles.backButton}><ArrowRight size={20} /></button>}

		<div style={styles.logoContainer}>
		  <div style={styles.logoIcon}><CheckSquare size={36} color="#059669" /></div>
		  <h1 style={styles.logoTitle}>OPERIX <span style={{ color: '#059669' }}>Edu</span></h1>
		  <p style={styles.logoSubtitle}>بوابة المعلمين — تطبيق التحضير والمتابعة</p>
		  <div style={styles.systemBadge}>
			<Building2 size={13} />
			<span>تابع لنظام OPERIX Edu لإدارة المدارس</span>
		  </div>
		</div>

		{/* مؤشر الخطوات */}
		<div style={styles.stepIndicator}>
		  {stepLabels.map((label, idx) => {
			const n = idx + 1;
			const isDone = step > n;
			const isCurrent = step === n;
			return (
			  <React.Fragment key={label}>
				<div style={styles.stepItem}>
				  <div style={{ ...styles.stepDot, ...(isCurrent ? styles.stepDotActive : {}), ...(isDone ? styles.stepDotDone : {}) }}>
					{isDone ? <CheckCircle2 size={13} /> : n}
				  </div>
				  <span style={{ ...styles.stepLabel, ...(isCurrent ? styles.stepLabelActive : {}) }}>{label}</span>
				</div>
				{n < stepLabels.length && <div style={{ ...styles.stepLine, ...(isDone ? styles.stepLineDone : {}) }} />}
			  </React.Fragment>
			);
		  })}
		</div>

		{error && (
		  <div style={styles.errorBox}>
			<AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
			<span>{error}</span>
		  </div>
		)}

		{step === 1 && (
		  <form onSubmit={(e) => { e.preventDefault(); if (domain.length > 2) setStep(2); }} style={styles.form}>
			<div style={styles.inputGroup}>
			  <label style={styles.label}>نطاق المدرسة</label>
			  <div style={styles.inputWrapper}>
				<Globe size={20} style={styles.iconRight} color="#9ca3af" />
				<input type="text" required value={domain} onChange={e => setDomain(e.target.value)} dir="ltr" autoFocus style={{ ...styles.input, paddingRight: '48px', paddingLeft: '100px' }} placeholder="alnaseem" />
				<span style={styles.domainSuffix}>.operix.edu</span>
			  </div>
			  <p style={styles.helperText}>هذا هو النطاق الذي زوّدتك به إدارة المدرسة عند تفعيل حسابك على نظام OPERIX Edu.</p>
			</div>
			<button type="submit" style={styles.primaryButtonBlack}>المتابعة</button>
		  </form>
		)}

		{step === 2 && (
		  <form onSubmit={handleLoginSubmit} style={styles.form}>
			<div style={styles.inputGroup}>
			  <label style={styles.label}>البريد الإلكتروني</label>
			  <div style={styles.inputWrapper}>
				<Mail size={20} style={styles.iconRight} color="#9ca3af" />
				<input type="email" required value={email} onChange={e => setEmail(e.target.value)} dir="ltr" autoFocus style={{ ...styles.input, paddingRight: '48px' }} placeholder="teacher@school.com" />
			  </div>
			</div>
			<div style={styles.inputGroup}>
			  <label style={styles.label}>كلمة المرور</label>
			  <div style={styles.inputWrapper}>
				<Lock size={20} style={styles.iconRight} color="#9ca3af" />
				<input type="password" required value={password} onChange={e => setPassword(e.target.value)} dir="ltr" style={{ ...styles.input, paddingRight: '48px' }} placeholder="••••••••" />
			  </div>
			  <p style={styles.helperText}>هذه هي نفس بيانات الدخول المستخدمة في نظام OPERIX Edu الرئيسي على الحاسوب.</p>
			</div>
			<button type="submit" disabled={isSubmitting} style={styles.primaryButtonEmerald}>
			  {isSubmitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
			</button>
		  </form>
		)}

		{step === 3 && (
		  <form onSubmit={handleOtpSubmit} style={styles.form}>
			<div style={styles.otpAlert}>
			  <ShieldCheck size={24} color="#059669" style={{ flexShrink: 0 }} />
			  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>جهاز جديد. تم إرسال رمز التحقق المكوّن من 6 أرقام إلى بريدك الإلكتروني.</p>
			</div>
			<div style={styles.inputWrapper}>
			  <KeyRound size={20} style={styles.iconRight} color="#9ca3af" />
			  <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} dir="ltr" autoFocus maxLength={8} style={styles.otpInput} placeholder="00000000" />
			</div>
			<button type="submit" disabled={isSubmitting} style={styles.primaryButtonEmerald}>
			  {isSubmitting ? 'جاري التوثيق...' : 'تأكيد الجهاز'}
			</button>
		  </form>
		)}
	  </div>

	  {/* ---------- تذييل الدعم الفني وروابط النظام — ثابت أسفل شاشة الدخول ---------- */}
	  <div style={styles.loginFooter}>
		<div style={styles.footerDivider} />
		<a href={`mailto:${SUPPORT_EMAIL}`} style={styles.supportButton}>
		  <LifeBuoy size={16} />
		  <span>تواصل مع الدعم الفني</span>
		</a>
		<div style={styles.footerLinksRow}>
		  <a href={MAIN_WEBSITE_URL} target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
			<Globe size={13} />
			<span>{MAIN_WEBSITE_LABEL}</span>
		  </a>
		  <span style={styles.footerLinkSep}>•</span>
		  <a href={MAIN_SYSTEM_URL} target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
			<ExternalLink size={13} />
			<span>{MAIN_SYSTEM_LABEL}</span>
		  </a>
		</div>
		<div style={styles.footerContactRow}>
		  <Mail size={12} color="#9ca3af" />
		  <span style={{ direction: 'ltr' }}>{SUPPORT_EMAIL}</span>
		</div>
		<p style={styles.footerCopyright}>© {new Date().getFullYear()} OPERIX Solutions — جميع الحقوق محفوظة</p>
	  </div>
	</div>
  );
};

// ==============================================================
// 2. SHARED SMALL COMPONENTS
// ==============================================================
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
	<div style={styles.modalSheet} onClick={e => e.stopPropagation()}>
	  <div style={styles.modalHeader}>
		<h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#111827' }}>{title}</h3>
		<button onClick={onClose} style={styles.modalCloseBtn}><X size={18} color="#6b7280" /></button>
	  </div>
	  <div style={{ padding: '20px' }}>{children}</div>
	</div>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
	<label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#374151' }}>{label}</label>
	{children}
  </div>
);

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem', boxSizing: 'border-box', color: '#111827', backgroundColor: '#ffffff' };

// ==============================================================
// 3. وحدة الجدول الدراسي (READ ONLY)
// ==============================================================
const PWATimetable = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
	const fetchTimetable = async () => {
	  if (!workspace || !user || !activePortal) return;
	  setIsLoading(true);
	  const { data } = await supabase
		.from('timetable_edu')
		.select('*, subjects_edu(name)')
		.eq('workspace_id', workspace.id)
		.eq('teacher_id', user.id)
		.eq('portal_type', activePortal)
		.order('day_of_week')
		.order('period_number');
	  if (data) setTimetable(data);
	  setIsLoading(false);
	};
	fetchTimetable();
  }, [workspace, user, activePortal]);

  if (isLoading) return <div style={styles.placeholder}>جاري تحديث الجدول...</div>;

  return (
	<div style={styles.pageContent}>
	  <h2 style={styles.pageTitle}>الجدول الدراسي</h2>
	  {timetable.length === 0 ? (
		<div style={styles.emptyState}>لا يوجد حصص مسجلة لك في هذه البوابة.</div>
	  ) : (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {timetable.map(t => (
			<div key={t.id} style={styles.card}>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
				<span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>{t.subjects_edu?.name || 'مادة'}</span>
				<span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700 }}>{t.grade_level}{t.section ? ` - شعبة ${t.section}` : ''}</span>
			  </div>
			  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
				<span style={styles.badgeSuccess}>{DAYS_OF_WEEK[t.day_of_week]}</span>
				<span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 800 }}>الحصة {t.period_number}</span>
			  </div>
			</div>
		  ))}
		</div>
	  )}
	</div>
  );
};

// ==============================================================
// 4. وحدة تحضير الطلاب (INSERT DAILY)
// ==============================================================
interface AttendanceEntryPWA {
  status: string;
  note: string;
  image_url: string | null;
  dirty: boolean;
}

const PWAAttendance = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [studentId: string]: AttendanceEntryPWA }>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [expandedExcuseId, setExpandedExcuseId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRefs = React.useRef<{ [studentId: string]: HTMLInputElement | null }>({});

  // ---------- جلب طلاب البوابة وسجل الحضور الفعلي لليوم المحدد — تماماً كما تعمل
  // صفحة الحضور في النظام الرئيسي (بدون أي ارتباط بجدول حصص المعلم) ----------
  useEffect(() => {
	const fetchData = async () => {
	  if (!workspace || !activePortal) return;
	  setIsLoading(true);

	  const { data: studentsData, error: studentsError } = await supabase
		.from('students_edu')
		.select('id, full_name, national_id, stage, grade_level, section')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', activePortal)
		.order('grade_level')
		.order('section')
		.order('full_name');

	  if (studentsError) {
		console.error('PWAAttendance students fetch error:', studentsError);
		setStudents([]);
	  } else if (studentsData) {
		setStudents(studentsData);
	  }

	  const { data: attData, error: attError } = await supabase
		.from('attendance_edu')
		.select('student_id, status, image_url, note')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', activePortal)
		.eq('date', selectedDate);

	  if (attError) {
		console.error('PWAAttendance attendance fetch error:', attError);
	  }

	  const attMap: { [key: string]: AttendanceEntryPWA } = {};
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
  }, [workspace, activePortal, selectedDate]);

  // ---------- خيارات فلتر الصف ← الشعبة، مشتقة من طلاب هذه البوابة فقط ----------
  const grades = React.useMemo(() => Array.from(new Set(students.map(s => s.grade_level).filter(Boolean))), [students]);
  const sections = React.useMemo(() => {
	const pool = gradeFilter === 'all' ? students : students.filter(s => s.grade_level === gradeFilter);
	return Array.from(new Set(pool.map(s => s.section).filter(Boolean)));
  }, [students, gradeFilter]);

  useEffect(() => { setSectionFilter('all'); }, [gradeFilter]);

  const filteredStudents = React.useMemo(() => {
	const q = searchQuery.trim().toLowerCase();
	return students.filter(s => {
	  if (gradeFilter !== 'all' && s.grade_level !== gradeFilter) return false;
	  if (sectionFilter !== 'all' && s.section !== sectionFilter) return false;
	  if (q && !s.full_name?.toLowerCase().includes(q)) return false;
	  return true;
	});
  }, [students, searchQuery, gradeFilter, sectionFilter]);

  const groupedStudents = React.useMemo(() => {
	const groups: { key: string; grade: string; section: string; rows: any[] }[] = [];
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

  const summary = React.useMemo(() => {
	const counts = { 'حاضر': 0, 'غائب': 0, 'متأخر': 0, 'بعذر': 0, unmarked: 0 };
	filteredStudents.forEach(s => {
	  const st = attendance[s.id]?.status;
	  if (st && st in counts) (counts as any)[st]++;
	  else counts.unmarked++;
	});
	return counts;
  }, [filteredStudents, attendance]);

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
	if (REQUIRES_EXCUSE.has(status)) setExpandedExcuseId(studentId);
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
	if (!workspace || !activePortal) return;
	const entries = Object.entries(attendance).filter(([studentId, entry]) => studentId && entry.status);
	if (entries.length === 0) { alert('لا توجد أي حالات محددة للحفظ.'); return; }

	setIsSaving(true);
	const payload = entries.map(([studentId, entry]) => ({
	  workspace_id: workspace.id,
	  portal_type: activePortal,
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

	if (error) {
	  console.error('PWAAttendance save error:', error);
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

  return (
	<div style={styles.pageContent}>
	  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
		<h2 style={{ ...styles.pageTitle, marginBottom: '4px' }}>تحضير الطلاب</h2>
	  </div>

	  {/* ---------- التاريخ + زر الفلاتر ---------- */}
	  <div style={styles.attTopRow}>
		<div style={styles.attDatePicker}>
		  <CalendarDays size={16} color="#059669" />
		  <input
			type="date"
			value={selectedDate}
			onChange={(e) => setSelectedDate(e.target.value)}
			style={styles.attDateInput}
		  />
		</div>
		<button onClick={() => setShowFilters(v => !v)} style={{ ...styles.attFilterToggle, ...(showFilters ? styles.attFilterToggleActive : {}) }}>
		  <Filter size={15} /> فلاتر
		</button>
	  </div>

	  {showFilters && (
		<div style={styles.attFilterPanel}>
		  <div style={styles.attSearchBox}>
			<Search size={16} color="#9ca3af" />
			<input
			  type="text"
			  placeholder="ابحث باسم الطالب…"
			  value={searchQuery}
			  onChange={(e) => setSearchQuery(e.target.value)}
			  style={styles.attSearchInput}
			/>
		  </div>
		  <div style={{ display: 'flex', gap: '8px' }}>
			<div style={{ position: 'relative', flex: 1 }}>
			  <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} style={styles.attFilterSelect}>
				<option value="all">الصف: الكل</option>
				{grades.map(g => <option key={g} value={g}>{g}</option>)}
			  </select>
			  <ChevronDown size={13} style={styles.attFilterChevron} />
			</div>
			<div style={{ position: 'relative', flex: 1 }}>
			  <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} style={styles.attFilterSelect}>
				<option value="all">الشعبة: الكل</option>
				{sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
			  </select>
			  <ChevronDown size={13} style={styles.attFilterChevron} />
			</div>
		  </div>
		</div>
	  )}

	  {isLoading ? (
		<div style={styles.placeholder}>جاري تحميل كشف البوابة...</div>
	  ) : (
		<>
		  <div style={styles.attSummaryRow}>
			{ATTENDANCE_STATUS_OPTIONS.map(opt => (
			  <div key={opt.value} style={{ ...styles.attSummaryChip, backgroundColor: opt.bg, color: opt.color }}>
				{opt.label}: {(summary as any)[opt.value]}
			  </div>
			))}
			<div style={{ ...styles.attSummaryChip, backgroundColor: '#f3f4f6', color: '#6b7280' }}>غير مسجّل: {summary.unmarked}</div>
		  </div>

		  <button onClick={markAllVisiblePresent} style={styles.attQuickFillBtn}>تحديد الجميع كحاضر</button>

		  {filteredStudents.length === 0 ? (
			<div style={styles.emptyState}>لا يوجد طلاب مطابقين لمعايير البحث/الفلترة الحالية.</div>
		  ) : (
			groupedStudents.map(group => (
			  <div key={group.key} style={{ marginTop: '16px' }}>
				<div style={styles.attGroupHeader}>
				  <span style={{ fontWeight: 800, color: '#111827' }}>{group.grade}</span>
				  {group.section && <span style={{ color: '#6b7280', fontWeight: 700 }}>شعبة {group.section}</span>}
				  <span style={styles.attGroupCount}>{group.rows.length} طالب</span>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
				  {group.rows.map(s => {
					const entry = attendance[s.id];
					const currentStatus = entry?.status || '';
					const needsExcuse = REQUIRES_EXCUSE.has(currentStatus);
					const isUploading = uploadingFor === s.id;
					const isExpanded = expandedExcuseId === s.id;

					return (
					  <div key={s.id} style={styles.attCard}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>{s.full_name}</span>
						  {needsExcuse && (
							<button onClick={() => setExpandedExcuseId(isExpanded ? null : s.id)} style={styles.attExcuseToggle}>
							  {entry?.image_url ? <ImageIcon size={13} /> : <Paperclip size={13} />}
							  {isExpanded ? 'إخفاء العذر' : 'العذر'}
							</button>
						  )}
						</div>

						<div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
						  {ATTENDANCE_STATUS_OPTIONS.map(opt => {
							const Icon = opt.icon;
							const isActive = currentStatus === opt.value;
							return (
							  <button
								key={opt.value}
								onClick={() => handleStatusChange(s.id, opt.value)}
								style={{
								  display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px',
								  borderRadius: '8px', border: `1px solid ${isActive ? opt.color : '#e5e7eb'}`,
								  backgroundColor: isActive ? opt.color : '#ffffff',
								  color: isActive ? '#ffffff' : '#6b7280',
								  fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center',
								}}
							  >
								<Icon size={13} /> {opt.label}
							  </button>
							);
						  })}
						</div>

						{needsExcuse && isExpanded && (
						  <div style={styles.attExcuseBox}>
							<input
							  type="text"
							  placeholder="ملاحظة العذر (اختياري)"
							  value={entry?.note || ''}
							  onChange={(e) => handleNoteChange(s.id, e.target.value)}
							  style={styles.attNoteInput}
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
								<button type="button" onClick={() => setPreviewUrl(entry.image_url)} style={styles.attAttachedChip}>
								  <ImageIcon size={13} /> عرض المرفق
								</button>
								<button type="button" onClick={() => removeExcuseImage(s.id)} style={styles.attRemoveBtn}>
								  <X size={13} />
								</button>
							  </div>
							) : (
							  <button
								type="button"
								disabled={isUploading}
								onClick={() => fileInputRefs.current[s.id]?.click()}
								style={styles.attAttachBtn}
							  >
								<Paperclip size={13} /> {isUploading ? 'جاري الرفع...' : 'إرفاق صورة العذر'}
							  </button>
							)}
						  </div>
						)}
					  </div>
					);
				  })}
				</div>
			  </div>
			))
		  )}

		  <button onClick={saveAttendance} disabled={isSaving} style={styles.attSaveBar}>
			<Save size={18} />
			{isSaving ? 'جاري الحفظ...' : 'حفظ سجل الحضور'}
		  </button>
		</>
	  )}

	  {previewUrl && (
		<div style={styles.previewOverlay} onClick={() => setPreviewUrl(null)}>
		  <div style={styles.previewCard} onClick={(e) => e.stopPropagation()}>
			<button style={styles.previewClose} onClick={() => setPreviewUrl(null)}><X size={18} /></button>
			<img src={previewUrl} alt="مرفق العذر" style={{ maxWidth: '85vw', maxHeight: '70vh', borderRadius: '8px' }} />
		  </div>
		</div>
	  )}
	</div>
  );
};

// ==============================================================
// 5. وحدة السلوك والمواظبة (READ, INSERT)
// ==============================================================
const PWABehavior = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [form, setForm] = useState({ student_id: '', note_type: 'إيجابي', note: '' });

  const fetchRecords = async () => {
	if (!workspace || !user || !activePortal) return;
	const { data } = await supabase
	  .from('behavior_edu')
	  .select('*, students_edu(full_name)')
	  .eq('workspace_id', workspace.id)
	  .eq('teacher_id', user.id)
	  .eq('portal_type', activePortal)
	  .order('date', { ascending: false })
	  .limit(50);
	if (data) setRecords(data);
  };

  useEffect(() => { fetchRecords(); }, [workspace, user, activePortal]);

  const openModal = async () => {
	const { data } = await supabase
	  .from('students_edu')
	  .select('id, full_name')
	  .eq('workspace_id', workspace?.id)
	  .eq('portal_type', activePortal)
	  .order('full_name')
	  .limit(200);
	if (data) setStudents(data);
	setForm({ student_id: data?.[0]?.id || '', note_type: 'إيجابي', note: '' });
	setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!form.student_id || !form.note.trim()) return;
	setSaving(true);
	const { error } = await supabase.from('behavior_edu').insert([{
	  workspace_id: workspace?.id,
	  teacher_id: user?.id,
	  student_id: form.student_id,
	  portal_type: activePortal,
	  note_type: form.note_type,
	  note: form.note.trim(),
	  date: new Date().toISOString().split('T')[0]
	}]);
	setSaving(false);
	if (!error) {
	  setModalOpen(false);
	  fetchRecords();
	} else {
	  alert('تعذر حفظ الملاحظة، حاول مرة أخرى.');
	}
  };

  const typeMeta = (t: string) => BEHAVIOR_TYPES.find(b => b.value === t) || BEHAVIOR_TYPES[2];

  return (
	<div style={styles.pageContent}>
	  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
		<h2 style={styles.pageTitle}>السلوك والمواظبة</h2>
		<button onClick={openModal} style={styles.addBtn}><Plus size={14} /> إضافة</button>
	  </div>

	  {records.length === 0 ? (
		<div style={styles.emptyState}>لا توجد ملاحظات سلوكية مسجلة بعد في هذه البوابة.</div>
	  ) : (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {records.map(r => {
			const meta = typeMeta(r.note_type);
			return (
			  <div key={r.id} style={styles.card}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
				  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#111827' }}>{r.students_edu?.full_name}</span>
				  <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>{r.note}</span>
				  <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700 }}>{r.date}</span>
				</div>
				<span style={{ ...styles.badgeSuccess, backgroundColor: meta.bg, color: meta.color }}>{r.note_type}</span>
			  </div>
			);
		  })}
		</div>
	  )}

	  {isModalOpen && (
		<Modal title="تسجيل ملاحظة سلوكية" onClose={() => setModalOpen(false)}>
		  <form onSubmit={handleSubmit}>
			<FormField label="الطالب">
			  <select required value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} style={inputStyle}>
				{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
			  </select>
			</FormField>
			<FormField label="نوع الملاحظة">
			  <div style={{ display: 'flex', gap: '8px' }}>
				{BEHAVIOR_TYPES.map(t => (
				  <button
					key={t.value}
					type="button"
					onClick={() => setForm(f => ({ ...f, note_type: t.value }))}
					style={{
					  flex: 1, padding: '10px', borderRadius: '10px', border: form.note_type === t.value ? `2px solid ${t.color}` : '1px solid #e5e7eb',
					  backgroundColor: form.note_type === t.value ? t.bg : '#ffffff', color: t.color, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
					}}
				  >{t.value}</button>
				))}
			  </div>
			</FormField>
			<FormField label="الملاحظة">
			  <textarea required rows={3} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="اكتب تفاصيل الملاحظة..." />
			</FormField>
			<button type="submit" disabled={isSaving} style={styles.modalSubmitBtn}>
			  <Save size={16} /> {isSaving ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
			</button>
		  </form>
		</Modal>
	  )}
	</div>
  );
};

// ==============================================================
// 6. وحدة الواجبات (READ, INSERT)
// ==============================================================
const PWAAssignments = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [form, setForm] = useState({ subject_id: '', title: '', description: '', grade_level: '', due_date: '', full_mark: 10 });

  const fetchTasks = async () => {
	if (!workspace || !user || !activePortal) return;
	const { data } = await supabase
	  .from('assignments_edu')
	  .select('*, subjects_edu(name)')
	  .eq('workspace_id', workspace.id)
	  .eq('teacher_id', user.id)
	  .eq('portal_type', activePortal)
	  .order('due_date', { ascending: true });
	if (data) setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, [workspace, user, activePortal]);

  const openModal = async () => {
	const { data } = await supabase
	  .from('subjects_edu')
	  .select('id, name')
	  .eq('workspace_id', workspace?.id)
	  .order('name');
	if (data) setSubjects(data);
	setForm({ subject_id: data?.[0]?.id || '', title: '', description: '', grade_level: '', due_date: '', full_mark: 10 });
	setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!form.subject_id || !form.title.trim() || !form.grade_level.trim() || !form.due_date) return;
	setSaving(true);
	const { error } = await supabase.from('assignments_edu').insert([{
	  workspace_id: workspace?.id,
	  teacher_id: user?.id,
	  subject_id: form.subject_id,
	  portal_type: activePortal,
	  title: form.title.trim(),
	  description: form.description.trim() || null,
	  grade_level: form.grade_level.trim(),
	  due_date: form.due_date,
	  full_mark: Number(form.full_mark) || 10
	}]);
	setSaving(false);
	if (!error) {
	  setModalOpen(false);
	  fetchTasks();
	} else {
	  alert('تعذر حفظ الواجب، حاول مرة أخرى.');
	}
  };

  return (
	<div style={styles.pageContent}>
	  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
		<h2 style={styles.pageTitle}>مهامي للطلاب</h2>
		<button onClick={openModal} style={styles.addBtn}><Plus size={14} /> إضافة</button>
	  </div>

	  {tasks.length === 0 ? (
		<div style={styles.emptyState}>لم تقم بإضافة مهام في هذه البوابة.</div>
	  ) : (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {tasks.map(t => (
			<div key={t.id} style={styles.card}>
			  <div>
				<span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#111827', display: 'block', marginBottom: '4px' }}>{t.title}</span>
				<span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{t.subjects_edu?.name}</span>
				<span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '12px' }}>الصف: {t.grade_level}</span>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
				  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800 }}><CalendarIcon size={12} style={{ display: 'inline', marginRight: '4px' }} /> الاستحقاق: {t.due_date}</span>
				  <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 800 }}>الدرجة: {t.full_mark}</span>
				</div>
			  </div>
			</div>
		  ))}
		</div>
	  )}

	  {isModalOpen && (
		<Modal title="إضافة واجب جديد" onClose={() => setModalOpen(false)}>
		  <form onSubmit={handleSubmit}>
			<FormField label="المادة">
			  <select required value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} style={inputStyle}>
				{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
			  </select>
			</FormField>
			<FormField label="عنوان الواجب">
			  <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="مثال: حل تمارين الدرس الثالث" />
			</FormField>
			<FormField label="وصف (اختياري)">
			  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
			</FormField>
			<FormField label="الصف الدراسي">
			  <input required type="text" value={form.grade_level} onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))} style={inputStyle} placeholder="مثال: الصف الرابع" />
			</FormField>
			<FormField label="تاريخ الاستحقاق">
			  <input required type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} />
			</FormField>
			<FormField label="الدرجة الكاملة">
			  <input required type="number" min={1} value={form.full_mark} onChange={e => setForm(f => ({ ...f, full_mark: Number(e.target.value) }))} style={inputStyle} />
			</FormField>
			<button type="submit" disabled={isSaving} style={styles.modalSubmitBtn}>
			  <Save size={16} /> {isSaving ? 'جاري الحفظ...' : 'حفظ الواجب'}
			</button>
		  </form>
		</Modal>
	  )}
	</div>
  );
};

// ==============================================================
// 7. وحدة النتائج (READ, INSERT)
// ==============================================================
const PWAResults = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [form, setForm] = useState({ student_id: '', subject_id: '', marks_obtained: 0 });

  const fetchResults = async () => {
	if (!workspace || !activePortal) return;
	// results_edu has no teacher_id column, so results are scoped to subjects
	// this teacher actually teaches (via subjects taught in their timetable).
	const { data: taughtSubjects } = await supabase
	  .from('timetable_edu')
	  .select('subject_id')
	  .eq('workspace_id', workspace.id)
	  .eq('teacher_id', user?.id)
	  .eq('portal_type', activePortal);
	const subjectIds = [...new Set((taughtSubjects || []).map(t => t.subject_id))];
	if (subjectIds.length === 0) { setResults([]); return; }

	const { data } = await supabase
	  .from('results_edu')
	  .select('*, students_edu(full_name), subjects_edu(name, total_mark)')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', activePortal)
	  .in('subject_id', subjectIds)
	  .order('created_at', { ascending: false })
	  .limit(50);
	if (data) setResults(data);
  };

  useEffect(() => { fetchResults(); }, [workspace, user, activePortal]);

  const openModal = async () => {
	const [{ data: studentData }, { data: taughtSubjects }] = await Promise.all([
	  supabase.from('students_edu').select('id, full_name').eq('workspace_id', workspace?.id).eq('portal_type', activePortal).order('full_name').limit(200),
	  supabase.from('timetable_edu').select('subject_id, subjects_edu(id, name)').eq('workspace_id', workspace?.id).eq('teacher_id', user?.id).eq('portal_type', activePortal)
	]);
	const uniqueSubjects = Object.values(
	  (taughtSubjects || []).reduce((acc: any, t: any) => {
		if (t.subjects_edu) acc[t.subjects_edu.id] = t.subjects_edu;
		return acc;
	  }, {})
	);
	setStudents(studentData || []);
	setSubjects(uniqueSubjects as any[]);
	setForm({ student_id: studentData?.[0]?.id || '', subject_id: (uniqueSubjects[0] as any)?.id || '', marks_obtained: 0 });
	setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!form.student_id || !form.subject_id) return;
	setSaving(true);
	const { error } = await supabase.from('results_edu').insert([{
	  workspace_id: workspace?.id,
	  student_id: form.student_id,
	  subject_id: form.subject_id,
	  portal_type: activePortal,
	  marks_obtained: Number(form.marks_obtained) || 0
	}]);
	setSaving(false);
	if (!error) {
	  setModalOpen(false);
	  fetchResults();
	} else {
	  alert('تعذر حفظ النتيجة، حاول مرة أخرى.');
	}
  };

  return (
	<div style={styles.pageContent}>
	  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
		<h2 style={styles.pageTitle}>نتائج الطلاب</h2>
		<button onClick={openModal} style={styles.addBtn}><Plus size={14} /> إضافة</button>
	  </div>

	  {results.length === 0 ? (
		<div style={styles.emptyState}>لا توجد نتائج مسجلة بعد لمواد تدرّسها في هذه البوابة.</div>
	  ) : (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {results.map(r => (
			<div key={r.id} style={styles.card}>
			  <div>
				<span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#111827', display: 'block' }}>{r.students_edu?.full_name}</span>
				<span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>{r.subjects_edu?.name}</span>
			  </div>
			  <span style={styles.badgeSuccess}>{r.marks_obtained} / {r.subjects_edu?.total_mark ?? 100}</span>
			</div>
		  ))}
		</div>
	  )}

	  {isModalOpen && (
		<Modal title="إدخال نتيجة" onClose={() => setModalOpen(false)}>
		  <form onSubmit={handleSubmit}>
			<FormField label="الطالب">
			  <select required value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} style={inputStyle}>
				{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
			  </select>
			</FormField>
			<FormField label="المادة">
			  <select required value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} style={inputStyle}>
				{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
			  </select>
			  {subjects.length === 0 && (
				<span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
				  <AlertCircle size={12} /> لا توجد مواد مرتبطة بجدولك في هذه البوابة بعد.
				</span>
			  )}
			</FormField>
			<FormField label="الدرجة المحصّلة">
			  <input required type="number" min={0} value={form.marks_obtained} onChange={e => setForm(f => ({ ...f, marks_obtained: Number(e.target.value) }))} style={inputStyle} />
			</FormField>
			<button type="submit" disabled={isSaving || subjects.length === 0} style={styles.modalSubmitBtn}>
			  <Save size={16} /> {isSaving ? 'جاري الحفظ...' : 'حفظ النتيجة'}
			</button>
		  </form>
		</Modal>
	  )}
	</div>
  );
};

// ==============================================================
// 8. وحدة الأنشطة والفعاليات (READ, INSERT)
// ==============================================================
const PWAEvents = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', event_date: '', is_public: true });

  const fetchEvents = async () => {
	if (!workspace || !activePortal) return;
	const { data } = await supabase
	  .from('events_edu')
	  .select('*')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', activePortal)
	  .order('event_date', { ascending: true });
	if (data) setEvents(data);
  };

  useEffect(() => { fetchEvents(); }, [workspace, activePortal]);

  const openModal = () => {
	setForm({ title: '', description: '', event_date: '', is_public: true });
	setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!form.title.trim() || !form.event_date) return;
	setSaving(true);
	const { error } = await supabase.from('events_edu').insert([{
	  workspace_id: workspace?.id,
	  portal_type: activePortal,
	  title: form.title.trim(),
	  description: form.description.trim() || null,
	  event_date: form.event_date,
	  is_public: form.is_public
	}]);
	setSaving(false);
	if (!error) {
	  setModalOpen(false);
	  fetchEvents();
	} else {
	  alert('تعذر حفظ النشاط، حاول مرة أخرى.');
	}
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) >= new Date(new Date().toISOString().split('T')[0]);

  return (
	<div style={styles.pageContent}>
	  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
		<h2 style={styles.pageTitle}>الأنشطة والفعاليات</h2>
		<button onClick={openModal} style={styles.addBtn}><Plus size={14} /> إضافة</button>
	  </div>

	  {events.length === 0 ? (
		<div style={styles.emptyState}>لا توجد أنشطة أو فعاليات مسجلة بعد في هذه البوابة.</div>
	  ) : (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {events.map(ev => (
			<div key={ev.id} style={styles.card}>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
				<span style={{ fontSize: '1rem', fontWeight: 900, color: '#111827' }}>{ev.title}</span>
				{ev.description && <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>{ev.description}</span>}
				<span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800 }}>
				  <CalendarIcon size={12} style={{ display: 'inline', marginRight: '4px' }} /> {ev.event_date}
				</span>
			  </div>
			  <span style={{ ...styles.badgeSuccess, backgroundColor: isUpcoming(ev.event_date) ? '#d1fae5' : '#f3f4f6', color: isUpcoming(ev.event_date) ? '#047857' : '#9ca3af' }}>
				{isUpcoming(ev.event_date) ? 'قادم' : 'منتهي'}
			  </span>
			</div>
		  ))}
		</div>
	  )}

	  {isModalOpen && (
		<Modal title="إضافة نشاط أو فعالية" onClose={() => setModalOpen(false)}>
		  <form onSubmit={handleSubmit}>
			<FormField label="عنوان النشاط">
			  <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="مثال: رحلة مدرسية" />
			</FormField>
			<FormField label="وصف (اختياري)">
			  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
			</FormField>
			<FormField label="تاريخ النشاط">
			  <input required type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} style={inputStyle} />
			</FormField>
			<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>
			  <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
			  مرئي لأولياء الأمور
			</label>
			<button type="submit" disabled={isSaving} style={styles.modalSubmitBtn}>
			  <Save size={16} /> {isSaving ? 'جاري الحفظ...' : 'حفظ النشاط'}
			</button>
		  </form>
		</Modal>
	  )}
	</div>
  );
};

// ==============================================================
// 9. وحدة سجل الطلاب (READ) — مع بيانات ولي الأمر مضمّنة
// ==============================================================
const PWAStudents = ({ activePortal }: { activePortal: string }) => {
  const { workspace } = useTenant();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<{ [studentId: string]: any | null }>({});
  const [guardianLoading, setGuardianLoading] = useState<string | null>(null);

  useEffect(() => {
	const fetchStudents = async () => {
	  if (!workspace || !activePortal) return;
	  setIsLoading(true);

	  // نفس نمط الاستعلام المستخدم فعلياً وبنجاح في صفحة الطلاب بالنظام الرئيسي
	  // (بدون أي join مع جدول أولياء الأمور، لتفادي فشل الاستعلام بالكامل في حال
	  // اختلاف اسم علاقة المفتاح الأجنبي عن المتوقع)
	  let query = supabase
		.from('students_edu')
		.select('*')
		.eq('workspace_id', workspace.id)
		.eq('portal_type', activePortal)
		.order('created_at', { ascending: false });

	  if (search.trim()) {
		query = query.or(`full_name.ilike.%${search}%,national_id.ilike.%${search}%`).limit(30);
	  } else {
		query = query.limit(30);
	  }

	  const { data, error } = await query;
	  if (error) {
		console.error('PWAStudents fetch error:', error);
		setStudents([]);
	  } else if (data) {
		setStudents(data);
	  }
	  setIsLoading(false);
	};
	const delay = setTimeout(() => fetchStudents(), 300);
	return () => clearTimeout(delay);
  }, [workspace, activePortal, search]);

  // نجلب بيانات ولي الأمر عند التوسيع فقط (وليس ضمن الاستعلام الرئيسي)، حتى لا
  // يؤدي أي خطأ في هذا الاستعلام الثانوي إلى إخفاء قائمة الطلاب بأكملها
  const toggleExpand = async (studentId: string) => {
	const next = expandedId === studentId ? null : studentId;
	setExpandedId(next);
	if (next && !(studentId in guardians)) {
	  setGuardianLoading(studentId);
	  try {
		const { data, error } = await supabase
		  .from('guardians_edu')
		  .select('full_name, phone_number, email')
		  .eq('student_id', studentId)
		  .maybeSingle();
		if (error) throw error;
		setGuardians(prev => ({ ...prev, [studentId]: data || null }));
	  } catch (err) {
		console.error('PWAStudents guardian fetch error:', err);
		setGuardians(prev => ({ ...prev, [studentId]: null }));
	  } finally {
		setGuardianLoading(null);
	  }
	}
  };

  return (
	<div style={styles.pageContent}>
	  <h2 style={styles.pageTitle}>سجل الطلاب</h2>
	  <div style={{ position: 'relative', marginBottom: '20px' }}>
		<Search size={18} color="#9ca3af" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
		<input
		  type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو رقم الهوية..."
		  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box' }}
		/>
	  </div>

	  {isLoading ? (
		<div style={styles.placeholder}>جاري تحميل قائمة الطلاب...</div>
	  ) : (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
		  {students.map(s => {
			const isExpanded = expandedId === s.id;
			const guardian = guardians[s.id];
			const isGuardianLoading = guardianLoading === s.id;
			return (
			  <div key={s.id} style={{ ...styles.card, flexDirection: 'column', alignItems: 'stretch', padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleExpand(s.id)}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
				  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
					<Users size={20} />
				  </div>
				  <div>
					<span style={{ display: 'block', fontWeight: 800, color: '#111827', fontSize: '0.9rem' }}>{s.full_name}</span>
					<span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>{s.grade_level}{s.section ? ` - ${s.section}` : ''}</span>
				  </div>
				</div>
				{isExpanded && (
				  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
					<span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9ca3af' }}>ولي الأمر</span>
					{isGuardianLoading ? (
					  <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>جاري التحميل...</span>
					) : guardian ? (
					  <>
						<span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{guardian.full_name}</span>
						{guardian.phone_number && (
						  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
							<Phone size={12} /> {guardian.phone_number}
						  </span>
						)}
					  </>
					) : (
					  <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>لا يوجد ولي أمر مسجّل</span>
					)}
				  </div>
				)}
			  </div>
			);
		  })}
		  {students.length === 0 && <div style={styles.emptyState}>لا توجد نتائج.</div>}
		</div>
	  )}
	</div>
  );
};

// ==============================================================
// 10. MAIN TEACHER APP SHELL (WITH PORTAL SWITCHER)
// ==============================================================
// Bottom-nav tab data, iOS-style: if the list grows past 5 tabs, only the
// first MAX_VISIBLE_TABS show directly; the rest collapse behind "المزيد".
const TEACHER_NAV_TABS = [
  { path: 'timetable', label: 'الجدول', icon: Clock },
  { path: 'attendance', label: 'التحضير', icon: CheckSquare },
  { path: 'assignments', label: 'الواجبات', icon: BookOpen },
  { path: 'students', label: 'الطلاب', icon: Users },
  { path: 'behavior', label: 'السلوك', icon: ClipboardList },
  { path: 'results', label: 'النتائج', icon: GraduationCap },
  { path: 'events', label: 'الأنشطة', icon: Sparkles },
];
const MAX_VISIBLE_TABS = 4;
const PRIMARY_NAV_TABS = TEACHER_NAV_TABS.length > 5 ? TEACHER_NAV_TABS.slice(0, MAX_VISIBLE_TABS) : TEACHER_NAV_TABS;
const OVERFLOW_NAV_TABS = TEACHER_NAV_TABS.length > 5 ? TEACHER_NAV_TABS.slice(MAX_VISIBLE_TABS) : [];

export default function TeacherApp() {
  const { user, isLoading } = useAuth();
  const { isOnline, pendingSyncs } = useOfflineSync();
  const [activePortal, setActivePortal] = useState('elementary');
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreOpen || OVERFLOW_NAV_TABS.some((tab) => location.pathname.startsWith(`/teacher-app/${tab.path}`));

  const handleLogout = async () => {
	await supabase.auth.signOut();
  };

  if (isLoading) {
	return (
	  <div style={styles.loadingContainer}>
		<div style={styles.spinner}></div>
		<span style={{ fontWeight: 800, color: '#047857' }}>جاري تحميل التطبيق...</span>
	  </div>
	);
  }

  if (!user) return <PWALogin />;

  return (
	<div style={styles.appContainer} dir="rtl">

	  <header style={styles.header}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
		  <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>OPERIX <span style={{ color: '#059669' }}>Teacher</span></h1>
		  <select
			value={activePortal}
			onChange={(e) => setActivePortal(e.target.value)}
			style={{ border: 'none', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#374151', outline: 'none' }}
		  >
			{PORTALS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
		  </select>
		</div>

		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
		  {!isOnline ? (
			<span style={styles.offlineBadge}><WifiOff size={12} /></span>
		  ) : pendingSyncs > 0 ? (
			<span style={styles.syncBadge}><CloudUpload size={12} /> {pendingSyncs}</span>
		  ) : null}

		  <button onClick={handleLogout} style={styles.logoutBtn}>
			<LogOut size={16} color="#6b7280" />
		  </button>
		</div>
	  </header>

	  <main style={styles.mainContent}>
		<Routes>
		  <Route path="attendance" element={<PWAAttendance activePortal={activePortal} />} />
		  <Route path="timetable" element={<PWATimetable activePortal={activePortal} />} />
		  <Route path="behavior" element={<PWABehavior activePortal={activePortal} />} />
		  <Route path="assignments" element={<PWAAssignments activePortal={activePortal} />} />
		  <Route path="results" element={<PWAResults activePortal={activePortal} />} />
		  <Route path="events" element={<PWAEvents activePortal={activePortal} />} />
		  <Route path="students" element={<PWAStudents activePortal={activePortal} />} />
		  <Route path="*" element={<Navigate to="/teacher-app/timetable" replace />} />
		</Routes>
	  </main>

	  {/* Bottom navigation — iOS-style: shows first 4 tabs; rest collapse behind "المزيد" once total tabs exceed 5 */}
	  <nav style={styles.bottomNav}>
		<div style={styles.navContainer}>
		  {PRIMARY_NAV_TABS.map((tab) => {
			const Icon = tab.icon;
			return (
			  <NavLink key={tab.path} to={`/teacher-app/${tab.path}`} style={({ isActive }) => (isActive ? styles.navItemActive : styles.navItem)}>
				{({ isActive }) => (
				  <>
					<Icon size={22} color={isActive ? '#059669' : '#9ca3af'} fill={isActive ? '#d1fae5' : 'transparent'} />
					<span>{tab.label}</span>
				  </>
				)}
			  </NavLink>
			);
		  })}

		  {OVERFLOW_NAV_TABS.length > 0 && (
			<button
			  type="button"
			  onClick={() => setMoreOpen(true)}
			  style={{ ...(isMoreActive ? styles.navItemActive : styles.navItem), ...styles.navButtonReset }}
			>
			  <MoreHorizontal size={22} color={isMoreActive ? '#059669' : '#9ca3af'} />
			  <span>المزيد</span>
			</button>
		  )}
		</div>
	  </nav>

	  {moreOpen && (
		<Modal title="المزيد" onClose={() => setMoreOpen(false)}>
		  {OVERFLOW_NAV_TABS.map((tab, idx) => {
			const Icon = tab.icon;
			const isLast = idx === OVERFLOW_NAV_TABS.length - 1;
			return (
			  <NavLink
				key={tab.path}
				to={`/teacher-app/${tab.path}`}
				onClick={() => setMoreOpen(false)}
				style={{ ...styles.moreListItem, borderBottom: isLast ? 'none' : styles.moreListItem.borderBottom }}
			  >
				{({ isActive }) => (
				  <>
					<span style={{ ...styles.moreListIconBox, backgroundColor: isActive ? '#d1fae5' : '#f3f4f6' }}>
					  <Icon size={20} color={isActive ? '#059669' : '#374151'} />
					</span>
					<span style={{ ...styles.moreListLabel, color: isActive ? '#059669' : '#111827' }}>{tab.label}</span>
					{isActive ? <CheckCircle2 size={18} color="#059669" /> : <ChevronLeft size={18} color="#d1d5db" />}
				  </>
				)}
			  </NavLink>
			);
		  })}
		</Modal>
	  )}
	</div>
  );
}

// ==============================================================
// 11. INLINE STYLES
// ==============================================================
const styles: { [key: string]: React.CSSProperties } = {
  loginContainer: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif', direction: 'rtl', maxWidth: '450px', margin: '0 auto', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' },
  loginScroll: { flex: 1, overflowY: 'auto', padding: '32px 24px 12px' },
  backButton: { alignSelf: 'flex-start', padding: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '50%', cursor: 'pointer', marginBottom: '20px', color: '#6b7280' },
  logoContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' },
  logoIcon: { width: '76px', height: '76px', backgroundColor: '#d1fae5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '1px solid #a7f3d0' },
  logoTitle: { fontSize: '1.9rem', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' },
  logoSubtitle: { color: '#6b7280', fontSize: '0.88rem', marginTop: '8px', fontWeight: 700, textAlign: 'center' },
  systemBadge: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #e5e7eb' },

  stepIndicator: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '24px' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '64px' },
  stepDot: { width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 },
  stepDotActive: { backgroundColor: '#111827', color: '#ffffff', border: '1px solid #111827' },
  stepDotDone: { backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' },
  stepLabel: { fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textAlign: 'center' },
  stepLabelActive: { color: '#111827', fontWeight: 800 },
  stepLine: { flex: 1, height: '2px', backgroundColor: '#e5e7eb', marginBottom: '18px', maxWidth: '30px' },
  stepLineDone: { backgroundColor: '#a7f3d0' },

  errorBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '14px 16px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', fontWeight: 800, color: '#374151' },
  inputWrapper: { position: 'relative', display: 'flex', width: '100%' },
  iconRight: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' },
  input: { width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', outline: 'none', fontSize: '1rem', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', color: '#111827' },
  domainSuffix: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.9rem' },
  helperText: { margin: 0, fontSize: '0.76rem', color: '#9ca3af', fontWeight: 600, lineHeight: 1.5 },
  otpAlert: { backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  otpInput: { width: '100%', padding: '20px 16px 20px 48px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '1.8rem', fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box' },
  primaryButtonBlack: { backgroundColor: '#111827', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', marginTop: '8px' },
  primaryButtonEmerald: { backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', marginTop: '8px' },

  loginFooter: { flexShrink: 0, padding: '14px 24px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb' },
  footerDivider: { width: '100%', height: '1px', backgroundColor: '#e5e7eb', marginBottom: '2px' },
  supportButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', padding: '10px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none', width: '100%', justifyContent: 'center', boxSizing: 'border-box' },
  footerLinksRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' },
  footerLink: { display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800, direction: 'ltr' },
  footerLinkSep: { color: '#d1d5db', fontSize: '0.75rem' },
  footerContactRow: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700 },
  footerCopyright: { margin: 0, fontSize: '0.68rem', color: '#d1d5db', fontWeight: 600, textAlign: 'center' },

  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif', maxWidth: '450px', margin: '0 auto', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' },
  header: { backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10 },
  offlineBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: '20px', border: '1px solid #fecaca' },
  syncBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#d97706', backgroundColor: '#fffbeb', padding: '4px 8px', borderRadius: '20px', border: '1px solid #fde68a' },
  logoutBtn: { background: '#f3f4f6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  mainContent: { flex: 1, overflowY: 'auto', paddingBottom: '100px', backgroundColor: '#f9fafb' },
  pageContent: { padding: '24px 20px' },
  pageTitle: { margin: '0 0 20px 0', fontSize: '1.3rem', fontWeight: 900, color: '#111827' },
  placeholder: { padding: '40px', textAlign: 'center', fontWeight: 800, color: '#9ca3af' },
  emptyState: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontWeight: 700 },
  card: { backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  badgeSuccess: { backgroundColor: '#d1fae5', color: '#047857', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900, whiteSpace: 'nowrap' },
  actionBtn: { border: 'none', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  addBtn: { backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' },
  backLink: { background: 'none', border: 'none', color: '#059669', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 },
  modalSheet: { backgroundColor: '#ffffff', width: '100%', maxWidth: '450px', margin: '0 auto', borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, backgroundColor: '#ffffff' },
  modalCloseBtn: { background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalSubmitBtn: { width: '100%', backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },

  attTopRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  attDatePicker: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 12px', flex: 1 },
  attDateInput: { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontWeight: 800, color: '#111827', fontSize: '0.85rem', width: '100%' },
  attFilterToggle: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#374151', padding: '9px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 },
  attFilterToggleActive: { backgroundColor: '#111827', color: '#ffffff', border: '1px solid #111827' },
  attFilterPanel: { display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', marginBottom: '12px' },
  attFilterSelect: { width: '100%', appearance: 'none', padding: '9px 26px 9px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem', color: '#111827', cursor: 'pointer', boxSizing: 'border-box' },
  attFilterChevron: { position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' },
  attGroupHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 2px' },
  attGroupCount: { marginRight: 'auto', fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '999px' },
  attDateRow: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 700, marginBottom: '16px' },
  attSearchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 12px' },
  attSearchInput: { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, width: '100%', color: '#111827', fontSize: '0.9rem' },
  attSummaryRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  attSummaryChip: { padding: '5px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 },
  attQuickFillBtn: { width: '100%', backgroundColor: '#ffffff', border: '1px dashed #d1d5db', color: '#111827', padding: '9px', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', marginBottom: '4px' },
  attCard: { backgroundColor: '#ffffff', padding: '14px', borderRadius: '14px', border: '1px solid #e5e7eb' },
  attExcuseToggle: { display: 'flex', alignItems: 'center', gap: '5px', background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' },
  attExcuseBox: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e5e7eb' },
  attNoteInput: { padding: '9px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, color: '#111827', width: '100%', boxSizing: 'border-box' },
  attAttachBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #d1d5db', backgroundColor: '#f9fafb', color: '#6b7280', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', width: 'fit-content' },
  attAttachedChip: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #059669', backgroundColor: '#d1fae5', color: '#059669', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },
  attRemoveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#6b7280', cursor: 'pointer' },
  attSaveBar: { position: 'sticky', bottom: '8px', width: '100%', marginTop: '16px', backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' },
  previewOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(17,24,39,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  previewCard: { position: 'relative', backgroundColor: '#ffffff', padding: '14px', borderRadius: '14px' },
  previewClose: { position: 'absolute', top: '-14px', left: '-14px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#111827', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50 },
  navContainer: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '65px' },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: '4px', textDecoration: 'none', color: '#9ca3af', fontSize: '0.7rem', fontWeight: 800 },
  navItemActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: '4px', textDecoration: 'none', color: '#059669', fontSize: '0.7rem', fontWeight: 800 },
  navButtonReset: { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', WebkitTapHighlightColor: 'transparent' },
  moreListItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 2px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid #f3f4f6' },
  moreListIconBox: { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moreListLabel: { flex: 1, fontSize: '0.92rem', fontWeight: 800 },

  loadingContainer: { display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  spinner: { width: '40px', height: '40px', border: '4px solid #d1fae5', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);