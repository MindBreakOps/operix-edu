import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap,
  CalendarDays, TableProperties, Activity, BookOpen, Book,
  FileSignature, Calendar, Wallet, Landmark, Receipt, HeartHandshake,Scale,
  Package, Bus, PenTool, Settings, ChevronDown, ChevronLeft, ChevronRight, FileText,Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 
import logo from '../../assets/logo.png';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface PageIndexEntry {
  key: string;
  label: string;
  icon: IconType;
  group: string;
  keywords: string[];
  allowedRoles?: string[]; 
  color: string; 
}

const ADMIN = '16c63ddf-3059-4d8d-9c9d-1c56f263bee6';
const TEACHER = 'b11a322b-749e-45f5-ba33-d395212bed9b';
const ACCOUNTANT = '7b4e1424-b3e8-48ab-8425-26cc4cbd8042';

export const PAGE_INDEX: PageIndexEntry[] = [
  { key: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, group: 'الرئيسية', keywords: ['dashboard'], allowedRoles: [ADMIN, TEACHER, ACCOUNTANT], color: '#3b82f6' },

  { key: 'students', label: 'الطلاب', icon: Users, group: 'المستخدمين', keywords: ['student'], allowedRoles: [ADMIN, TEACHER, ACCOUNTANT], color: '#10b981' },
  { key: 'parents', label: 'أولياء الأمور', icon: UserCheck, group: 'المستخدمين', keywords: ['parent'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#8b5cf6' },
  { key: 'teachers', label: 'الهيئة التعليمية', icon: GraduationCap, group: 'المستخدمين', keywords: ['teacher'], allowedRoles: [ADMIN], color: '#f59e0b' },
  { key: 'staff', label: 'شؤون الموظفين (HR)', icon: Briefcase, group: 'المستخدمين', keywords: ['hr', 'staff', 'employee'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#6366f1' },

  { key: 'attendance', label: 'الحضور والغياب', icon: CalendarDays, group: 'الشؤون الأكاديمية', keywords: ['attendance'], allowedRoles: [ADMIN, TEACHER], color: '#ec4899' },
  { key: 'timetable', label: 'الجدول الدراسي', icon: TableProperties, group: 'الشؤون الأكاديمية', keywords: ['timetable'], allowedRoles: [ADMIN, TEACHER], color: '#8b5cf6' },
  { key: 'behavior', label: 'السلوك والمواظبة', icon: Activity, group: 'الشؤون الأكاديمية', keywords: ['behavior'], allowedRoles: [ADMIN, TEACHER], color: '#ef4444' },
  { key: 'subjects', label: 'المواد الدراسية', icon: Book, group: 'الشؤون الأكاديمية', keywords: ['subject'], allowedRoles: [ADMIN, TEACHER], color: '#06b6d4' },
  { key: 'assignments', label: 'الواجبات', icon: BookOpen, group: 'الشؤون الأكاديمية', keywords: ['assignment'], allowedRoles: [ADMIN, TEACHER], color: '#f97316' },
  { key: 'results', label: 'النتائج', icon: FileSignature, group: 'الشؤون الأكاديمية', keywords: ['results'], allowedRoles: [ADMIN, TEACHER], color: '#14b8a6' },
  
  { key: 'examinations', label: 'الاختبارات والنماذج', icon: FileText, group: 'الشؤون الأكاديمية', keywords: ['exams', 'tests'], allowedRoles: [ADMIN, TEACHER], color: '#f43f5e' },

  { key: 'events', label: 'إدارة الفعاليات', icon: Calendar, group: 'الأنشطة والفعاليات', keywords: ['event'], allowedRoles: [ADMIN, TEACHER], color: '#d946ef' },

  { key: 'finance/fees', label: 'الرسوم الدراسية', icon: Wallet, group: 'الإدارة والمالية', keywords: ['fees'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#10b981' },
  { key: 'finance/salaries', label: 'الرواتب', icon: Landmark, group: 'الإدارة والمالية', keywords: ['salary'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#3b82f6' },
  { key: 'finance/debts', label: 'المديونيات', icon: Receipt, group: 'الإدارة والمالية', keywords: ['debt'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#f43f5e' },
  { key: 'finance/logistics', label: 'اللوجستيات', icon: Package, group: 'الإدارة والمالية', keywords: ['logistics'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#8b5cf6' },
  { key: 'finance/transportation', label: 'النقل المدرسي', icon: Bus, group: 'الإدارة والمالية', keywords: ['transportation'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#eab308' },
  { key: 'finance/kindergarten', label: 'مالية رياض الأطفال', icon: Landmark, group: 'الإدارة والمالية', keywords: ['kindergarten'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#ec4899' },
  { key: 'finance/special-services', label: 'الخدمات الخاصة', icon: HeartHandshake, group: 'الإدارة والمالية', keywords: ['special services'], allowedRoles: [ADMIN, ACCOUNTANT], color: '#0ea5e9' },

  { key: 'dox-studio', label: 'Dox Studio', icon: PenTool, group: 'أدوات النظام', keywords: ['dox'], allowedRoles: [ADMIN], color: '#f59e0b' },
  { key: 'regulations', label: 'اللوائح والقوانين', icon: Scale, group: 'الإدارة والمالية', keywords: ['regulations', 'rules'], allowedRoles: [ADMIN], color: '#f59e0b' },
  { key: 'settings', label: 'الإعدادات', icon: Settings, group: 'أدوات النظام', keywords: ['settings'], allowedRoles: [ADMIN], color: '#94a3b8' },
  
];

export const NAV_LABELS: Record<string, string> = PAGE_INDEX.reduce((acc, p) => {
  const lastSegment = p.key.split('/').pop() as string;
  acc[lastSegment] = p.label;
  return acc;
}, { finance: 'الإدارة والمالية' } as Record<string, string>);

export const PORTAL_LABELS: Record<string, string> = {
  kindergarten: 'رياض الأطفال',
  elementary: 'الابتدائية',
  intermediate: 'المتوسطة',
  secondary: 'الثانوية',
};

const GROUP_ORDER = ['الرئيسية', 'المستخدمين', 'الشؤون الأكاديمية', 'الأنشطة والفعاليات', 'الإدارة والمالية', 'أدوات النظام'];

export default function Sidebar() {
  const { portalType } = useParams<{ portalType: string }>();
  const activePortal = portalType || 'elementary';
  const navigate = useNavigate();
  const location = useLocation();
 
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role_id || ADMIN; 

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));

  const toggleGroup = (index: number) => {
	setOpenGroups((prev) => {
	  const next = new Set(prev);
	  if (next.has(index)) next.delete(index);
	  else next.add(index);
	  return next;
	});
  };

  const handlePortalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
	const portal = e.target.value;
	const currentSubPage = location.pathname.split('/').slice(3).join('/') || 'dashboard';
	navigate(`/app/${portal}/${currentSubPage}`);
  };

  const navGroups = useMemo(() => (
	GROUP_ORDER.map((title) => {
	  const filteredItems = PAGE_INDEX
		.filter((p) => p.group === title)
		.filter((p) => !p.allowedRoles || p.allowedRoles.includes(userRole))
		.map((p) => ({ name: p.label, path: `/app/${activePortal}/${p.key}`, icon: p.icon, color: p.color }));
		
	  return { title, items: filteredItems };
	}).filter(group => group.items.length > 0)
  ), [activePortal, userRole]);

  const isActive = (path: string) =>
	location.pathname === path || location.pathname.startsWith(path + '/');

  useEffect(() => {
	const idx = navGroups.findIndex((g) => g.items.some((it) => isActive(it.path)));
	if (idx !== -1) {
	  setOpenGroups((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));
	}
  }, [location.pathname, navGroups]);

  return (
	<>
	  <style>{`
		.sidebar-nav-link {
		  display: flex;
		  align-items: center;
		  gap: 12px;
		  padding: 10px 14px;
		  border-radius: 10px;
		  text-decoration: none;
		  color: #cbd5e1; /* Brightened main link text */
		  font-weight: 700;
		  font-size: 1rem; /* Increased base font size */
		  transition: background-color 0.18s ease, color 0.18s ease;
		  position: relative;
		  white-space: nowrap;
		}
		.sidebar-nav-link:hover {
		  background-color: rgba(255, 255, 255, 0.08);
		  color: #ffffff;
		}
		.sidebar-nav-link.active {
		  background: linear-gradient(90deg, rgba(79,125,243,0.2), rgba(79,125,243,0.05));
		  color: #ffffff;
		  font-weight: 800;
		}
		.sidebar-nav-link.active::before {
		  content: '';
		  position: absolute;
		  right: 0; top: 8px; bottom: 8px;
		  width: 4px;
		  border-radius: 4px;
		  background: var(--icon-color, #4f7df3);
		}

		.sidebar-nav-link svg { 
		  flex-shrink: 0; 
		  transition: transform 0.25s ease, color 0.18s ease;
		  color: #94a3b8; 
		}
		.sidebar-nav-link:hover svg {
		  color: var(--icon-color);
		  transform: translateX(-2px);
		}
		.sidebar-nav-link.active svg {
		  color: var(--icon-color);
		}

		.sidebar-group-toggle {
		  display: flex; align-items: center; justify-content: space-between;
		  width: 100%; background: none; border: none; cursor: pointer;
		  padding: 8px 12px 10px 12px; 
		  color: #94a3b8; /* Brightened sub-directory header */
		  font-size: 0.85rem; /* Increased size for visibility */
		  font-weight: 800; 
		  text-transform: uppercase;
		  letter-spacing: 0.05em;
		}
		.sidebar-group-toggle:hover { color: #f1f5f9; }
		.sidebar-group-toggle svg { transition: transform 0.2s ease, color 0.18s ease; color: #94a3b8; width: 14px; height: 14px; }
		.sidebar-group-toggle:hover svg { color: #f1f5f9; }
		.sidebar-group-toggle.open svg { transform: rotate(180deg); }

		.sidebar-group-items {
		  display: flex; flex-direction: column; gap: 4px;
		  max-height: 0; overflow: hidden;
		  transition: max-height 0.3s ease-in-out;
		}
		.sidebar-group-items.open { max-height: 700px; padding-bottom: 8px; }

		.sidebar-collapse-btn {
		  position: absolute; top: 34px; left: -13px;
		  width: 26px; height: 26px; border-radius: 50%;
		  background: #1a2540; border: 1px solid #2c3a5c;
		  display: flex; align-items: center; justify-content: center;
		  cursor: pointer; color: #cbd5e1; z-index: 25;
		  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		  transition: transform 0.15s ease, background-color 0.15s ease, color 0.15s ease;
		}
		.sidebar-collapse-btn:hover { transform: scale(1.1); background: #38bdf8; border-color: #38bdf8; color: #ffffff; }

		.nav-tooltip {
		  position: absolute; right: calc(100% + 14px); top: 50%;
		  transform: translateY(-50%);
		  background: #101a2e; color: #fff; padding: 8px 16px;
		  border-radius: 8px; font-size: 0.9rem; font-weight: 800;
		  white-space: nowrap; opacity: 0; pointer-events: none;
		  transition: opacity 0.15s ease; box-shadow: 0 6px 16px rgba(0,0,0,0.4);
		  border: 1px solid #263455;
		}
		.sidebar-nav-link:hover .nav-tooltip { opacity: 1; }
	  `}</style>

	  <aside className="no-print" style={{ ...styles.sidebar, width: collapsed ? '92px' : '320px' }}>

		<button
		  className="sidebar-collapse-btn"
		  onClick={() => setCollapsed((c) => !c)}
		  title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
		>
		  {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
		</button>

		<div style={styles.header}>
		  <div style={styles.brandRow}>
			<div style={styles.logoChip}>
			  <img src={logo} alt="OPERIX" style={styles.logoImg} />
			</div>
			{!collapsed && (
			  <div style={styles.brandTextCol}>
				<h2 style={styles.logoText}>OPERIX <span style={styles.logoAccent}>Edu</span></h2>
				<span style={styles.brandSub}>لوحة التحكم المركزية</span>
			  </div>
			)}
		  </div>

		  {!collapsed && (
			<div style={{ position: 'relative' }}>
			  <select value={activePortal} onChange={handlePortalChange} style={styles.portalSwitcher}>
				<option value="kindergarten">رياض الأطفال</option>
				<option value="elementary">الابتدائية</option>
				<option value="intermediate">المتوسطة</option>
				<option value="secondary">الثانوية</option>
			  </select>
			  <ChevronDown size={18} style={styles.chevron} />
			</div>
		  )}
		</div>

		<nav style={styles.nav}>
		  {navGroups.map((group, index) => (
			<div key={index} style={styles.navGroup}>
			  {!collapsed && (
				<button
				  className={`sidebar-group-toggle ${openGroups.has(index) ? 'open' : ''}`}
				  onClick={() => toggleGroup(index)}
				>
				  <span>{group.title}</span>
				  <ChevronDown size={16} />
				</button>
			  )}
			  <div className={`sidebar-group-items ${collapsed || openGroups.has(index) ? 'open' : ''}`}>
				{group.items.map((link) => {
				  const active = isActive(link.path);
				  return (
					<Link
					  key={link.path}
					  to={link.path}
					  className={`sidebar-nav-link ${active ? 'active' : ''}`}
					  style={{ 
						...(collapsed ? { justifyContent: 'center', padding: '14px' } : {}),
						'--icon-color': link.color 
					  } as React.CSSProperties}
					>
					  <link.icon size={24} />
					  {!collapsed && <span>{link.name}</span>}
					  {collapsed && <span className="nav-tooltip">{link.name}</span>}
					</Link>
				  );
				})}
			  </div>
			</div>
		  ))}
		</nav>

		{!collapsed && (
		  <div style={styles.footer}>
			<span style={styles.footerText}>OPERIX Edu — الإصدار 2.4</span>
		  </div>
		)}
	  </aside>
	</>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
	backgroundColor: '#0d1526',
	borderLeft: '1px solid #0a1220',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	zIndex: 20,
	height: '100%',
	position: 'relative',
	transition: 'width 0.22s ease',
	overflow: 'visible',
	boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
  },
  header: {
	padding: '24px 20px 22px 20px',
	backgroundColor: '#15203b', // Added a distinct background to the header block
	borderBottom: '2px solid #1e2b4d', // Thickened the border to define the zone
	display: 'flex',
	flexDirection: 'column',
	gap: '20px',
  },
  brandRow: {
	display: 'flex',
	alignItems: 'center',
	gap: '14px',
  },
  logoChip: {
	width: '44px',
	height: '44px',
	borderRadius: '12px',
	backgroundColor: '#ffffff',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	padding: '6px',
	boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
  },
  logoImg: {
	width: '100%',
	height: '100%',
	objectFit: 'contain',
  },
  brandTextCol: {
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	minWidth: 0,
  },
  logoText: {
	color: '#ffffff',
	fontSize: '1.35rem', // Larger, bolder typography
	fontWeight: 900,
	margin: 0,
	letterSpacing: '-0.5px',
	whiteSpace: 'nowrap',
  },
  logoAccent: {
	color: '#38bdf8', // Brighter, more vibrant cyan to perfect the logo contrast
  },
  brandSub: {
	fontSize: '0.78rem',
	color: '#94a3b8',
	fontWeight: 700,
  },
  portalSwitcher: {
	width: '100%',
	padding: '12px 36px 12px 16px',
	borderRadius: '10px',
	border: '1px solid #263859',
	backgroundColor: '#0d1526',
	color: '#f8fafc',
	fontWeight: 800,
	fontSize: '0.95rem', 
	appearance: 'none',
	cursor: 'pointer',
	outline: 'none',
	transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  chevron: {
	position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
	pointerEvents: 'none', color: '#94a3b8',
  },
  nav: {
	padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '18px',
	overflowY: 'auto', flex: 1,
  },
  navGroup: { display: 'flex', flexDirection: 'column' },
  footer: {
	padding: '16px 20px', borderTop: '1px solid #1b2540',
  },
  footerText: { fontSize: '0.78rem', color: '#5c6a8a', fontWeight: 700 },
};