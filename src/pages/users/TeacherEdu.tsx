import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { PageShell } from '../../components/layout/PageShell';
import {
  BookOpen, Calendar, Target, X, Plus, Edit3, Send, GraduationCap, CheckCircle2,
  Search, GripVertical, Trash2, Share2, Paperclip, Link2, ExternalLink, Users, Inbox
} from 'lucide-react';

// Types
// ---------------------------------------------------------------------------
interface Employee {
  id: string;
  profile_id: string | null;
  workspace_id?: string;
  full_name: string;
  job_title: string;
  department?: string | null;
  employee_number?: string | null;
  specialization?: string | null;
  qualification?: string | null;
  hire_date?: string | null;
  pdf_url?: string | null;
  cert_url?: string | null;
  
}

interface Attachment { name: string; url: string; }

interface TaskItem {
  id: string;
  workspace_id: string;
  portal_type: string;
  teacher_id: string;
  task_name: string;
  assigned_role: string | null;
  task_category: string;
  description: string | null;
  activity_type: string | null;
  location: string | null;
  priority: string;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completion_date: string | null;
  estimated_hours: number | null;
  evaluation_score: number | null;
  supervisor_notes: string | null;
  teacher_notes: string | null;
  attachments: Attachment[] | null;
}

interface Assignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  grade_level: string;
  section: string;
  subjects_edu?: { name: string };
}

interface TimetableEntry {
  id: string;
  teacher_id: string;
  subject_id: string;
  day_of_week: number;
  period_number: number;
  subjects_edu?: { name: string };
}

interface Subject { id: string; name: string; }

type TaskFormState = {
  task_category: string; task_name: string; assigned_role: string; description: string;
  activity_type: string; location: string; priority: string; status: string; progress: number;
  start_date: string; due_date: string; completion_date: string; estimated_hours: string;
  evaluation_score: string; supervisor_notes: string; attachments: Attachment[];
};

type ToastMsg = { id: number; text: string; kind: 'success' | 'error'; leaving: boolean };

// A single unified in-page drag payload. Covers dragging a task onto a status
// column, and dragging a subject (from the palette, or an existing placed
// cell) onto a timetable slot or the trash zone.
type LiveDrag =
  | { kind: 'task'; taskId: string; label: string; x: number; y: number }
  | { kind: 'subject-palette'; subjectId: string; label: string; x: number; y: number }
  | { kind: 'subject-cell'; subjectId: string; entryId: string; label: string; x: number; y: number }
  | null;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EMPTY_TASK_FORM: TaskFormState = {
  task_category: 'academic', task_name: '', assigned_role: '', description: '', activity_type: '',
  location: '', priority: 'medium', status: 'pending', progress: 0, start_date: '', due_date: '',
  completion_date: '', estimated_hours: '', evaluation_score: '', supervisor_notes: '', attachments: [],
};

// ASSUMPTION — verify against your data (see note 3 above).
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'الأحد' },
  { value: 2, label: 'الاثنين' },
  { value: 3, label: 'الثلاثاء' },
  { value: 4, label: 'الأربعاء' },
  { value: 5, label: 'الخميس' },
];
const PERIODS_COUNT = 7;

const TASK_STATUSES: { value: string; label: string; accent: string; bg: string }[] = [
  { value: 'pending', label: 'قيد الانتظار', accent: '#64748b', bg: '#f8fafc' },
  { value: 'in_progress', label: 'جاري العمل', accent: '#2563eb', bg: '#eff6ff' },
  { value: 'under_review', label: 'قيد المراجعة', accent: '#d97706', bg: '#fffbeb' },
  { value: 'completed', label: 'مكتمل', accent: '#059669', bg: '#ecfdf5' },
];

const CATEGORY_LABELS: { [k: string]: string } = {
  academic: 'أكاديمي (تدريس، تحضير)', administrative: 'إداري (إشراف، مناوبة)',
  activity: 'نشاط لاصفي (إذاعة، نادي)', evaluation: 'تقييم مستمر', training: 'تدريب وتطوير',
};

const SUBJECT_PALETTE = [
  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
  { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function subjectColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length];
}

function getPriorityColor(priority: string) {
  switch (priority) {
	case 'urgent': return { bg: '#fee2e2', text: '#b91c1c' };
	case 'high': return { bg: '#ffedd5', text: '#c2410c' };
	case 'low': return { bg: '#e0f2fe', text: '#0369a1' };
	default: return { bg: '#fef9c3', text: '#a16207' };
  }
}

function formatDateAr(d: string | null) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('ar-SA'); } catch { return d; }
}

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
	return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

function shareNative(text: string, onFallbackCopy: () => void) {
  if ((navigator as any).share) {
	(navigator as any).share({ text }).catch(() => {});
  } else {
	copyToClipboard(text).then(ok => { if (ok) onFallbackCopy(); });
  }
}

// TODO — wire this to your GAS file-upload endpoint (the same middleware that
// already produces employees_edu.pdf_url / cert_url) so dropped files get a
// real shareable link. Until it's connected, dropped files surface an inline
// message pointing at "add link", which works today with any URL you have.
async function uploadFileToDrive(_file: File): Promise<string> {
  throw new Error('not-connected');
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function ToastStack({ toasts }: { toasts: ToastMsg[] }) {
  if (toasts.length === 0) return null;
  return (
	<div style={styles.toastStack}>
	  {toasts.map(t => (
		<div key={t.id} style={{
		  ...styles.toast,
		  borderColor: t.kind === 'error' ? '#fecaca' : '#bbf7d0',
		  color: t.kind === 'error' ? '#b91c1c' : '#15803d',
		  opacity: t.leaving ? 0 : 1,
		  transform: t.leaving ? 'translateY(-6px) scale(0.98)' : 'translateY(0) scale(1)',
		}}>
		  {t.kind === 'error' ? '⚠' : '✓'} {t.text}
		</div>
	  ))}
	</div>
  );
}

function TeacherCardSkeleton() {
  return (
	<div style={styles.card}>
	  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
		<div className="shimmer" style={{ width: 40, height: 40, borderRadius: '50%' }} />
		<div style={{ flex: 1 }}>
		  <div className="shimmer" style={{ width: '70%', height: 14, borderRadius: 6, marginBottom: 8 }} />
		  <div className="shimmer" style={{ width: '45%', height: 10, borderRadius: 6 }} />
		</div>
	  </div>
	  <div className="shimmer" style={{ width: '50%', height: 20, borderRadius: 6, marginTop: 16 }} />
	</div>
  );
}

function ConfirmAction({ onConfirm, title }: { onConfirm: () => void; title: string }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
	if (!confirming) return;
	const t = setTimeout(() => setConfirming(false), 4000);
	return () => clearTimeout(t);
  }, [confirming]);

  if (confirming) {
	return (
	  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
		<button type="button" onClick={() => { onConfirm(); setConfirming(false); }} style={styles.confirmYes}>تأكيد</button>
		<button type="button" onClick={() => setConfirming(false)} style={styles.confirmNo}>إلغاء</button>
	  </span>
	);
  }
  return (
	<button type="button" onClick={() => setConfirming(true)} style={styles.iconBtn} title={title}>
	  <Trash2 size={14} />
	</button>
  );
}

function ShareButtons({ getText, small }: { getText: () => string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const size = small ? 13 : 15;
  return (
	<>
	  <button
		type="button"
		className="whatsapp-btn"
		style={small ? styles.iconBtnSm : styles.iconBtn}
		title="إرسال عبر واتساب"
		onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getText())}`, '_blank')}
	  >
		<Send size={size} />
	  </button>
	  <button
		type="button"
		style={small ? styles.iconBtnSm : styles.iconBtn}
		title={copied ? 'تم النسخ!' : 'مشاركة'}
		onClick={() => shareNative(getText(), () => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
	  >
		<Share2 size={size} />
	  </button>
	</>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TeachersEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();

  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Employee | null>(null);
  const [teacherDetails, setTeacherDetails] = useState<{ assignments: Assignment[]; timetable: TimetableEntry[]; tasks: TaskItem[] }>({ assignments: [], timetable: [], tasks: [] });
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'academic'>('tasks');

  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskClosing, setTaskClosing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM);
  const [linkDraft, setLinkDraft] = useState({ name: '', url: '' });

  const [assignmentForm, setAssignmentForm] = useState<{ id: string | null; subject_id: string; grade_level: string; section: string }>({ id: null, subject_id: '', grade_level: '', section: '' });
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [armedSubjectId, setArmedSubjectId] = useState<string | null>(null);

  const [liveDrag, setLiveDrag] = useState<LiveDrag>(null);
  const liveDragRef = useRef<LiveDrag>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);

  useEffect(() => { liveDragRef.current = liveDrag; }, [liveDrag]);

  useEffect(() => {
	if (workspace) { fetchTeachers(); fetchSubjects(); }
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  // Unified pointer-drag listeners — only (re)subscribed when a drag starts/ends.
  useEffect(() => {
	if (!liveDrag) return;
	const onMove = (e: PointerEvent) => {
	  setLiveDrag(d => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
	  const hit = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-drop]') as HTMLElement | null;
	  setHoveredTarget(hit ? hit.getAttribute('data-drop') : null);
	};
	const onUp = (e: PointerEvent) => {
	  const hit = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-drop]') as HTMLElement | null;
	  const dropKey = hit ? hit.getAttribute('data-drop') : null;
	  const drag = liveDragRef.current;
	  setLiveDrag(null);
	  setHoveredTarget(null);
	  if (!drag || !dropKey) return;

	  if (drag.kind === 'task' && dropKey.startsWith('status:')) {
		const status = dropKey.slice('status:'.length);
		const task = teacherDetails.tasks.find(t => t.id === drag.taskId);
		if (task) updateTaskStatus(task, status);
	  } else if (dropKey === 'trash' && drag.kind === 'subject-cell') {
		removeTimetableEntry(drag.entryId);
	  } else if (dropKey.startsWith('slot:') && (drag.kind === 'subject-palette' || drag.kind === 'subject-cell')) {
		const [, dayStr, periodStr] = dropKey.split(':');
		placeSubjectInSlot(drag.subjectId, parseInt(dayStr, 10), parseInt(periodStr, 10), drag.kind === 'subject-cell' ? drag.entryId : undefined);
	  }
	};
	window.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);
	return () => {
	  window.removeEventListener('pointermove', onMove);
	  window.removeEventListener('pointerup', onUp);
	};
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDrag !== null]);

  const pushToast = (text: string, kind: ToastMsg['kind'] = 'success') => {
	const id = Date.now() + Math.random();
	setToasts(t => [...t, { id, text, kind, leaving: false }]);
	setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x)), 2600);
	setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2950);
  };

  const fetchTeachers = async () => {
	setIsLoading(true);
	const { data } = await supabase
	  .from('employees_edu')
	  .select('*, profiles(email)')
	  .eq('workspace_id', workspace?.id)
	  .eq('department', 'الشؤون الأكاديمية')
	  .order('created_at', { ascending: false });

	if (data) setTeachers(data);
	setIsLoading(false);
  };

  const fetchSubjects = async () => {
	const { data } = await supabase.from('subjects_edu').select('id, name').eq('workspace_id', workspace?.id).order('name');
	if (data) setSubjectsList(data);
  };

  const fetchTeacherDetails = async (employee: Employee) => {
	if (!workspace || !portalType) return;
	const [assignmentsRes, timetableRes, tasksRes] = await Promise.all([
	  supabase.from('teacher_assignments_edu').select('*, subjects_edu(name)').eq('teacher_id', employee.id).eq('workspace_id', workspace.id),
	  supabase.from('timetable_edu').select('*, subjects_edu(name)').eq('teacher_id', employee.id).eq('portal_type', portalType).eq('workspace_id', workspace.id),
	  supabase.from('teachers_edu_tasks').select('*').eq('teacher_id', employee.id).eq('portal_type', portalType).eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
	]);

	setTeacherDetails({
	  assignments: assignmentsRes.data || [],
	  timetable: timetableRes.data || [],
	  tasks: tasksRes.data || [],
	});
  };

  const openTeacherProfile = async (teacher: Employee) => {
	setSelectedTeacher(teacher);
	setActiveTab('tasks');
	await fetchTeacherDetails(teacher);
	setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
	setProfileClosing(true);
	setTimeout(() => { setIsProfileModalOpen(false); setProfileClosing(false); }, 180);
  };

  const openTaskModal = (task?: TaskItem) => {
	if (task) {
	  setSelectedTask(task);
	  setTaskForm({
		task_category: task.task_category, task_name: task.task_name, assigned_role: task.assigned_role || '',
		description: task.description || '', activity_type: task.activity_type || '', location: task.location || '',
		priority: task.priority, status: task.status, progress: task.progress,
		start_date: task.start_date ? task.start_date.split('T')[0] : '', due_date: task.due_date ? task.due_date.split('T')[0] : '',
		completion_date: task.completion_date ? task.completion_date.split('T')[0] : '',
		estimated_hours: task.estimated_hours != null ? String(task.estimated_hours) : '',
		evaluation_score: task.evaluation_score != null ? String(task.evaluation_score) : '',
		supervisor_notes: task.supervisor_notes || '', attachments: task.attachments || [],
	  });
	} else {
	  setSelectedTask(null);
	  setTaskForm(EMPTY_TASK_FORM);
	}
	setLinkDraft({ name: '', url: '' });
	setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
	setTaskClosing(true);
	setTimeout(() => { setIsTaskModalOpen(false); setTaskClosing(false); }, 180);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!workspace || !selectedTeacher || !portalType) return;
	setIsSubmitting(true);

	const payload = {
	  workspace_id: workspace.id,
	  portal_type: portalType,
	  teacher_id: selectedTeacher.id,
	  task_name: taskForm.task_name,
	  assigned_role: taskForm.assigned_role || null,
	  task_category: taskForm.task_category,
	  description: taskForm.description || null,
	  activity_type: taskForm.activity_type || null,
	  location: taskForm.location || null,
	  priority: taskForm.priority,
	  status: taskForm.status,
	  progress: taskForm.progress,
	  start_date: taskForm.start_date || null,
	  due_date: taskForm.due_date || null,
	  completion_date: taskForm.completion_date || null,
	  estimated_hours: taskForm.estimated_hours ? parseFloat(taskForm.estimated_hours) : null,
	  evaluation_score: taskForm.evaluation_score ? parseFloat(taskForm.evaluation_score) : null,
	  supervisor_notes: taskForm.supervisor_notes || null,
	  attachments: taskForm.attachments,
	};

	const { error } = selectedTask
	  ? await supabase.from('teachers_edu_tasks').update(payload).eq('id', selectedTask.id)
	  : await supabase.from('teachers_edu_tasks').insert([payload]);

	if (error) pushToast('تعذر حفظ التكليف', 'error');
	else pushToast('تم حفظ التكليف بنجاح');

	await fetchTeacherDetails(selectedTeacher);
	setIsSubmitting(false);
	closeTaskModal();
  };

  const deleteTask = async (task: TaskItem) => {
	if (!selectedTeacher) return;
	setTeacherDetails(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== task.id) }));
	const { error } = await supabase.from('teachers_edu_tasks').delete().eq('id', task.id);
	if (error) { pushToast('تعذر حذف التكليف', 'error'); fetchTeacherDetails(selectedTeacher); }
	else pushToast('تم حذف التكليف');
  };

  const updateTaskStatus = async (task: TaskItem, newStatus: string) => {
	if (task.status === newStatus || !selectedTeacher) return;
	const patch: Partial<TaskItem> = { status: newStatus };
	if (newStatus === 'completed') {
	  patch.progress = 100;
	  if (!task.completion_date) patch.completion_date = new Date().toISOString().split('T')[0];
	}
	setTeacherDetails(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, ...patch } : t) }));
	const { error } = await supabase.from('teachers_edu_tasks').update(patch).eq('id', task.id);
	if (error) { pushToast('تعذر تحديث حالة المهمة', 'error'); fetchTeacherDetails(selectedTeacher); }
	else pushToast('تم تحديث الحالة');
  };

  // ---- Assignments (classes/subjects) CRUD ----
  const openAssignmentForm = (a?: Assignment) => {
	setAssignmentForm(a
	  ? { id: a.id, subject_id: a.subject_id, grade_level: a.grade_level, section: a.section }
	  : { id: null, subject_id: subjectsList[0]?.id || '', grade_level: '', section: '' });
	setIsAssignmentFormOpen(true);
  };

  const saveAssignment = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!workspace || !selectedTeacher || !assignmentForm.subject_id) return;
	const payload = {
	  workspace_id: workspace.id,
	  teacher_id: selectedTeacher.id,
	  subject_id: assignmentForm.subject_id, // SUBJECT_FK — adjust if your column name differs
	  grade_level: assignmentForm.grade_level,
	  section: assignmentForm.section,
	};
	const { error } = assignmentForm.id
	  ? await supabase.from('teacher_assignments_edu').update(payload).eq('id', assignmentForm.id)
	  : await supabase.from('teacher_assignments_edu').insert([payload]);

	if (error) pushToast('تعذر حفظ الإسناد', 'error');
	else pushToast('تم الحفظ بنجاح');
	setIsAssignmentFormOpen(false);
	fetchTeacherDetails(selectedTeacher);
  };

  const deleteAssignment = async (id: string) => {
	if (!selectedTeacher) return;
	setTeacherDetails(d => ({ ...d, assignments: d.assignments.filter(a => a.id !== id) }));
	const { error } = await supabase.from('teacher_assignments_edu').delete().eq('id', id);
	if (error) { pushToast('تعذر الحذف', 'error'); fetchTeacherDetails(selectedTeacher); }
	else pushToast('تم الحذف');
  };

  // ---- Timetable drag-and-drop ----
  const placeSubjectInSlot = async (subjectId: string, day: number, period: number, moveEntryId?: string) => {
	if (!workspace || !selectedTeacher || !portalType) return;
	setArmedSubjectId(null);
	const existing = teacherDetails.timetable.find(en => en.day_of_week === day && en.period_number === period);
	const subject = subjectsList.find(s => s.id === subjectId);

	setTeacherDetails(d => {
	  let next = d.timetable.filter(en => en.id !== moveEntryId);
	  next = next.filter(en => !(en.day_of_week === day && en.period_number === period));
	  const optimistic: TimetableEntry = {
		id: moveEntryId || `temp-${Date.now()}`,
		teacher_id: selectedTeacher.id, subject_id: subjectId, day_of_week: day, period_number: period,
		subjects_edu: subject ? { name: subject.name } : undefined,
	  };
	  return { ...d, timetable: [...next, optimistic] };
	});

	if (existing && existing.id !== moveEntryId) {
	  await supabase.from('timetable_edu').delete().eq('id', existing.id);
	}
	const result = moveEntryId
	  ? await supabase.from('timetable_edu').update({ day_of_week: day, period_number: period }).eq('id', moveEntryId)
	  : await supabase.from('timetable_edu').insert([{ workspace_id: workspace.id, teacher_id: selectedTeacher.id, portal_type: portalType, subject_id: subjectId, day_of_week: day, period_number: period }]);

	if (result.error) { pushToast('تعذر تحديث الجدول', 'error'); fetchTeacherDetails(selectedTeacher); return; }
	pushToast('تم تحديث الجدول');
	fetchTeacherDetails(selectedTeacher);
  };

  const removeTimetableEntry = async (entryId: string) => {
	if (!selectedTeacher) return;
	setTeacherDetails(d => ({ ...d, timetable: d.timetable.filter(en => en.id !== entryId) }));
	const { error } = await supabase.from('timetable_edu').delete().eq('id', entryId);
	if (error) { pushToast('تعذر حذف الحصة', 'error'); fetchTeacherDetails(selectedTeacher); }
	else pushToast('تم حذف الحصة من الجدول');
  };

  // ---- Attachments ----
  const addAttachmentLink = () => {
	if (!linkDraft.url.trim()) return;
	setTaskForm(f => ({ ...f, attachments: [...f.attachments, { name: linkDraft.name.trim() || linkDraft.url.trim(), url: linkDraft.url.trim() }] }));
	setLinkDraft({ name: '', url: '' });
  };
  const removeAttachment = (idx: number) => {
	setTaskForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));
  };
  const handleFilesDropped = async (files: FileList | File[]) => {
	for (const file of Array.from(files)) {
	  try {
		const url = await uploadFileToDrive(file);
		setTaskForm(f => ({ ...f, attachments: [...f.attachments, { name: file.name, url }] }));
	  } catch {
		pushToast('رفع الملفات غير مفعّل بعد — أضف رابط الملف يدويًا بالأسفل', 'error');
	  }
	}
  };

  // ---- Derived data ----
  const filteredTeachers = useMemo(() => {
	return teachers.filter(t => {
	  if (accountFilter === 'linked' && !t.profile_id) return false;
	  if (accountFilter === 'unlinked' && t.profile_id) return false;
	  if (!searchQuery.trim()) return true;
	  const q = searchQuery.trim().toLowerCase();
	  return t.full_name?.toLowerCase().includes(q) || t.specialization?.toLowerCase().includes(q) || t.job_title?.toLowerCase().includes(q);
	});
  }, [teachers, searchQuery, accountFilter]);

  const paletteSubjects = useMemo(() => {
	const seen = new Map<string, string>();
	teacherDetails.assignments.forEach(a => { if (!seen.has(a.subject_id)) seen.set(a.subject_id, a.subjects_edu?.name || '—'); });
	return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [teacherDetails.assignments]);

  const tasksByStatus = useMemo(() => {
	const map: { [k: string]: TaskItem[] } = {};
	TASK_STATUSES.forEach(s => { map[s.value] = []; });
	teacherDetails.tasks.forEach(t => { (map[t.status] || (map[t.status] = [])).push(t); });
	return map;
  }, [teacherDetails.tasks]);

  return (
	<PageShell title="الهيئة التعليمية والمهام" subtitle={`إدارة تقييمات ومهام المُعلمين (مرتبطة بـ HR) - ${portalType}`}>
	  <style>{`
		@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
		@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
		@keyframes modalOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(10px) scale(0.98); } }
		@keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
		@keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
		.shimmer { background: linear-gradient(90deg, #eef1f5 25%, #f7f9fb 37%, #eef1f5 63%); background-size: 400px 100%; animation: shimmer 1.4s ease infinite; }
		.hover-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-color: #93c5fd; }
		.hover-card:active { transform: translateY(-1px) scale(0.99); }
		.tab-btn { padding: 12px 24px; border: none; background: transparent; font-weight: 800; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
		.tab-btn.active { color: var(--color-royal); }
		.tab-indicator { position: absolute; bottom: -1px; height: 3px; border-radius: 3px; background: var(--color-royal); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1); }
		.whatsapp-btn:hover { background-color: #22c55e !important; color: white !important; border-color: #22c55e !important; }
		.icon-btn-hover:hover { background: #eef2ff !important; border-color: #93c5fd !important; color: var(--color-royal) !important; }
		.kanban-col-drop { outline: 2px dashed #3b82f6; outline-offset: -2px; background: #eff6ff !important; }
		.slot-drop { outline: 2px dashed #3b82f6; outline-offset: -2px; }
		.trash-drop { background: #fef2f2 !important; border-color: #fca5a5 !important; color: #b91c1c !important; }
		.grip-handle { cursor: grab; touch-action: none; }
		.grip-handle:active { cursor: grabbing; }
		.chip-armed { box-shadow: 0 0 0 2px var(--color-royal); animation: popIn 0.15s ease; }
		.dropzone-active { border-color: var(--color-royal) !important; background: #eff6ff !important; }
		@media (prefers-reduced-motion: reduce) {
		  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
		}
	  `}</style>

	  <ToastStack toasts={toasts} />

	  {/* Search + filter bar */}
	  <div style={styles.searchBar}>
		<div style={styles.searchInputWrap}>
		  <Search size={16} color="#94a3b8" />
		  <input
			value={searchQuery}
			onChange={e => setSearchQuery(e.target.value)}
			placeholder="ابحث بالاسم أو التخصص..."
			style={styles.searchInput}
		  />
		</div>
		<div style={styles.segmented}>
		  {[{ v: 'all', l: 'الكل' }, { v: 'linked', l: 'لديهم حساب' }, { v: 'unlinked', l: 'بدون حساب' }].map(opt => (
			<button
			  key={opt.v}
			  type="button"
			  onClick={() => setAccountFilter(opt.v as any)}
			  style={{ ...styles.segmentBtn, ...(accountFilter === opt.v ? styles.segmentBtnActive : {}) }}
			>
			  {opt.l}
			</button>
		  ))}
		</div>
	  </div>

	  {isLoading ? (
		<div style={styles.grid}>
		  {Array.from({ length: 6 }).map((_, i) => <TeacherCardSkeleton key={i} />)}
		</div>
	  ) : filteredTeachers.length === 0 ? (
		<div style={styles.emptyState}>
		  <Users size={32} color="#cbd5e1" />
		  <p style={{ margin: '12px 0 0 0' }}>{teachers.length === 0 ? 'لا يوجد أعضاء هيئة تعليمية مسجلون بعد.' : 'لا توجد نتائج مطابقة لبحثك.'}</p>
		</div>
	  ) : (
		<div style={styles.grid}>
		  {filteredTeachers.map((t, idx) => (
			<div key={t.id} className="hover-card" style={{ ...styles.card, animation: `slideUp 0.4s ease forwards ${idx * 0.04}s`, opacity: 0 }} onClick={() => openTeacherProfile(t)}>
			  <div style={styles.cardHeader}>
				<div style={styles.avatarCircle}>{(t.full_name || '?').trim().charAt(0)}</div>
				<div style={{ flex: 1 }}>
				  <h3 style={{ margin: 0, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
					<GraduationCap size={16} /> {t.full_name}
				  </h3>
				  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{t.job_title} • {t.specialization || 'عام'}</p>
				</div>
			  </div>
			  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
				{t.profile_id ? (
				  <span style={styles.badgeSuccess}><CheckCircle2 size={12} /> له حساب نظام</span>
				) : (
				  <span style={styles.badgeMuted}>بدون حساب (متابعة ورقية/واتساب)</span>
				)}
			  </div>
			</div>
		  ))}
		</div>
	  )}

	  {/* Teacher Profile Modal */}
	  {isProfileModalOpen && selectedTeacher && (
		<div style={styles.modalOverlay} onClick={closeProfileModal}>
		  <div style={{ ...styles.modalContent, animation: profileClosing ? 'modalOut 0.18s ease forwards' : 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
			<div style={styles.modalHeader}>
			  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
				<div style={{ ...styles.avatarCircle, width: 52, height: 52, fontSize: '1.3rem' }}>{(selectedTeacher.full_name || '?').trim().charAt(0)}</div>
				<div>
				  <h2 style={{ margin: 0, color: 'var(--color-navy)' }}>{selectedTeacher.full_name}</h2>
				  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedTeacher.job_title} · رقم الموظف: {selectedTeacher.employee_number || 'غير متوفر'}</span>
				  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
					{selectedTeacher.qualification && <span style={styles.metaChip}>{selectedTeacher.qualification}</span>}
					{selectedTeacher.hire_date && <span style={styles.metaChip}>منذ {formatDateAr(selectedTeacher.hire_date)}</span>}
					{selectedTeacher.pdf_url && (
					  <a href={selectedTeacher.pdf_url} target="_blank" rel="noreferrer" style={styles.docLink}><ExternalLink size={12} /> السيرة الذاتية</a>
					)}
					{selectedTeacher.cert_url && (
					  <a href={selectedTeacher.cert_url} target="_blank" rel="noreferrer" style={styles.docLink}><ExternalLink size={12} /> الشهادات</a>
					)}
				  </div>
				</div>
			  </div>
			  <button onClick={closeProfileModal} style={styles.closeBtn}><X size={22} /></button>
			</div>

			{/* Tabs with sliding indicator */}
			<div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24, position: 'relative' }}>
			  <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>المهام والأنشطة</button>
			  <button className={`tab-btn ${activeTab === 'academic' ? 'active' : ''}`} onClick={() => setActiveTab('academic')}>الجدول والفصول</button>
			  <span className="tab-indicator" style={activeTab === 'tasks' ? { transform: 'translateX(0)', width: 138 } : { transform: 'translateX(138px)', width: 130 }} />
			</div>

			{/* Tasks Tab — Kanban */}
			{activeTab === 'tasks' && (
			  <div style={{ animation: 'slideUp 0.3s ease-out' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
				  <h3 style={styles.sectionTitle}><Target size={18} /> التكليفات والتقييم المستمر</h3>
				  <button onClick={() => openTaskModal()} style={styles.btnPrimary}>
					<Plus size={16} /> إضافة تكليف جديد
				  </button>
				</div>

				<div style={styles.kanbanBoard}>
				  {TASK_STATUSES.map(col => (
					<div key={col.value} style={styles.kanbanCol}>
					  <div style={{ ...styles.kanbanColHeader, borderTopColor: col.accent }}>
						<span>{col.label}</span>
						<span style={styles.kanbanCount}>{tasksByStatus[col.value]?.length || 0}</span>
					  </div>
					  <div
						data-drop={`status:${col.value}`}
						className={hoveredTarget === `status:${col.value}` ? 'kanban-col-drop' : ''}
						style={{ ...styles.kanbanColBody, backgroundColor: col.bg }}
					  >
						{(tasksByStatus[col.value] || []).map(task => {
						  const colors = getPriorityColor(task.priority);
						  const shareText = `*📌 تكليف: ${task.task_name}*\nالموظف: ${selectedTeacher.full_name}\nالتصنيف: ${CATEGORY_LABELS[task.task_category] || task.task_category}\nتفاصيل: ${task.description || 'لا يوجد تفاصيل إضافية'}\nموعد التسليم: ${task.due_date ? formatDateAr(task.due_date) : 'مفتوح'}\n\nيرجى المتابعة والإنجاز، مع التحية.`;
						  return (
							<div key={task.id} style={{ ...styles.taskCard, opacity: liveDrag?.kind === 'task' && liveDrag.taskId === task.id ? 0.35 : 1 }}>
							  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
								<div style={{ flex: 1 }}>
								  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
									<span style={styles.categoryBadge}>{task.task_category}</span>
									<span style={{ ...styles.priorityBadge, backgroundColor: colors.bg, color: colors.text }}>{task.priority}</span>
								  </div>
								  <h4 style={{ margin: '0 0 6px 0', color: 'var(--color-navy)', fontSize: '1rem' }}>{task.task_name}</h4>
								  {task.description && <p style={styles.taskDesc}>{task.description}</p>}
								  {(task.location || task.assigned_role) && (
									<p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{[task.assigned_role, task.location].filter(Boolean).join(' · ')}</p>
								  )}
								</div>
								<span
								  className="grip-handle"
								  onPointerDown={e => { e.preventDefault(); setLiveDrag({ kind: 'task', taskId: task.id, label: task.task_name, x: e.clientX, y: e.clientY }); }}
								  style={styles.gripHandle}
								  title="اسحب لتغيير الحالة"
								>
								  <GripVertical size={16} />
								</span>
							  </div>

							  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
								<span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>{task.progress}%</span>
								<div style={styles.progressTrack}>
								  <div style={{ height: '100%', width: `${task.progress}%`, backgroundColor: task.progress === 100 ? '#10b981' : '#3b82f6', borderRadius: 3, transition: 'width 0.3s ease' }} />
								</div>
							  </div>

							  {task.due_date && (
								<p style={{ margin: '8px 0 0 0', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
								  <Calendar size={11} /> {formatDateAr(task.due_date)}
								  {task.attachments && task.attachments.length > 0 && (
									<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 8 }}><Paperclip size={11} /> {task.attachments.length}</span>
								  )}
								</p>
							  )}

							  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
								<div style={{ display: 'flex', gap: 6 }}>
								  <button onClick={() => openTaskModal(task)} className="icon-btn-hover" style={styles.iconBtn} title="تعديل"><Edit3 size={14} /></button>
								  <ShareButtons getText={() => shareText} small />
								  <ConfirmAction onConfirm={() => deleteTask(task)} title="حذف" />
								</div>
								<select
								  value={task.status}
								  onChange={e => updateTaskStatus(task, e.target.value)}
								  style={styles.statusSelect}
								  title="تغيير الحالة بدون سحب"
								>
								  {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
								</select>
							  </div>
							</div>
						  );
						})}
						{(tasksByStatus[col.value] || []).length === 0 && (
						  <div style={styles.kanbanEmpty}><Inbox size={16} color="#cbd5e1" /></div>
						)}
					  </div>
					</div>
				  ))}
				</div>
			  </div>
			)}

			{/* Academic Tab — editable assignments + drag-and-drop timetable */}
			{activeTab === 'academic' && (
			  <div style={{ animation: 'slideUp 0.3s ease-out', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
				<div style={styles.section}>
				  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<h3 style={styles.sectionTitle}><BookOpen size={18} /> الفصول والمواد</h3>
					<button type="button" onClick={() => openAssignmentForm()} style={styles.smallAddBtn}><Plus size={14} /></button>
				  </div>

				  {isAssignmentFormOpen && (
					<form onSubmit={saveAssignment} style={styles.inlineForm}>
					  <select required style={styles.input} value={assignmentForm.subject_id} onChange={e => setAssignmentForm(f => ({ ...f, subject_id: e.target.value }))}>
						<option value="" disabled>اختر المادة</option>
						{subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
					  </select>
					  <div style={{ display: 'flex', gap: 8 }}>
						<input required placeholder="الصف" style={styles.input} value={assignmentForm.grade_level} onChange={e => setAssignmentForm(f => ({ ...f, grade_level: e.target.value }))} />
						<input required placeholder="الفصل" style={styles.input} value={assignmentForm.section} onChange={e => setAssignmentForm(f => ({ ...f, section: e.target.value }))} />
					  </div>
					  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
						<button type="button" onClick={() => setIsAssignmentFormOpen(false)} style={styles.btnSecondary}>إلغاء</button>
						<button type="submit" style={styles.btnPrimary}>حفظ</button>
					  </div>
					</form>
				  )}

				  <ul style={styles.list}>
					{teacherDetails.assignments.map((a) => {
					  const c = subjectColor(a.subject_id);
					  return (
						<li key={a.id} style={{ ...styles.listItem, borderInlineStart: `3px solid ${c.text}` }}>
						  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span><strong>{a.subjects_edu?.name}</strong> - الصف {a.grade_level} ({a.section})</span>
							<div style={{ display: 'flex', gap: 4 }}>
							  <button type="button" onClick={() => openAssignmentForm(a)} className="icon-btn-hover" style={styles.iconBtnSm}><Edit3 size={12} /></button>
							  <ConfirmAction onConfirm={() => deleteAssignment(a.id)} title="حذف الإسناد" />
							</div>
						  </div>
						</li>
					  );
					})}
					{teacherDetails.assignments.length === 0 && !isAssignmentFormOpen && (
					  <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>لا توجد فصول مُسندة بعد.</p>
					)}
				  </ul>

				  {paletteSubjects.length > 0 && (
					<div style={{ marginTop: 20 }}>
					  <p style={styles.paletteLabel}>اسحب مادة إلى الجدول، أو اضغط عليها ثم اضغط على خانة فارغة</p>
					  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						{paletteSubjects.map(s => {
						  const c = subjectColor(s.id);
						  const armed = armedSubjectId === s.id;
						  return (
							<button
							  key={s.id}
							  type="button"
							  className={armed ? 'chip-armed' : ''}
							  onPointerDown={e => { e.preventDefault(); setLiveDrag({ kind: 'subject-palette', subjectId: s.id, label: s.name, x: e.clientX, y: e.clientY }); }}
							  onClick={() => setArmedSubjectId(armed ? null : s.id)}
							  style={{ ...styles.subjectChip, background: c.bg, color: c.text, borderColor: c.border }}
							>
							  <GripVertical size={11} /> {s.name}
							</button>
						  );
						})}
					  </div>
					</div>
				  )}
				</div>

				<div style={styles.section}>
				  <h3 style={styles.sectionTitle}><Calendar size={18} /> الجدول الدراسي</h3>
				  <div style={styles.timetableWrap}>
					<table style={styles.timetableTable}>
					  <thead>
						<tr>
						  <th style={styles.timetableTh}></th>
						  {DAYS.map(d => <th key={d.value} style={styles.timetableTh}>{d.label}</th>)}
						</tr>
					  </thead>
					  <tbody>
						{Array.from({ length: PERIODS_COUNT }).map((_, i) => {
						  const period = i + 1;
						  return (
							<tr key={period}>
							  <td style={styles.timetablePeriodCell}>ح {period}</td>
							  {DAYS.map(day => {
								const entry = teacherDetails.timetable.find(en => en.day_of_week === day.value && en.period_number === period);
								const dropKey = `slot:${day.value}:${period}`;
								const isHovered = hoveredTarget === dropKey;
								if (entry) {
								  const c = subjectColor(entry.subject_id);
								  return (
									<td key={day.value} style={styles.timetableTd}>
									  <button
										type="button"
										data-drop={dropKey}
										className={isHovered ? 'slot-drop' : ''}
										onPointerDown={e => { e.preventDefault(); setLiveDrag({ kind: 'subject-cell', subjectId: entry.subject_id, entryId: entry.id, label: entry.subjects_edu?.name || '', x: e.clientX, y: e.clientY }); }}
										style={{ ...styles.timetableFilledCell, background: c.bg, color: c.text, borderColor: c.border, opacity: liveDrag?.kind === 'subject-cell' && liveDrag.entryId === entry.id ? 0.3 : 1 }}
										title={entry.subjects_edu?.name}
									  >
										{entry.subjects_edu?.name}
									  </button>
									</td>
								  );
								}
								return (
								  <td key={day.value} style={styles.timetableTd}>
									<button
									  type="button"
									  data-drop={dropKey}
									  className={isHovered ? 'slot-drop' : ''}
									  onClick={() => armedSubjectId && placeSubjectInSlot(armedSubjectId, day.value, period)}
									  style={{ ...styles.timetableEmptyCell, ...(isHovered ? { borderColor: '#3b82f6' } : {}) }}
									>
									  +
									</button>
								  </td>
								);
							  })}
							</tr>
						  );
						})}
					  </tbody>
					</table>
				  </div>
				  {liveDrag?.kind === 'subject-cell' && (
					<div data-drop="trash" className={hoveredTarget === 'trash' ? 'trash-drop' : ''} style={styles.trashZone}>
					  <Trash2 size={14} /> اسحب هنا لإزالة الحصة من الجدول
					</div>
				  )}
				</div>
			  </div>
			)}
		  </div>
		</div>
	  )}

	  {/* Add/Edit Task Modal */}
	  {isTaskModalOpen && (
		<div style={{ ...styles.modalOverlay, zIndex: 1100 }} onClick={closeTaskModal}>
		  <div style={{ ...styles.modalContent, maxWidth: 640, animation: taskClosing ? 'modalOut 0.18s ease forwards' : 'slideUp 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
			<div style={styles.modalHeader}>
			  <h3 style={{ margin: 0 }}>{selectedTask ? 'تعديل التكليف' : 'إضافة تكليف جديد'}</h3>
			  <button onClick={closeTaskModal} style={styles.closeBtn}><X size={20} /></button>
			</div>
			<form onSubmit={handleSaveTask} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
				  <label style={styles.label}>تصنيف المهمة</label>
				  <select style={styles.input} value={taskForm.task_category} onChange={e => setTaskForm({ ...taskForm, task_category: e.target.value })}>
					{Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
				  </select>
				</div>
				<div>
				  <label style={styles.label}>الأولوية</label>
				  <select style={styles.input} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
					<option value="low">منخفضة</option>
					<option value="medium">متوسطة</option>
					<option value="high">عالية</option>
					<option value="urgent">عاجلة جداً</option>
				  </select>
				</div>
			  </div>

			  <div>
				<label style={styles.label}>عنوان المهمة / النشاط (إلزامي)</label>
				<input required style={styles.input} value={taskForm.task_name} onChange={e => setTaskForm({ ...taskForm, task_name: e.target.value })} placeholder="مثال: الإشراف على الإذاعة المدرسية" />
			  </div>

			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
				  <label style={styles.label}>الدور المسند (اختياري)</label>
				  <input style={styles.input} value={taskForm.assigned_role} onChange={e => setTaskForm({ ...taskForm, assigned_role: e.target.value })} placeholder="مثال: مشرف نشاط" />
				</div>
				<div>
				  <label style={styles.label}>الموقع / القاعة (اختياري)</label>
				  <input style={styles.input} value={taskForm.location} onChange={e => setTaskForm({ ...taskForm, location: e.target.value })} placeholder="مثال: الساحة الرئيسية" />
				</div>
			  </div>

			  <div>
				<label style={styles.label}>الوصف والتفاصيل</label>
				<textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="أدخل تفاصيل المهمة أو التكليف بدقة..." />
			  </div>

			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
				<div>
				  <label style={styles.label}>تاريخ البدء</label>
				  <input type="date" style={styles.input} value={taskForm.start_date} onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })} />
				</div>
				<div>
				  <label style={styles.label}>تاريخ التسليم</label>
				  <input type="date" style={styles.input} value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
				</div>
				<div>
				  <label style={styles.label}>ساعات مقدرة</label>
				  <input type="number" min="0" step="0.25" style={styles.input} value={taskForm.estimated_hours} onChange={e => setTaskForm({ ...taskForm, estimated_hours: e.target.value })} />
				</div>
			  </div>

			  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
				  <label style={styles.label}>نسبة الإنجاز (%)</label>
				  <input type="number" min="0" max="100" style={styles.input} value={taskForm.progress} onChange={e => setTaskForm({ ...taskForm, progress: parseInt(e.target.value) || 0 })} />
				</div>
				<div>
				  <label style={styles.label}>الحالة</label>
				  <select
					style={styles.input}
					value={taskForm.status}
					onChange={e => {
					  const status = e.target.value;
					  setTaskForm(f => ({ ...f, status, progress: status === 'completed' ? 100 : f.progress, completion_date: status === 'completed' && !f.completion_date ? new Date().toISOString().split('T')[0] : f.completion_date }));
					}}
				  >
					{TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
				  </select>
				</div>
			  </div>

			  {taskForm.status === 'completed' && (
				<div>
				  <label style={styles.label}>تاريخ الإنجاز الفعلي</label>
				  <input type="date" style={styles.input} value={taskForm.completion_date} onChange={e => setTaskForm({ ...taskForm, completion_date: e.target.value })} />
				</div>
			  )}

			  <div style={styles.evalBox}>
				<h4 style={{ margin: '0 0 12px 0', color: 'var(--color-navy)' }}>التقييم الإداري</h4>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
				  <div>
					<label style={styles.label}>درجة التقييم (من 100)</label>
					<input type="number" min="0" max="100" step="0.01" style={styles.input} value={taskForm.evaluation_score} onChange={e => setTaskForm({ ...taskForm, evaluation_score: e.target.value })} placeholder="مثال: 95.5" />
				  </div>
				  <div>
					<label style={styles.label}>ملاحظات المشرف / الإدارة</label>
					<textarea style={{ ...styles.input, minHeight: 60 }} value={taskForm.supervisor_notes} onChange={e => setTaskForm({ ...taskForm, supervisor_notes: e.target.value })} placeholder="توجيهات أو ملاحظات سرية على الأداء..." />
				  </div>
				  {selectedTask?.teacher_notes && (
					<div>
					  <label style={styles.label}>ملاحظات المعلم</label>
					  <p style={styles.teacherNoteBox}>{selectedTask.teacher_notes}</p>
					</div>
				  )}
				</div>
			  </div>

			  {/* Attachments / sharing */}
			  <div style={styles.evalBox}>
				<h4 style={{ margin: '0 0 12px 0', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: 8 }}><Paperclip size={16} /> الملفات والمشاركة</h4>

				<div
				  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dropzone-active'); }}
				  onDragLeave={e => e.currentTarget.classList.remove('dropzone-active')}
				  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dropzone-active'); if (e.dataTransfer.files?.length) handleFilesDropped(e.dataTransfer.files); }}
				  style={styles.dropzone}
				>
				  اسحب الملفات هنا، أو أضف رابط ملف موجود (مثل رابط Google Drive) بالأسفل
				</div>

				<div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
				  <input placeholder="اسم الملف (اختياري)" style={{ ...styles.input, flex: 1 }} value={linkDraft.name} onChange={e => setLinkDraft(d => ({ ...d, name: e.target.value }))} />
				  <input placeholder="الصق رابط الملف هنا" style={{ ...styles.input, flex: 2 }} value={linkDraft.url} onChange={e => setLinkDraft(d => ({ ...d, url: e.target.value }))} />
				  <button type="button" onClick={addAttachmentLink} style={styles.btnSecondaryOutline}><Link2 size={14} /> إضافة</button>
				</div>

				{taskForm.attachments.length > 0 && (
				  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
					{taskForm.attachments.map((att, idx) => (
					  <div key={idx} style={styles.attachmentRow}>
						<a href={att.url} target="_blank" rel="noreferrer" style={styles.attachmentName}><Paperclip size={13} /> {att.name}</a>
						<div style={{ display: 'flex', gap: 4 }}>
						  <ShareButtons getText={() => `📎 ${att.name}\n${att.url}`} small />
						  <button type="button" onClick={() => removeAttachment(idx)} style={styles.iconBtnSm}><X size={12} /></button>
						</div>
					  </div>
					))}
				  </div>
				)}
			  </div>

			  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
				<button type="button" onClick={closeTaskModal} style={styles.btnSecondary} disabled={isSubmitting}>إلغاء</button>
				<button type="submit" style={styles.btnPrimary} disabled={isSubmitting}>
				  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التكليف والبيانات'}
				</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}

	  {/* Floating drag ghost */}
	  {liveDrag && (
		<div style={{ ...styles.dragGhost, left: liveDrag.x, top: liveDrag.y }}>
		  <GripVertical size={12} /> {liveDrag.label}
		</div>
	  )}
	</PageShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  searchBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchInputWrap: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 220 },
  searchInput: { border: 'none', outline: 'none', fontFamily: 'inherit', fontWeight: 600, width: '100%', background: 'transparent' },
  segmented: { display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 2 },
  segmentBtn: { border: 'none', background: 'transparent', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' },
  segmentBtnActive: { background: '#fff', color: 'var(--color-navy)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card: { padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  cardHeader: { display: 'flex', justifyContent: 'flex-start', gap: 12, alignItems: 'center' },
  avatarCircle: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-royal), #1e3a8a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 },
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 },
  badgeMuted: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 },
  metaChip: { backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700 },
  docLink: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-royal)', textDecoration: 'none', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' },
  modalContent: { backgroundColor: '#fff', padding: 32, borderRadius: 24, width: '100%', maxWidth: 960, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  closeBtn: { background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 8, borderRadius: '50%', transition: 'background 0.2s', flexShrink: 0 },
  section: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-navy)', margin: 0 },
  list: { listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'flex', flexDirection: 'column', gap: 10 },
  listItem: { fontSize: '0.85rem', backgroundColor: '#fff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' },
  smallAddBtn: { background: 'var(--color-royal)', color: '#fff', border: 'none', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineForm: { display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, margin: '14px 0', animation: 'slideUp 0.2s ease' },
  paletteLabel: { fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 8px 0' },
  subjectChip: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid', borderRadius: 999, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'grab', touchAction: 'none' },
  timetableWrap: { marginTop: 4, overflowX: 'auto' },
  timetableTable: { width: '100%', borderCollapse: 'separate', borderSpacing: 6 },
  timetableTh: { fontSize: '0.72rem', fontWeight: 800, color: '#64748b', padding: '4px 0' },
  timetablePeriodCell: { fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textAlign: 'center', width: 34 },
  timetableTd: { padding: 0, width: 90 },
  timetableEmptyCell: { width: '100%', height: 44, border: '1.5px dashed #e2e8f0', borderRadius: 10, background: '#fff', color: '#cbd5e1', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.15s' },
  timetableFilledCell: { width: '100%', height: 44, border: '1.5px solid', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800, cursor: 'grab', touchAction: 'none', padding: '2px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  trashZone: { marginTop: 12, border: '1.5px dashed #fca5a5', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' },
  kanbanBoard: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: 14, overflowX: 'auto' },
  kanbanCol: { display: 'flex', flexDirection: 'column', minWidth: 240 },
  kanbanColHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-navy)', padding: '0 4px 10px 4px', borderTop: '3px solid', paddingTop: 10 },
  kanbanCount: { color: '#94a3b8' },
  kanbanColBody: { display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 14, padding: 8, minHeight: 120, transition: 'background 0.15s' },
  kanbanEmpty: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', opacity: 0.6 },
  taskCard: { backgroundColor: '#fff', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  taskDesc: { margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  categoryBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 7px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800 },
  priorityBadge: { padding: '3px 7px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800 },
  progressTrack: { width: 90, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  gripHandle: { color: '#cbd5e1', cursor: 'grab', flexShrink: 0, padding: 2 },
  iconBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', transition: 'all 0.2s' },
  iconBtnSm: { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.2s' },
  statusSelect: { fontSize: '0.68rem', fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', color: '#64748b', background: '#fff', cursor: 'pointer' },
  confirmYes: { background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' },
  confirmNo: { background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 8 },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnSecondary: { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' },
  btnSecondaryOutline: { backgroundColor: '#fff', color: 'var(--color-royal)', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  evalBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 8 },
  teacherNoteBox: { margin: 0, fontSize: '0.85rem', color: '#475569', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 },
  dropzone: { border: '2px dashed #cbd5e1', borderRadius: 12, padding: '20px 14px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, transition: 'all 0.15s' },
  attachmentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' },
  attachmentName: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-navy)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  toastStack: { position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' },
  toast: { background: '#fff', border: '1px solid', borderRadius: 12, padding: '10px 18px', fontSize: '0.82rem', fontWeight: 700, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', transition: 'all 0.3s ease' },
  dragGhost: { position: 'fixed', zIndex: 3000, pointerEvents: 'none', transform: 'translate(-50%, -140%) rotate(-2deg)', background: '#fff', border: '1px solid #93c5fd', borderRadius: 10, padding: '8px 14px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-navy)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 6 },
};