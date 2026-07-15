import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap,
  CalendarDays, TableProperties, Activity, BookOpen, Book,
  FileSignature, Calendar, Wallet, Landmark, Receipt, HeartHandshake,
  Package, Bus, PenTool, Settings, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
// 1. IMPORT YOUR AUTH CONTEXT
import { useAuth } from '../../context/AuthContext'; 

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface PageIndexEntry {
  key: string;
  label: string;
  icon: IconType;
  group: string;
  keywords: string[];
  // 2. ADD ALLOWED ROLES TO THE INTERFACE
  allowedRoles?: string[]; 
}

// 3. DEFINE YOUR ROLE UUIDS
const ADMIN = '16c63ddf-3059-4d8d-9c9d-1c56f263bee6';
const TEACHER = 'b11a322b-749e-45f5-ba33-d395212bed9b';
const ACCOUNTANT = '7b4e1424-b3e8-48ab-8425-26cc4cbd8042';

// 4. ASSIGN ROLES TO PAGES
export const PAGE_INDEX: PageIndexEntry[] = [
  { key: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, group: 'الرئيسية', keywords: ['dashboard'], allowedRoles: [ADMIN, TEACHER, ACCOUNTANT] },

  { key: 'students', label: 'الطلاب', icon: Users, group: 'المستخدمين', keywords: ['student'], allowedRoles: [ADMIN, TEACHER, ACCOUNTANT] },
  { key: 'parents', label: 'أولياء الأمور', icon: UserCheck, group: 'المستخدمين', keywords: ['parent'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'teachers', label: 'الهيئة التعليمية', icon: GraduationCap, group: 'المستخدمين', keywords: ['teacher'], allowedRoles: [ADMIN] },

  { key: 'attendance', label: 'الحضور والغياب', icon: CalendarDays, group: 'الشؤون الأكاديمية', keywords: ['attendance'], allowedRoles: [ADMIN, TEACHER] },
  { key: 'timetable', label: 'الجدول الدراسي', icon: TableProperties, group: 'الشؤون الأكاديمية', keywords: ['timetable'], allowedRoles: [ADMIN, TEACHER] },
  { key: 'behavior', label: 'السلوك والمواظبة', icon: Activity, group: 'الشؤون الأكاديمية', keywords: ['behavior'], allowedRoles: [ADMIN, TEACHER] },
  { key: 'subjects', label: 'المواد الدراسية', icon: Book, group: 'الشؤون الأكاديمية', keywords: ['subject'], allowedRoles: [ADMIN, TEACHER] },
  { key: 'assignments', label: 'الواجبات', icon: BookOpen, group: 'الشؤون الأكاديمية', keywords: ['assignment'], allowedRoles: [ADMIN, TEACHER] },
  { key: 'results', label: 'النتائج', icon: FileSignature, group: 'الشؤون الأكاديمية', keywords: ['results'], allowedRoles: [ADMIN, TEACHER] },

  { key: 'events', label: 'إدارة الفعاليات', icon: Calendar, group: 'الأنشطة والفعاليات', keywords: ['event'], allowedRoles: [ADMIN, TEACHER] },

  { key: 'finance/fees', label: 'الرسوم الدراسية', icon: Wallet, group: 'الإدارة والمالية', keywords: ['fees'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'finance/salaries', label: 'الرواتب', icon: Landmark, group: 'الإدارة والمالية', keywords: ['salary'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'finance/debts', label: 'المديونيات', icon: Receipt, group: 'الإدارة والمالية', keywords: ['debt'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'finance/logistics', label: 'اللوجستيات', icon: Package, group: 'الإدارة والمالية', keywords: ['logistics'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'finance/transportation', label: 'النقل المدرسي', icon: Bus, group: 'الإدارة والمالية', keywords: ['transportation'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'finance/kindergarten', label: 'مالية رياض الأطفال', icon: Landmark, group: 'الإدارة والمالية', keywords: ['kindergarten'], allowedRoles: [ADMIN, ACCOUNTANT] },
  { key: 'finance/special-services', label: 'الخدمات الخاصة', icon: HeartHandshake, group: 'الإدارة والمالية', keywords: ['special services'], allowedRoles: [ADMIN, ACCOUNTANT] },

  { key: 'dox-studio', label: 'Dox Studio', icon: PenTool, group: 'أدوات النظام', keywords: ['dox'], allowedRoles: [ADMIN] },
  { key: 'settings', label: 'الإعدادات', icon: Settings, group: 'أدوات النظام', keywords: ['settings'], allowedRoles: [ADMIN] },
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
  
  // 5. GET THE USER'S ROLE FROM METADATA
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

  // 6. FILTER THE MENU BASED ON THE USER'S ROLE
  const navGroups = useMemo(() => (
	GROUP_ORDER.map((title) => {
	  const filteredItems = PAGE_INDEX
		.filter((p) => p.group === title)
		.filter((p) => !p.allowedRoles || p.allowedRoles.includes(userRole)) // The magic filter!
		.map((p) => ({ name: p.label, path: `/app/${activePortal}/${p.key}`, icon: p.icon }));
		
	  return { title, items: filteredItems };
	}).filter(group => group.items.length > 0) // Hide empty groups
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
		  gap: 13px;
		  padding: 10px 14px;
		  border-radius: 9px;
		  text-decoration: none;
		  color: #9aa7c2;
		  font-weight: 600;
		  font-size: 0.92rem;
		  transition: background-color 0.15s ease, color 0.15s ease;
		  border-right: 3px solid transparent;
		  position: relative;
		  white-space: nowrap;
		}
		.sidebar-nav-link:hover {
		  background-color: rgba(79, 125, 243, 0.08);
		  color: #e7ebf5;
		}
		.sidebar-nav-link.active {
		  background-color: rgba(79, 125, 243, 0.14);
		  color: var(--color-royal, #4f7df3);
		  font-weight: 800;
		  border-right: 3px solid var(--color-royal, #4f7df3);
		}
		.sidebar-nav-link svg { flex-shrink: 0; }

		.sidebar-group-toggle {
		  display: flex; align-items: center; justify-content: space-between;
		  width: 100%; background: none; border: none; cursor: pointer;
		  padding: 6px 14px 8px 14px; color: #5c6a8a;
		  font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
		  letter-spacing: 0.06em;
		}
		.sidebar-group-toggle svg { transition: transform 0.2s ease; color: #445071; }
		.sidebar-group-toggle.open svg { transform: rotate(180deg); color: #4f7df3; }

		.sidebar-group-items {
		  display: flex; flex-direction: column; gap: 2px;
		  max-height: 0; overflow: hidden;
		  transition: max-height 0.25s ease;
		}
		.sidebar-group-items.open { max-height: 700px; }

		.sidebar-collapse-btn {
		  position: absolute; top: 92px; left: -14px;
		  width: 26px; height: 26px; border-radius: 50%;
		  background: #4f7df3; border: 3px solid #f5f7fb;
		  display: flex; align-items: center; justify-content: center;
		  cursor: pointer; color: #ffffff; z-index: 25;
		  box-shadow: 0 2px 8px rgba(16, 26, 46, 0.3);
		  transition: transform 0.15s ease;
		}
		.sidebar-collapse-btn:hover { transform: scale(1.08); }

		.nav-tooltip {
		  position: absolute; right: calc(100% + 14px); top: 50%;
		  transform: translateY(-50%);
		  background: #101a2e; color: #fff; padding: 7px 14px;
		  border-radius: 6px; font-size: 0.84rem; font-weight: 700;
		  white-space: nowrap; opacity: 0; pointer-events: none;
		  transition: opacity 0.15s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		  border: 1px solid #263455;
		}
		.sidebar-nav-link:hover .nav-tooltip { opacity: 1; }
	  `}</style>

	  <aside className="no-print" style={{ ...styles.sidebar, width: collapsed ? '92px' : '304px' }}>

		<button
		  className="sidebar-collapse-btn"
		  onClick={() => setCollapsed((c) => !c)}
		  title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
		>
		  {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
		</button>

		<div style={styles.header}>
		  <div style={styles.brandRow}>
			<div style={styles.emblem}>
			  <GraduationCap size={20} color="#ffffff" strokeWidth={2.5} />
			</div>
			{!collapsed && (
			  <h2 style={styles.logo}>OPERIX <span style={styles.logoAccent}>Edu</span></h2>
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
			  <ChevronDown size={16} style={styles.chevron} />
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
				  <ChevronDown size={15} />
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
					  style={collapsed ? { justifyContent: 'center', padding: '13px' } : undefined}
					>
					  <link.icon size={22} />
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
	backgroundColor: '#101a2e',
	borderLeft: '1px solid #0a1220',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	zIndex: 20,
	height: '100%',
	position: 'relative',
	transition: 'width 0.22s ease',
	overflow: 'visible',
  },
  header: {
	padding: '22px 20px',
	borderBottom: '1px solid #1e2a45',
	display: 'flex',
	flexDirection: 'column',
	gap: '16px',
  },
  brandRow: {
	display: 'flex',
	alignItems: 'center',
	gap: '12px',
  },
  emblem: {
	width: '34px',
	height: '34px',
	borderRadius: '9px',
	backgroundColor: '#4f7df3',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
  },
  logo: {
	color: '#ffffff',
	fontSize: '1.3rem',
	fontWeight: 800,
	margin: 0,
	letterSpacing: '-0.3px',
	whiteSpace: 'nowrap',
  },
  logoAccent: {
	color: '#4f7df3',
  },
  portalSwitcher: {
	width: '100%',
	padding: '11px 34px 11px 14px',
	borderRadius: '9px',
	border: '1px solid #263455',
	backgroundColor: '#182238',
	color: '#e7ebf5',
	fontWeight: 700,
	fontSize: '0.88rem',
	appearance: 'none',
	cursor: 'pointer',
	outline: 'none',
  },
  chevron: {
	position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
	pointerEvents: 'none', color: '#5c6a8a',
  },
  nav: {
	padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '10px',
	overflowY: 'auto', flex: 1,
  },
  navGroup: { display: 'flex', flexDirection: 'column' },
  footer: {
	padding: '16px 22px', borderTop: '1px solid #1e2a45',
  },
  footerText: { fontSize: '0.72rem', color: '#5c6a8a', fontWeight: 600 },
};