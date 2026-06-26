import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, ShieldCheck, LineChart, Award, Users, 
  ChevronLeft, ChevronRight, Globe, Mail, Phone, FileText, 
  ExternalLink, HelpCircle, X 
} from 'lucide-react';
import logo from '../assets/logo.png';

const OPS_API = 'https://script.google.com/macros/s/AKfycbxzwlFPfOFiUS5atnjkAuXDcr-L_-LSY33_S9d6t12P36qmTWthc00ywCKpReFxzLY/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';

const theme = { 
  navy: '#0f172a', 
  royal: '#2563eb', 
  pencil: '#f59e0b',      // The new pencil yellow accent
  pencilLight: '#fef3c7', // Soft yellow background for accents
  slate: '#f8fafc', 
  white: '#ffffff', 
  border: '#e2e8f0', 
  textMuted: '#64748b' 
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
	navFeatures: "Features",
	navVision: "Academic Vision",
	pricing: "Pricing",
	login: "Login",
	supportBtn: "Support",
	badge: "Enterprise School Edition 2026",
	heroTitle1: "The future of school management ",
	heroTitle2: "starts here.",
	heroSub: "A fully integrated cloud platform designed specifically to meet the standards of Ministries of Education in the Middle East. We combine academic management rigor with modern technical fluency to empower school leaders and teachers.",
	demoBtn: "Book a Demo",
	platformBtn: "Enter Platform",
	visionTitle: "Because a teacher's time is too valuable to waste on paperwork.",
	visionDesc: '"OPERIX Edu was designed by technical experts with the vision of academic leaders. We understand that educational quality starts with administrative stability. We provide precise tools for grading, behavior analysis, and official certificate generation with a single click, freeing teachers for their highest calling: building minds."',
	featuresTitle: "Integrated Infrastructure for Future Schools",
	featuresSub: "Everything school administration needs under one digital roof.",
	f1Title: "Dox Studio for Certificates",
	f1Desc: "Instant generation of student certificates and grade reports in 4K print resolution compliant with official formats.",
	f2Title: "Precise Grading System",
	f2Desc: "Advanced management of subjects, classes, and assignments, with automated cumulative GPA calculations.",
	f3Title: "Behavior & Attendance",
	f3Desc: "Accurate documentation of student attendance and behavioral infractions to ensure a disciplined educational environment.",
	f4Title: "Parents Management",
	f4Desc: "Direct connection between student records and parents to facilitate communication and send periodic reports.",
	// Footer & Modals
	footerTagline: "A product by OPERIX Solutions for digital systems.",
	footerProduct: "Product",
	footerCompany: "Company",
	footerContact: "Contact",
	footerLinks: ["Features", "Pricing", "Book a Demo", "Login"],
	footerCompanyLinks: ["About OPERIX", "Solutions", "Careers", "Blog"],
	footerRights: "© 2026 OPERIX Solutions. All rights reserved.",
	footerVat: "VAT Reg. No: 310XXXXXXXXX | Riyadh, Saudi Arabia",
	supportTitle: "Support Center",
	supportSub: "We're here to help you 24/7. Reach out via any channel below.",
	termsTitle: "Terms of Use & Privacy Policy",
	termsEffective: "Effective Date: January 1, 2026",
	termsClose: "I Understand",
	modalTitle: "Request a Demo",
	modalSub: "Fill out your school's details and our academic systems team will contact you.",
	submit: "Send Request",
	submitting: "Sending...",
  },
  ar: {
	navFeatures: "المميزات",
	navVision: "الرؤية الأكاديمية",
	pricing: "الأسعار",
	login: "تسجيل الدخول",
	supportBtn: "الدعم الفني",
	badge: "الإصدار المؤسسي للمدارس 2026",
	heroTitle1: "مستقبل الإدارة المدرسية ",
	heroTitle2: "يبدأ من هنا.",
	heroSub: "منصة سحابية متكاملة مصممة خصيصاً لتلبي معايير وزارات التعليم في الشرق الأوسط. نجمع بين رصانة الإدارة الأكاديمية وسلاسة التقنية الحديثة لتمكين قادة المدارس والمعلمين.",
	demoBtn: "طلب عرض تجريبي",
	platformBtn: "دخول المنصة",
	visionTitle: "لأن وقت المعلم أثمن من أن يضيع في الأعمال الورقية.",
	visionDesc: '"صُمم OPERIX Edu بأيدي خبراء تقنيين وبرؤية قادة أكاديميين. نحن ندرك أن جودة التعليم تبدأ من استقرار الإدارة، ولذلك وفرنا أدوات دقيقة لرصد الدرجات، تحليل السلوك، واستخراج الشهادات الرسمية بنقرة واحدة، ليتفرغ المعلم لرسالته الأسمى: بناء العقول."',
	featuresTitle: "بنية تحتية متكاملة لمدارس المستقبل",
	featuresSub: "كل ما تحتاجه الإدارة المدرسية تحت سقف رقمي واحد.",
	f1Title: "Dox Studio للشهادات",
	f1Desc: "استخراج فوري لشهادات الطلاب وإشعارات الدرجات بدقة طباعة 4K متوافقة مع التنسيقات الرسمية.",
	f2Title: "نظام رصد أكاديمي دقيق",
	f2Desc: "إدارة متقدمة للمواد الدراسية، الفصول، والواجبات، مع حساب آلي للمعدلات التراكمية.",
	f3Title: "السلوك والمواظبة",
	f3Desc: "توثيق دقيق لحضور الطلاب ومخالفاتهم السلوكية لضمان بيئة تعليمية منضبطة.",
	f4Title: "إدارة أولياء الأمور",
	f4Desc: "ربط مباشر بين بيانات الطالب وولي أمره لتسهيل التواصل وإرسال التقارير الدورية.",
	// Footer & Modals
	footerTagline: "إحدى منتجات شركة OPERIX Solutions للأنظمة الرقمية.",
	footerProduct: "المنتج",
	footerCompany: "الشركة",
	footerContact: "التواصل",
	footerLinks: ["المميزات", "الأسعار", "طلب عرض", "تسجيل الدخول"],
	footerCompanyLinks: ["عن أوبيريكس", "الحلول", "الوظائف", "المدونة"],
	footerRights: "© 2026 أوبيريكس سوليوشنز. جميع الحقوق محفوظة.",
	footerVat: "الرقم الضريبي: 310XXXXXXXXX | الرياض، المملكة العربية السعودية",
	supportTitle: "مركز الدعم",
	supportSub: "نحن هنا لمساعدتك على مدار الساعة. تواصل معنا عبر أي قناة أدناه.",
	termsTitle: "شروط الاستخدام وسياسة الخصوصية",
	termsEffective: "تاريخ السريان: 1 يناير 2026",
	termsClose: "أوافق",
	modalTitle: "طلب عرض تجريبي",
	modalSub: "أدخل بيانات المدرسة وسيتواصل معك فريق الأنظمة الأكاديمية قريباً.",
	submit: "إرسال الطلب",
	submitting: "جاري الإرسال...",
  }
};

// ─── MODALS ───
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

function TermsModal({ t, isAr, onClose }: any) {
  const sections = isAr ? [
	{ title: '١. القبول والاتفاقية', body: 'باستخدامك منصة OPERIX Edu، فإنك توافق على الالتزام بهذه الشروط والأحكام الخاصة بالمؤسسات التعليمية.' },
	{ title: '٢. حماية بيانات الطلاب', body: 'نلتزم بأعلى معايير الأمان لحماية السجلات الأكاديمية والبيانات الشخصية للطلاب. لا يتم مشاركة البيانات مع أي أطراف إعلانية.' },
	{ title: '٣. الفوترة والاشتراكات', body: 'تُحتسب الرسوم بشكل دوري. جميع الأسعار داخل المملكة تخضع لضريبة القيمة المضافة 15%، والنظام متوافق مع متطلبات هيئة الزكاة (ZATCA).' },
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
export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('ar');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', school: '', students: '1-200' });

  const isAr = lang === 'ar';
  const t = translations[isAr ? 'ar' : 'en'];

  const features = [
	{ title: t.f1Title, desc: t.f1Desc, icon: <Award size={32} /> },
	{ title: t.f2Title, desc: t.f2Desc, icon: <LineChart size={32} /> },
	{ title: t.f3Title, desc: t.f3Desc, icon: <ShieldCheck size={32} /> },
	{ title: t.f4Title, desc: t.f4Desc, icon: <Users size={32} /> }
  ];

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
	  
	  {/* ─── HEADER ─── */}
	  <header style={{ backgroundColor: theme.white, borderBottom: `1px solid ${theme.border}`, padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
		  <img src={logo} alt="OPERIX Edu" style={{ height: '40px', objectFit: 'contain' }} />
		  <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: theme.navy }}>OPERIX Edu</h1>
		</div>
		<nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
		  <a href="#features" style={{ textDecoration: 'none', color: theme.textMuted, fontWeight: 700 }}>{t.navFeatures}</a>
		  <a href="#academic" style={{ textDecoration: 'none', color: theme.textMuted, fontWeight: 700 }}>{t.navVision}</a>
		  <Link to="/subscriptions" style={{ textDecoration: 'none', color: theme.textMuted, fontWeight: 700 }}>{t.pricing}</Link>
		  
		  <div style={{ width: '1px', height: '24px', backgroundColor: theme.border, margin: '0 4px' }} />

		  <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
			<Globe size={18} /> {isAr ? 'EN' : 'عربي'}
		  </button>
		  
		  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700 }}>
			{t.supportBtn}
		  </button>

		  <button onClick={() => setShowDemoModal(true)} style={{ backgroundColor: theme.pencilLight, color: theme.pencil, border: `1px solid ${theme.pencil}`, padding: '8px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
			{t.demoBtn}
		  </button>

		  <Link to="/login" style={{ backgroundColor: theme.navy, color: theme.white, textDecoration: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 800, transition: 'background 0.2s' }}>
			{t.login}
		  </Link>
		</nav>
	  </header>

	  {/* ─── HERO ─── */}
	  <section style={{ padding: '80px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', backgroundColor: theme.white }}>
		<div style={{ flex: '1 1 500px', maxWidth: '650px' }}>
		  <div style={{ display: 'inline-block', backgroundColor: '#eff6ff', color: theme.royal, padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem', marginBottom: '24px' }}>
			{t.badge}
		  </div>
		  <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: theme.navy, margin: '0 0 24px 0', lineHeight: 1.2, letterSpacing: '-1px' }}>
			{t.heroTitle1} <br/> <span style={{ color: theme.pencil }}>{t.heroTitle2}</span>
		  </h2>
		  <p style={{ fontSize: '1.15rem', color: theme.textMuted, lineHeight: 1.8, margin: '0 0 32px 0' }}>
			{t.heroSub}
		  </p>
		  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
			<Link to="/login" style={{ backgroundColor: theme.royal, color: theme.white, textDecoration: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
			  {t.platformBtn} {isAr ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
			</Link>
			<Link to="/subscription" style={{ backgroundColor: theme.white, color: theme.navy, border: `2px solid ${theme.border}`, textDecoration: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			  {t.pricing}
			</Link>
			<button onClick={() => setShowDemoModal(true)} style={{ backgroundColor: theme.pencil, color: theme.white, border: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${theme.pencil}40` }}>
			  {t.demoBtn}
			</button>
		  </div>
		</div>
		<div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
		  <div style={{ width: '400px', height: '400px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.royal}22, ${theme.pencil}22)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div style={{ width: '300px', height: '300px', borderRadius: '24px', backgroundColor: theme.white, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}`, padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
			  <div style={{ height: '40px', width: '40px', backgroundColor: theme.royal, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.white }}><GraduationCap /></div>
			  <div style={{ height: '24px', width: '70%', backgroundColor: theme.slate, borderRadius: '4px' }}></div>
			  <div style={{ height: '16px', width: '90%', backgroundColor: theme.slate, borderRadius: '4px' }}></div>
			  <div style={{ height: '16px', width: '50%', backgroundColor: theme.slate, borderRadius: '4px' }}></div>
			  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
				<div style={{ height: '32px', width: '32px', borderRadius: '50%', backgroundColor: theme.pencilLight }}></div>
				<div style={{ height: '32px', width: '100px', borderRadius: '16px', backgroundColor: theme.pencil }}></div>
			  </div>
			</div>
		  </div>
		</div>
	  </section>

	  {/* ─── VISION SECTION ─── */}
	  <section id="academic" style={{ padding: '80px 5%', backgroundColor: theme.navy, color: theme.white, textAlign: 'center' }}>
		<div style={{ maxWidth: '800px', margin: '0 auto' }}>
		  <BookOpen size={48} color={theme.pencil} style={{ marginBottom: '24px' }} />
		  <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>{t.visionTitle}</h2>
		  <p style={{ fontSize: '1.2rem', color: '#94a3b8', lineHeight: 2 }}>{t.visionDesc}</p>
		</div>
	  </section>

	  {/* ─── FEATURES ─── */}
	  <section id="features" style={{ padding: '80px 5%' }}>
		<div style={{ textAlign: 'center', marginBottom: '60px' }}>
		  <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: theme.navy, margin: '0 0 16px 0' }}>{t.featuresTitle}</h2>
		  <p style={{ fontSize: '1.1rem', color: theme.textMuted }}>{t.featuresSub}</p>
		</div>
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
		  {features.map((feature, i) => (
			<div key={i} style={{ backgroundColor: theme.white, padding: '32px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', transition: 'transform 0.2s', cursor: 'default' }}>
			  <div style={{ width: '64px', height: '64px', backgroundColor: theme.pencilLight, color: theme.pencil, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
				{feature.icon}
			  </div>
			  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: theme.navy, margin: '0 0 12px 0' }}>{feature.title}</h3>
			  <p style={{ color: theme.textMuted, lineHeight: 1.7, margin: 0 }}>{feature.desc}</p>
			</div>
		  ))}
		</div>
	  </section>

	  {/* ─── FOOTER ─── */}
	  <footer style={{ backgroundColor: theme.white, borderTop: `1px solid ${theme.border}`, padding: '64px 5% 0' }}>
		<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
		  <div style={{ display: 'grid', gridTemplateColumns: isAr ? 'repeat(4, 1fr)' : '2fr 1fr 1fr 1.5fr', gap: '40px', paddingBottom: '48px', borderBottom: `1px solid ${theme.border}` }}>
			
			{/* Brand */}
			<div>
			  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
				<img src={logo} alt="OPERIX" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
				<span style={{ fontSize: '1.2rem', fontWeight: 900, color: theme.navy }}>OPERIX Edu</span>
			  </div>
			  <p style={{ color: theme.textMuted, fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 20px 0' }}>{t.footerTagline}</p>
			</div>

			{/* Product */}
			<div>
			  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: theme.navy, textTransform: 'uppercase', marginBottom: '16px' }}>{t.footerProduct}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<a href="#features" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600 }}>{t.footerLinks[0]}</a>
				<Link to="/subscription" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600 }}>{t.footerLinks[1]}</Link>
				<button onClick={() => setShowDemoModal(true)} style={{ background: 'none', border: 'none', padding: 0, textAlign: isAr ? 'right' : 'left', color: theme.textMuted, cursor: 'pointer', fontWeight: 600 }}>{t.footerLinks[2]}</button>
				<Link to="/login" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600 }}>{t.footerLinks[3]}</Link>
			  </div>
			</div>

			{/* Company */}
			<div>
			  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: theme.navy, textTransform: 'uppercase', marginBottom: '16px' }}>{t.footerCompany}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				{t.footerCompanyLinks.map((link, i) => (
				  <a key={i} href="https://www.operix-solutions.com" target="_blank" rel="noreferrer" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600 }}>{link}</a>
				))}
			  </div>
			</div>

			{/* Contact */}
			<div>
			  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: theme.navy, textTransform: 'uppercase', marginBottom: '16px' }}>{t.footerContact}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				{[
				  { icon: <Mail size={16} />, val: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com' },
				  { icon: <Phone size={16} />, val: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com' },
				  { icon: <Globe size={16} />, val: 'www.operix-solutions.com', href: 'https://www.operix-solutions.com' }
				].map((c, i) => (
				  <a key={i} href={c.href} target={i === 2 ? '_blank' : undefined} rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textMuted, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
					<span style={{ color: theme.pencil }}>{c.icon}</span> {c.val}
				  </a>
				))}
			  </div>
			</div>
		  </div>

		  {/* Bottom Bar */}
		  <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
			<div>
			  <div style={{ color: theme.textMuted, fontSize: '0.9rem', fontWeight: 600 }}>{t.footerRights}</div>
			  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>{t.footerVat}</div>
			</div>
			<div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
			  <button onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
				<FileText size={16} /> {isAr ? 'الشروط والخصوصية' : 'Terms & Privacy'}
			  </button>
			  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
				<HelpCircle size={16} /> {t.supportBtn}
			  </button>
			</div>
		  </div>
		</div>
	  </footer>

	  {/* ─── DEMO MODAL ─── */}
	  {showDemoModal && (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
		  <div style={{ background: theme.white, borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: isAr ? 'rtl' : 'ltr' }}>
			<div style={{ height: '6px', background: theme.pencil }} />
			<div style={{ padding: '32px' }}>
			  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
				<div>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
					<GraduationCap color={theme.pencil} size={28} />
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
					  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outlineColor: theme.pencil }}
					  value={(demoForm as any)[field]}
					  onChange={e => setDemoForm({ ...demoForm, [field]: e.target.value })}
					  required
					/>
				  </div>
				))}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: theme.navy }}>{isAr ? 'عدد الطلاب التقديري' : 'Estimated Students'}</label>
				  <select style={{ width: '100%', padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outlineColor: theme.pencil, cursor: 'pointer' }} value={demoForm.students} onChange={e => setDemoForm({ ...demoForm, students: e.target.value })}>
					<option value="1-200">1 - 200 {isAr ? 'طالب' : 'Students'}</option>
					<option value="201-500">201 - 500 {isAr ? 'طالب' : 'Students'}</option>
					<option value="501-1000">501 - 1000 {isAr ? 'طالب' : 'Students'}</option>
					<option value="1000+">1000+ {isAr ? 'طالب' : 'Students'}</option>
				  </select>
				</div>

				<button
				  type="submit"
				  style={{ width: '100%', padding: '16px', background: isSubmitting ? theme.textMuted : theme.pencil, color: theme.white, border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 800, cursor: isSubmitting ? 'default' : 'pointer', marginTop: '8px' }}
				  disabled={isSubmitting}>
				  {isSubmitting ? t.submitting : t.submit}
				</button>
			  </form>
			</div>
		  </div>
		</div>
	  )}

	  {/* ─── SUPPORT MODAL ─── */}
	  {showSupportModal && <SupportModal t={t} isAr={isAr} onClose={() => setShowSupportModal(false)} />}

	  {/* ─── TERMS MODAL ─── */}
	  {showTermsModal && <TermsModal t={t} isAr={isAr} onClose={() => setShowTermsModal(false)} />}

	</div>
  );
}