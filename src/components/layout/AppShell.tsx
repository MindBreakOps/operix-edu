import React from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, CalendarDays, 
  Wallet, Settings, ChevronRight, FileSignature
} from 'lucide-react';

export default function AppShell() {
  const { portalType } = useParams<{ portalType: string }>();
  const location = useLocation();

  // Validate the portal type. If it's invalid, you can handle a fallback here.
  const currentPortalName = getPortalDisplayName(portalType);

  const navLinks = [
	{ name: 'لوحة القيادة', path: `/app/${portalType}/dashboard`, icon: LayoutDashboard },
	{ name: 'الطلاب', path: `/app/${portalType}/students`, icon: Users },
	{ name: 'أولياء الأمور', path: `/app/${portalType}/parents`, icon: Users },
	{ name: 'الهيئة التعليمية', path: `/app/${portalType}/teachers`, icon: GraduationCap },
	{ name: 'الحضور والغياب', path: `/app/${portalType}/attendance`, icon: CalendarDays },
	{ name: 'النتائج', path: `/app/${portalType}/results`, icon: FileSignature },
	{ name: 'المالية', path: `/app/${portalType}/finance/fees`, icon: Wallet },
	{ name: 'الإعدادات', path: `/app/${portalType}/settings`, icon: Settings },
  ];

  return (
	<div style={styles.shell}>
	  {/* Sidebar - strictly hidden during print */}
	  <aside className="no-print" style={styles.sidebar}>
		<div style={styles.sidebarHeader}>
		  <h2 style={styles.logo}>OPERIX Edu</h2>
		  <span style={styles.portalBadge}>{currentPortalName}</span>
		</div>

		<nav style={styles.nav}>
		  {navLinks.map((link) => {
			const isActive = location.pathname.includes(link.path);
			return (
			  <Link 
				key={link.path} 
				to={link.path} 
				style={{
				  ...styles.navItem,
				  backgroundColor: isActive ? 'var(--color-royal)' : 'transparent',
				  color: isActive ? 'var(--color-white)' : 'var(--color-text-muted)',
				}}
			  >
				<link.icon size={20} />
				<span style={{ fontWeight: isActive ? 800 : 600 }}>{link.name}</span>
				{isActive && <ChevronRight size={16} style={{ marginRight: 'auto' }} />}
			  </Link>
			);
		  })}
		</nav>
	  </aside>

	  {/* Main Content Area */}
	  <main style={styles.mainContent}>
		<div style={styles.pageContainer}>
		  {/* React Router injects the matching page component here */}
		  <Outlet />
		</div>
	  </main>
	</div>
  );
}

// Helper to translate URL parameter to Display Name
function getPortalDisplayName(type?: string) {
  switch(type) {
	case 'kindergarten': return 'بوابة رياض الأطفال';
	case 'elementary': return 'بوابة المرحلة الابتدائية';
	case 'intermediate': return 'بوابة المرحلة المتوسطة';
	case 'secondary': return 'بوابة المرحلة الثانوية';
	default: return 'بوابة النظام';
  }
}

// Scoped layout styles mapping to CSS variables
const styles: { [key: string]: React.CSSProperties } = {
  shell: {
	display: 'flex',
	height: '100vh',
	width: '100vw',
	overflow: 'hidden',
	backgroundColor: 'var(--color-slate)',
  },
  sidebar: {
	width: '280px',
	backgroundColor: 'var(--color-white)',
	borderLeft: '1px solid var(--color-border)',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	zIndex: 10,
  },
  sidebarHeader: {
	padding: '32px 24px',
	borderBottom: '1px solid var(--color-border)',
  },
  logo: {
	color: 'var(--color-navy)',
	fontSize: '1.8rem',
	fontWeight: 900,
	margin: '0 0 8px 0',
  },
  portalBadge: {
	display: 'inline-block',
	backgroundColor: 'var(--color-slate)',
	color: 'var(--color-royal)',
	padding: '4px 12px',
	borderRadius: '20px',
	fontSize: '0.8rem',
	fontWeight: 800,
	border: '1px solid var(--color-border)',
  },
  nav: {
	padding: '24px 16px',
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
	overflowY: 'auto',
  },
  navItem: {
	display: 'flex',
	alignItems: 'center',
	gap: '12px',
	padding: '12px 16px',
	borderRadius: '8px',
	textDecoration: 'none',
	transition: 'all 0.2s ease',
  },
  mainContent: {
	flex: 1,
	overflowY: 'auto',
	overflowX: 'hidden',
	position: 'relative',
  },
  pageContainer: {
	maxWidth: '1400px',
	margin: '0 auto',
	padding: '40px',
	minHeight: '100%',
  }
};