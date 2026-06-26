import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UsersRound, CalendarCheck, 
  TableProperties, FileSignature, FileSpreadsheet, 
  ShieldAlert, Wallet, Settings, BookOpen, GraduationCap, Award
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

const theme = {
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', textLight: '#94a3b8', white: '#ffffff'
};

export default function Sidebar() {
  const { workspace } = useTenant();

  const menuGroups = [
	{
	  title: 'الرئيسية',
	  items: [
		{ to: '/app/dashboard', label: 'لوحة القيادة', icon: <LayoutDashboard size={20} /> }
	  ]
	},
	{
	  title: 'شؤون الطلاب',
	  items: [
		{ to: '/app/students', label: 'سجل الطلاب', icon: <Users size={20} /> },
		{ to: '/app/parents', label: 'أولياء الأمور', icon: <UsersRound size={20} /> },
		{ to: '/app/attendance', label: 'الحضور والغياب', icon: <CalendarCheck size={20} /> },
		{ to: '/app/behavior', label: 'السلوك والمواظبة', icon: <ShieldAlert size={20} /> },
	  ]
	},
	{
	  title: 'الشؤون الأكاديمية',
	  items: [
		{ to: '/app/subjects', label: 'المواد الدراسية', icon: <BookOpen size={20} /> },
		{ to: '/app/timetable', label: 'الجدول المدرسي', icon: <TableProperties size={20} /> },
		{ to: '/app/assignments', label: 'الواجبات والاختبارات', icon: <FileSignature size={20} /> },
		{ to: '/app/results', label: 'سجل الدرجات', icon: <FileSpreadsheet size={20} /> },
		{ to: '/app/dox-studio', label: 'منصة Dox Studio', icon: <Award size={20} /> },
	  ]
	},
	{
	  title: 'الإدارة',
	  items: [
		{ to: '/app/teachers', label: 'الهيئة التعليمية', icon: <GraduationCap size={20} /> },
		{ to: '/app/fees', label: 'الرسوم المالية', icon: <Wallet size={20} /> },
		{ to: '/app/settings', label: 'الإعدادات', icon: <Settings size={20} /> },
	  ]
	}
  ];

  return (
	<aside className="no-print" style={{ width: '280px', backgroundColor: theme.navy, color: theme.white, display: 'flex', flexDirection: 'column', height: '100vh', borderLeft: '1px solid #1e293b' }}>
	  <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
		<div style={{ width: '40px', height: '40px', backgroundColor: theme.royal, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>E</div>
		<div>
		  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>OPERIX Edu</h2>
		  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textLight }}>{workspace?.name || 'مؤسسة تعليمية'}</p>
		</div>
	  </div>

	  <nav style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }} className="custom-scrollbar">
		{menuGroups.map((group, idx) => (
		  <div key={idx} style={{ marginBottom: '24px' }}>
			<h3 style={{ fontSize: '0.75rem', color: theme.textLight, marginBottom: '12px', paddingRight: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
			  {group.title}
			</h3>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
			  {group.items.map((item, i) => (
				<NavLink
				  key={i}
				  to={item.to}
				  style={({ isActive }) => ({
					display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
					borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
					transition: 'all 0.2s',
					backgroundColor: isActive ? theme.royal : 'transparent',
					color: isActive ? theme.white : '#cbd5e1'
				  })}
				  onMouseEnter={(e) => { if (e.currentTarget.style.backgroundColor === 'transparent') e.currentTarget.style.backgroundColor = '#1e293b'; }}
				  onMouseLeave={(e) => { if (e.currentTarget.style.backgroundColor === 'rgb(30, 41, 59)') e.currentTarget.style.backgroundColor = 'transparent'; }}
				>
				  {item.icon} {item.label}
				</NavLink>
			  ))}
			</div>
		  </div>
		))}
	  </nav>
	</aside>
  );
}