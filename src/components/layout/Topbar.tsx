import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import {
  Bell, Search, UserCircle, LogOut, Plus, Users, GraduationCap,
  UserPlus, CheckCircle2, ChevronLeft, Settings, User as UserIcon, CornerDownLeft,
  AlertCircle, UserX, ClipboardList, BookOpen // Added icons for dynamic notifications
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NAV_LABELS, PORTAL_LABELS, PAGE_INDEX, PageIndexEntry } from './Sidebar';

// Role UUIDs
const ADMIN = '16c63ddf-3059-4d8d-9c9d-1c56f263bee6';
const TEACHER = 'b11a322b-749e-45f5-ba33-d395212bed9b';
const ACCOUNTANT = '7b4e1424-b3e8-48ab-8425-26cc4cbd8042';

// ---------- محرك البحث الذكي ----------
function normalizeArabic(str: string): string {
  return str
	.replace(/[\u064B-\u0652]/g, '')
	.replace(/[إأآا]/g, 'ا')
	.replace(/ى/g, 'ي')
	.replace(/ة/g, 'ه')
	.replace(/ؤ/g, 'و')
	.replace(/ئ/g, 'ي')
	.toLowerCase()
	.trim();
}

function scorePage(query: string, page: PageIndexEntry): number {
  const q = normalizeArabic(query);
  if (!q) return 0;
  const label = normalizeArabic(page.label);
  const group = normalizeArabic(page.group);

  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 75;

  for (const kw of page.keywords) {
	const nk = normalizeArabic(kw);
	if (nk.startsWith(q)) return 65;
	if (nk.includes(q)) return 50;
  }

  if (group.includes(q)) return 30;

  let qi = 0;
  for (let i = 0; i < label.length && qi < q.length; i++) {
	if (label[i] === q[qi]) qi++;
  }
  if (qi === q.length) return 15;

  return 0;
}

function highlight(label: string, query: string): React.ReactNode {
  if (!query.trim()) return label;
  const idx = label.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return label;
  return (
	<>
	  {label.slice(0, idx)}
	  <strong style={{ color: '#4f7df3' }}>{label.slice(idx, idx + query.trim().length)}</strong>
	  {label.slice(idx + query.trim().length)}
	</>
  );
}

const QUICK_ACCESS_KEYS = ['dashboard', 'students', 'attendance', 'results', 'settings'];

export default function Topbar() {
  const { user } = useAuth();
  const { workspace } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // States for Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // State for user data
  const [fullName, setFullName] = useState('جاري التحميل...');
  const [userRole, setUserRole] = useState<string>(ADMIN);
  const [roleName, setRoleName] = useState('جاري التحميل...');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch real user name AND role directly from the database
  useEffect(() => {
	const fetchProfileData = async () => {
	  if (!user) return;
	  const { data, error } = await supabase
		.from('profiles')
		.select('full_name, role_id')
		.eq('id', user.id)
		.single();

	  if (!error && data) {
		setFullName(data.full_name || user.email?.split('@')[0] || 'المستخدم');
		setUserRole(data.role_id);
		
		if (data.role_id === ADMIN) setRoleName('مدير النظام');
		else if (data.role_id === TEACHER) setRoleName('معلم');
		else if (data.role_id === ACCOUNTANT) setRoleName('محاسب');
		else setRoleName('مستخدم');
	  } else {
		setFullName(user.email?.split('@')[0] || 'المستخدم');
	  }
	};
	fetchProfileData();
  }, [user]);

  // 2. LIVE NOTIFICATION ENGINE (Debts, Attendance, Results, Tasks)
  useEffect(() => {
	if (!workspace) return;

	const fetchAlerts = async () => {
	  const today = new Date().toISOString().split('T')[0];
	  const newAlerts = [];

	  // Fetch Pending Teacher Tasks
	  const { data: tasks } = await supabase
		.from('teachers_edu_tasks')
		.select('id, task_name')
		.eq('workspace_id', workspace.id)
		.eq('status', 'pending')
		.limit(2);

	  // Fetch Overdue Debts / Loans
	  const { data: loans } = await supabase
		.from('finance_loans')
		.select('id, entity_type, loan_amount, paid_amount, due_date')
		.eq('workspace_id', workspace.id)
		.lt('due_date', today)
		.limit(2);

	  // Fetch Today's Late/Absent Attendance
	  const { data: attendance } = await supabase
		.from('attendance_edu')
		.select('id, status')
		.eq('workspace_id', workspace.id)
		.eq('date', today)
		.in('status', ['غائب', 'متأخر'])
		.limit(2);

	  // Fetch Recent Academic Results
	  const { data: results } = await supabase
		.from('results_edu')
		.select('id, marks_obtained')
		.eq('workspace_id', workspace.id)
		.order('created_at', { ascending: false })
		.limit(2);

	  // Map dynamic data into unified notification components
	  if (tasks) {
		tasks.forEach(t => newAlerts.push({ id: t.id, title: 'مهمة معلقة', desc: t.task_name, icon: ClipboardList, color: '#3b82f6', bg: '#eff6ff' }));
	  }
	  if (loans) {
		loans.filter(l => (l.loan_amount || 0) > (l.paid_amount || 0)).forEach(l => newAlerts.push({ id: l.id, title: 'مديونية متأخرة', desc: `مستحقة على: ${l.entity_type}`, icon: AlertCircle, color: '#ef4444', bg: '#fef2f2' }));
	  }
	  if (attendance) {
		attendance.forEach(a => newAlerts.push({ id: a.id, title: 'تنبيه حضور', desc: `تم تسجيل طالب (${a.status})`, icon: UserX, color: '#f59e0b', bg: '#fffbeb' }));
	  }
	  if (results) {
		results.forEach(r => newAlerts.push({ id: r.id, title: 'نتيجة جديدة', desc: `تم رصد درجة: ${r.marks_obtained}`, icon: BookOpen, color: '#10b981', bg: '#ecfdf5' }));
	  }

	  setNotifications(newAlerts);

	  // Trigger Audio Alert if new notifications arrive
	  if (newAlerts.length > 0) {
		setUnreadCount(newAlerts.length);
		try {
		  const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
		  // Note: Modern browsers require the user to have interacted with the document (clicked anywhere) before audio is allowed to autoplay
		  alertSound.play().catch(e => console.warn('Audio autoplay blocked by browser until user interaction occurs.'));
		} catch (e) {}
	  }
	};

	fetchAlerts();
  }, [workspace]);

  // 3. Close menus on outside click
  useEffect(() => {
	const handleClickOutside = (e: MouseEvent) => {
	  if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setShowAddMenu(false);
	  if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setShowNotifications(false);
	  if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
	  if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
	};
	document.addEventListener('mousedown', handleClickOutside);
	return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Search Shortcut
  useEffect(() => {
	const handleKeyDown = (e: KeyboardEvent) => {
	  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
		e.preventDefault();
		searchInputRef.current?.focus();
		setSearchOpen(true);
	  }
	};
	window.addEventListener('keydown', handleKeyDown);
	return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
	await supabase.auth.signOut();
	window.location.href = '/login';
  };

  const currentPortal = location.pathname.split('/')[2] || 'elementary';

  const handleQuickAction = (path: string) => {
	setShowAddMenu(false);
	navigate(`/app/${currentPortal}/${path}`);
  };

  const searchResults = useMemo(() => {
	const allowedPages = PAGE_INDEX.filter(p => {
	  const allowedRoles = (p as any).allowedRoles;
	  return !allowedRoles || allowedRoles.includes(userRole);
	});

	if (!searchQuery.trim()) {
	  return allowedPages.filter((p) => QUICK_ACCESS_KEYS.includes(p.key));
	}
	
	return allowedPages
	  .map((p) => ({ page: p, score: scorePage(searchQuery, p) }))
	  .filter((r) => r.score > 0)
	  .sort((a, b) => b.score - a.score)
	  .slice(0, 7)
	  .map((r) => r.page);
  }, [searchQuery, userRole]);

  useEffect(() => { setActiveIndex(0); }, [searchQuery, searchOpen]);

  const goToResult = (page: PageIndexEntry) => {
	navigate(`/app/${currentPortal}/${page.key}`);
	setSearchQuery('');
	setSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
	if (!searchOpen) return;
	if (e.key === 'ArrowDown') {
	  e.preventDefault();
	  setActiveIndex((i) => Math.min(i + 1, searchResults.length - 1));
	} else if (e.key === 'ArrowUp') {
	  e.preventDefault();
	  setActiveIndex((i) => Math.max(i - 1, 0));
	} else if (e.key === 'Enter') {
	  e.preventDefault();
	  if (searchResults[activeIndex]) goToResult(searchResults[activeIndex]);
	} else if (e.key === 'Escape') {
	  setSearchOpen(false);
	  searchInputRef.current?.blur();
	}
  };

  const segments = location.pathname.split('/').filter(Boolean).slice(2);
  const crumbs = [
	{ label: 'الرئيسية', path: `/app/${currentPortal}/dashboard` },
	...segments
	  .filter((seg) => seg !== 'dashboard')
	  .map((seg, i) => ({
		label: NAV_LABELS[seg] || seg,
		path: `/app/${currentPortal}/${segments.slice(0, i + 1).join('/')}`,
	  })),
  ];

  return (
	<>
	  <style>{`
		@keyframes topbarDropdownIn {
		  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
		  to { opacity: 1; transform: translateY(0) scale(1); }
		}
		.topbar-dropdown { animation: topbarDropdownIn 0.16s ease-out; transform-origin: top left; }
		.topbar-icon-btn { transition: background-color 0.15s ease, border-color 0.15s ease; }
		.topbar-icon-btn:hover { background-color: #eaeef7 !important; border-color: #4f7df3 !important; }
		.quick-action-item { transition: background-color 0.15s ease; }
		.quick-action-item:hover { background-color: #f5f7fb; }
		.profile-menu-item { transition: background-color 0.15s ease; }
		.profile-menu-item:hover { background-color: #f5f7fb; }
		.topbar-search-input:focus-within { border-color: #4f7df3 !important; }
		.breadcrumb-link { color: #8592ab; text-decoration: none; transition: all 0.15s ease; }
		.breadcrumb-link:hover { color: #3b82f6; transform: translateY(-1px); }
		.search-result-item { transition: background-color 0.12s ease; }
		.search-result-item.active-result, .search-result-item:hover { background-color: #eef2fb; }
	  `}</style>

	  <header className="no-print" style={styles.topbar}>
		<div style={styles.rightSection}>
		  <div style={styles.workspaceInfo}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			  <span style={styles.workspaceName}>{workspace?.name || 'جاري التحميل...'}</span>
			  <span style={styles.portalTag}>{PORTAL_LABELS[currentPortal] || currentPortal}</span>
			</div>
			
			<nav style={styles.breadcrumbRow} aria-label="مسار التنقل">
			  {crumbs.map((c, i) => (
				<React.Fragment key={c.path}>
				  {i > 0 && <ChevronLeft size={14} color="#94a3b8" />}
				  {i === crumbs.length - 1 ? (
					<span style={styles.breadcrumbCurrent}>{c.label}</span>
				  ) : (
					<Link to={c.path} className="breadcrumb-link" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
					  {c.label}
					</Link>
				  )}
				</React.Fragment>
			  ))}
			</nav>
		  </div>
		</div>

		<div style={styles.leftSection}>

		  <div style={{ position: 'relative' }} ref={searchWrapRef}>
			<div className="topbar-search-input" style={styles.searchContainer}>
			  <Search size={17} color="#9db8a8" />
			  <input
				ref={searchInputRef}
				type="text"
				placeholder="ابحث عن صفحة…"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				onFocus={() => setSearchOpen(true)}
				onKeyDown={handleSearchKeyDown}
				style={styles.searchInput}
			  />
			  {!searchQuery && <span style={styles.kbdHint}>Ctrl K</span>}
			</div>

			{searchOpen && (
			  <div className="topbar-dropdown" style={styles.searchDropdown}>
				<div style={styles.dropdownHeader}>
				  {searchQuery.trim() ? `نتائج البحث (${searchResults.length})` : 'الوصول السريع'}
				</div>
				{searchResults.length === 0 && (
				  <div style={styles.searchEmpty}>لا توجد صفحات مطابقة لـ «{searchQuery}»</div>
				)}
				{searchResults.map((page, i) => (
				  <button
					key={page.key}
					className={`search-result-item ${i === activeIndex ? 'active-result' : ''}`}
					style={styles.searchResultItem}
					onMouseEnter={() => setActiveIndex(i)}
					onClick={() => goToResult(page)}
				  >
					<span style={styles.iconChip}><page.icon size={16} color="#4f7df3" /></span>
					<span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
					  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#131b2e' }}>
						{highlight(page.label, searchQuery)}
					  </span>
					  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{page.group}</span>
					</span>
					{i === activeIndex && <CornerDownLeft size={14} color="#94a3b8" />}
				  </button>
				))}
			  </div>
			)}
		  </div>

		  <div style={{ position: 'relative' }} ref={addMenuRef}>
			{userRole !== TEACHER && (
			  <button
				onClick={() => { setShowAddMenu(!showAddMenu); setShowNotifications(false); setShowProfileMenu(false); }}
				style={styles.actionButton}
			  >
				<Plus size={18} />
				إجراء سريع
			  </button>
			)}

			{showAddMenu && (
			  <div className="topbar-dropdown" style={styles.dropdownMenu}>
				<div style={styles.dropdownHeader}>إجراءات سريعة</div>
				
				<button className="quick-action-item" style={styles.dropdownItem} onClick={() => handleQuickAction('students')}>
				  <span style={{ ...styles.iconChip, backgroundColor: '#e9eefb' }}><Users size={15} color="#4f7df3" /></span>
				  تسجيل طالب جديد
				</button>
				
				<button className="quick-action-item" style={styles.dropdownItem} onClick={() => handleQuickAction('parents')}>
				  <span style={{ ...styles.iconChip, backgroundColor: '#e6f6ec' }}><UserPlus size={15} color="#16a34a" /></span>
				  إضافة ولي أمر
				</button>
				
				{userRole === ADMIN && (
				  <button className="quick-action-item" style={{ ...styles.dropdownItem, borderBottom: 'none' }} onClick={() => handleQuickAction('teachers')}>
					<span style={{ ...styles.iconChip, backgroundColor: '#fdf1e0' }}><GraduationCap size={15} color="#d97706" /></span>
					تعيين معلم
				  </button>
				)}
			  </div>
			)}
		  </div>

		  {/* NOTIFICATION HUB */}
		  <div style={{ position: 'relative' }} ref={notificationsRef}>
			<button
			  className="topbar-icon-btn"
			  onClick={() => { 
				setShowNotifications(!showNotifications); 
				setShowAddMenu(false); 
				setShowProfileMenu(false); 
				if (!showNotifications) setUnreadCount(0); // Mark as read upon opening
			  }}
			  style={styles.iconButton}
			>
			  <Bell size={19} color="#4a5570" />
			  {unreadCount > 0 && <span style={styles.notificationDot}>{unreadCount}</span>}
			</button>

			{showNotifications && (
			  <div className="topbar-dropdown" style={styles.notificationsMenu}>
				<div style={styles.notificationsHeader}>
				  <span style={{ fontWeight: 800, color: '#0f172a' }}>الإشعارات الحديثة</span>
				  <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#4f7df3', fontWeight: 700, cursor: 'pointer' }}>مسح الكل</button>
				</div>

				<div style={{ maxHeight: '320px', overflowY: 'auto' }}>
				  {notifications.length === 0 ? (
					<div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>
					  لا توجد تنبيهات جديدة في النظام.
					</div>
				  ) : (
					notifications.map((notif, idx) => (
					  <div key={idx} style={styles.notificationItem}>
						{unreadCount > 0 && <span style={styles.unreadDot} />}
						<div style={{ ...styles.notificationIcon, backgroundColor: notif.bg }}>
						  <notif.icon size={16} color={notif.color} />
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
						  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#131b2e' }}>{notif.title}</span>
						  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{notif.desc}</span>
						</div>
					  </div>
					))
				  )}
				</div>
				
				<Link to={`/app/${currentPortal}/notifications`} style={styles.notificationsFooter}>
				  عرض سجل الإشعارات بالكامل
				</Link>
			  </div>
			)}
		  </div>

		  <div style={styles.divider}></div>

		  <div style={{ position: 'relative' }} ref={profileRef}>
			<button
			  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowAddMenu(false); setShowNotifications(false); }}
			  style={styles.profileSection}
			>
			  <div style={styles.profileText}>
				<span style={styles.userName}>{fullName}</span>
				<span style={styles.userRole}>{roleName}</span>
			  </div>
			  <UserCircle size={36} color="#4f7df3" strokeWidth={1.5} />
			</button>

			{showProfileMenu && (
			  <div className="topbar-dropdown" style={styles.profileMenu}>
				<div style={styles.profileMenuHeader}>
				  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{fullName}</span>
				  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email}</span>
				</div>
				<Link
				  to={`/app/${currentPortal}/settings`}
				  className="profile-menu-item"
				  style={styles.profileMenuItem}
				  onClick={() => setShowProfileMenu(false)}
				>
				  <UserIcon size={16} color="#334155" /> الملف الشخصي
				</Link>
				<button
				  className="profile-menu-item"
				  style={{ ...styles.profileMenuItem, ...styles.logoutMenuItem }}
				  onClick={handleLogout}
				>
				  <LogOut size={16} color="#ef4444" /> تسجيل الخروج
				</button>
			  </div>
			)}
		  </div>

		</div>
	  </header>
	</>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  topbar: { height: '72px', backgroundColor: '#ffffff', borderBottom: '1px solid #e4e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0, zIndex: 30 },
  rightSection: { display: 'flex', alignItems: 'center' },
  workspaceInfo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  workspaceName: { fontSize: '1.25rem', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.3px' },
  breadcrumbRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  breadcrumbCurrent: { fontSize: '0.82rem', fontWeight: 800, color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px' },
  portalTag: { fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', backgroundColor: '#3b82f6', padding: '4px 12px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)' },
  leftSection: { display: 'flex', alignItems: 'center', gap: '16px' },
  actionButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#4f7df3', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'filter 0.15s ease' },
  dropdownMenu: { position: 'absolute', top: '48px', left: '0', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 12px 28px -6px rgba(16,26,46,0.14)', width: '230px', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50, border: '1px solid #e4e8f0' },
  dropdownHeader: { padding: '12px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#8592ab', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #eef1f6' },
  dropdownItem: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#334155', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', textAlign: 'right', width: '100%', borderBottom: '1px solid #f8fafc' },
  iconChip: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#e9eefb' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f5f7fb', padding: '9px 14px', borderRadius: '10px', width: '300px', border: '1px solid #e4e8f0', transition: 'border-color 0.15s ease' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', color: '#131b2e', width: '100%', fontSize: '0.88rem', fontFamily: 'inherit' },
  kbdHint: { fontSize: '0.68rem', fontWeight: 700, color: '#8592ab', border: '1px solid #dbe1ec', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 },
  searchDropdown: { position: 'absolute', top: '50px', left: '0', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 12px 28px -6px rgba(16,26,46,0.14)', width: '340px', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50, border: '1px solid #e4e8f0', maxHeight: '380px', overflowY: 'auto' },
  searchEmpty: { padding: '20px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 },
  searchResultItem: { padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'right', borderBottom: '1px solid #f8fafc' },
  iconButton: { background: '#f5f7fb', border: '1px solid #e4e8f0', cursor: 'pointer', position: 'relative', display: 'flex', padding: '9px', borderRadius: '50%' },
  notificationDot: { position: 'absolute', top: '-4px', left: '-4px', minWidth: '16px', height: '16px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', border: '2px solid #ffffff', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notificationsMenu: { position: 'absolute', top: '50px', left: '0', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 12px 28px -6px rgba(16,26,46,0.14)', width: '320px', display: 'flex', flexDirection: 'column', zIndex: 50, border: '1px solid #e4e8f0' },
  notificationsHeader: { padding: '14px 16px', borderBottom: '1px solid #e4e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  notificationItem: { padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start', borderBottom: '1px solid #f8fafc', cursor: 'pointer', position: 'relative' },
  unreadDot: { width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4f7df3', marginTop: '6px', flexShrink: 0 },
  notificationIcon: { backgroundColor: '#e6f6ec', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notificationsFooter: { display: 'block', padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#4f7df3', textDecoration: 'none', borderTop: '1px solid #eef1f6', backgroundColor: '#f8fafc' },
  divider: { height: '32px', width: '1px', backgroundColor: '#e4e8f0' },
  profileSection: { display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  profileText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  userName: { fontSize: '0.9rem', fontWeight: 800, color: '#131b2e' },
  userRole: { fontSize: '0.72rem', fontWeight: 600, color: '#8592ab' },
  profileMenu: { position: 'absolute', top: '52px', left: '0', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 12px 28px -6px rgba(16,26,46,0.14)', width: '240px', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50, border: '1px solid #e4e8f0' },
  profileMenuHeader: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid #eef1f6' },
  profileMenuItem: { padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '0.87rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', textAlign: 'right', width: '100%', textDecoration: 'none' },
  logoutMenuItem: { borderTop: '1px solid #eef1f6' }
};