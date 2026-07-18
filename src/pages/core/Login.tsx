import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, Building2,
  KeyRound, Eye, EyeOff, Loader2, XCircle, Send, RotateCw, ShieldAlert
} from 'lucide-react';
import logo from '../../assets/logo.png';

const theme = {
  navy: '#0f172a',
  navyDeep: '#060911',
  navyMid: '#161f34',
  navySoft: '#212c46',
  navyLine: 'rgba(255,255,255,0.08)',
  gold: '#f2a922',
  goldDark: '#b45309',
  goldLight: '#fef3c7',
  goldSoft: 'rgba(242,169,34,0.14)',
  azure: '#3b82f6',
  paper: '#fdfcfa',
  white: '#ffffff',
  border: '#e7e4de',
  borderStrong: '#d9d5cc',
  textMuted: '#6b7280',
  textFaint: '#94a3b8',
  success: '#0f9d63',
  successLight: '#ecfdf5',
  danger: '#e0374a',
  dangerLight: '#fef2f2'
};

const OTP_LENGTH = 8;
const RESEND_WAIT = 45;

const STEP_LABELS = ['نطاق المؤسسة', 'بيانات الدخول', 'التحقق بخطوتين'];
const FORGOT_STEP_LABELS = ['البريد الإلكتروني', 'رمز الاستعادة', 'كلمة مرور جديدة'];

// نمط دوائر إلكترونية دقيق يُستخدم كخلفية للمساحة الداكنة — مولّد كـ SVG وليس صورة مستوردة
const CIRCUIT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23f2a922' stroke-opacity='0.10' stroke-width='1.1'%3E%3Cpath d='M18 18 H100 V78 H190 V18'/%3E%3Cpath d='M18 140 H62 V206 H150 V162 H222'/%3E%3Cpath d='M100 78 V140'/%3E%3Cpath d='M150 162 V120 H190 V78'/%3E%3Ccircle cx='18' cy='18' r='3' fill='%23f2a922' fill-opacity='0.28'/%3E%3Ccircle cx='190' cy='18' r='3' fill='%23f2a922' fill-opacity='0.28'/%3E%3Ccircle cx='100' cy='140' r='3' fill='%23f2a922' fill-opacity='0.28'/%3E%3Ccircle cx='222' cy='162' r='3' fill='%23f2a922' fill-opacity='0.28'/%3E%3Ccircle cx='190' cy='78' r='3' fill='%23f2a922' fill-opacity='0.28'/%3E%3C/g%3E%3C/svg%3E\")";

// نسيج ورقي دقيق جداً لبطاقة النموذج حتى لا تبدو مسطّحة
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='10' cy='10' r='1' fill='%230f172a' fill-opacity='0.035'/%3E%3Ccircle cx='55' cy='40' r='1' fill='%230f172a' fill-opacity='0.03'/%3E%3Ccircle cx='95' cy='15' r='1' fill='%230f172a' fill-opacity='0.035'/%3E%3Ccircle cx='30' cy='85' r='1' fill='%230f172a' fill-opacity='0.03'/%3E%3Ccircle cx='80' cy='95' r='1' fill='%230f172a' fill-opacity='0.035'/%3E%3Ccircle cx='110' cy='60' r='1' fill='%230f172a' fill-opacity='0.03'/%3E%3C/svg%3E\")";

type PasswordStrength = { score: number; label: string; color: string };

const getPasswordStrength = (pw: string): PasswordStrength => {
  const levels: PasswordStrength[] = [
	{ score: 0, label: 'ضعيفة جداً', color: theme.danger },
	{ score: 1, label: 'ضعيفة', color: theme.danger },
	{ score: 2, label: 'مقبولة', color: theme.gold },
	{ score: 3, label: 'جيدة', color: theme.azure },
	{ score: 4, label: 'قوية جداً', color: theme.success }
  ];
  if (!pw) return levels[0];
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return levels[Math.min(score, levels.length - 1)];
};

export default function Login() {
  // ---- Font injection (Tajawal — distinct Arabic display/body pairing) ----
  useEffect(() => {
	if (document.getElementById('opx-tajawal-font')) return;
	const link = document.createElement('link');
	link.id = 'opx-tajawal-font';
	link.rel = 'stylesheet';
	link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap';
	document.head.appendChild(link);
  }, []);

  // ---- Ambient cursor spotlight / parallax ----
  const [spot, setSpot] = useState({ x: 62, y: 42 });
  const rafRef = useRef<number | null>(null);
  const handlePointerMove = useCallback((e: React.MouseEvent) => {
	if (rafRef.current) return;
	rafRef.current = requestAnimationFrame(() => {
	  const x = (e.clientX / window.innerWidth) * 100;
	  const y = (e.clientY / window.innerHeight) * 100;
	  setSpot({ x, y });
	  rafRef.current = null;
	});
  }, []);
  const driftX = (spot.x - 62) * 0.06;
  const driftY = (spot.y - 42) * 0.06;

  // ---- Ambient particles (memoized so positions don't jump on re-render) ----
  const particles = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({
	id: i,
	left: 6 + Math.random() * 88,
	size: 2 + Math.random() * 3,
	delay: Math.random() * 8,
	duration: 9 + Math.random() * 8
  })), []);

  // ---- Primary login flow state ----
  const [view, setView] = useState<'login' | 'forgot'>('login');
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
  const [resendCooldown, setResendCooldown] = useState(0);

  // ---- Forgot password flow state ----
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
	if (user) navigate('/app');
  }, [user, navigate]);

  useEffect(() => {
	if (resendCooldown <= 0) return;
	const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
	return () => clearTimeout(t);
  }, [resendCooldown]);

  // كل مرة يظهر فيها خطأ جديد، نُشغّل تأثير الاهتزاز من جديد
  const raiseError = (message: string) => {
	setError(message);
	setShakeKey(k => k + 1);
  };

  const domainValid = domain.trim().length >= 3 && /^[a-z0-9-]+$/.test(domain.trim());
  const domainTouched = domain.trim().length > 0;
  const strength = getPasswordStrength(newPassword);

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

	  setResendCooldown(RESEND_WAIT);
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

  const handleResendLoginOtp = async () => {
	if (resendCooldown > 0 || isSubmitting) return;
	setError('');
	setIsSubmitting(true);
	try {
	  const { error: otpError } = await supabase.auth.signInWithOtp({ email });
	  if (otpError) throw new Error('فشل إعادة إرسال الرمز. حاول مرة أخرى.');
	  setResendCooldown(RESEND_WAIT);
	} catch (err: any) {
	  raiseError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const makeDigitHandler = (
	digits: string[],
	setDigits: React.Dispatch<React.SetStateAction<string[]>>,
	refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
	onComplete: (val: string) => void
  ) => (index: number, value: string) => {
	const digit = value.replace(/[^0-9]/g, '').slice(-1);
	const next = [...digits];
	next[index] = digit;
	setDigits(next);

	if (digit && index < OTP_LENGTH - 1) {
	  refs.current[index + 1]?.focus();
	}
	if (digit && index === OTP_LENGTH - 1 && next.every(d => d)) {
	  onComplete(next.join(''));
	}
  };

  const makeKeyDownHandler = (
	digits: string[],
	refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
	if (e.key === 'Backspace' && !digits[index] && index > 0) {
	  refs.current[index - 1]?.focus();
	}
  };

  const makePasteHandler = (
	setDigits: React.Dispatch<React.SetStateAction<string[]>>,
	refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
	onComplete: (val: string) => void
  ) => (e: React.ClipboardEvent<HTMLInputElement>) => {
	e.preventDefault();
	const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
	if (!pasted) return;
	const next = Array(OTP_LENGTH).fill('');
	for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
	setDigits(next);
	const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
	refs.current[focusIndex]?.focus();
	if (pasted.length === OTP_LENGTH) onComplete(pasted);
  };

  const handleOtpDigitChange = makeDigitHandler(otpDigits, setOtpDigits, otpRefs, submitOtp);
  const handleOtpKeyDown = makeKeyDownHandler(otpDigits, otpRefs);
  const handleOtpPaste = makePasteHandler(setOtpDigits, otpRefs, submitOtp);

  // ---------------- Forgot password flow ----------------

  const resetForgotState = () => {
	setForgotStep(1);
	setForgotEmail('');
	setForgotOtpDigits(Array(OTP_LENGTH).fill(''));
	setNewPassword('');
	setConfirmNewPassword('');
	setShowNewPassword(false);
	setShowConfirmPassword(false);
  };

  const openForgotFlow = () => {
	setError('');
	resetForgotState();
	setForgotEmail(email);
	setView('forgot');
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setError('');
	setIsSubmitting(true);

	try {
	  const trimmedEmail = forgotEmail.trim();

	  // تأكيد وجود حساب مرتبط بهذا البريد ضمن جدول profiles
	  const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('id')
		.eq('email', trimmedEmail)
		.maybeSingle();

	  if (profileError) throw new Error('تعذر التحقق من البريد الإلكتروني. حاول مرة أخرى.');
	  if (!profile) throw new Error('لا يوجد حساب مرتبط بهذا البريد الإلكتروني.');

	  const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
	  if (resetError) throw new Error('تعذر إرسال رمز الاستعادة. حاول مرة أخرى.');

	  setResendCooldown(RESEND_WAIT);
	  setForgotStep(2);
	} catch (err: any) {
	  raiseError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const handleResendForgotOtp = async () => {
	if (resendCooldown > 0 || isSubmitting) return;
	setError('');
	setIsSubmitting(true);
	try {
	  const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
	  if (resetError) throw new Error('فشل إعادة إرسال الرمز. حاول مرة أخرى.');
	  setResendCooldown(RESEND_WAIT);
	} catch (err: any) {
	  raiseError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const submitForgotOtp = async (fullOtp: string) => {
	setError('');
	setIsSubmitting(true);
	try {
	  const { data, error: verifyError } = await supabase.auth.verifyOtp({
		email: forgotEmail.trim(),
		token: fullOtp,
		type: 'recovery'
	  });

	  if (verifyError || !data.session) throw new Error('الرمز غير صحيح أو منتهي الصلاحية.');
	  setForgotStep(3);
	} catch (err: any) {
	  raiseError(err.message);
	  setForgotOtpDigits(Array(OTP_LENGTH).fill(''));
	  forgotOtpRefs.current[0]?.focus();
	} finally {
	  setIsSubmitting(false);
	}
  };

  const handleForgotOtpSubmit = (e: React.FormEvent) => {
	e.preventDefault();
	const fullOtp = forgotOtpDigits.join('');
	if (fullOtp.length < OTP_LENGTH) {
	  raiseError('الرجاء إدخال الرمز كاملاً.');
	  return;
	}
	submitForgotOtp(fullOtp);
  };

  const handleForgotOtpDigitChange = makeDigitHandler(forgotOtpDigits, setForgotOtpDigits, forgotOtpRefs, submitForgotOtp);
  const handleForgotOtpKeyDown = makeKeyDownHandler(forgotOtpDigits, forgotOtpRefs);
  const handleForgotOtpPaste = makePasteHandler(setForgotOtpDigits, forgotOtpRefs, submitForgotOtp);

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setError('');

	if (newPassword.length < 8) {
	  raiseError('يجب ألا تقل كلمة المرور عن ٨ أحرف.');
	  return;
	}
	if (newPassword !== confirmNewPassword) {
	  raiseError('كلمتا المرور غير متطابقتين.');
	  return;
	}

	setIsSubmitting(true);
	try {
	  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
	  if (updateError) throw new Error('تعذر تحديث كلمة المرور. حاول مرة أخرى.');

	  await supabase.auth.signOut();
	  setForgotStep(4);
	} catch (err: any) {
	  raiseError(err.message);
	} finally {
	  setIsSubmitting(false);
	}
  };

  const backToLoginFromForgot = () => {
	const rememberedEmail = forgotEmail;
	resetForgotState();
	setError('');
	setEmail(rememberedEmail);
	setStep(2);
	setView('login');
  };

  const handleBack = () => {
	setError('');
	if (view === 'forgot') {
	  if (forgotStep > 1 && forgotStep < 4) setForgotStep(s => s - 1);
	  else backToLoginFromForgot();
	  return;
	}
	if (step > 1) setStep(step - 1);
	else navigate('/');
  };

  const focusRing = (e: React.FocusEvent<HTMLElement>) => {
	e.currentTarget.style.borderColor = theme.gold;
	e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.goldSoft}`;
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

  const renderStepper = (current: number, labels: string[]) => (
	<div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '30px' }} aria-label={`الخطوة ${current} من ${labels.length}: ${labels[current - 1]}`}>
	  {labels.map((label, i) => {
		const num = i + 1;
		const done = num < current;
		const active = num === current;
		return (
		  <React.Fragment key={label}>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1px' }}>
			  <div
				className={active ? 'opx-step-active' : ''}
				style={{
				  width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
				  fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, transition: 'all 0.25s ease',
				  backgroundColor: done ? theme.navy : active ? theme.gold : theme.paper,
				  color: done ? theme.white : active ? theme.navy : theme.textFaint,
				  border: `1.5px solid ${done ? theme.navy : active ? theme.gold : theme.border}`
				}}
			  >
				{done ? <CheckCircle2 size={16} /> : num}
			  </div>
			  <span style={{
				fontSize: '0.68rem', fontWeight: 700, marginTop: '8px', whiteSpace: 'nowrap',
				color: active ? theme.navy : theme.textFaint, letterSpacing: '-0.2px'
			  }}>
				{label}
			  </span>
			</div>
			{num < labels.length && (
			  <div style={{
				flex: 1, height: '1.5px', marginTop: '15px', backgroundColor: done ? theme.navy : theme.border,
				transition: 'background-color 0.25s ease'
			  }} />
			)}
		  </React.Fragment>
		);
	  })}
	</div>
  );

  const renderOtpGrid = (
	digits: string[],
	refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
	onChange: (i: number, v: string) => void,
	onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void,
	onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void
  ) => (
	<div dir="ltr" style={{ display: 'flex', gap: '7px', justifyContent: 'center', flexWrap: 'wrap' }} onPaste={onPaste}>
	  {digits.map((digit, i) => (
		<input
		  key={i}
		  ref={(el) => { refs.current[i] = el; }}
		  type="text" inputMode="numeric" maxLength={1}
		  value={digit}
		  onChange={(e) => onChange(i, e.target.value)}
		  onKeyDown={(e) => onKeyDown(i, e)}
		  className="opx-otp-cell"
		  style={{
			width: '38px', height: '48px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 900,
			fontFamily: '"JetBrains Mono", monospace',
			borderRadius: '10px', border: `1.5px solid ${theme.border}`, outline: 'none',
			backgroundColor: theme.paper, color: theme.navy, transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s'
		  }}
		  onFocus={focusRing}
		  onBlur={blurRing}
		/>
	  ))}
	</div>
  );

  const primaryBtn = (label: string, submittingLabel: string, icon?: React.ReactNode) => (
	<button
	  type="submit" disabled={isSubmitting}
	  className="opx-btn-shine"
	  style={{ ...styles.primaryButton, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.75 : 1 }}
	  {...(!isSubmitting ? pressable(theme.navy, theme.navyMid) : {})}
	>
	  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
		{isSubmitting ? <Loader2 size={18} className="opx-spin" /> : icon}
		{isSubmitting ? submittingLabel : label}
	  </span>
	</button>
  );

  const backLabel = view === 'forgot'
	? (forgotStep === 1 ? 'العودة لتسجيل الدخول' : forgotStep === 4 ? '' : 'الخطوة السابقة')
	: (step > 1 ? 'العودة للخطوة السابقة' : 'العودة للصفحة الرئيسية');

  return (
	<div onMouseMove={handlePointerMove} style={styles.page}>
	  {/* ------------ الخلفية الجوّية: تدرّج، نسيج دوائر، توهّج متحرك، جزيئات ------------ */}
	  <div style={styles.bgBase} />
	  <div className="opx-bg-texture" style={styles.bgTexture} />
	  <div style={{ ...styles.spotlight, background: `radial-gradient(720px circle at ${spot.x}% ${spot.y}%, rgba(242,169,34,0.10), transparent 62%)` }} />
	  <div className="opx-float-slow" style={{ ...styles.glowCircle1, transform: `translate(${driftX * 2}px, ${driftY * 2}px)` }} />
	  <div className="opx-float-slow-rev" style={{ ...styles.glowCircle2, transform: `translate(${-driftX * 2}px, ${-driftY * 2}px)` }} />
	  {particles.map(p => (
		<div
		  key={p.id}
		  className="opx-particle"
		  style={{
			left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`,
			animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`
		  }}
		/>
	  ))}

	  <div style={styles.stage}>

		{/* ---------------- بطاقة النموذج العائمة ---------------- */}
		<div className="opx-card-enter" style={styles.cardWrap}>
		  <div style={styles.card}>
			<div className="opx-card-texture" style={styles.cardTexture} />
			<div style={{ position: 'relative', zIndex: 1 }}>

			  {backLabel && (
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
				  <button
					onClick={handleBack}
					className="opx-back-btn"
					style={styles.backButton}
				  >
					<ArrowRight size={16} /> {backLabel}
				  </button>
				</div>
			  )}

			  {/* ---------------- LOGIN VIEW ---------------- */}
			  {view === 'login' && (
				<>
				  {renderStepper(step, STEP_LABELS)}

				  {step === 1 && (
					<div style={styles.animateFade} key="step1">
					  <div className="opx-stagger opx-d1" style={styles.logoContainer}>
						<img src={logo} alt="OPERIX Edu" style={{ height: '44px', objectFit: 'contain' }} />
						<span style={styles.logoText}>OPERIX <span style={{ color: theme.gold }}>Edu</span></span>
					  </div>

					  <h1 className="opx-stagger opx-d2" style={styles.heading}>تسجيل الدخول</h1>
					  <p className="opx-stagger opx-d3" style={styles.subheading}>أدخل نطاق مساحة العمل الخاصة بمؤسستك التعليمية للوصول إلى النظام.</p>

					  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

					  <form onSubmit={handleDomainSubmit} className="opx-stagger opx-d4">
						<label style={styles.label}>نطاق المؤسسة التعليمية</label>
						<div
						  className="opx-domain-wrap"
						  style={{
							...styles.domainInputWrapper,
							borderColor: domainTouched ? (domainValid ? theme.success : theme.border) : theme.border
						  }}
						  onFocus={(e) => { e.currentTarget.style.borderColor = theme.gold; e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.goldSoft}`; }}
						  onBlur={(e) => { e.currentTarget.style.borderColor = domainTouched && domainValid ? theme.success : theme.border; e.currentTarget.style.boxShadow = 'none'; }}
						>
						  <input
							type="text" required autoFocus dir="ltr"
							value={domain} onChange={(e) => { setDomain(e.target.value.toLowerCase().trim()); if (error) setError(''); }}
							style={styles.domainInput} placeholder="alnaseem"
						  />
						  {domainTouched && domainValid && <CheckCircle2 size={20} color={theme.success} style={{ marginLeft: '4px', flexShrink: 0 }} className="opx-pop-in" />}
						  <div style={styles.domainSuffix}>.operix.edu</div>
						</div>
						<p style={{ fontSize: '0.8rem', color: theme.textMuted, margin: '8px 2px 0 2px' }}>
						  حروف إنجليزية صغيرة وأرقام وشرطات فقط، مثال: <span style={{ fontFamily: '"JetBrains Mono", monospace', color: theme.navy, fontWeight: 700 }}>alnaseem-school</span>
						</p>
						<button type="submit" className="opx-btn-shine" style={styles.primaryButton} {...pressable(theme.navy, theme.navyMid)}>
						  <span style={{ position: 'relative', zIndex: 1 }}>المتابعة</span>
						</button>
					  </form>
					</div>
				  )}

				  {step === 2 && (
					<div style={styles.animateFade} key="step2">
					  <div className="opx-stagger opx-d1" style={styles.badge}><Building2 size={16} /> {domain}.operix.edu</div>
					  <h1 className="opx-stagger opx-d2" style={styles.heading}>بيانات الدخول</h1>
					  <p className="opx-stagger opx-d3" style={styles.subheading}>الرجاء إدخال البريد الإلكتروني وكلمة المرور الخاصة بك.</p>

					  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

					  <form onSubmit={handleLoginSubmit} className="opx-stagger opx-d4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
							<button type="button" onClick={openForgotFlow} className="opx-link-btn" style={styles.linkButton}>نسيت كلمة المرور؟</button>
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

						{primaryBtn('دخول آمن', 'جاري التحقق...', <ShieldCheck size={18} />)}
					  </form>
					</div>
				  )}

				  {step === 3 && (
					<div style={styles.animateFade} key="step3">
					  {justVerified ? (
						<div style={{ textAlign: 'center', padding: '36px 0' }}>
						  <div className="opx-pop-in" style={{ ...styles.iconShowcase, backgroundColor: theme.successLight, borderColor: theme.success, margin: '0 auto 24px auto' }}>
							<CheckCircle2 size={40} color={theme.success} />
						  </div>
						  <h1 style={{ ...styles.heading, fontSize: '1.8rem' }}>تم توثيق الجهاز</h1>
						  <p style={styles.subheading}>جاري تحويلك إلى لوحة التحكم...</p>
						</div>
					  ) : (
						<>
						  <div className="opx-stagger opx-d1" style={{ ...styles.badge, backgroundColor: theme.successLight, color: theme.success, borderColor: '#a7f3d0' }}>
							<ShieldCheck size={16} /> حماية الأجهزة غير المعروفة
						  </div>
						  <h1 className="opx-stagger opx-d2" style={styles.heading}>التحقق بخطوتين</h1>
						  <p className="opx-stagger opx-d3" style={styles.subheading}>
							لاحظنا تسجيل دخول من جهاز جديد. قمنا بإرسال رمز تحقق سري إلى بريدك الإلكتروني <strong style={{ color: theme.navy }}>{email}</strong>.
						  </p>

						  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

						  <form onSubmit={handleOtpSubmit} className="opx-stagger opx-d4" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
							<div>
							  <label style={{ ...styles.label, textAlign: 'center', display: 'block' }}>رمز التحقق (OTP)</label>
							  {renderOtpGrid(otpDigits, otpRefs, handleOtpDigitChange, handleOtpKeyDown, handleOtpPaste)}
							</div>

							<button
							  type="submit" disabled={isSubmitting} className="opx-btn-shine"
							  style={{ ...styles.primaryButton, marginTop: 0, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.75 : 1 }}
							  {...(!isSubmitting ? pressable(theme.navy, theme.navyMid) : {})}
							>
							  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
								{isSubmitting && <Loader2 size={18} className="opx-spin" />}
								{isSubmitting ? 'جاري توثيق الجهاز...' : 'تأكيد وحفظ الجهاز'}
							  </span>
							</button>

							<button
							  type="button" onClick={handleResendLoginOtp} disabled={resendCooldown > 0 || isSubmitting}
							  style={{ ...styles.ghostButton, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', opacity: resendCooldown > 0 ? 0.6 : 1 }}
							>
							  <RotateCw size={15} className={resendCooldown > 0 ? '' : 'opx-nudge'} /> {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown} ثانية` : 'إعادة إرسال الرمز'}
							</button>
						  </form>
						</>
					  )}
					</div>
				  )}
				</>
			  )}

			  {/* ---------------- FORGOT PASSWORD VIEW ---------------- */}
			  {view === 'forgot' && (
				<>
				  {forgotStep < 4 && renderStepper(forgotStep, FORGOT_STEP_LABELS)}

				  {forgotStep === 1 && (
					<div style={styles.animateFade} key="forgot1">
					  <div className="opx-stagger opx-d1" style={styles.badge}><KeyRound size={16} /> استعادة كلمة المرور</div>
					  <h1 className="opx-stagger opx-d2" style={styles.heading}>نسيت كلمة المرور؟</h1>
					  <p className="opx-stagger opx-d3" style={styles.subheading}>أدخل بريدك الإلكتروني المسجّل، وسنرسل لك رمز استعادة مكوّناً من {OTP_LENGTH} أرقام.</p>

					  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

					  <form onSubmit={handleForgotEmailSubmit} className="opx-stagger opx-d4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
						<div>
						  <label style={styles.label}>البريد الإلكتروني</label>
						  <div style={{ position: 'relative' }}>
							<Mail size={20} color={theme.textMuted} style={styles.inputIcon} />
							<input
							  type="email" required dir="ltr" autoFocus
							  value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); if (error) setError(''); }}
							  style={styles.input} placeholder="admin@school.com"
							  onFocus={focusRing}
							  onBlur={blurRing}
							/>
						  </div>
						</div>

						{primaryBtn('إرسال رمز الاستعادة', 'جاري الإرسال...', <Send size={18} />)}
					  </form>
					</div>
				  )}

				  {forgotStep === 2 && (
					<div style={styles.animateFade} key="forgot2">
					  <div className="opx-stagger opx-d1" style={styles.badge}><ShieldAlert size={16} /> تحقق أمني</div>
					  <h1 className="opx-stagger opx-d2" style={styles.heading}>أدخل رمز الاستعادة</h1>
					  <p className="opx-stagger opx-d3" style={styles.subheading}>
						أرسلنا رمزاً مكوّناً من {OTP_LENGTH} أرقام إلى <strong style={{ color: theme.navy }}>{forgotEmail}</strong>.
					  </p>

					  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

					  <form onSubmit={handleForgotOtpSubmit} className="opx-stagger opx-d4" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
						<div>
						  <label style={{ ...styles.label, textAlign: 'center', display: 'block' }}>رمز التحقق (OTP)</label>
						  {renderOtpGrid(forgotOtpDigits, forgotOtpRefs, handleForgotOtpDigitChange, handleForgotOtpKeyDown, handleForgotOtpPaste)}
						</div>

						<button
						  type="submit" disabled={isSubmitting} className="opx-btn-shine"
						  style={{ ...styles.primaryButton, marginTop: 0, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.75 : 1 }}
						  {...(!isSubmitting ? pressable(theme.navy, theme.navyMid) : {})}
						>
						  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
							{isSubmitting && <Loader2 size={18} className="opx-spin" />}
							{isSubmitting ? 'جاري التحقق...' : 'تأكيد الرمز'}
						  </span>
						</button>

						<button
						  type="button" onClick={handleResendForgotOtp} disabled={resendCooldown > 0 || isSubmitting}
						  style={{ ...styles.ghostButton, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', opacity: resendCooldown > 0 ? 0.6 : 1 }}
						>
						  <RotateCw size={15} className={resendCooldown > 0 ? '' : 'opx-nudge'} /> {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown} ثانية` : 'إعادة إرسال الرمز'}
						</button>
					  </form>
					</div>
				  )}

				  {forgotStep === 3 && (
					<div style={styles.animateFade} key="forgot3">
					  <div className="opx-stagger opx-d1" style={{ ...styles.badge, backgroundColor: theme.successLight, color: theme.success, borderColor: '#a7f3d0' }}>
						<CheckCircle2 size={16} /> تم التحقق من الرمز
					  </div>
					  <h1 className="opx-stagger opx-d2" style={styles.heading}>كلمة مرور جديدة</h1>
					  <p className="opx-stagger opx-d3" style={styles.subheading}>اختر كلمة مرور قوية لحماية حسابك. يجب ألا تقل عن ٨ أحرف.</p>

					  {error && <div key={shakeKey} className="opx-shake" style={styles.errorBox}><XCircle size={18} style={{ flexShrink: 0 }} /> {error}</div>}

					  <form onSubmit={handleNewPasswordSubmit} className="opx-stagger opx-d4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
						<div>
						  <label style={styles.label}>كلمة المرور الجديدة</label>
						  <div style={{ position: 'relative' }}>
							<Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
							<input
							  type={showNewPassword ? 'text' : 'password'} required dir="ltr" autoFocus
							  value={newPassword} onChange={(e) => { setNewPassword(e.target.value); if (error) setError(''); }}
							  style={{ ...styles.input, paddingLeft: '48px' }} placeholder="••••••••"
							  onFocus={focusRing}
							  onBlur={blurRing}
							/>
							<button
							  type="button"
							  onClick={() => setShowNewPassword(s => !s)}
							  aria-label={showNewPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
							  style={styles.eyeToggle}
							>
							  {showNewPassword ? <EyeOff size={19} color={theme.textMuted} /> : <Eye size={19} color={theme.textMuted} />}
							</button>
						  </div>
						  {newPassword && (
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
							  <div style={{ flex: 1, height: '4px', borderRadius: '4px', backgroundColor: theme.border, overflow: 'hidden' }}>
								<div style={{
								  height: '100%', borderRadius: '4px', backgroundColor: strength.color,
								  width: `${(strength.score / 4) * 100}%`, transition: 'width 0.25s ease, background-color 0.25s ease'
								}} />
							  </div>
							  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: strength.color, whiteSpace: 'nowrap' }}>{strength.label}</span>
							</div>
						  )}
						</div>

						<div>
						  <label style={styles.label}>تأكيد كلمة المرور</label>
						  <div style={{ position: 'relative' }}>
							<Lock size={20} color={theme.textMuted} style={styles.inputIcon} />
							<input
							  type={showConfirmPassword ? 'text' : 'password'} required dir="ltr"
							  value={confirmNewPassword} onChange={(e) => { setConfirmNewPassword(e.target.value); if (error) setError(''); }}
							  style={{ ...styles.input, paddingLeft: '48px' }} placeholder="••••••••"
							  onFocus={focusRing}
							  onBlur={blurRing}
							/>
							<button
							  type="button"
							  onClick={() => setShowConfirmPassword(s => !s)}
							  aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
							  style={styles.eyeToggle}
							>
							  {showConfirmPassword ? <EyeOff size={19} color={theme.textMuted} /> : <Eye size={19} color={theme.textMuted} />}
							</button>
						  </div>
						  {confirmNewPassword && confirmNewPassword !== newPassword && (
							<p style={{ fontSize: '0.78rem', color: theme.danger, fontWeight: 700, margin: '8px 2px 0 2px' }}>كلمتا المرور غير متطابقتين.</p>
						  )}
						</div>

						{primaryBtn('حفظ كلمة المرور', 'جاري الحفظ...')}
					  </form>
					</div>
				  )}

				  {forgotStep === 4 && (
					<div style={{ ...styles.animateFade, textAlign: 'center', padding: '36px 0' }} key="forgot4">
					  <div className="opx-pop-in" style={{ ...styles.iconShowcase, backgroundColor: theme.successLight, borderColor: theme.success, margin: '0 auto 24px auto' }}>
						<CheckCircle2 size={40} color={theme.success} />
					  </div>
					  <h1 style={{ ...styles.heading, fontSize: '1.8rem' }}>تم تحديث كلمة المرور</h1>
					  <p style={styles.subheading}>يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</p>
					  <button onClick={backToLoginFromForgot} className="opx-btn-shine" style={styles.primaryButton} {...pressable(theme.navy, theme.navyMid)}>
						<span style={{ position: 'relative', zIndex: 1 }}>العودة لتسجيل الدخول</span>
					  </button>
					</div>
				  )}
				</>
			  )}
			</div>
		  </div>
		</div>

		{/* ---------------- عمود الهوية البصرية ---------------- */}
		<div className="no-print opx-visual-col" style={{ ...styles.visualCol, transform: `translate(${driftX}px, ${driftY}px)` }}>

		  <div className="opx-seal-wrap" style={styles.sealWrap}>
			<div className="opx-seal-pulse" style={styles.sealPulse}></div>
			<div className="opx-seal-pulse opx-seal-pulse-delay" style={styles.sealPulse}></div>
			<div className="opx-seal-ring" style={styles.sealRing}></div>
			<div className="opx-seal-ring-rev" style={styles.sealRingRev}></div>
			<div style={styles.sealCore}>
			  <ShieldCheck size={36} color={theme.navy} strokeWidth={2.4} />
			</div>
			<div className="opx-seal-orbit">
			  <span className="opx-seal-dot" />
			</div>
		  </div>

		  <h2 className="opx-stagger opx-d1" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', fontWeight: 900, color: theme.white, margin: '0 0 22px 0', lineHeight: 1.2, letterSpacing: '-1px' }}>
			أمان متطور، <br /><span style={{ color: theme.gold, position: 'relative' }}>لتجربة تعليمية موثوقة.</span>
		  </h2>
		  <p className="opx-stagger opx-d2" style={{ fontSize: '1.1rem', color: '#9aa8c2', lineHeight: 1.8, marginBottom: '38px', maxWidth: '480px' }}>
			نظام OPERIX Edu مزود بأحدث تقنيات التحقق بخطوتين وتشفير البيانات لضمان بقاء سجلاتك الأكاديمية والمالية في أيدٍ أمينة دائماً.
		  </p>

		  <div className="opx-stagger opx-d3" style={{ display: 'flex', gap: '30px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '30px', flexWrap: 'wrap' }}>
			{[
			  { value: 'AAL2', label: 'مستوى المصادقة', gold: false },
			  { value: '256-bit', label: 'تشفير البيانات', gold: false },
			  { value: '99.9%', label: 'استقرار الخوادم', gold: true }
			].map((s) => (
			  <div className="opx-stat" key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
				<span style={{ fontSize: '2.1rem', fontWeight: 900, color: s.gold ? theme.gold : theme.white, fontFamily: '"JetBrains Mono", monospace' }}>{s.value}</span>
				<span style={{ fontSize: '0.83rem', color: '#8894ac', fontWeight: 700 }}>{s.label}</span>
				<span className="opx-stat-underline" />
			  </div>
			))}
		  </div>
		</div>
	  </div>

	  <style>{`
		* { box-sizing: border-box; }

		@keyframes fadeIn {
		  from { opacity: 0; transform: translateY(10px); }
		  to { opacity: 1; transform: translateY(0); }
		}
		@keyframes opxRise {
		  from { opacity: 0; transform: translateY(14px); }
		  to { opacity: 1; transform: translateY(0); }
		}
		@keyframes opxCardEnter {
		  from { opacity: 0; transform: translateY(22px) scale(0.98); }
		  to { opacity: 1; transform: translateY(0) scale(1); }
		}
		@keyframes opxPopIn {
		  0% { opacity: 0; transform: scale(0.6); }
		  70% { opacity: 1; transform: scale(1.08); }
		  100% { opacity: 1; transform: scale(1); }
		}
		@keyframes opxShake {
		  10%, 90% { transform: translateX(-1px); }
		  20%, 80% { transform: translateX(2px); }
		  30%, 50%, 70% { transform: translateX(-4px); }
		  40%, 60% { transform: translateX(4px); }
		}
		@keyframes opxSpin { to { transform: rotate(360deg); } }
		@keyframes opxNudge {
		  0%, 100% { transform: rotate(0deg); }
		  50% { transform: rotate(-40deg); }
		}
		@keyframes opxSealRing { to { transform: rotate(360deg); } }
		@keyframes opxSealRingRev { to { transform: rotate(-360deg); } }
		@keyframes opxSealPulse {
		  0% { transform: scale(0.85); opacity: 0.55; }
		  100% { transform: scale(1.6); opacity: 0; }
		}
		@keyframes opxOrbit { to { transform: rotate(360deg); } }
		@keyframes opxFloatSlow {
		  0%, 100% { transform: translate(0, 0); }
		  50% { transform: translate(18px, -14px); }
		}
		@keyframes opxFloatSlowRev {
		  0%, 100% { transform: translate(0, 0); }
		  50% { transform: translate(-16px, 16px); }
		}
		@keyframes opxParticleDrift {
		  0% { transform: translateY(0); opacity: 0; }
		  10% { opacity: 0.55; }
		  90% { opacity: 0.35; }
		  100% { transform: translateY(-620px); opacity: 0; }
		}
		@keyframes opxShine {
		  0% { transform: translateX(-120%) skewX(-15deg); }
		  100% { transform: translateX(220%) skewX(-15deg); }
		}

		.opx-shake { animation: opxShake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
		.opx-spin { animation: opxSpin 0.8s linear infinite; }
		.opx-pop-in { animation: opxPopIn 0.45s cubic-bezier(.34,1.56,.64,1) both; }
		.opx-card-enter { animation: opxCardEnter 0.55s cubic-bezier(.16,1,.3,1) both; }

		.opx-stagger { opacity: 0; animation: opxRise 0.5s ease both; }
		.opx-d1 { animation-delay: 0.05s; }
		.opx-d2 { animation-delay: 0.12s; }
		.opx-d3 { animation-delay: 0.19s; }
		.opx-d4 { animation-delay: 0.26s; }

		.opx-back-btn { transition: color 0.2s, transform 0.15s; }
		.opx-back-btn:hover { color: ${theme.navy}; transform: translateX(-3px); }

		.opx-link-btn { transition: color 0.2s; }
		.opx-link-btn:hover { color: ${theme.navy}; text-decoration: underline; }

		.opx-otp-cell:hover { border-color: ${theme.borderStrong}; }
		.opx-domain-wrap:hover { border-color: ${theme.borderStrong}; }

		.opx-ghost-hover:hover { color: ${theme.navy}; }

		.opx-nudge:hover { animation: opxNudge 0.5s ease; }

		.opx-btn-shine { position: relative; overflow: hidden; }
		.opx-btn-shine::after {
		  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 40%;
		  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.16), transparent);
		  transform: translateX(-120%) skewX(-15deg); pointer-events: none;
		}
		.opx-btn-shine:hover::after { animation: opxShine 0.9s ease; }

		.opx-step-active { box-shadow: 0 0 0 5px ${theme.goldSoft}; animation: opxSealPulse 1.8s ease-out infinite; }

		.opx-seal-wrap { position: relative; }
		.opx-seal-ring { animation: opxSealRing 14s linear infinite; }
		.opx-seal-ring-rev { animation: opxSealRingRev 20s linear infinite; }
		.opx-seal-pulse { animation: opxSealPulse 3s ease-out infinite; }
		.opx-seal-pulse-delay { animation-delay: 1.5s; }
		.opx-seal-orbit {
		  position: absolute; inset: -22px; animation: opxOrbit 6s linear infinite;
		}
		.opx-seal-dot {
		  position: absolute; top: 0; left: 50%; width: 6px; height: 6px; border-radius: 50%;
		  background: ${theme.gold}; box-shadow: 0 0 10px 2px ${theme.gold};
		}

		.opx-float-slow { animation: opxFloatSlow 10s ease-in-out infinite; }
		.opx-float-slow-rev { animation: opxFloatSlowRev 12s ease-in-out infinite; }

		.opx-particle {
		  position: absolute; bottom: 0; border-radius: 50%; background: ${theme.gold};
		  animation-name: opxParticleDrift; animation-timing-function: ease-in; animation-iteration-count: infinite;
		  z-index: 1; pointer-events: none;
		}

		.opx-stat { transition: transform 0.25s ease; }
		.opx-stat:hover { transform: translateY(-4px); }
		.opx-stat-underline {
		  position: absolute; bottom: -1px; right: 0; height: 2px; width: 0%;
		  background: ${theme.gold}; transition: width 0.3s ease;
		}
		.opx-stat:hover .opx-stat-underline { width: 100%; }

		input:focus { transform: translateY(-1px); }

		@media (prefers-reduced-motion: reduce) {
		  .opx-shake, .opx-spin, .opx-seal-ring, .opx-seal-ring-rev, .opx-seal-pulse, .opx-seal-orbit,
		  .opx-float-slow, .opx-float-slow-rev, .opx-particle, .opx-card-enter, .opx-pop-in, .opx-stagger,
		  .opx-step-active, .opx-btn-shine::after { animation: none !important; }
		}

		@media (max-width: 980px) {
		  .no-print { display: none !important; }
		}
	  `}</style>
	</div>
  );
}

// Scoped UI Styles
const styles: { [key: string]: React.CSSProperties } = {
  page: {
	position: 'relative', minHeight: '100vh', overflow: 'hidden', direction: 'rtl',
	fontFamily: '"Tajawal", "Segoe UI", system-ui, sans-serif',
	backgroundColor: theme.navyDeep
  },
  bgBase: {
	position: 'fixed', inset: 0, zIndex: 0,
	backgroundImage: `radial-gradient(1100px 700px at 78% 15%, ${theme.navySoft} 0%, transparent 60%), linear-gradient(155deg, ${theme.navyDeep} 0%, ${theme.navy} 55%, ${theme.navyMid} 100%)`
  },
  bgTexture: {
	position: 'fixed', inset: 0, zIndex: 0, backgroundImage: CIRCUIT_BG, backgroundSize: '240px 240px', opacity: 0.6
  },
  spotlight: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', transition: 'background 0.15s ease-out' },
  glowCircle1: { position: 'fixed', top: '-18%', left: '4%', width: '760px', height: '760px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.azure}2e 0%, transparent 70%)`, filter: 'blur(70px)', zIndex: 0 },
  glowCircle2: { position: 'fixed', bottom: '-14%', right: '6%', width: '520px', height: '520px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.gold}26 0%, transparent 70%)`, filter: 'blur(50px)', zIndex: 0 },

  stage: { position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '80px', padding: '48px', maxWidth: '1320px', margin: '0 auto', flexWrap: 'wrap' },

  cardWrap: { flex: '0 1 460px', minWidth: '340px' },
  card: {
	position: 'relative', overflow: 'hidden', backgroundColor: theme.white, borderRadius: '26px', padding: '44px 40px',
	boxShadow: '0 30px 80px rgba(3,7,18,0.55), 0 2px 0 rgba(255,255,255,0.6) inset',
	border: `1px solid rgba(255,255,255,0.6)`, borderTop: `3px solid ${theme.gold}`
  },
  cardTexture: { position: 'absolute', inset: 0, backgroundImage: PAPER_GRAIN, backgroundSize: '120px 120px', zIndex: 0, pointerEvents: 'none' },

  visualCol: { flex: '1 1 480px', maxWidth: '560px', textAlign: 'right', transition: 'transform 0.2s ease-out' },

  backButton: { background: 'none', border: 'none', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', padding: 0, fontFamily: 'inherit' },
  animateFade: { animation: 'fadeIn 0.3s ease-in-out' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' },
  logoText: { fontSize: '1.35rem', fontWeight: 900, color: theme.navy, letterSpacing: '-0.3px' },
  heading: { fontSize: '2.1rem', fontWeight: 900, color: theme.navy, margin: '0 0 12px 0', letterSpacing: '-0.5px' },
  subheading: { color: theme.textMuted, margin: '0 0 30px 0', fontSize: '1.0rem', lineHeight: 1.7 },
  errorBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: theme.dangerLight, color: theme.danger, padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #fecaca', marginBottom: '22px', fontSize: '0.93rem', fontWeight: 700 },
  label: { display: 'block', fontWeight: 800, color: theme.navy, marginBottom: '10px', fontSize: '0.9rem' },
  linkButton: { background: 'none', border: 'none', padding: 0, color: theme.goldDark, fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  domainInputWrapper: { display: 'flex', alignItems: 'center', border: `1.5px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s', backgroundColor: theme.paper, paddingRight: '12px' },
  domainInput: { flex: 1, padding: '15px 0 15px 16px', border: 'none', outline: 'none', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.02rem', backgroundColor: 'transparent', textAlign: 'right', color: theme.navy },
  domainSuffix: { padding: '15px 18px', backgroundColor: '#efece5', color: theme.textMuted, fontWeight: 800, borderRight: `1.5px solid ${theme.border}`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.92rem', direction: 'ltr' },
  input: { width: '100%', padding: '15px 16px 15px 48px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', fontSize: '0.98rem', backgroundColor: theme.paper, color: theme.navy, transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s' },
  inputIcon: { position: 'absolute', right: '16px', top: '15px' },
  eyeToggle: { position: 'absolute', left: '14px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },
  primaryButton: { width: '100%', backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 900, fontSize: '1.02rem', marginTop: '22px', transition: 'background-color 0.2s, transform 0.1s', boxShadow: '0 10px 26px rgba(15,23,42,0.28)', fontFamily: 'inherit' },
  ghostButton: { width: '100%', backgroundColor: 'transparent', color: theme.textMuted, border: `1.5px dashed ${theme.border}`, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', transition: 'color 0.2s, border-color 0.2s' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: theme.goldLight, color: theme.goldDark, padding: '8px 16px', borderRadius: '20px', fontSize: '0.83rem', fontWeight: 800, marginBottom: '22px', border: '1px solid #fde68a' },
  iconShowcase: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.goldLight, padding: '16px', borderRadius: '20px', marginBottom: '30px', border: `1px solid ${theme.gold}` },

  sealWrap: { position: 'relative', width: '100px', height: '100px', marginBottom: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sealPulse: { position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${theme.gold}55 0%, transparent 72%)` },
  sealRing: { position: 'absolute', inset: '-8px', borderRadius: '50%', border: `1.5px dashed ${theme.gold}99`, borderTopColor: 'transparent', borderLeftColor: 'transparent' },
  sealRingRev: { position: 'absolute', inset: '-16px', borderRadius: '50%', border: `1px dashed ${theme.azure}55`, borderBottomColor: 'transparent', borderRightColor: 'transparent' },
  sealCore: { position: 'relative', width: '74px', height: '74px', borderRadius: '50%', backgroundColor: theme.goldLight, border: `1px solid ${theme.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 32px rgba(0,0,0,0.4), inset 0 0 0 4px ${theme.white}`, zIndex: 1 }
};