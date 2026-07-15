import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, Laptop, Building2,
  KeyRound, Eye, EyeOff, Loader2, XCircle
} from 'lucide-react';
import logo from '../../assets/logo.png';

const theme = {
  navy: '#0f172a',
  navyMid: '#1e293b',
  royal: '#2563eb',
  pencil: '#f59e0b',
  pencilDark: '#b45309',
  pencilLight: '#fef3c7',
  slate: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  textMuted: '#64748b',
  success: '#10b981',
  successLight: '#ecfdf5',
  danger: '#ef4444',
  dangerLight: '#fef2f2'
};

const OTP_LENGTH = 8;

const STEP_LABELS = ['نطاق المؤسسة', 'بيانات الدخول', 'التحقق بخطوتين'];

export default function Login() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
	if (user) navigate('/app');
  }, [user, navigate]);

  // كل مرة يظهر فيها خطأ جديد، نُشغّل تأثير الاهتزاز من جديد
  const raiseError = (message: string) => {
	setError(message);
	setShakeKey(k => k + 1);
  };

  const domainValid = domain.trim().length >= 3 && /^[a-z0-9-]+$/.test(domain.trim());
  const domainTouched = domain.trim().length > 0;

  const handleDomainSubmit = (e: React.FormEvent) => {
	e.preventDefault();
	if (!domainValid) {
	  raiseError(domain.trim().length < 3 ? 'الرجاء إدخال نطاق صحيح لمساحة العمل (٣ أحرف على الأقل).' : 'يُسمح فقط بأحرف إنجليزية صغيرة، أرقام، وشرطات.');
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
	  raiseError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const submitOtp = async (fullOtp: string) => {
	setError('');
	setIsSubmitting(true);

	try {
	  const { data, error: verifyError } = await supabase.auth.verifyOtp({
		email,
		token: fullOtp,
		type: 'email'
	  });

	  if (verifyError || !data.user) throw new Error('الرمز غير صحيح أو منتهي الصلاحية.');

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

	  setJustVerified(true);
	  setTimeout(() => { window.location.href = '/app'; }, 700);
	} catch (err: any) {
	  raiseError(err.message);
	  setOtpDigits(Array(OTP_LENGTH).fill(''));
	  otpRefs.current[0]?.focus();
	} finally {
	  setIsSubmitting(false);
	}
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
	e.preventDefault();
	const fullOtp = otpDigits.join('');
	if (fullOtp.length < OTP_LENGTH) {
	  raiseError('الرجاء إدخال الرمز كاملاً.');
	  return;
	}
	submitOtp(fullOtp);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
	const digit = value.replace(/[^0-9]/g, '').slice(-1);
	const next = [...otpDigits];
	next[index] = digit;
	setOtpDigits(next);

	if (digit && index < OTP_LENGTH - 1) {
	  otpRefs.current[index + 1]?.focus();
	}

	if (digit && index === OTP_LENGTH - 1 && next.every(d => d)) {
	  submitOtp(next.join(''));
	}
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
	if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
	  otpRefs.current[index - 1]?.focus();
	}
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
	e.preventDefault();
	const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
	if (!pasted) return;
	const next = Array(OTP_LENGTH).fill('');
	for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
	setOtpDigits(next);
	const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
	otpRefs.current[focusIndex]?.focus();
	if (pasted.length === OTP_LENGTH) submitOtp(pasted);
  };

  const focusRing = (e: React.FocusEvent<HTMLElement>) => {
	e.currentTarget.style.borderColor = theme.pencil;
	e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.pencilLight}`;
  };
  const blurRing = (e: React.FocusEvent<HTMLElement>) => {
	e.currentTarget.style.borderColor = theme.border;
	e.currentTarget.style.boxShadow = 'none';
  };

  const pressable = (bg: string, bgHover: string) => ({
	onMouseDown: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = 'scale(0.98)'; },
	onMouseUp: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = 'scale(1)'; },
	onMouseOver: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = bgHover; },
	onMouseOut: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = bg; e.currentTarget.style.transform = 'scale(1)'; },
  });

  return (
	<div style={{ minHeight: '100vh', display: 'flex', backgroundColor: theme.slate, direction: 'rtl', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

	  {/* القسم الأيمن: نموذج الدخول */}
	  <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: theme.white, position: 'relative', zIndex: 10, boxShadow: '20px 0 40px rgba(0,0,0,0.03)' }}>
		<div style={{ width: '100%', maxWidth: '420px' }}>

		  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
			<button
			  onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
			  style={styles.backButton}
			  onMouseOver={(e) => e.currentTarget.style.color = theme.navy}
			  onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}
			>
			  <ArrowRight size={16} /> {step > 1 ? 'العودة للخطوة السابقة' : 'العودة للصفحة الرئيسية'}
			</button>
		  </div>

		  {/* مؤشر مراحل تسجيل الدخول */}
		  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }} aria-label={`الخطوة ${step} من 3: ${STEP_LABELS[step - 1]}`}>
			{[1, 2, 3].map(s => (
			  <div key={s} style={{
				height: '4px', flex: 1, borderRadius: '4px',
				backgroundColor: s <= step ? theme.pencil : theme.border,
				transition: 'background-color 0.3s'
			  }} />
			))}
		  </div>

		  {step === 1 && (
			<div style={styles.animateFade} key="step1">
			  <div style={styles.logoContainer}>
				<img src={logo} alt="OPERIX Edu" style={{ height: '48px', objectFit: 'contain' }} />
				<span style={styles.logoText}>OPERIX <span style={{ color: theme.pencil }}>Edu</span></span>
			  </div>

			  <h1 style={styles.heading}>تسجيل الدخول</h1>
			  <p style={styles.subheading}>أدخل نطاق مساحة العمل الخاصة بمؤسستك التعليمية للوصول إلى النظام.</p>

			  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

			  <form onSubmit={handleDomainSubmit}>
				<label style={styles.label}>نطاق المؤسسة التعليمية</label>
				<div
				  style={{
					...styles.domainInputWrapper,
					borderColor: domainTouched ? (domainValid ? theme.success : theme.border) : theme.border
				  }}
				  onFocus={(e) => { e.currentTarget.style.borderColor = theme.pencil; e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.pencilLight}`; }}
				  onBlur={(e) => { e.currentTarget.style.borderColor = domainTouched && domainValid ? theme.success : theme.border; e.currentTarget.style.boxShadow = 'none'; }}
				>
				  <input
					type="text" required autoFocus dir="ltr"
					value={domain} onChange={(e) => { setDomain(e.target.value.toLowerCase().trim()); if (error) setError(''); }}
					style={styles.domainInput} placeholder="alnaseem"
				  />
				  {domainTouched && domainValid && <CheckCircle2 size={20} color={theme.success} style={{ marginLeft: '4px', flexShrink: 0 }} />}
				  <div style={styles.domainSuffix}>.operix.edu</div>
				</div>
				<p style={{ fontSize: '0.8rem', color: theme.textMuted, margin: '8px 2px 0 2px' }}>
				  حروف إنجليزية صغيرة وأرقام وشرطات فقط، مثال: <span style={{ fontFamily: 'monospace', color: theme.navy, fontWeight: 700 }}>alnaseem-school</span>
				</p>
				<button
				  type="submit"
				  style={styles.primaryButton}
				  {...pressable(theme.navy, theme.navyMid)}
				>
				  المتابعة
				</button>
			  </form>
			</div>
		  )}

		  {step === 2 && (
			<div style={styles.animateFade} key="step2">
			  <div style={styles.badge}><Building2 size={16} /> {domain}.operix.edu</div>
			  <h1 style={styles.heading}>بيانات الدخول</h1>
			  <p style={styles.subheading}>الرجاء إدخال البريد الإلكتروني وكلمة المرور الخاصة بك.</p>

			  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

			  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div>
				  <label style={styles.label}>البريد الإلكتروني</label>
				  <div style={{ position: 'relative' }}>
					<Mail size={20} color={theme.textMuted} style={styles.inputIcon} />
					<input
					  type="email" required dir="ltr" autoFocus
					  value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
					  style={styles.input} placeholder="admin@school.com"
					  onFocus={focusRing}
					  onBlur={blurRing}
					/>
				  </div>
				</div>

				<div>
				  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
					<label style={{ ...styles.label, marginBottom: 0 }}>كلمة المرور</label>
					<a href="#" style={{ color: theme.royal, fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none' }}>نسيت كلمة المرور؟</a>
				  </div>
				  <div style={{ position: 'relative' }}>
					<Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
					<input
					  type={showPassword ? 'text' : 'password'} required dir="ltr"
					  value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
					  style={{ ...styles.input, paddingLeft: '48px' }} placeholder="••••••••"
					  onFocus={focusRing}
					  onBlur={blurRing}
					/>
					<button
					  type="button"
					  onClick={() => setShowPassword(s => !s)}
					  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
					  style={styles.eyeToggle}
					>
					  {showPassword ? <EyeOff size={19} color={theme.textMuted} /> : <Eye size={19} color={theme.textMuted} />}
					</button>
				  </div>
				</div>

				<button
				  type="submit" disabled={isSubmitting}
				  style={{ ...styles.primaryButton, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
				  {...(!isSubmitting ? pressable(theme.navy, theme.navyMid) : {})}
				>
				  {isSubmitting && <Loader2 size={18} className="opx-spin" />}
				  {isSubmitting ? 'جاري التحقق...' : 'دخول آمن'}
				</button>
			  </form>
			</div>
		  )}

		  {step === 3 && (
			<div style={styles.animateFade} key="step3">
			  {justVerified ? (
				<div style={{ textAlign: 'center', padding: '40px 0' }}>
				  <div style={{ ...styles.iconShowcase, backgroundColor: theme.successLight, borderColor: theme.success, margin: '0 auto 24px auto' }}>
					<CheckCircle2 size={40} color={theme.success} />
				  </div>
				  <h1 style={{ ...styles.heading, fontSize: '1.8rem' }}>تم توثيق الجهاز</h1>
				  <p style={styles.subheading}>جاري تحويلك إلى لوحة التحكم...</p>
				</div>
			  ) : (
				<>
				  <div style={{ ...styles.badge, backgroundColor: theme.successLight, color: theme.success, borderColor: '#a7f3d0' }}>
					<ShieldCheck size={16} /> حماية الأجهزة غير المعروفة
				  </div>
				  <h1 style={styles.heading}>التحقق بخطوتين</h1>
				  <p style={styles.subheading}>
					لاحظنا تسجيل دخول من جهاز جديد. قمنا بإرسال رمز تحقق سري إلى بريدك الإلكتروني <strong style={{ color: theme.navy }}>{email}</strong>.
				  </p>

				  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

				  <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
					<div>
					  <label style={{ ...styles.label, textAlign: 'center', display: 'block' }}>رمز التحقق (OTP)</label>
					  <div dir="ltr" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
						{otpDigits.map((digit, i) => (
						  <input
							key={i}
							ref={(el) => { otpRefs.current[i] = el; }}
							type="text" inputMode="numeric" maxLength={1}
							value={digit}
							onChange={(e) => handleOtpDigitChange(i, e.target.value)}
							onKeyDown={(e) => handleOtpKeyDown(i, e)}
							style={{
							  width: '38px', height: '48px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 900,
							  borderRadius: '10px', border: `1.5px solid ${theme.border}`, outline: 'none',
							  backgroundColor: theme.slate, color: theme.navy, transition: 'border-color 0.15s, box-shadow 0.15s'
							}}
							onFocus={focusRing}
							onBlur={blurRing}
						  />
						))}
					  </div>
					</div>

					<button
					  type="submit" disabled={isSubmitting}
					  style={{ ...styles.primaryButton, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
					  {...(!isSubmitting ? pressable(theme.navy, theme.navyMid) : {})}
					>
					  {isSubmitting && <Loader2 size={18} className="opx-spin" />}
					  {isSubmitting ? 'جاري توثيق الجهاز...' : 'تأكيد وحفظ الجهاز'}
					</button>
				  </form>
				</>
			  )}
			</div>
		  )}
		</div>
	  </div>

	  {/* القسم الأيسر: الهوية البصرية */}
	  <div className="no-print" style={styles.visualSection}>
		<div style={styles.glowCircle1}></div>
		<div style={styles.glowCircle2}></div>
		<div className="opx-grid-pattern" style={styles.gridPattern}></div>

		<div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', textAlign: 'right' }}>

		  <div className="opx-float" style={styles.iconShowcase}>
			<Laptop size={40} color={theme.pencilDark} />
		  </div>

		  <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: theme.white, margin: '0 0 24px 0', lineHeight: 1.2, letterSpacing: '-1px' }}>
			أمان متطور، <br /><span style={{ color: theme.pencil }}>لتجربة تعليمية موثوقة.</span>
		  </h2>
		  <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '40px', maxWidth: '500px' }}>
			نظام OPERIX Edu مزود بأحدث تقنيات التحقق بخطوتين وتشفير البيانات لضمان بقاء سجلاتك الأكاديمية والمالية في أيدٍ أمينة دائماً.
		  </p>

		  <div style={{ display: 'flex', gap: '32px', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '32px', flexWrap: 'wrap' }}>
			<div className="opx-stat" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.white, fontFamily: 'monospace' }}>AAL2</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>مستوى المصادقة</span>
			</div>
			<div style={{ width: '1px', height: '40px', backgroundColor: '#1e293b' }}></div>
			<div className="opx-stat" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.white, fontFamily: 'monospace' }}>256-bit</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>تشفير البيانات</span>
			</div>
			<div style={{ width: '1px', height: '40px', backgroundColor: '#1e293b' }}></div>
			<div className="opx-stat" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.pencil, fontFamily: 'monospace' }}>99.9%</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>استقرار الخوادم</span>
			</div>
		  </div>
		</div>
	  </div>

	  <style>{`
		* { box-sizing: border-box; }

		@keyframes fadeIn {
		  from { opacity: 0; transform: translateY(10px); }
		  to { opacity: 1; transform: translateY(0); }
		}
		@keyframes opxShake {
		  10%, 90% { transform: translateX(-1px); }
		  20%, 80% { transform: translateX(2px); }
		  30%, 50%, 70% { transform: translateX(-4px); }
		  40%, 60% { transform: translateX(4px); }
		}
		@keyframes opxSpin {
		  to { transform: rotate(360deg); }
		}
		@keyframes opxFloat {
		  0%, 100% { transform: translateY(0); }
		  50% { transform: translateY(-8px); }
		}
		@keyframes opxPulse {
		  0%, 100% { opacity: 0.6; }
		  50% { opacity: 1; }
		}

		.opx-shake { animation: opxShake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
		.opx-spin { animation: opxSpin 0.8s linear infinite; }
		.opx-float { animation: opxFloat 4s ease-in-out infinite; }
		.opx-stat { transition: transform 0.2s ease; }
		.opx-stat:hover { transform: translateY(-3px); }

		@media (prefers-reduced-motion: reduce) {
		  .opx-shake, .opx-spin, .opx-float { animation: none !important; }
		}
	  `}</style>
	</div>
  );
}

// Scoped UI Styles (Merged and Cleaned)
const styles: { [key: string]: React.CSSProperties } = {
  backButton: { background: 'none', border: 'none', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', padding: 0, transition: 'color 0.2s' },
  animateFade: { animation: 'fadeIn 0.3s ease-in-out' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' },
  logoText: { fontSize: '1.4rem', fontWeight: 900, color: theme.navy, letterSpacing: '-0.3px' },
  heading: { fontSize: '2.4rem', fontWeight: 900, color: theme.navy, margin: '0 0 12px 0', letterSpacing: '-0.5px' },
  subheading: { color: theme.textMuted, margin: '0 0 32px 0', fontSize: '1.05rem', lineHeight: 1.7 },
  errorBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: theme.dangerLight, color: theme.danger, padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #fecaca', marginBottom: '24px', fontSize: '0.95rem', fontWeight: 700 },
  label: { display: 'block', fontWeight: 800, color: theme.navy, marginBottom: '10px', fontSize: '0.95rem' },
  domainInputWrapper: { display: 'flex', alignItems: 'center', border: `1.5px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s', backgroundColor: theme.slate, paddingRight: '12px' },
  domainInput: { flex: 1, padding: '16px 0 16px 16px', border: 'none', outline: 'none', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', backgroundColor: 'transparent', textAlign: 'right', color: theme.navy },
  domainSuffix: { padding: '16px 20px', backgroundColor: '#e2e8f0', color: theme.textMuted, fontWeight: 800, borderRight: `1.5px solid ${theme.border}`, fontFamily: 'monospace', fontSize: '1rem', direction: 'ltr' },
  input: { width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', fontSize: '1rem', backgroundColor: theme.slate, color: theme.navy, transition: 'border-color 0.2s, box-shadow 0.2s' },
  inputIcon: { position: 'absolute', right: '16px', top: '16px' },
  eyeToggle: { position: 'absolute', left: '14px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },
  primaryButton: { width: '100%', backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', marginTop: '24px', transition: 'background-color 0.2s, transform 0.1s', boxShadow: '0 8px 20px rgba(15,23,42,0.15)' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: theme.pencilLight, color: theme.pencilDark, padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px', border: '1px solid #fde68a' },
  visualSection: { flex: '1.2', backgroundColor: theme.navy, padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRight: `1px solid ${theme.navy}` },
  glowCircle1: { position: 'absolute', top: '-20%', left: '-10%', width: '800px', height: '800px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.royal}33 0%, transparent 70%)`, filter: 'blur(60px)', zIndex: 0 },
  glowCircle2: { position: 'absolute', bottom: '-10%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.pencil}22 0%, transparent 70%)`, filter: 'blur(40px)', zIndex: 0 },
  gridPattern: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', zIndex: 0, maskImage: 'radial-gradient(circle at 30% 40%, black, transparent 70%)' },
  iconShowcase: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pencilLight, padding: '16px', borderRadius: '20px', marginBottom: '32px', border: `1px solid ${theme.pencil}` }
};