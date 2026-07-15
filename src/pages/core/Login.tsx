import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, Laptop, Building2, KeyRound } from 'lucide-react';
import logo from '../../assets/logo.png';

const theme = { 
  navy: '#0f172a', 
  navyMid: '#1e293b',
  royal: '#2563eb', 
  pencil: '#f59e0b',
  pencilLight: '#fef3c7',
  slate: '#f8fafc', 
  white: '#ffffff', 
  border: '#e2e8f0',
  textMuted: '#64748b',
  success: '#10b981'
};

export default function Login() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
	if (user) navigate('/app');
  }, [user, navigate]);

  const handleDomainSubmit = (e: React.FormEvent) => {
	e.preventDefault();
	if (domain.trim().length < 3) {
	  setError('الرجاء إدخال نطاق صحيح لمساحة العمل.');
	  return;
	}
	setError('');
	setStep(2);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setError('');
	setIsSubmitting(true);

	try {
	  // 1. Verify Credentials
	  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
	  
	  if (signInError) throw new Error('بيانات الدخول غير صحيحة أو غير مصرح لك بالدخول.');
	  if (!authData.user) throw new Error('حدث خطأ غير متوقع.');

	  // 2. Check Device Fingerprint
	  const localDeviceId = localStorage.getItem('opx_device_id');
	  
	  if (localDeviceId) {
		const { data: device } = await supabase
		  .from('trusted_devices')
		  .select('id')
		  .eq('device_identifier', localDeviceId)
		  .single();

		if (device) {
		  // Trusted device -> Proceed to app
		  window.location.href = '/app';
		  return;
		}
	  }

	  // 3. Unrecognized Device -> Trigger OTP Flow
	  await supabase.auth.signOut();
	  
	  const { error: otpError } = await supabase.auth.signInWithOtp({ email });
	  if (otpError) throw new Error('فشل إرسال رمز التحقق. حاول مرة أخرى.');

	  setStep(3);
	} catch (err: any) {
	  setError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setError('');
	setIsSubmitting(true);

	try {
	  // 1. Verify OTP (Now supports 8 digits)
	  const { data, error: verifyError } = await supabase.auth.verifyOtp({ 
		email, 
		token: otp, 
		type: 'email' 
	  });

	  if (verifyError || !data.user) throw new Error('الرمز غير صحيح أو منتهي الصلاحية.');

	  // 2. Register New Trusted Device
	  const newDeviceId = crypto.randomUUID();
	  const browserInfo = navigator.userAgent;

	  const { error: insertError } = await supabase
		.from('trusted_devices')
		.insert([{ 
		  user_id: data.user.id, 
		  device_identifier: newDeviceId,
		  browser_info: browserInfo
		}]);

	  if (insertError) console.error('Failed to register device:', insertError);
	  else localStorage.setItem('opx_device_id', newDeviceId);

	  // 3. Complete Login
	  window.location.href = '/app';
	} catch (err: any) {
	  setError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  return (
	<div style={{ minHeight: '100vh', display: 'flex', backgroundColor: theme.slate, direction: 'rtl', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
	  
	  {/* القسم الأيمن: نموذج الدخول */}
	  <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: theme.white, position: 'relative', zIndex: 10, boxShadow: '20px 0 40px rgba(0,0,0,0.03)' }}>
		<div style={{ width: '100%', maxWidth: '420px' }}>
		  
		  <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} style={styles.backButton} onMouseOver={(e) => e.currentTarget.style.color = theme.navy} onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}>
			<ArrowRight size={16} /> {step > 1 ? 'العودة للخطوة السابقة' : 'العودة للصفحة الرئيسية'}
		  </button>

		  {step === 1 && (
			<div style={styles.animateFade}>
			  <div style={styles.logoContainer}>
				<img src={logo} alt="OPERIX Edu" style={{ height: '48px', objectFit: 'contain' }} />
				<span style={styles.logoText}>OPERIX <span style={{ color: theme.pencil }}>Edu</span></span>
			  </div>
			  
			  <h1 style={styles.heading}>تسجيل الدخول</h1>
			  <p style={styles.subheading}>أدخل نطاق مساحة العمل الخاصة بمؤسستك التعليمية للوصول إلى النظام.</p>

			  {error && <div style={styles.errorBox}>{error}</div>}

			  <form onSubmit={handleDomainSubmit}>
				<label style={styles.label}>نطاق المؤسسة التعليمية</label>
				<div style={styles.domainInputWrapper}
					 onFocus={(e) => { e.currentTarget.style.borderColor = theme.pencil; e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.pencilLight}`; }}
					 onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none'; }}>
				  <input 
					type="text" required autoFocus dir="ltr"
					value={domain} onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
					style={styles.domainInput} placeholder="alnaseem"
				  />
				  <div style={styles.domainSuffix}>.operix.edu</div>
				</div>
				<button type="submit" style={styles.primaryButton}
				  onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.navyMid}
				  onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.navy}>
				  المتابعة
				</button>
			  </form>
			</div>
		  )}

		  {step === 2 && (
			<div style={styles.animateFade}>
			  <div style={styles.badge}><Building2 size={16} /> {domain}.operix.edu</div>
			  <h1 style={styles.heading}>بيانات الدخول</h1>
			  <p style={styles.subheading}>الرجاء إدخال البريد الإلكتروني وكلمة المرور الخاصة بك.</p>

			  {error && <div style={styles.errorBox}>{error}</div>}

			  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div>
				  <label style={styles.label}>البريد الإلكتروني</label>
				  <div style={{ position: 'relative' }}>
					<Mail size={20} color={theme.textMuted} style={styles.inputIcon} />
					<input 
					  type="email" required dir="ltr" autoFocus
					  value={email} onChange={(e) => setEmail(e.target.value)}
					  style={styles.input} placeholder="admin@school.com"
					  onFocus={(e) => e.currentTarget.style.borderColor = theme.pencil}
					  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
					/>
				  </div>
				</div>

				<div>
				  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
					<label style={styles.label}>كلمة المرور</label>
					<a href="#" style={{ color: theme.royal, fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none' }}>نسيت كلمة المرور؟</a>
				  </div>
				  <div style={{ position: 'relative' }}>
					<Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
					<input 
					  type="password" required dir="ltr"
					  value={password} onChange={(e) => setPassword(e.target.value)}
					  style={styles.input} placeholder="••••••••"
					  onFocus={(e) => e.currentTarget.style.borderColor = theme.pencil}
					  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
					/>
				  </div>
				</div>

				<button type="submit" disabled={isSubmitting} style={{...styles.primaryButton, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(15,23,42,0.15)'}}
				  onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.navyMid)}
				  onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.navy)}>
				  {isSubmitting ? 'جاري التحقق...' : 'دخول آمن'}
				</button>
			  </form>
			</div>
		  )}

		  {step === 3 && (
			<div style={styles.animateFade}>
			  <div style={{ ...styles.badge, backgroundColor: '#ecfdf5', color: theme.success, borderColor: '#a7f3d0' }}>
				<ShieldCheck size={16} /> حماية الأجهزة غير المعروفة
			  </div>
			  <h1 style={styles.heading}>التحقق بخطوتين</h1>
			  <p style={styles.subheading}>
				لاحظنا تسجيل دخول من جهاز جديد. قمنا بإرسال رمز تحقق سري إلى بريدك الإلكتروني <strong>{email}</strong>.
			  </p>

			  {error && <div style={styles.errorBox}>{error}</div>}

			  <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				<div>
				  <label style={{...styles.label, textAlign: 'center', display: 'block'}}>رمز التحقق (OTP)</label>
				  <div style={{ position: 'relative' }}>
					<KeyRound size={22} color={theme.textMuted} style={{ position: 'absolute', right: '20px', top: '18px' }} />
					<input 
					  type="text" required dir="ltr" autoFocus maxLength={8}
					  value={otp} onChange={(e) => setOtp(e.target.value.trim())}
					  style={{ ...styles.input, fontSize: '1.5rem', letterSpacing: '6px', textAlign: 'center', padding: '16px', fontWeight: 900 }} 
					  placeholder="00000000"
					  onFocus={(e) => e.currentTarget.style.borderColor = theme.pencil}
					  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
					/>
				  </div>
				</div>

				<button type="submit" disabled={isSubmitting} style={{...styles.primaryButton, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(15,23,42,0.15)'}}
				  onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.navyMid)}
				  onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.navy)}>
				  {isSubmitting ? 'جاري توثيق الجهاز...' : 'تأكيد وحفظ الجهاز'}
				</button>
			  </form>
			</div>
		  )}
		</div>
	  </div>

	  {/* القسم الأيسر: الهوية البصرية */}
	  <div className="no-print" style={styles.visualSection}>
		<div style={styles.glowCircle1}></div>
		<div style={styles.glowCircle2}></div>
		
		<div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', textAlign: 'right' }}>
		  
		  <div style={styles.iconShowcase}>
			<Laptop size={40} color={theme.pencilDark || '#b45309'} />
		  </div>

		  <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: theme.white, margin: '0 0 24px 0', lineHeight: 1.2, letterSpacing: '-1px' }}>
			أمان متطور، <br/><span style={{ color: theme.pencil }}>لتجربة تعليمية موثوقة.</span>
		  </h2>
		  <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '40px', maxWidth: '500px' }}>
			نظام OPERIX Edu مزود بأحدث تقنيات التحقق بخطوتين وتشفير البيانات لضمان بقاء سجلاتك الأكاديمية والمالية في أيدٍ أمينة دائماً.
		  </p>
		  
		  <div style={{ display: 'flex', gap: '32px', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '32px' }}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.white, fontFamily: 'monospace' }}>AAL2</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>مستوى المصادقة</span>
			</div>
			<div style={{ width: '1px', height: '40px', backgroundColor: '#1e293b' }}></div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.white, fontFamily: 'monospace' }}>256-bit</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>تشفير البيانات</span>
			</div>
			<div style={{ width: '1px', height: '40px', backgroundColor: '#1e293b' }}></div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.pencil, fontFamily: 'monospace' }}>99.9%</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>استقرار الخوادم</span>
			</div>
		  </div>
		</div>
	  </div>

	  <style>{`
		@keyframes fadeIn {
		  from { opacity: 0; transform: translateY(10px); }
		  to { opacity: 1; transform: translateY(0); }
		}
		* { box-sizing: border-box; }
	  `}</style>
	</div>
  );
}

// Scoped UI Styles (Merged and Cleaned)
const styles: { [key: string]: React.CSSProperties } = {
  backButton: { background: 'none', border: 'none', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '40px', fontWeight: 800, fontSize: '0.9rem', padding: 0, transition: 'color 0.2s' },
  animateFade: { animation: 'fadeIn 0.3s ease-in-out' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' },
  logoText: { fontSize: '1.4rem', fontWeight: 900, color: theme.navy, letterSpacing: '-0.3px' },
  heading: { fontSize: '2.4rem', fontWeight: 900, color: theme.navy, margin: '0 0 12px 0', letterSpacing: '-0.5px' },
  subheading: { color: theme.textMuted, margin: '0 0 32px 0', fontSize: '1.05rem', lineHeight: 1.7 },
  errorBox: { backgroundColor: '#fef2f2', color: '#ef4444', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #fecaca', marginBottom: '24px', fontSize: '0.95rem', fontWeight: 700 },
  label: { display: 'block', fontWeight: 800, color: theme.navy, marginBottom: '10px', fontSize: '0.95rem' },
  domainInputWrapper: { display: 'flex', alignItems: 'center', border: `1.5px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s', backgroundColor: theme.slate },
  domainInput: { flex: 1, padding: '16px', border: 'none', outline: 'none', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', backgroundColor: 'transparent', textAlign: 'right', color: theme.navy },
  domainSuffix: { padding: '16px 20px', backgroundColor: '#e2e8f0', color: theme.textMuted, fontWeight: 800, borderRight: `1.5px solid ${theme.border}`, fontFamily: 'monospace', fontSize: '1rem', direction: 'ltr' },
  input: { width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', fontSize: '1rem', backgroundColor: theme.slate, color: theme.navy, transition: 'border-color 0.2s' },
  inputIcon: { position: 'absolute', right: '16px', top: '16px' },
  primaryButton: { width: '100%', backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', marginTop: '24px', transition: 'all 0.2s' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: theme.pencilLight, color: '#b45309', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px', border: '1px solid #fde68a' },
  visualSection: { flex: '1.2', backgroundColor: theme.navy, padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRight: `1px solid ${theme.navy}` },
  glowCircle1: { position: 'absolute', top: '-20%', left: '-10%', width: '800px', height: '800px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.royal}33 0%, transparent 70%)`, filter: 'blur(60px)', zIndex: 0 },
  glowCircle2: { position: 'absolute', bottom: '-10%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.pencil}22 0%, transparent 70%)`, filter: 'blur(40px)', zIndex: 0 },
  iconShowcase: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pencilLight, padding: '16px', borderRadius: '20px', marginBottom: '32px', border: `1px solid ${theme.pencil}` }
};