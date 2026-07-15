import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { GraduationCap, Mail, ShieldCheck } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function TeachersEdu() {
  const { workspace } = useTenant();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
	const fetchTeachers = async () => {
	  if (!workspace) return;
	  setIsLoading(true);
	  // Fetch centralized workspace profiles (Teachers span across portals)
	  const { data } = await supabase
		.from('profiles')
		.select('*')
		.eq('workspace_id', workspace.id)
		.order('full_name');
		
	  if (data) setTeachers(data);
	  setIsLoading(false);
	};
	fetchTeachers();
  }, [workspace]);

  return (
	<PageShell 
	  title="الهيئة التعليمية" 
	  subtitle="إدارة المعلمين وموظفي النظام المرتبطين بمساحة العمل"
	  onPrint={() => window.print()}
	>
	  <div className="no-print" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px', color: '#1e3a8a', fontWeight: 800 }}>
		<ShieldCheck size={20} />
		<p style={{ margin: 0, fontSize: '0.9rem' }}>
		  يتم إضافة المعلمين الجدد وتحديد صلاحياتهم من خلال دعوات النظام في لوحة تحكم OPERIX المركزية.
		</p>
	  </div>

	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', fontWeight: 800, color: 'var(--color-text-muted)' }}>
		  جاري تحميل البيانات...
		</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>الاسم الرباعي</th>
			  <th style={styles.th}>البريد الإلكتروني</th>
			  <th style={styles.th}>الحالة الأكاديمية</th>
			</tr>
		  </thead>
		  <tbody>
			{teachers.map(t => (
			  <tr key={t.id}>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-royal)' }}>
					  <GraduationCap size={16} />
					</div>
					{t.full_name || 'مستخدم بدون اسم'}
				  </div>
				</td>
				<td style={{ ...styles.td, fontFamily: 'monospace' }} dir="ltr">
				  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
					{t.email || '---'} <Mail size={14} color="var(--color-text-muted)" />
				  </div>
				</td>
				<td style={styles.td}>
				  <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
					نشط - مسجل بالنظام
				  </span>
				</td>
			  </tr>
			))}
			{teachers.length === 0 && (
			  <tr>
				<td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
				  لا يوجد مستخدمين مسجلين.
				</td>
			  </tr>
			)}
		  </tbody>
		</table>
	  )}
	</PageShell>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600 },
};