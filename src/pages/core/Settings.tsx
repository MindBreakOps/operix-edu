import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings as SettingsIcon, Calendar, CheckCircle, 
  Shield, Laptop, Smartphone, Trash2, ShieldAlert 
} from 'lucide-react';

const theme = { 
  navy: '#0f172a', royal: '#2563eb', slate: '#f8fafc', 
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b', 
  textMuted: '#64748b', danger: '#ef4444', dangerBg: '#fef2f2' 
};

// دالة مساعدة لتحليل User Agent وتحويله لاسم مقروء وأيقونة
const parseDevice = (userAgent: string) => {
  let os = 'جهاز غير معروف';
  let browser = 'متصفح غير معروف';
  let isMobile = false;

  if (!userAgent) return { os, browser, isMobile };

  if (/Mac OS X/.test(userAgent)) os = 'Apple Mac';
  else if (/Windows NT/.test(userAgent)) os = 'Windows PC';
  else if (/Android/.test(userAgent)) { os = 'Android'; isMobile = true; }
  else if (/iPhone|iPad|iPod/.test(userAgent)) { os = 'Apple iOS'; isMobile = true; }
  else if (/Linux/.test(userAgent)) os = 'Linux';

  if (/Edg/.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) browser = 'Google Chrome';
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari';
  else if (/Firefox/.test(userAgent)) browser = 'Mozilla Firefox';

  return { os, browser, isMobile };
};

export default function Settings() {
  const { workspace } = useTenant();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('terms');
  
  const [terms, setTerms] = useState<any[]>([]);
  const [termData, setTermData] = useState({ year_name: '1446-1447', term_name: 'الفصل الدراسي الأول', is_active: false });
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const currentDeviceId = localStorage.getItem('opx_device_id');

  const fetchTerms = async () => {
	if (!workspace) return;
	const { data } = await supabase.from('academic_terms_edu')
	  .select('*').eq('workspace_id', workspace.id)
	  .order('year_name', { ascending: false });
	if (data) setTerms(data);
  };

  const fetchDevices = async () => {
	if (!user) return;
	setIsLoadingDevices(true);
	const { data } = await supabase.from('trusted_devices')
	  .select('*')
	  .eq('user_id', user.id)
	  .order('last_used_at', { ascending: false });
	if (data) setDevices(data);
	setIsLoadingDevices(false);
  };

  useEffect(() => { 
	fetchTerms(); 
  }, [workspace]);

  useEffect(() => {
	if (activeTab === 'devices') fetchDevices();
  }, [activeTab]);

  const handleAddTerm = async (e: React.FormEvent) => {
	e.preventDefault();
	if (termData.is_active) {
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

  const handleRevokeDevice = async (id: string, isCurrentDevice: boolean) => {
	if (isCurrentDevice) {
	  const confirmLogout = window.confirm('تحذير: إزالة هذا الجهاز ستؤدي إلى تسجيل خروجك فوراً ولن تتمكن من الدخول إلا برمز تحقق جديد. هل تريد الاستمرار؟');
	  if (!confirmLogout) return;
	} else {
	  const confirmRevoke = window.confirm('هل أنت متأكد من إلغاء توثيق هذا الجهاز؟');
	  if (!confirmRevoke) return;
	}

	await supabase.from('trusted_devices').delete().eq('id', id);

	if (isCurrentDevice) {
	  localStorage.removeItem('opx_device_id');
	  await supabase.auth.signOut();
	  window.location.href = '/login';
	} else {
	  fetchDevices();
	}
  };

  const styles = {
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' },
	input: { padding: '10px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, width: '100%' },
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' },
	tab: (active: boolean) => ({ 
	  padding: '12px 24px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
	  borderBottom: active ? `3px solid ${theme.royal}` : '3px solid transparent', 
	  color: active ? theme.navy : theme.textMuted, transition: 'all 0.2s'
	}),
	deviceCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: `1px solid ${theme.border}`, borderRadius: '12px', marginBottom: '12px' },
	deviceIconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: theme.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' },
	currentBadge: { backgroundColor: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #a7f3d0' },
	btnDanger: { background: theme.dangerBg, color: theme.danger, border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }
  };

  return (
	<div style={{ padding: '20px' }}>
	  <div style={{ marginBottom: '32px' }}>
		<h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>الإعدادات</h1>
		<p style={{ margin: 0, color: theme.textMuted }}>إدارة خصائص النظام والأجهزة والفصول الدراسية</p>
	  </div>

	  <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, marginBottom: '24px', gap: '16px' }}>
		<div style={styles.tab(activeTab === 'terms')} onClick={() => setActiveTab('terms')}>
		  <Calendar size={18} /> الفصول الدراسية
		</div>
		<div style={styles.tab(activeTab === 'devices')} onClick={() => setActiveTab('devices')}>
		  <Shield size={18} /> الأجهزة الموثوقة
		</div>
		<div style={styles.tab(activeTab === 'general')} onClick={() => setActiveTab('general')}>
		  <SettingsIcon size={18} /> المعلومات الأساسية
		</div>
	  </div>

	  {activeTab === 'terms' && (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
		  <div style={styles.card}>
			<h3 style={{ marginTop: 0, color: theme.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>إضافة فصل جديد</h3>
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

	  {activeTab === 'devices' && (
		<div style={{ ...styles.card, maxWidth: '800px' }}>
		  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
			<div>
			  <h3 style={{ margin: 0, color: theme.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>الأجهزة المرتبطة بالحساب</h3>
			  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: theme.textMuted }}>إدارة الأجهزة التي اجتازت التحقق بخطوتين (2FA) ويُسمح لها بالدخول.</p>
			</div>
			<ShieldAlert size={32} color={theme.royal} opacity={0.2} />
		  </div>

		  {isLoadingDevices ? (
			<div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted, fontWeight: 800 }}>جاري جلب الأجهزة...</div>
		  ) : (
			<div style={{ display: 'flex', flexDirection: 'column' }}>
			  {devices.map((device) => {
				const { os, browser, isMobile } = parseDevice(device.browser_info);
				const isCurrent = device.device_identifier === currentDeviceId;
				const addedDate = new Date(device.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

				return (
				  <div key={device.id} style={{ ...styles.deviceCard, backgroundColor: isCurrent ? '#f8fafc' : '#ffffff', borderColor: isCurrent ? '#bfdbfe' : theme.border }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
					  <div style={{ ...styles.deviceIconBox, backgroundColor: isCurrent ? '#dbeafe' : theme.slate, color: isCurrent ? theme.royal : theme.textMuted }}>
						{isMobile ? <Smartphone size={24} /> : <Laptop size={24} />}
					  </div>
					  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						  <span style={{ fontWeight: 900, color: theme.navy, fontSize: '1.05rem' }}>{os}</span>
						  {isCurrent && <span style={styles.currentBadge}>هذا الجهاز</span>}
						</div>
						<span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 600 }}>
						  متصفح {browser} • أُضيف في {addedDate}
						</span>
					  </div>
					</div>
					
					<button 
					  onClick={() => handleRevokeDevice(device.id, isCurrent)} 
					  style={styles.btnDanger}
					>
					  <Trash2 size={16} /> إزالة
					</button>
				  </div>
				);
			  })}
			  {devices.length === 0 && (
				<div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted, fontWeight: 800 }}>لا توجد أجهزة مسجلة.</div>
			  )}
			</div>
		  )}
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