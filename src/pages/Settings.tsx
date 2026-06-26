import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Settings as SettingsIcon, Calendar, CheckCircle } from 'lucide-react';

const theme = { navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', textMuted: '#64748b' };

export default function Settings() {
  const { workspace } = useTenant();
  const [terms, setTerms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('terms');
  
  const [termData, setTermData] = useState({ year_name: '1446-1447', term_name: 'الفصل الدراسي الأول', is_active: false });

  const fetchTerms = async () => {
	if (!workspace) return;
	const { data } = await supabase.from('academic_terms_edu').select('*').eq('workspace_id', workspace.id).order('year_name', { ascending: false });
	if (data) setTerms(data);
  };

  useEffect(() => { fetchTerms(); }, [workspace]);

  const handleAddTerm = async (e: React.FormEvent) => {
	e.preventDefault();
	if (termData.is_active) {
	  // إلغاء تفعيل الفصول السابقة
	  await supabase.from('academic_terms_edu').update({ is_active: false }).eq('workspace_id', workspace?.id);
	}
	await supabase.from('academic_terms_edu').insert([{ ...termData, workspace_id: workspace?.id }]);
	fetchTerms();
  };

  const setTermActive = async (id: string) => {
	await supabase.from('academic_terms_edu').update({ is_active: false }).eq('workspace_id', workspace?.id);
	await supabase.from('academic_terms_edu').update({ is_active: true }).eq('id', id);
	fetchTerms();
  };

  const styles = {
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' },
	input: { padding: '10px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, width: '100%' },
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' },
	tab: (active: boolean) => ({ padding: '12px 24px', fontWeight: 800, cursor: 'pointer', borderBottom: active ? `3px solid ${theme.royal}` : '3px solid transparent', color: active ? theme.navy : theme.textMuted })
  };

  return (
	<div>
	  <div style={{ marginBottom: '32px' }}>
		<h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>الإعدادات</h1>
		<p style={{ margin: 0, color: theme.textMuted }}>إدارة خصائص النظام والفصول الدراسية</p>
	  </div>

	  <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, marginBottom: '24px' }}>
		<div style={styles.tab(activeTab === 'terms')} onClick={() => setActiveTab('terms')}>الفصول الدراسية</div>
		<div style={styles.tab(activeTab === 'general')} onClick={() => setActiveTab('general')}>المعلومات الأساسية</div>
	  </div>

	  {activeTab === 'terms' && (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
		  <div style={styles.card}>
			<h3 style={{ marginTop: 0, color: theme.navy, display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} /> إضافة فصل جديد</h3>
			<form onSubmit={handleAddTerm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			  <div><label style={{ fontWeight: 800, fontSize: '0.85rem' }}>العام الدراسي</label><input style={styles.input} value={termData.year_name} onChange={e => setTermData({...termData, year_name: e.target.value})} placeholder="مثال: 2025-2026" /></div>
			  <div><label style={{ fontWeight: 800, fontSize: '0.85rem' }}>اسم الفصل</label><input style={styles.input} value={termData.term_name} onChange={e => setTermData({...termData, term_name: e.target.value})} placeholder="مثال: الفصل الأول" /></div>
			  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, cursor: 'pointer' }}>
				<input type="checkbox" checked={termData.is_active} onChange={e => setTermData({...termData, is_active: e.target.checked})} /> تعيين كالفصل النشط حالياً
			  </label>
			  <button type="submit" style={styles.btnPrimary}>إضافة وتفعيل</button>
			</form>
		  </div>

		  <div style={styles.card}>
			<h3 style={{ marginTop: 0, color: theme.navy }}>سجل الفصول الدراسية</h3>
			<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
			  <thead><tr><th style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>العام</th><th style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>الفصل</th><th style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>الحالة</th></tr></thead>
			  <tbody>
				{terms.map(t => (
				  <tr key={t.id}>
					<td style={{ padding: '12px', borderBottom: `1px solid ${theme.border}`, fontWeight: 800 }}>{t.year_name}</td>
					<td style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>{t.term_name}</td>
					<td style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
					  {t.is_active ? (
						<span style={{ color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={16} /> نشط</span>
					  ) : (
						<button onClick={() => setTermActive(t.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.slate, cursor: 'pointer', fontWeight: 800 }}>تفعيل</button>
					  )}
					</td>
				  </tr>
				))}
			  </tbody>
			</table>
		  </div>
		</div>
	  )}

	  {activeTab === 'general' && (
		<div style={{ ...styles.card, maxWidth: '600px' }}>
		  <h3 style={{ marginTop: 0, color: theme.navy, display: 'flex', alignItems: 'center', gap: '8px' }}><SettingsIcon size={20} /> بيانات المنشأة</h3>
		  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<div><label style={{ fontWeight: 800, fontSize: '0.85rem' }}>اسم المدرسة المعتمد</label><input style={{...styles.input, backgroundColor: '#f1f5f9'}} value={workspace?.name || ''} readOnly /></div>
			<div><label style={{ fontWeight: 800, fontSize: '0.85rem' }}>نطاق مساحة العمل (Domain)</label><input style={{...styles.input, backgroundColor: '#f1f5f9'}} value={workspace?.domain || ''} dir="ltr" readOnly /></div>
			<p style={{ fontSize: '0.85rem', color: theme.textMuted }}>تعديل الاسم أو النطاق يتم من خلال بوابة الاشتراكات المركزية لـ OPERIX.</p>
		  </div>
		</div>
	  )}
	</div>
  );
}