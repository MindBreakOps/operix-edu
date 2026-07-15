import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function PortalLayout() {
  return (
	<div style={styles.layoutRoot}>
	  
	  {/* SIDEBAR INJECTION */}
	  <Sidebar />

	  {/* MAIN CONTENT WRAPPER */}
	  <div style={styles.mainWrapper}>
		
		{/* TOPBAR INJECTION */}
		<Topbar />

		{/* DYNAMIC PAGE INJECTION */}
		<main style={styles.scrollableContent}>
		  <div className="page-bounds" style={styles.pageBounds}>
			<Outlet />
		  </div>
		</main>

	  </div>

	</div>
  );
}

// Master Layout Engine mapping to Global Variables
const styles: { [key: string]: React.CSSProperties } = {
  layoutRoot: {
	display: 'flex',
	height: '100vh',
	width: '100vw',
	overflow: 'hidden',
	backgroundColor: 'var(--color-slate)', // Native background fallbacks
  },
  mainWrapper: {
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	height: '100vh',
	overflow: 'hidden',
	position: 'relative',
  },
  scrollableContent: {
	flex: 1,
	overflowY: 'auto',
	overflowX: 'hidden',
	backgroundColor: 'var(--color-slate)',
  },
  pageBounds: {
	maxWidth: '1400px', // Prevents UI stretching on ultra-wide monitors
	margin: '0 auto',
	padding: '40px',
	minHeight: '100%',
  }
};