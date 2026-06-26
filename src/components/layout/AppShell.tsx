import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const theme = {
  bg: '#f8fafc', // Slate 50
  navy: '#0f172a',
  border: '#e2e8f0',
};

export default function AppShell() {
  const { user } = useAuth();

  const handleLogout = async () => {
	await supabase.auth.signOut();
	window.location.href = '/login';
  };

  return (
	<div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
	  <Sidebar />
	  
	  <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
		{/* الشريط العلوي */}
		<header className="no-print" style={{ height: '70px', backgroundColor: '#fff', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px' }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
			<div style={{ textAlign: 'left' }}>
			  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: theme.navy }}>الإدارة المدرسية</p>
			  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }} dir="ltr">{user?.email}</p>
			</div>
			<button 
			  onClick={handleLogout}
			  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
			>
			  <LogOut size={16} /> خروج
			</button>
		  </div>
		</header>

		{/* محتوى الصفحة */}
		<div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="custom-scrollbar">
		  <Outlet />
		</div>
	  </main>
	</div>
  );
}