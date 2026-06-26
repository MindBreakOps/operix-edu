import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Printer, GraduationCap, Mail, ShieldCheck } from 'lucide-react';

const theme = { navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b' };

export default function TeachersEdu() {
  const { workspace } = useTenant();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
	const fetchTeachers = async () => {
	  if (!workspace) return;
	  setIsLoading(true);
	  // جلب المستخدمين (المعلمين) من جدول profiles المرتبطين بمساحة العمل
	  const { data } = await supabase.from('profiles').select('*').eq('workspace_id', workspace.id).order('full_name');
	  if (data) setTeachers(data);
	  setIsLoading(false);
	};
	fetchTeachers();
  }, [workspace]);

  const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
	btnSecondary: { backgroundColor: theme.white, color: theme.navy, border: `1px solid ${theme.border}`, padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
	th: { backgroundColor: theme.slate, color: theme.textMuted, fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right' as const, borderBottom: `1px solid ${theme.border}` },
	td: { padding: '16px', borderBottom: `1px solid ${theme.border}`, color: theme.textDark, fontWeight: 600 },
  };

  return (
	<div>
	  <style>{`@media print { body * { visibility: hidden; } #printable-area, #printable-area * { visibility: visible; } #printable-area { position: absolute; left: 0; top: 0; width: 100%; direction: rtl; } .no-print { display: none !important; } }`}</style>
	  
	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>الهيئة التعليمية</h1>
		  <p style={{ margin: 0, color: theme.textMuted }}>إدارة المعلمين وموظفي النظام المرتبطين بمساحة العمل</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}><Printer size={18} /> طباعة الكشف</button>
		</div>
	  </div>

	  <div className="no-print" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#1e3a8a', fontWeight: 800 }}>
		<ShieldCheck size={20} />
		<p style={{ margin: 0, fontSize: '0.9rem' }}>يتم إضافة المعلمين الجدد وتحديد صلاحياتهم من خلال دعوات النظام في لوحة تحكم OPERIX المركزية.</p>
	  </div>

	  <div id="printable-area" style={styles.card}>
		{isLoading ? <div style={{ padding: '40px', textAlign: 'center', fontWeight: 800, color: theme.textMuted }}>جاري تحميل البيانات...</div> : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead><tr><th style={styles.th}>الاسم الرباعي</th><th style={styles.th}>البريد الإلكتروني</th><th style={styles.th}>الحالة الأكاديمية</th></tr></thead>
			<tbody>
			  {teachers.map(t => (
				<tr key={t.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: theme.navy }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.royal }}><GraduationCap size={16} /></div>
					  {t.full_name || 'مستخدم بدون اسم'}
					</div>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }} dir="ltr">
					<div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
					  {t.email || '---'} <Mail size={14} color={theme.textMuted} />
					</div>
				  </td>
				  <td style={styles.td}><span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>نشط - مسجل بالنظام</span></td>
				</tr>
			  ))}
			  {teachers.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontWeight: 800 }}>لا يوجد مستخدمين مسجلين.</td></tr>}
			</tbody>
		  </table>
		)}
	  </div>
	</div>
  );
}