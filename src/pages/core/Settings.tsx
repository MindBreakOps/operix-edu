import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import {
  Settings as SettingsIcon, Calendar, CheckCircle,
  Shield, Laptop, Smartphone, Trash2, ShieldAlert,
  ExternalLink, Download, Copy, Check, Plus, Inbox
} from 'lucide-react';

const theme = {
  navy: '#0f172a', royal: '#2563eb', royalDark: '#1d4ed8', slate: '#f8fafc',
  white: '#ffffff', border: '#e2e8f0', textDark: '#1e293b',
  textMuted: '#64748b', danger: '#ef4444', dangerBg: '#fef2f2',
  success: '#10b981', successBg: '#ecfdf5', royalTint: '#eff6ff'
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

const TABS = [
  { id: 'terms', label: 'الفصول الدراسية', icon: Calendar },
  { id: 'devices', label: 'الأجهزة الموثوقة', icon: Shield },
  { id: 'teacher_app', label: 'تطبيق المعلمين', icon: Smartphone },
  { id: 'general', label: 'المعلومات الأساسية', icon: SettingsIcon },
] as const;

export default function Settings() {
  const { workspace } = useTenant();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('terms');

  const [terms, setTerms] = useState<any[]>([]);
  const [termData, setTermData] = useState({ year_name: '1446-1447', term_name: 'الفصل الدراسي الأول', is_active: false });
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const currentDeviceId = localStorage.getItem('opx_device_id');

  // روابط تطبيق المعلمين
  const pwaUrl = `${window.location.origin}/teacher-app`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=H&margin=8&data=${encodeURIComponent(pwaUrl)}`;

  // ===== عرض QR Code مع شعار النظام في المنتصف =====
  // العرض على الشاشة يتم بتركيب صورتين بواسطة CSS (بدون قراءة بيانات الصورة)
  // حتى لا يتأثر بسياسات CORS الخاصة بخادم QR الخارجي.
  const [qrReady, setQrReady] = useState(false);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
	setQrReady(false);
	setQrLoadFailed(false);
	const img = new Image();
	img.onload = () => setQrReady(true);
	img.onerror = () => { setQrReady(true); setQrLoadFailed(true); };
	img.src = qrUrl;
  }, [qrUrl]);

  // يُستخدم فقط عند الضغط على "تنزيل" لدمج الشعار داخل صورة واحدة قابلة للحفظ
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadQR = async () => {
	setIsDownloading(true);
	const canvas = canvasRef.current;
	const size = 320;

	const downloadDirect = () => {
	  const link = document.createElement('a');
	  link.href = qrUrl;
	  link.target = '_blank';
	  link.rel = 'noopener noreferrer';
	  link.download = 'operix-teacher-app-qr.png';
	  document.body.appendChild(link);
	  link.click();
	  document.body.removeChild(link);
	};

	if (!canvas) { downloadDirect(); setIsDownloading(false); return; }
	const ctx = canvas.getContext('2d');
	if (!ctx) { downloadDirect(); setIsDownloading(false); return; }

	try {
	  canvas.width = size;
	  canvas.height = size;

	  const qrImg = new Image();
	  qrImg.crossOrigin = 'anonymous';
	  await new Promise<void>((resolve, reject) => {
		qrImg.onload = () => resolve();
		qrImg.onerror = () => reject(new Error('qr-load-failed'));
		qrImg.src = qrUrl;
	  });

	  ctx.clearRect(0, 0, size, size);
	  ctx.fillStyle = '#ffffff';
	  ctx.fillRect(0, 0, size, size);
	  ctx.drawImage(qrImg, 0, 0, size, size);

	  const logoImg = new Image();
	  await new Promise<void>((resolve) => {
		logoImg.onload = () => resolve();
		logoImg.onerror = () => resolve(); // نتابع بدون شعار إن تعذر تحميله
		logoImg.src = logo;
	  });

	  if (logoImg.complete && logoImg.naturalWidth > 0) {
		const logoSize = size * 0.2;
		const logoX = (size - logoSize) / 2;
		const logoY = (size - logoSize) / 2;
		const pad = 8;
		const bx = logoX - pad, by = logoY - pad, bw = logoSize + pad * 2, bh = logoSize + pad * 2;
		const radius = 14;

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(bx + radius, by);
		ctx.arcTo(bx + bw, by, bx + bw, by + bh, radius);
		ctx.arcTo(bx + bw, by + bh, bx, by + bh, radius);
		ctx.arcTo(bx, by + bh, bx, by, radius);
		ctx.arcTo(bx, by, bx + bw, by, radius);
		ctx.closePath();
		ctx.fillStyle = '#ffffff';
		ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
		ctx.shadowBlur = 6;
		ctx.fill();
		ctx.restore();

		ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
	  }

	  // قد يفشل هذا السطر تحديداً إن رفض الخادم الخارجي إرسال ترويسات CORS،
	  // حتى لو نجح تحميل الصورة نفسها على الشاشة.
	  const dataUrl = canvas.toDataURL('image/png');
	  const link = document.createElement('a');
	  link.href = dataUrl;
	  link.download = 'operix-teacher-app-qr.png';
	  document.body.appendChild(link);
	  link.click();
	  document.body.removeChild(link);
	} catch (err) {
	  // فشل الدمج (غالباً بسبب CORS) → نزّل نسخة الرمز الأصلية بدون الشعار
	  downloadDirect();
	} finally {
	  setIsDownloading(false);
	}
  };

  const handleCopyLink = async () => {
	try {
	  await navigator.clipboard.writeText(pwaUrl);
	  setLinkCopied(true);
	  setTimeout(() => setLinkCopied(false), 2000);
	} catch {
	  // نسخ احتياطي في حال رفض المتصفح صلاحية الحافظة
	  const temp = document.createElement('textarea');
	  temp.value = pwaUrl;
	  document.body.appendChild(temp);
	  temp.select();
	  document.execCommand('copy');
	  document.body.removeChild(temp);
	  setLinkCopied(true);
	  setTimeout(() => setLinkCopied(false), 2000);
	}
  };

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
	card: { backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' },
	sectionTitle: { display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px 0', color: theme.navy, fontSize: '1.05rem', fontWeight: 900 },
	sectionSubtitle: { margin: '0 0 20px 0', fontSize: '0.85rem', color: theme.textMuted, fontWeight: 500 },
	iconBadge: (bg: string, color: string) => ({ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
	input: { padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, width: '100%', fontSize: '0.9rem', color: theme.textDark, transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' as const },
	label: { fontWeight: 800, fontSize: '0.8rem', color: theme.textMuted, marginBottom: '6px', display: 'block' },
	btnPrimary: { backgroundColor: theme.royal, color: theme.white, border: 'none', padding: '11px 22px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.15s, transform 0.1s' },
	btnSecondary: { backgroundColor: theme.white, color: theme.navy, border: `1px solid ${theme.border}`, padding: '11px 22px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.15s' },
	navItem: (active: boolean) => ({
	  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px',
	  fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'background-color 0.15s, color 0.15s',
	  backgroundColor: active ? theme.royalTint : 'transparent',
	  color: active ? theme.royal : theme.textMuted,
	}),
	deviceCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: `1px solid ${theme.border}`, borderRadius: '14px', marginBottom: '12px', transition: 'border-color 0.15s, background-color 0.15s' },
	deviceIconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: theme.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
	currentBadge: { backgroundColor: theme.successBg, color: theme.success, padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #a7f3d0' },
	btnDanger: { background: theme.dangerBg, color: theme.danger, border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', flexShrink: 0 },
	emptyState: { textAlign: 'center' as const, padding: '48px 24px', color: theme.textMuted },
  };

  return (
	<div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
	  <style>{`
		@keyframes opxFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
		.opx-fade { animation: opxFadeIn 0.25s ease-out; }
		.opx-input:focus { border-color: ${theme.royal} !important; box-shadow: 0 0 0 3px ${theme.royalTint}; }
		.opx-btn-primary:hover { background-color: ${theme.royalDark} !important; }
		.opx-btn-secondary:hover { background-color: ${theme.slate} !important; }
		.opx-nav-item:hover { background-color: ${theme.slate}; }
		.opx-device-card:hover { border-color: #bfdbfe !important; }
		.opx-settings-layout { display: flex; gap: 28px; align-items: flex-start; }
		@media (max-width: 860px) {
		  .opx-settings-layout { flex-direction: column; }
		  .opx-settings-nav { width: 100% !important; display: flex !important; flex-direction: row !important; overflow-x: auto; }
		  .opx-terms-grid { grid-template-columns: 1fr !important; }
		  .opx-teacher-grid { grid-template-columns: 1fr !important; }
		}
	  `}</style>

	  <div style={{ marginBottom: '28px' }}>
		<h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.navy, margin: '0 0 6px 0' }}>الإعدادات</h1>
		<p style={{ margin: 0, color: theme.textMuted, fontSize: '0.95rem' }}>إدارة خصائص النظام والأجهزة والفصول الدراسية</p>
	  </div>

	  <div className="opx-settings-layout">
		<nav className="opx-settings-nav" style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', position: 'sticky', top: '24px' }}>
		  {TABS.map(tab => {
			const Icon = tab.icon;
			const active = activeTab === tab.id;
			return (
			  <div
				key={tab.id}
				className="opx-nav-item"
				style={styles.navItem(active)}
				onClick={() => setActiveTab(tab.id)}
			  >
				<Icon size={18} />
				{tab.label}
			  </div>
			);
		  })}
		</nav>

		<div style={{ flex: 1, minWidth: 0 }}>
		  {activeTab === 'terms' && (
			<div className="opx-terms-grid opx-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
			  <div style={styles.card}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
				  <div style={styles.iconBadge(theme.royalTint, theme.royal)}><Plus size={18} /></div>
				  <div>
					<h3 style={{ ...styles.sectionTitle, margin: 0 }}>إضافة فصل جديد</h3>
				  </div>
				</div>
				<form onSubmit={handleAddTerm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				  <div>
					<label style={styles.label}>العام الدراسي</label>
					<input className="opx-input" style={styles.input} value={termData.year_name} onChange={e => setTermData({ ...termData, year_name: e.target.value })} placeholder="مثال: 1446-1447" />
				  </div>
				  <div>
					<label style={styles.label}>اسم الفصل</label>
					<input className="opx-input" style={styles.input} value={termData.term_name} onChange={e => setTermData({ ...termData, term_name: e.target.value })} placeholder="مثال: الفصل الأول" />
				  </div>
				  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem', color: theme.textDark, cursor: 'pointer' }}>
					<input type="checkbox" checked={termData.is_active} onChange={e => setTermData({ ...termData, is_active: e.target.checked })} /> تعيين كالفصل النشط حالياً
				  </label>
				  <button type="submit" className="opx-btn-primary" style={styles.btnPrimary}>إضافة وتفعيل</button>
				</form>
			  </div>

			  <div style={styles.card}>
				<h3 style={styles.sectionTitle}><Calendar size={18} color={theme.royal} /> سجل الفصول الدراسية</h3>
				<p style={styles.sectionSubtitle}>جميع الفصول الدراسية المسجلة في مساحة العمل.</p>
				{terms.length === 0 ? (
				  <div style={styles.emptyState}>
					<Inbox size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
					<div style={{ fontWeight: 800 }}>لا توجد فصول دراسية بعد</div>
					<div style={{ fontSize: '0.85rem' }}>أضف أول فصل دراسي من النموذج المجاور.</div>
				  </div>
				) : (
				  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
					<thead>
					  <tr>
						<th style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.78rem', color: theme.textMuted, fontWeight: 800 }}>العام</th>
						<th style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.78rem', color: theme.textMuted, fontWeight: 800 }}>الفصل</th>
						<th style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, fontSize: '0.78rem', color: theme.textMuted, fontWeight: 800 }}>الحالة</th>
					  </tr>
					</thead>
					<tbody>
					  {terms.map(t => (
						<tr key={t.id}>
						  <td style={{ padding: '14px 12px', borderBottom: `1px solid ${theme.border}`, fontWeight: 800, color: theme.navy }}>{t.year_name}</td>
						  <td style={{ padding: '14px 12px', borderBottom: `1px solid ${theme.border}`, color: theme.textDark }}>{t.term_name}</td>
						  <td style={{ padding: '14px 12px', borderBottom: `1px solid ${theme.border}` }}>
							{t.is_active ? (
							  <span style={{ color: theme.success, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><CheckCircle size={16} /> نشط</span>
							) : (
							  <button onClick={() => setTermActive(t.id)} className="opx-btn-secondary" style={{ ...styles.btnSecondary, padding: '7px 14px', fontSize: '0.8rem' }}>تفعيل</button>
							)}
						  </td>
						</tr>
					  ))}
					</tbody>
				  </table>
				)}
			  </div>
			</div>
		  )}

		  {activeTab === 'devices' && (
			<div style={{ ...styles.card, maxWidth: '800px' }} className="opx-fade">
			  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
				  <div style={styles.iconBadge(theme.royalTint, theme.royal)}><Shield size={18} /></div>
				  <div>
					<h3 style={{ ...styles.sectionTitle, margin: 0 }}>الأجهزة المرتبطة بالحساب</h3>
					<p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: theme.textMuted }}>إدارة الأجهزة التي اجتازت التحقق بخطوتين (2FA) ويُسمح لها بالدخول.</p>
				  </div>
				</div>
				<ShieldAlert size={28} color={theme.royal} opacity={0.2} />
			  </div>

			  {isLoadingDevices ? (
				<div style={styles.emptyState}>
				  <div style={{ fontWeight: 800 }}>جاري جلب الأجهزة...</div>
				</div>
			  ) : (
				<div style={{ display: 'flex', flexDirection: 'column' }}>
				  {devices.map((device) => {
					const { os, browser, isMobile } = parseDevice(device.browser_info);
					const isCurrent = device.device_identifier === currentDeviceId;
					const addedDate = new Date(device.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

					return (
					  <div key={device.id} className="opx-device-card" style={{ ...styles.deviceCard, backgroundColor: isCurrent ? theme.slate : theme.white, borderColor: isCurrent ? '#bfdbfe' : theme.border }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
						  <div style={{ ...styles.deviceIconBox, backgroundColor: isCurrent ? '#dbeafe' : theme.slate, color: isCurrent ? theme.royal : theme.textMuted }}>
							{isMobile ? <Smartphone size={24} /> : <Laptop size={24} />}
						  </div>
						  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
					<div style={styles.emptyState}>
					  <Inbox size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
					  <div style={{ fontWeight: 800 }}>لا توجد أجهزة مسجلة</div>
					  <div style={{ fontSize: '0.85rem' }}>ستظهر هنا الأجهزة بعد تسجيل الدخول والتحقق منها.</div>
					</div>
				  )}
				</div>
			  )}
			</div>
		  )}

		  {activeTab === 'teacher_app' && (
			<div className="opx-teacher-grid opx-fade" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', maxWidth: '900px' }}>
			  {/* بطاقة رمز الاستجابة السريعة */}
			  <div style={{ ...styles.card, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<div style={{ width: '56px', height: '56px', backgroundColor: theme.successBg, color: theme.success, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
				  <Smartphone size={28} />
				</div>
				<h3 style={{ margin: '0 0 4px 0', color: theme.navy, fontWeight: 900 }}>امسح للوصول السريع</h3>
				<p style={{ color: theme.textMuted, fontSize: '0.82rem', margin: '0 0 20px 0' }}>وجّه كاميرا الهاتف نحو الرمز لفتح التطبيق مباشرة</p>

				<div style={{ backgroundColor: theme.slate, padding: '18px', borderRadius: '18px', border: `1px solid ${theme.border}`, position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				  {!qrReady ? (
					<div style={{ color: theme.textMuted, fontSize: '0.8rem', fontWeight: 700 }}>جاري إنشاء الرمز...</div>
				  ) : qrLoadFailed ? (
					<div style={{ color: theme.danger, fontSize: '0.8rem', fontWeight: 700, padding: '0 12px' }}>تعذّر تحميل الرمز، تحقق من الاتصال بالإنترنت</div>
				  ) : (
					<div style={{ position: 'relative', width: '184px', height: '184px' }}>
					  <img src={qrUrl} alt="رمز الاستجابة السريعة لتطبيق المعلمين" style={{ width: '184px', height: '184px', borderRadius: '8px', display: 'block' }} />
					  <div style={{
						position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
						width: '40px', height: '40px', backgroundColor: '#ffffff', borderRadius: '10px',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
					  }}>
						<img src={logo} alt="شعار OPERIX" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
					  </div>
					</div>
				  )}
				</div>
				{/* لوحة رسم مخفية تُستخدم فقط عند التنزيل لدمج الشعار داخل الصورة النهائية */}
				<canvas ref={canvasRef} style={{ display: 'none' }} />

				<div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
				  <button onClick={handleDownloadQR} disabled={!qrReady || qrLoadFailed || isDownloading} className="opx-btn-primary" style={{ ...styles.btnPrimary, flex: 1, opacity: (!qrReady || qrLoadFailed || isDownloading) ? 0.6 : 1 }}>
					<Download size={16} /> {isDownloading ? 'جاري التنزيل...' : 'تنزيل'}
				  </button>
				  <button onClick={handleCopyLink} className="opx-btn-secondary" style={{ ...styles.btnSecondary, flex: 1 }}>
					{linkCopied ? <><Check size={16} color={theme.success} /> تم النسخ</> : <><Copy size={16} /> نسخ الرابط</>}
				  </button>
				</div>
			  </div>

			  {/* بطاقة المعلومات والرابط */}
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={styles.card}>
				  <h3 style={styles.sectionTitle}><SettingsIcon size={18} color={theme.royal} /> تطبيق المعلمين للأجهزة المحمولة</h3>
				  <p style={{ color: theme.textMuted, fontSize: '0.88rem', lineHeight: '1.7', margin: '4px 0 0 0' }}>
					امسح رمز الاستجابة السريعة (QR Code) باستخدام كاميرا الهاتف المحمول للوصول إلى التطبيق، أو انسخ الرابط المباشر وشاركه مع المعلمين. التطبيق مصمم للعمل بدون إنترنت ويدعم المزامنة التلقائية عند توفر الاتصال.
				  </p>
				</div>

				<div style={styles.card}>
				  <label style={styles.label}>الرابط المباشر للتطبيق</label>
				  <div style={{ display: 'flex', gap: '8px' }}>
					<input className="opx-input" style={{ ...styles.input, backgroundColor: theme.slate, direction: 'ltr', textAlign: 'left' }} value={pwaUrl} readOnly />
					<a href={pwaUrl} target="_blank" rel="noopener noreferrer" style={{ ...styles.btnPrimary, textDecoration: 'none', whiteSpace: 'nowrap' }}>
					  فتح <ExternalLink size={16} />
					</a>
				  </div>
				</div>

				<div style={{ ...styles.card, backgroundColor: theme.royalTint, border: `1px solid #bfdbfe` }}>
				  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
					<div style={styles.iconBadge(theme.white, theme.royal)}><ShieldAlert size={18} /></div>
					<p style={{ margin: 0, fontSize: '0.82rem', color: theme.navy, lineHeight: '1.6', fontWeight: 600 }}>
					  يحمل رمز الاستجابة السريعة شعار OPERIX في مركزه، وقد تم إنشاؤه بمستوى تصحيح خطأ مرتفع (H) لضمان قابليته للمسح دائماً.
					</p>
				  </div>
				</div>
			  </div>
			</div>
		  )}

		  {activeTab === 'general' && (
			<div style={{ ...styles.card, maxWidth: '600px' }} className="opx-fade">
			  <h3 style={styles.sectionTitle}><SettingsIcon size={18} color={theme.royal} /> بيانات المنشأة</h3>
			  <p style={styles.sectionSubtitle}>معلومات مساحة العمل الحالية.</p>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div>
				  <label style={styles.label}>اسم المدرسة المعتمد</label>
				  <input style={{ ...styles.input, backgroundColor: theme.slate }} value={workspace?.name || ''} readOnly />
				</div>
				<div>
				  <label style={styles.label}>نطاق مساحة العمل (Domain)</label>
				  <input style={{ ...styles.input, backgroundColor: theme.slate }} value={workspace?.domain || ''} dir="ltr" readOnly />
				</div>
				<p style={{ fontSize: '0.82rem', color: theme.textMuted, margin: 0 }}>تعديل الاسم أو النطاق يتم من خلال بوابة الاشتراكات المركزية لـ OPERIX.</p>
			  </div>
			</div>
		  )}
		</div>
	  </div>
	</div>
  );
}