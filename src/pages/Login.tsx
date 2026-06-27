import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, CheckCircle2, GraduationCap, Building2 } from 'lucide-react';
// استيراد الشعار
import logo from '../assets/logo.png';

const theme = { 
  navy: '#0f172a', 
  navyMid: '#1e293b',
  royal: '#2563eb', 
  pencil: '#f59e0b',
  pencilLight: '#fef3c7',
  slate: '#f8fafc', 
  white: '#ffffff', 
  border: '#e2e8f0',
  textMuted: '#64748b'
};

export default function Login() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
	if (user) navigate('/app/dashboard');
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

	const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

	if (signInError) {
	  setError('بيانات الدخول غير صحيحة أو غير مصرح لك بالدخول.');
	  setIsSubmitting(false);
	} else {
	  window.location.href = '/app/dashboard';
	}
  };

  return (
	<div style={{ minHeight: '100vh', display: 'flex', backgroundColor: theme.slate, direction: 'rtl', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
	  
	  {/* القسم الأيمن: نموذج الدخول */}
	  <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: theme.white }}>
		<div style={{ width: '100%', maxWidth: '420px' }}>
		  
		  <button onClick={() => step === 2 ? setStep(1) : navigate('/')} style={{ background: 'none', border: 'none', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '40px', fontWeight: 800, fontSize: '0.9rem', padding: 0, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = theme.navy} onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}>
			<ArrowRight size={16} /> {step === 2 ? 'العودة لتغيير مساحة العمل' : 'العودة للصفحة الرئيسية'}
		  </button>

		  {step === 1 ? (
			<div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
			  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
				<img src={logo} alt="OPERIX Edu" style={{ height: '48px', objectFit: 'contain' }} />
				<span style={{ fontSize: '1.4rem', fontWeight: 900, color: theme.navy, letterSpacing: '-0.3px' }}>OPERIX <span style={{ color: theme.pencil }}>Edu</span></span>
			  </div>
			  
			  <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: theme.navy, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>تسجيل الدخول</h1>
			  <p style={{ color: theme.textMuted, margin: '0 0 32px 0', fontSize: '1.05rem', lineHeight: 1.7 }}>
				أهلاً بك في منصة OPERIX Edu. الرجاء إدخال نطاق مساحة العمل الخاصة بمدرستك للبدء.
			  </p>

			  {error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #fecaca', marginBottom: '24px', fontSize: '0.95rem', fontWeight: 700 }}>{error}</div>}

			  <form onSubmit={handleDomainSubmit}>
				<label style={{ display: 'block', fontWeight: 800, color: theme.navy, marginBottom: '10px', fontSize: '0.95rem' }}>نطاق المؤسسة التعليمية</label>
				<div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s', backgroundColor: theme.slate }}
					 onFocus={(e) => { e.currentTarget.style.borderColor = theme.pencil; e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.pencilLight}`; }}
					 onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none'; }}>
				  <input 
					type="text" 
					required autoFocus dir="ltr"
					value={domain}
					onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
					style={{ flex: 1, padding: '16px', border: 'none', outline: 'none', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', backgroundColor: 'transparent', textAlign: 'right', color: theme.navy }} 
					placeholder="alnaseem"
				  />
				  <div style={{ padding: '16px 20px', backgroundColor: '#e2e8f0', color: theme.textMuted, fontWeight: 800, borderRight: `1.5px solid ${theme.border}`, fontFamily: 'monospace', fontSize: '1rem', direction: 'ltr' }}>
					.operix.edu
				  </div>
				</div>
				<button type="submit" style={{ width: '100%', backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', marginTop: '24px', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(15,23,42,0.15)' }}
				  onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.navyMid}
				  onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.navy}>
				  المتابعة
				</button>
			  </form>
			</div>
		  ) : (
			<div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
			  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: theme.pencilLight, color: theme.pencilDark, padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px', border: '1px solid #fde68a' }}>
				<CheckCircle2 size={16} /> مساحة العمل: {domain}.operix.edu
			  </div>
			  <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: theme.navy, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>بيانات الدخول</h1>
			  <p style={{ color: theme.textMuted, margin: '0 0 32px 0', fontSize: '1.05rem' }}>الرجاء إدخال البريد الإلكتروني وكلمة المرور الخاصة بك.</p>

			  {error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #fecaca', marginBottom: '24px', fontSize: '0.95rem', fontWeight: 700 }}>{error}</div>}

			  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div>
				  <label style={{ display: 'block', fontWeight: 800, color: theme.navy, marginBottom: '10px', fontSize: '0.95rem' }}>البريد الإلكتروني</label>
				  <div style={{ position: 'relative' }}>
					<Mail size={20} color={theme.textMuted} style={{ position: 'absolute', right: '16px', top: '16px' }} />
					<input 
					  type="email" required dir="ltr" autoFocus
					  value={email} onChange={(e) => setEmail(e.target.value)}
					  style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', fontSize: '1rem', backgroundColor: theme.slate, color: theme.navy, transition: 'border-color 0.2s' }} 
					  placeholder="admin@school.com"
					  onFocus={(e) => e.currentTarget.style.borderColor = theme.pencil}
					  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
					/>
				  </div>
				</div>

				<div>
				  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
					<label style={{ fontWeight: 800, color: theme.navy, fontSize: '0.95rem' }}>كلمة المرور</label>
					<a href="#" style={{ color: theme.royal, fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none' }}>نسيت كلمة المرور؟</a>
				  </div>
				  <div style={{ position: 'relative' }}>
					<Lock size={20} color={theme.textMuted} style={{ position: 'absolute', right: '16px', top: '16px' }} />
					<input 
					  type="password" required dir="ltr"
					  value={password} onChange={(e) => setPassword(e.target.value)}
					  style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', fontSize: '1rem', backgroundColor: theme.slate, color: theme.navy, transition: 'border-color 0.2s' }} 
					  placeholder="••••••••"
					  onFocus={(e) => e.currentTarget.style.borderColor = theme.pencil}
					  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
					/>
				  </div>
				</div>

				<button 
				  type="submit" disabled={isSubmitting}
				  style={{ backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '12px', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(15,23,42,0.15)' }}
				  onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.navyMid)}
				  onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.navy)}
				>
				  {isSubmitting ? 'جاري التحقق...' : 'دخول آمن'}
				</button>
			  </form>
			</div>
		  )}
		</div>
	  </div>

	  {/* القسم الأيسر: الهوية البصرية */}
	  <div className="no-print" style={{ flex: '1.2', backgroundColor: theme.navy, padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRight: `1px solid ${theme.navy}` }}>
		<div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '800px', height: '800px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.royal}33 0%, transparent 70%)`, filter: 'blur(60px)', zIndex: 0 }}></div>
		<div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.pencil}22 0%, transparent 70%)`, filter: 'blur(40px)', zIndex: 0 }}></div>
		
		<div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', textAlign: 'right' }}>
		  
		  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pencilLight, padding: '16px', borderRadius: '20px', marginBottom: '32px', border: `1px solid ${theme.pencil}` }}>
			<GraduationCap size={40} color={theme.pencilDark} />
		  </div>

		  <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: theme.white, margin: '0 0 24px 0', lineHeight: 1.2, letterSpacing: '-1px' }}>
			بناء جيل واعٍ <br/><span style={{ color: theme.pencil }}>يبدأ بإدارة مُحكمة.</span>
		  </h2>
		  <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '40px', maxWidth: '500px' }}>
			نظام OPERIX Edu يوفر لك أدوات سحابية متقدمة لحماية بيانات طلابك، ومتابعة أدائهم الأكاديمي، وتنظيم المنشأة بمنتهى الدقة.
		  </p>
		  
		  <div style={{ display: 'flex', gap: '32px', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '32px' }}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.white, fontFamily: 'monospace' }}>41</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>مبادرة رقمية</span>
			</div>
			<div style={{ width: '1px', height: '40px', backgroundColor: '#1e293b' }}></div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme.white, fontFamily: 'monospace' }}>5+</span>
			  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700 }}>أنظمة أساسية</span>
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