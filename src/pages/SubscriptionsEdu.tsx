import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, X, Globe, Mail, Phone, FileText, ExternalLink, 
  HelpCircle, ShieldCheck, ChevronLeft, GraduationCap, Building 
} from 'lucide-react';
import logo from '../assets/logo.png'; // Make sure this path matches your project

const OPS_API = 'https://script.google.com/macros/s/AKfycbxzwlFPfOFiUS5atnjkAuXDcr-L_-LSY33_S9d6t12P36qmTWthc00ywCKpReFxzLY/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';

const theme = { 
  navy: '#0f172a', 
  royal: '#2563eb', 
  slate: '#f8fafc', 
  white: '#ffffff', 
  border: '#e2e8f0', 
  textMuted: '#64748b',
  success: '#10b981',
  danger: '#ef4444'
};

const gasCall = async (payload: any) => {
  try {
	await fetch(OPS_API, {
	  method: 'POST', mode: 'no-cors', cache: 'no-cache',
	  headers: { 'Content-Type': 'text/plain' },
	  body: JSON.stringify(payload)
	});
	return { success: true };
  } catch (e) {
	return { success: false };
  }
};

// ─── TRANSLATIONS ───
const translations = {
  en: {
	title: "Simple, Transparent Pricing",
	subtitle: "Choose the perfect plan for your educational institution. All plans include continuous updates and technical support.",
	monthly: "Monthly",
	annual: "Annually (Save 20%)",
	currencySAR: "SAR",
	currencyUSD: "USD",
	vatNote: "Prices exclude 15% VAT. Fully compliant with ZATCA Phase 1 & 2.",
	usdNote: "International pricing. VAT may apply based on your jurisdiction.",
	popular: "Most Popular",
	startBtn: "Get Started",
	demoBtn: "Request Custom Quote",
	// Modals
	modalTitle: "Request a Demo / Quote",
	modalSub: "Fill out your school's details and our academic systems team will contact you.",
	submit: "Send Request",
	submitting: "Sending...",
	supportTitle: "Support Center",
	supportSub: "We're here to help you 24/7. Reach out via any channel below.",
	termsTitle: "Terms of Use & Privacy Policy",
	termsEffective: "Effective Date: January 1, 2026",
	termsClose: "I Understand",
  },
  ar: {
	title: "أسعار بسيطة وشفافة",
	subtitle: "اختر الباقة الأنسب لمنشأتك التعليمية. جميع الباقات تشمل التحديثات المستمرة والدعم الفني.",
	monthly: "شهري",
	annual: "سنوي (توفير 20%)",
	currencySAR: "ر.س",
	currencyUSD: "دولار",
	vatNote: "الأسعار لا تشمل ضريبة القيمة المضافة 15%. النظام متوافق كلياً مع متطلبات هيئة الزكاة والضريبة والجمارك (فاتورة المرحلة الأولى والثانية).",
	usdNote: "تسعير دولي. قد تُطبق الضرائب المحلية حسب دولتك.",
	popular: "الأكثر طلباً",
	startBtn: "ابدأ الآن",
	demoBtn: "طلب عرض سعر خاص",
	// Modals
	modalTitle: "طلب عرض تجريبي",
	modalSub: "أدخل بيانات المدرسة وسيتواصل معك فريق الأنظمة الأكاديمية قريباً.",
	submit: "إرسال الطلب",
	submitting: "جاري الإرسال...",
	supportTitle: "مركز الدعم",
	supportSub: "نحن هنا لمساعدتك على مدار الساعة. تواصل معنا عبر أي قناة أدناه.",
	termsTitle: "شروط الاستخدام وسياسة الخصوصية",
	termsEffective: "تاريخ السريان: 1 يناير 2026",
	termsClose: "أوافق",
  }
};

// ─── PRICING DATA ───
const pricingPlans = [
  {
	id: 'basic',
	nameAr: 'الأساسية',
	nameEn: 'Basic',
	descAr: 'للمدارس الناشئة ورياض الأطفال',
	descEn: 'For emerging schools & kindergartens',
	monthlyPriceSAR: 499,
	annualPriceSAR: 4790,
	monthlyPriceUSD: 135,
	annualPriceUSD: 1290,
	featuresAr: ['سجلات الطلاب (حتى 200 طالب)', 'الحضور والانصراف الأساسي', 'بوابة أولياء الأمور', 'دعم فني عبر البريد'],
	featuresEn: ['Student Records (up to 200)', 'Basic Attendance Tracking', 'Parents Portal', 'Email Support'],
	isPopular: false
  },
  {
	id: 'pro',
	nameAr: 'الاحترافية',
	nameEn: 'Professional',
	descAr: 'الخيار المتكامل للمدارس المتوسطة والثانوية',
	descEn: 'Comprehensive choice for K-12 schools',
	monthlyPriceSAR: 999,
	annualPriceSAR: 9590,
	monthlyPriceUSD: 265,
	annualPriceUSD: 2590,
	featuresAr: ['عدد طلاب غير محدود', 'نظام الرصد الأكاديمي والشهادات', 'إدارة الرسوم المالية (ZATCA)', 'السلوك والمواظبة المتقدم', 'دعم فني وأولوية بالرد'],
	featuresEn: ['Unlimited Students', 'Academic Grading & Certificates', 'Financials & Fees (ZATCA)', 'Advanced Behavior Tracking', 'Priority Support'],
	isPopular: true
  },
  {
	id: 'enterprise',
	nameAr: 'الشركات التعليمية',
	nameEn: 'Enterprise',
	descAr: 'للمجمعات التعليمية وإدارة الفروع',
	descEn: 'For school districts & multiple branches',
	monthlyPriceSAR: 'مخصص',
	annualPriceSAR: 'مخصص',
	monthlyPriceUSD: 'Custom',
	annualPriceUSD: 'Custom',
	featuresAr: ['إدارة فروع متعددة', 'Dox Studio للشهادات المخصصة', 'ربط API مع أنظمة الوزارة', 'مدير حساب مخصص', 'استضافة سحابية خاصة'],
	featuresEn: ['Multi-branch Management', 'Dox Studio Custom Certificates', 'Ministry API Integrations', 'Dedicated Account Manager', 'Private Cloud Hosting'],
	isPopular: false
  }
];

// ─── SUPPORT MODAL ───
function SupportModal({ t, isAr, onClose }: any) {
  const contacts = [
	{ icon: <Mail size={18} />, label: isAr ? 'الاستفسارات العامة' : 'General', value: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com' },
	{ icon: <HelpCircle size={18} />, label: isAr ? 'الدعم الفني' : 'Support', value: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com' },
	{ icon: <FileText size={18} />, label: isAr ? 'الاشتراكات' : 'Subscriptions', value: 'subscription@operix-solutions.com', href: 'mailto:subscription@operix-solutions.com' },
  ];
  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
	  <div style={{ background: theme.white, borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${theme.border}`, direction: isAr ? 'rtl' : 'ltr' }} onClick={e => e.stopPropagation()}>
		<div style={{ background: theme.navy, padding: '24px', position: 'relative' }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			<div style={{ background: `${theme.royal}33`, color: theme.royal, padding: '8px', borderRadius: '8px' }}><HelpCircle /></div>
			<div>
			  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.white }}>{t.supportTitle}</h3>
			  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{t.supportSub}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position: 'absolute', top: '16px', [isAr ? 'left' : 'right']: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.white }}><X /></button>
		</div>
		<div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {contacts.map((c, i) => (
			<a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.slate, textDecoration: 'none', color: theme.navy }}>
			  <div style={{ color: theme.royal }}>{c.icon}</div>
			  <div>
				<div style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>{c.label}</div>
				<div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{c.value}</div>
			  </div>
			</a>
		  ))}
		  <button onClick={onClose} style={{ marginTop: '12px', width: '100%', padding: '14px', background: theme.navy, color: theme.white, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>{t.termsClose}</button>
		</div>
	  </div>
	</div>
  );
}

// ─── TERMS MODAL ───
function TermsModal({ t, isAr, onClose }: any) {
  const sections = isAr ? [
	{ title: '١. القبول والاتفاقية', body: 'باستخدامك منصة OPERIX Edu، فإنك توافق على الالتزام بهذه الشروط والأحكام الخاصة بالمؤسسات التعليمية.' },
	{ title: '٢. حماية بيانات الطلاب', body: 'نلتزم بأعلى معايير الأمان لحماية السجلات الأكاديمية والبيانات الشخصية للطلاب. لا يتم مشاركة البيانات مع أي أطراف إعلانية.' },
	{ title: '٣. الفوترة والاشتراكات', body: 'تُحتسب الرسوم بشكل دوري (شهري/سنوي). جميع الأسعار داخل المملكة تخضع لضريبة القيمة المضافة 15%، والنظام متوافق مع متطلبات هيئة الزكاة (ZATCA).' },
  ] : [
	{ title: '1. Acceptance & Agreement', body: 'By using OPERIX Edu, you agree to comply with these terms designed for educational institutions.' },
	{ title: '2. Student Data Protection', body: 'We adhere to the highest security standards to protect academic records and personal data. Data is never shared with advertisers.' },
	{ title: '3. Billing & Subscriptions', body: 'Fees are billed periodically. Prices in KSA are subject to 15% VAT, and the system is fully ZATCA compliant.' },
  ];

  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
	  <div style={{ background: theme.white, borderRadius: '16px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: isAr ? 'rtl' : 'ltr' }} onClick={e => e.stopPropagation()}>
		<div style={{ background: theme.navy, padding: '24px', position: 'relative' }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			<div style={{ background: `${theme.royal}33`, color: theme.royal, padding: '8px', borderRadius: '8px' }}><ShieldCheck /></div>
			<div>
			  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.white }}>{t.termsTitle}</h3>
			  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{t.termsEffective}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position: 'absolute', top: '16px', [isAr ? 'left' : 'right']: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.white }}><X /></button>
		</div>
		<div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
		  {sections.map((s, i) => (
			<div key={i} style={{ marginBottom: '20px' }}>
			  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: theme.navy }}>{s.title}</h4>
			  <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted, lineHeight: 1.7 }}>{s.body}</p>
			</div>
		  ))}
		</div>
		<div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}` }}>
		  <button onClick={onClose} style={{ width: '100%', padding: '14px', background: theme.royal, color: theme.white, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>{t.termsClose}</button>
		</div>
	  </div>
	</div>
  );
}

// ─── MAIN COMPONENT ───
export default function SubscriptionsEdu() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('ar');
  const [currency, setCurrency] = useState('SAR'); // SAR or USD
  const [isAnnual, setIsAnnual] = useState(true);
  
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [demoForm, setDemoForm] = useState({ name: '', email: '', school: '', students: '1-200' });

  const isAr = lang === 'ar';
  const t = translations[isAr ? 'ar' : 'en'];

  const handleDemoRequest = async (e: React.FormEvent) => {
	e.preventDefault();
	setIsSubmitting(true);
	const adminPayload = {
	  action: 'sendEmail', to: TARGET_EMAIL,
	  subject: `New EDU Lead: ${demoForm.school}`,
	  body: `NEW OPERIX EDU DEMO REQUEST 🎓\n\nName: ${demoForm.name}\nEmail: ${demoForm.email}\nSchool: ${demoForm.school}\nStudents: ${demoForm.students}`,
	  senderName: 'Operix Edu', senderEmail: 'system@operix.com'
	};
	const userPayload = {
	  action: 'sendEmail', to: demoForm.email,
	  subject: `Request Confirmed - Operix Edu`,
	  body: `Hello ${demoForm.name},\n\nThank you for your interest in Operix Edu. Our academic team has received your details for ${demoForm.school}.\n\nAn educational systems expert will reach out to you shortly.\n\nBest regards,\nThe Operix Team`,
	  senderName: 'Operix Team', senderEmail: 'system@operix.com'
	};
	await Promise.all([gasCall(adminPayload), gasCall(userPayload)]);
	setIsSubmitting(false);
	setShowDemoModal(false);
	alert(isAr ? `تم الإرسال بنجاح يا ${demoForm.name}! سنتواصل معك قريباً.` : `Request sent, ${demoForm.name}! We will be in touch.`);
	setDemoForm({ name: '', email: '', school: '', students: '1-200' });
  };

  return (
	<div style={{ minHeight: '100vh', backgroundColor: theme.slate, direction: isAr ? 'rtl' : 'ltr', fontFamily: 'system-ui, sans-serif' }}>
	  
	  {/* ─── HEADER (Matches Landing) ─── */}
	  <header style={{ backgroundColor: theme.white, borderBottom: `1px solid ${theme.border}`, padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
		  <img src={logo} alt="OPERIX Edu Logo" style={{ height: '40px', objectFit: 'contain' }} />
		  <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: theme.navy }}>OPERIX Edu</h1>
		</div>
		<nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
		  <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
			<Globe size={18} /> {isAr ? 'EN' : 'عربي'}
		  </button>
		  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700 }}>
			{isAr ? 'الدعم الفني' : 'Support'}
		  </button>
		  <button onClick={() => navigate('/login')} style={{ backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
			{isAr ? 'تسجيل الدخول' : 'Login'}
		  </button>
		</nav>
	  </header>

	  {/* ─── PRICING HEADER ─── */}
	  <section style={{ padding: '80px 5% 40px', textAlign: 'center' }}>
		<h2 style={{ fontSize: '3rem', fontWeight: 900, color: theme.navy, marginBottom: '16px' }}>{t.title}</h2>
		<p style={{ fontSize: '1.2rem', color: theme.textMuted, maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>{t.subtitle}</p>
		
		{/* Toggles */}
		<div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
		  {/* Billing Cycle */}
		  <div style={{ display: 'inline-flex', background: theme.white, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
			<button onClick={() => setIsAnnual(false)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: !isAnnual ? theme.navy : 'transparent', color: !isAnnual ? theme.white : theme.textMuted, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
			  {t.monthly}
			</button>
			<button onClick={() => setIsAnnual(true)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: isAnnual ? theme.navy : 'transparent', color: isAnnual ? theme.white : theme.textMuted, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
			  {t.annual}
			</button>
		  </div>

		  {/* Currency Toggle */}
		  <div style={{ display: 'inline-flex', background: theme.white, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
			<button onClick={() => setCurrency('SAR')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: currency === 'SAR' ? theme.royal : 'transparent', color: currency === 'SAR' ? theme.white : theme.textMuted, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
			  {t.currencySAR}
			</button>
			<button onClick={() => setCurrency('USD')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: currency === 'USD' ? theme.royal : 'transparent', color: currency === 'USD' ? theme.white : theme.textMuted, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
			  {t.currencyUSD}
			</button>
		  </div>
		</div>
	  </section>

	  {/* ─── PRICING CARDS ─── */}
	  <section style={{ padding: '0 5% 80px', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
		{pricingPlans.map((plan, i) => {
		  const isCustom = plan.monthlyPriceSAR === 'مخصص' || plan.monthlyPriceUSD === 'Custom';
		  const price = currency === 'SAR' 
			? (isAnnual ? plan.annualPriceSAR : plan.monthlyPriceSAR) 
			: (isAnnual ? plan.annualPriceUSD : plan.monthlyPriceUSD);
			
		  return (
			<div key={i} style={{ background: theme.white, borderRadius: '24px', border: `2px solid ${plan.isPopular ? theme.royal : theme.border}`, padding: '40px 32px', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: plan.isPopular ? '0 20px 25px -5px rgba(37,99,235,0.1)' : 'none' }}>
			  {plan.isPopular && (
				<div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: theme.royal, color: theme.white, padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
				  {t.popular}
				</div>
			  )}
			  
			  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.navy, margin: '0 0 8px 0' }}>{isAr ? plan.nameAr : plan.nameEn}</h3>
			  <p style={{ color: theme.textMuted, margin: '0 0 24px 0', fontSize: '0.95rem' }}>{isAr ? plan.descAr : plan.descEn}</p>
			  
			  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '32px' }}>
				<span style={{ fontSize: '3rem', fontWeight: 900, color: theme.navy }}>{price}</span>
				{!isCustom && <span style={{ color: theme.textMuted, fontWeight: 700 }}>/ {currency === 'SAR' ? t.currencySAR : t.currencyUSD} {isAnnual ? (isAr ? 'سنوياً' : 'yearly') : (isAr ? 'شهرياً' : 'mo')}</span>}
			  </div>

			  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, marginBottom: '32px' }}>
				{(isAr ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
				  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
					<div style={{ color: theme.success, marginTop: '2px' }}><Check size={18} strokeWidth={3} /></div>
					<span style={{ color: theme.navy, fontWeight: 600, fontSize: '0.95rem' }}>{feat}</span>
				  </div>
				))}
			  </div>

			  <button 
				onClick={() => setShowDemoModal(true)}
				style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: plan.isPopular ? theme.royal : `${theme.navy}0A`, color: plan.isPopular ? theme.white : theme.navy, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
			  >
				{isCustom ? t.demoBtn : t.startBtn}
			  </button>
			</div>
		  )
		})}
	  </section>

	  {/* ─── ZATCA & VAT NOTE ─── */}
	  <div style={{ textAlign: 'center', padding: '0 5% 80px' }}>
		<div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: `${theme.royal}11`, color: theme.navy, padding: '16px 24px', borderRadius: '12px', border: `1px solid ${theme.royal}33` }}>
		  <ShieldCheck color={theme.royal} />
		  <span style={{ fontWeight: 600 }}>{currency === 'SAR' ? t.vatNote : t.usdNote}</span>
		</div>
	  </div>

	  {/* ─── FOOTER ─── */}
	  <footer style={{ backgroundColor: theme.white, borderTop: `1px solid ${theme.border}`, padding: '40px 5%', textAlign: 'center' }}>
		<div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
		  <button onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 600 }}>{isAr ? 'الشروط والخصوصية' : 'Terms & Privacy'}</button>
		  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 600 }}>{isAr ? 'مركز الدعم' : 'Support Center'}</button>
		</div>
		<h2 style={{ color: theme.navy, fontWeight: 900, margin: '0 0 8px 0' }}>OPERIX Edu</h2>
		<p style={{ color: theme.textMuted, fontSize: '0.9rem', margin: '0 0 24px 0' }}>{isAr ? 'إحدى منتجات شركة OPERIX Solutions للأنظمة الرقمية.' : 'A product by OPERIX Solutions.'}</p>
		<p style={{ color: theme.textMuted, fontSize: '0.8rem', margin: 0 }}>© 2026 {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
	  </footer>

	  {/* ─── DEMO MODAL ─── */}
	  {showDemoModal && (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
		  <div style={{ background: theme.white, borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: isAr ? 'rtl' : 'ltr' }}>
			<div style={{ height: '6px', background: theme.royal }} />
			<div style={{ padding: '32px' }}>
			  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
				<div>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
					<GraduationCap color={theme.royal} size={28} />
					<h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: theme.navy }}>{t.modalTitle}</h3>
				  </div>
				  <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.5 }}>{t.modalSub}</p>
				</div>
				<button onClick={() => setShowDemoModal(false)} style={{ background: theme.slate, border: `1px solid ${theme.border}`, borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				  <X size={18} />
				</button>
			  </div>

			  <form onSubmit={handleDemoRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				{[
				  { label: isAr ? 'الاسم الكامل' : 'Full Name', field: 'name', type: 'text' },
				  { label: isAr ? 'البريد الإلكتروني للإدارة' : 'Admin Email', field: 'email', type: 'email' },
				  { label: isAr ? 'اسم المنشأة التعليمية' : 'School/Institution Name', field: 'school', type: 'text' }
				].map(({ label, field, type }) => (
				  <div key={field}>
					<label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: theme.navy }}>{label}</label>
					<input
					  type={type}
					  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outlineColor: theme.royal }}
					  value={(demoForm as any)[field]}
					  onChange={e => setDemoForm({ ...demoForm, [field]: e.target.value })}
					  required
					/>
				  </div>
				))}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: theme.navy }}>{isAr ? 'عدد الطلاب التقديري' : 'Estimated Students'}</label>
				  <select style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outlineColor: theme.royal, cursor: 'pointer' }} value={demoForm.students} onChange={e => setDemoForm({ ...demoForm, students: e.target.value })}>
					<option value="1-200">1 - 200 {isAr ? 'طالب' : 'Students'}</option>
					<option value="201-500">201 - 500 {isAr ? 'طالب' : 'Students'}</option>
					<option value="501-1000">501 - 1000 {isAr ? 'طالب' : 'Students'}</option>
					<option value="1000+">1000+ {isAr ? 'طالب' : 'Students'}</option>
				  </select>
				</div>

				<button
				  type="submit"
				  style={{ width: '100%', padding: '16px', background: isSubmitting ? theme.textMuted : theme.royal, color: theme.white, border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 800, cursor: isSubmitting ? 'default' : 'pointer', marginTop: '8px' }}
				  disabled={isSubmitting}>
				  {isSubmitting ? t.submitting : t.submit}
				</button>
			  </form>
			</div>
		  </div>
		</div>
	  )}

	</div>
  );
}