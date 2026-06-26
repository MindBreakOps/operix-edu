import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogOut, Bell, User } from 'lucide-react';

const theme = { navy: '#0f172a', royal: '#2563eb', border: '#e2e8f0', textMuted: '#64748b' };

export default function Topbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
	await supabase.auth.signOut();
	window.location.href = '/login';
  };

  return (
	<header className="no-print" style={{ height: '70px', backgroundColor: '#fff', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
	  
	  {/* قسم الإشعارات (يسار الشاشة) */}
	  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
		<button style={{ background: '#f8fafc', border: `1px solid ${theme.border}`, padding: '8px', borderRadius: '50%', cursor: 'pointer', color: theme.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
		  <Bell size={18} />
		</button>
	  </div>

	  {/* قسم المستخدم وتسجيل الخروج (يمين الشاشة) */}
	  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
		<div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
		  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: theme.navy }}>الإدارة المدرسية</p>
		  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted }} dir="ltr">{user?.email}</p>
		</div>
		<div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${theme.royal}15`, color: theme.royal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
		  <User size={20} />
		</div>
		<div style={{ width: '1px', height: '30px', backgroundColor: theme.border, margin: '0 8px' }}></div>
		<button 
		  onClick={handleLogout}
		  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, transition: 'all 0.2s' }}
		>
		  <LogOut size={16} /> خروج
		</button>
	  </div>
	</header>
  );
}