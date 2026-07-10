import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, ShieldCheck, LineChart, Award, Users, 
  ChevronLeft, ChevronRight, Globe, Mail, HelpCircle, X, Sparkles, 
  CheckCircle, School, Search, ChevronDown, FileText
} from 'lucide-react';
import logo from '../assets/logo.png';

const OPS_API = 'https://script.google.com/macros/s/AKfycbxzwlFPfOFiUS5atnjkAuXDcr-L_-LSY33_S9d6t12P36qmTWthc00ywCKpReFxzLY/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';

const theme = { 
  navy: '#0f172a', navyMid: '#1e293b', royal: '#2563eb', royalLight: '#3b82f6',
  pencil: '#f59e0b', pencilLight: '#fef3c7', pencilDark: '#d97706',
  slate: '#f8fafc', white: '#ffffff', border: '#e2e8f0', textMuted: '#64748b',
  green: '#10b981', ink: '#334155',
};

// ─── COUNTRIES DATA ───
const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', flag: '🇸🇦', dial: '+966' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', flag: '🇸🇩', dial: '+249' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', flag: '🇦🇪', dial: '+971' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', dial: '+20' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', dial: '+974' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', dial: '+965' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭', dial: '+973' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', flag: '🇴🇲', dial: '+968' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴', dial: '+962' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', flag: '🇺🇸', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', flag: '🇬🇧', dial: '+44' },
];

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

const formatText = (text: string) => {
  if (!text) return text;
  const parts = text.split(/(OPERIX Edu|OPERIX)/g);
  return parts.map((part, i) => 
	(part === 'OPERIX' || part === 'OPERIX Edu') ? 
	  <span key={i} style={{ color: theme.navy, backgroundColor: theme.white, padding: '2px 8px', borderRadius: '6px', fontWeight: 900, margin: '0 4px', fontStyle: 'normal', display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>{part}</span> 
	  : <React.Fragment key={i}>{part}</React.Fragment>
  );
};

function useScrollVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
	const obs = new IntersectionObserver(([entry]) => {
	  if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
	}, { threshold });
	if (ref.current) obs.observe(ref.current);
	return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AcademicSketch({ color = '#e2e8f0', size = 180 }: { color?: string; size?: number }) {
  return (
	<svg width={size} height={size} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
	  <path d="M30 60 Q90 50 90 50 Q90 50 150 60 L150 130 Q90 120 90 120 Q90 120 30 130 Z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
	  <line x1="90" y1="50" x2="90" y2="120" stroke={color} strokeWidth="1.5" strokeDasharray="4 3"/>
	  <line x1="42" y1="80" x2="82" y2="77" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="42" y1="90" x2="82" y2="87" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="42" y1="100" x2="78" y2="97" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="42" y1="110" x2="72" y2="107" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="98" y1="77" x2="138" y2="80" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="98" y1="87" x2="138" y2="90" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="98" y1="97" x2="134" y2="100" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="98" y1="107" x2="128" y2="110" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <path d="M68 35 L90 27 L112 35 L90 43 Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
	  <line x1="90" y1="43" x2="90" y2="54" stroke={color} strokeWidth="1.5"/>
	  <path d="M80 46 Q80 54 72 58" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
	  <circle cx="72" cy="59" r="2" fill={color}/>
	  <path d="M148 32 L150 28 L152 32 L156 30 L153 34 L156 38 L152 36 L150 40 L148 36 L144 38 L147 34 L144 30 Z" stroke={color} strokeWidth="1" fill="none"/>
	  <line x1="22" y1="148" x2="40" y2="130" stroke={color} strokeWidth="2" strokeLinecap="round"/>
	  <path d="M40 130 L44 134 L22 148 Z" stroke={color} strokeWidth="1.2" fill="none"/>
	  <line x1="42" y1="128" x2="46" y2="132" stroke={color} strokeWidth="2" strokeLinecap="round"/>
	</svg>
  );
}

const translations: Record<string, any> = {
  en: {
	navFeatures: "Features", navVision: "Academic Vision", pricing: "Pricing", login: "Login", supportBtn: "Support",
	badge: "Enterprise School Edition 2026", heroTitle1: "The future of school management", heroTitle2: "starts here.",
	heroSub: "A fully integrated cloud platform designed specifically to meet the standards of modern educational institutions. We combine academic management rigor with modern technical fluency to empower school leaders and teachers.",
	demoBtn: "Book a Demo", platformBtn: "Enter Platform",
	trustBadge1: "41 Global Initiatives", trustBadge2: "5+ Core Solutions", trustBadge3: "High Availability Architecture",
	visionTitle: "Because a teacher's time is too valuable to waste on paperwork.",
	visionDesc: '"OPERIX Edu was designed by technical experts with the vision of academic leaders. We understand that educational quality starts with administrative stability. We provide precise tools for grading, behavior analysis, and official certificate generation with a single click, freeing teachers for their highest calling: building minds."',
	featuresTitle: "Integrated Infrastructure for Future Schools", featuresSub: "Everything school administration needs under one digital roof.",
	f1Title: "Dox Studio for Certificates", f1Desc: "Instant generation of student certificates and grade reports in 4K print resolution compliant with official formats.",
	f2Title: "Precise Grading System", f2Desc: "Advanced management of subjects, classes, and assignments, with automated cumulative GPA calculations.",
	f3Title: "Behavior & Attendance", f3Desc: "Accurate documentation of student attendance and behavioral infractions to ensure a disciplined educational environment.",
	f4Title: "Parents Management", f4Desc: "Direct connection between student records and parents to facilitate communication and send periodic reports.",
	statsLabel1: "Total Software Initiatives", statsLabel2: "Core OPERIX Modules", statsLabel3: "Enterprise Clients", statsLabel4: "Platform Stability Runtime",
	ctaTitle: "Start your smart school journey today", ctaSub: "Join the digital transformation with OPERIX Edu's tailored infrastructure.",
	footerTagline: "A product by OPERIX Solutions for digital systems.", footerProduct: "Product", footerCompany: "Company", footerContact: "Contact",
	footerLinks: ["Features", "Pricing", "Book a Demo", "Login"], footerCompanyLinks: ["About OPERIX", "Solutions", "Careers", "Blog"],
	footerRights: "© 2026 OPERIX Solutions. All rights reserved.", footerVat: "VAT Reg. No: 310XXXXXXXXX | Riyadh, Saudi Arabia",
	supportTitle: "Support Center", supportSub: "We're here to help you 24/7. Reach out via any channel below.",
	termsTitle: "Terms of Use & Privacy Policy", termsEffective: "Effective Date: January 1, 2026 | Version 2.1", termsClose: "I Understand & Agree",
	modalTitle: "Request a Demo", modalSub: "Fill out your school's details and our academic systems team will contact you.",
	submit: "Send Request", submitting: "Sending...",
	phoneLabel: "Country & Phone Number", searchCountry: "Search country...", phonePlaceholder: "Phone number (e.g. 5x xxx xxxx)"
  },
  ar: {
	navFeatures: "المميزات", navVision: "الرؤية الأكاديمية", pricing: "الأسعار", login: "تسجيل الدخول", supportBtn: "الدعم الفني",
	badge: "الإصدار المؤسسي للمدارس 2026", heroTitle1: "مستقبل الإدارة المدرسية", heroTitle2: "يبدأ من هنا.",
	heroSub: "منصة سحابية متكاملة مصممة خصيصاً لتلبي معايير العمليات التعليمية الحديثة. نجمع بين رصانة الإدارة الأكاديمية وسلاسة التقنية لتمكين قادة المدارس والمعلمين.",
	demoBtn: "طلب عرض تجريبي", platformBtn: "دخول المنصة",
	trustBadge1: "41 مشروعاً تقنياً", trustBadge2: "5+ أنظمة أساسية", trustBadge3: "بنية برمجية عالية الاستقرار",
	visionTitle: "لأن وقت المعلم أثمن من أن يضيع في الأعمال الورقية.",
	visionDesc: '"صُمم OPERIX Edu بأيدي خبراء تقنيين وبرؤية قادة أكاديميين. نحن ندرك أن جودة التعليم تبدأ من استقرار الإدارة، ولذلك وفرنا أدوات دقيقة لرصد الدرجات، تحليل السلوك، واستخراج الشهادات الرقمية بنقرة واحدة، ليتفرغ المعلم لرسالته الأسمى: بناء العقول."',
	featuresTitle: "بنية تحتية متكاملة لمدارس المستقبل", featuresSub: "كل ما تحتاجه الإدارة المدرسية تحت سقف رقمي واحد.",
	f1Title: "Dox Studio للشهادات", f1Desc: "استخراج فوري لشهادات الطلاب وإشعارات الدرجات بدقة طباعة 4K متوافقة مع التنسيقات التنظيمية.",
	f2Title: "نظام رصد أكاديمي دقيق", f2Desc: "إدارة متقدمة للمواد الدراسية، الفصول، والواجبات، مع حساب آلي للمعدلات التراكمية.",
	f3Title: "السلوك والمواظبة", f3Desc: "توثيق دقيق لحضور الطلاب ومخالفاتهم السلوكية لضمان بيئة تعليمية منضبطة.",
	f4Title: "إدارة أولياء الأمور", f4Desc: "ربط مباشر بين بيانات الطالب وولي أمره لتسهيل التواصل وإرسال التقارير الدورية.",
	statsLabel1: "إجمالي المشروعات الرقمية", statsLabel2: "منظومات OPERIX الأساسية", statsLabel3: "شركاء استراتيجيين", statsLabel4: "معدل استقرار الأداء التشغيلي",
	ctaTitle: "ابدأ رحلة الإدارة الذكية اليوم", ctaSub: "انضم إلى التحول الرقمي مع بنية OPERIX Edu التحتية المتكاملة.",
	footerTagline: "إحدى منتجات شركة OPERIX Solutions للأنظمة الرقمية.", footerProduct: "المنتج", footerCompany: "الشركة", footerContact: "التواصل",
	footerLinks: ["المميزات", "الأسعار", "طلب عرض", "تسجيل الدخول"], footerCompanyLinks: ["عن أوبيريكس", "الحلول", "الوظائف", "المدونة"],
	footerRights: "© 2026 أوبيريكس سوليوشنز. جميع الحقوق محفوظة.", footerVat: "الرقم الضريبي: 310XXXXXXXXX | الرياض، المملكة العربية السعودية",
	supportTitle: "مركز الدعم", supportSub: "نحن هنا لمساعدتك على مدار الساعة. تواصل معنا عبر أي قناة أدناه.",
	termsTitle: "شروط الاستخدام وسياسة الخصوصية", termsEffective: "تاريخ السريان: 1 يناير 2026 | الإصدار 2.1", termsClose: "أوافق وأفهم",
	modalTitle: "طلب عرض تجريبي", modalSub: "أدخل بيانات المدرسة وسيتواصل معك فريق الأنظمة الأكاديمية قريباً.",
	submit: "إرسال الطلب", submitting: "جاري الإرسال...",
	phoneLabel: "الدولة ورقم الهاتف", searchCountry: "البحث عن دولة...", phonePlaceholder: "رقم الجوال (مثال: xxxx xxx 5x)"
  }
};

function getTermsSections(isAr: boolean) {
  if (isAr) return [
	{ title: '١. القبول والموافقة على الاتفاقية', body: 'باستخدامك منصة OPERIX Edu أو الاشتراك في أي باقاتها، فإنك تقر بأنك مخوّل قانونياً للتعاقد نيابةً عن المؤسسة التعليمية التي تمثلها وتوافق على الالتزام الكامل بهذه الشروط.' },
	{ title: '٢. الامتثال للأنظمة والقوانين - المملكة العربية السعودية', body: 'في حال استخدام المنظومة لإدارة العمليات التجارية والتعاقدية داخل المملكة العربية السعودية، يلتزم الطرفان بنظام حماية البيانات الشخصية (PDPL) والضوابط الصادرة عن هيئة الزكاة والضريبة والجمارك (ZATCA) للفوترة الإلكترونية فقط عند إتمام صفقات البيع والفوترة المالية الخاضعة للأنظمة المحلية للمملكة.' },
	{ title: '٣. الامتثال للأنظمة والقوانين - جمهورية السودان', body: 'في ما يخص العمليات وقواعد بيانات المستخدمين في جمهورية السودان، تلتزم OPERIX Solutions بأحكام قانون الاتصالات السوداني، والتوجيهات الصادرة عن هيئة تنظيم الاتصالات السودانية واللوائح التعليمية المحلية ذات الصلة.' },
	{ title: '٤. طبيعة الخدمة وحدود مسؤولية OPERIX Solutions', body: 'تقدم شركة OPERIX Solutions منصة OPERIX Edu بوصفها حلاً تقنياً بحتاً (Technology Solution Provider). المنصة مخصصة للعمليات التعليمية والأكاديمية ولا تحتوي على بوابات ربط تجارية مباشرة للفوترة الضريبية بداخلها، وتتحمل كل مؤسسة مسؤوليتها الحصرية في مراجعة البيانات.' }
  ];
  return [
	{ title: '1. Acceptance & Binding Agreement', body: 'By accessing or using the OPERIX Edu platform, you confirm that you are legally authorized to bind the educational institution to these Terms.' },
	{ title: '2. Regulatory Compliance — Kingdom of Saudi Arabia', body: 'When commercial transactions or system provisioning occur within Saudi Arabia, compliance with the Personal Data Protection Law (PDPL) and ZATCA e-invoicing mandates is strictly limited to localized sales processing and transactional contract execution matching Saudi financial law.' },
	{ title: '3. Regulatory Compliance — Republic of Sudan', body: 'For operations related to the Republic of Sudan, OPERIX Solutions complies with the Sudanese Telecommunications Act and respective regional educational archiving policies.' },
	{ title: '4. Tech Provider Disclaimer', body: 'OPERIX Solutions delivers OPERIX Edu strictly as a specialized scholastic infrastructure solution. Core academic deployments do not natively wrap tax-clearance models inside regular daily curriculum tasks.' }
  ];
}

function SupportModal({ t, isAr, onClose }: any) {
  const contacts = [
	{ icon: <Mail size={18} />, label: isAr ? 'الاستفسارات العامة' : 'General Inquiries', value: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com' },
	{ icon: <HelpCircle size={18} />, label: isAr ? 'الدعم الفني' : 'Technical Support', value: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com' },
	{ icon: <FileText size={18} />, label: isAr ? 'الاشتراكات' : 'Subscriptions', value: 'subscription@operix-solutions.com', href: 'mailto:subscription@operix-solutions.com' },
  ];
  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeInModal 0.2s ease' }} onClick={onClose}>
	  <div style={{ background: theme.white, borderRadius: '20px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)', direction: isAr ? 'rtl' : 'ltr' }} onClick={e => e.stopPropagation()}>
		<div style={{ background: `linear-gradient(135deg, ${theme.navy}, ${theme.navyMid})`, padding: '28px', position: 'relative' }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
			<div style={{ background: `${theme.royal}44`, color: '#60a5fa', padding: '10px', borderRadius: '12px' }}><HelpCircle size={22} /></div>
			<div>
			  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.white }}>{t.supportTitle}</h3>
			  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{t.supportSub}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position: 'absolute', top: '16px', [isAr ? 'left' : 'right']: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: theme.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
		</div>
		<div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
		  {contacts.map((c, i) => (
			<a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '14px', border: `1.5px solid ${theme.border}`, background: theme.slate, textDecoration: 'none', color: theme.navy, transition: 'border-color 0.2s, box-shadow 0.2s' }}
			  onMouseOver={e => { e.currentTarget.style.borderColor = theme.royal; e.currentTarget.style.boxShadow = `0 4px 12px ${theme.royal}22`; }}
			  onMouseOut={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none'; }}>
			  <div style={{ color: theme.royal, background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>{c.icon}</div>
			  <div>
				<div style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
				<div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px', color: theme.navy }}>{c.value}</div>
			  </div>
			</a>
		  ))}
		  <button onClick={onClose} style={{ marginTop: '8px', width: '100%', padding: '14px', background: theme.navy, color: theme.white, border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>{t.termsClose}</button>
		</div>
	  </div>
	</div>
  );
}

function TermsModal({ t, isAr, onClose }: any) {
  const sections = getTermsSections(isAr);
  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
	  <div style={{ background: theme.white, borderRadius: '20px', width: '100%', maxWidth: '680px', overflow: 'hidden', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)', direction: isAr ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
		<div style={{ background: `linear-gradient(135deg, ${theme.navy}, ${theme.navyMid})`, padding: '28px', position: 'relative', flexShrink: 0 }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
			<div style={{ background: `${theme.royal}44`, color: '#60a5fa', padding: '10px', borderRadius: '12px' }}><ShieldCheck size={22} /></div>
			<div>
			  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.white }}>{t.termsTitle}</h3>
			  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{t.termsEffective}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position: 'absolute', top: '16px', [isAr ? 'left' : 'right']: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: theme.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
		</div>
		<div style={{ padding: '16px 24px', background: '#f0f9ff', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
		  {[{ flag: '🇸🇦', label: isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia' }, { flag: '🇸🇩', label: isAr ? 'جمهورية السودان' : 'Republic of Sudan' }, { flag: '🛡️', label: isAr ? 'سياسة بيانات OPERIX' : 'OPERIX Data Policy' }].map((b, i) => (
			<span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: theme.white, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, color: theme.navy }}>{b.flag} {b.label}</span>
		  ))}
		</div>
		<div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
		  {sections.map((s, i) => (
			<div key={i} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: i < sections.length - 1 ? `1px dashed ${theme.border}` : 'none' }}>
			  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: theme.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>
				<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: '#eff6ff', color: theme.royal, borderRadius: '6px', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
				{s.title}
			  </h4>
			  <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, lineHeight: 1.8 }}>{s.body}</p>
			</div>
		  ))}
		  <div style={{ background: '#fffbeb', border: `1.5px solid #fde68a`, borderRadius: '12px', padding: '16px', marginTop: '8px' }}>
			<p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.7, fontWeight: 600 }}>
			  {isAr ? '⚠️ تنويه: شركة OPERIX Solutions هي مزوّد تقنية فقط. لا تتحمل الشركة أي مسؤولية عن المحتوى المُدخل في المنصة أو أي مخرجات تُستخدم من قِبَل المؤسسة التعليمية. جميع البيانات والقرارات هي مسؤولية المؤسسة التعليمية حصراً.' : '⚠️ Disclaimer: OPERIX Solutions is a technology provider only. The company bears no responsibility for content entered into or outputs generated from the platform. All data and decisions are the sole responsibility of the educational institution.'}
			</p>
		  </div>
		</div>
		<div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
		  <button onClick={onClose} style={{ width: '100%', padding: '14px', background: theme.royal, color: theme.white, border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '15px', transition: 'background 0.2s' }}
			onMouseOver={e => e.currentTarget.style.background = theme.royalLight}
			onMouseOut={e => e.currentTarget.style.background = theme.royal}>
			{t.termsClose}
		  </button>
		</div>
	  </div>
	</div>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollVisible();
  useEffect(() => {
	if (!visible) return;
	const duration = 1400;
	const steps = 30;
	const increment = target / steps;
	let current = 0;
	const timer = setInterval(() => {
	  current += increment;
	  if (current >= target) { setCount(target); clearInterval(timer); }
	  else setCount(Math.floor(current));
	}, duration / steps);
	return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function HeroDashboard({ isAr }: { isAr: boolean }) {
  return (
	<div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
	  <div style={{ position: 'absolute', inset: '-20px', background: `radial-gradient(ellipse at center, ${theme.royal}18, transparent 70%)`, filter: 'blur(30px)', borderRadius: '50%' }} />
	  <div style={{ background: theme.white, borderRadius: '20px', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.15)', border: `1px solid ${theme.border}`, overflow: 'hidden', position: 'relative' }}>
		<div style={{ background: theme.navy, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
		  <div style={{ display: 'flex', gap: '6px' }}>
			{['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
		  </div>
		  <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', direction: 'ltr' }}>operix-edu / dashboard.tsx</span>
		</div>
		<div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
		  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
			{[
			  { val: '41', label: isAr ? 'مبادرة رقمية' : 'Digital Initiatives', color: theme.royal },
			  { val: '5+', label: isAr ? 'منظومات مجمعة' : 'Core Solutions', color: theme.green },
			  { val: '3', label: isAr ? 'شركاء استراتيجيين' : 'Enterprise Clients', color: theme.pencil },
			].map((stat, i) => (
			  <div key={i} style={{ background: theme.slate, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
				<div style={{ fontSize: '20px', fontWeight: 900, color: stat.color, fontFamily: 'monospace' }}>{stat.val}</div>
				<div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: 700, marginTop: '2px' }}>{stat.label}</div>
			  </div>
			))}
		  </div>
		  <div style={{ background: theme.slate, borderRadius: '10px', padding: '14px' }}>
			<div style={{ fontSize: '11px', fontWeight: 700, color: theme.navy, marginBottom: '10px' }}>{isAr ? 'تحليل الأداء الأسبوعي' : 'Weekly Performance'}</div>
			<div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '52px' }}>
			  {[50, 65, 55, 85, 70, 95, 90].map((h, i) => (
				<div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', background: i === 5 ? theme.pencil : `${theme.royal}88`, transition: 'height 0.5s ease' }} />
			  ))}
			</div>
		  </div>
		  {[
			{ dot: theme.green, text: isAr ? 'تم إصدار 12 شهادة اليوم' : '12 certificates issued today' },
			{ dot: theme.royal, text: isAr ? 'تحديث سجلات الفصل 3/أ' : 'Class 3A records updated' },
			{ dot: theme.pencil, text: isAr ? 'تقرير مالي شهري جاهز' : 'Monthly financial report ready' },
		  ].map((item, i) => (
			<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 2 ? `1px solid ${theme.border}` : 'none' }}>
			  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
			  <span style={{ fontSize: '12px', color: theme.ink, fontWeight: 600 }}>{item.text}</span>
			</div>
		  ))}
		</div>
	  </div>
	  <div style={{ position: 'absolute', top: '-16px', [isAr ? 'left' : 'right']: '-20px', background: theme.pencil, color: theme.navy, padding: '10px 14px', borderRadius: '14px', boxShadow: `0 8px 24px ${theme.pencil}55`, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', animation: 'floatBadge 3s ease-in-out infinite' }}>
		<GraduationCap size={18} /> Dox Studio
	  </div>
	</div>
  );
}

function FeatureCard({ icon, title, desc, index }: any) {
  const { ref, visible } = useScrollVisible();
  const [hovered, setHovered] = useState(false);
  return (
	<div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
	  style={{ backgroundColor: hovered ? theme.navy : theme.white, padding: '36px 32px', borderRadius: '20px', border: `1.5px solid ${hovered ? theme.navy : theme.border}`, boxShadow: hovered ? '0 20px 40px rgba(15,23,42,0.18)' : '0 4px 16px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', cursor: 'default', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${index * 0.08}s` }}>
	  <div style={{ width: '60px', height: '60px', backgroundColor: hovered ? `${theme.pencil}22` : theme.pencilLight, color: theme.pencil, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', transition: 'all 0.3s' }}>
		{icon}
	  </div>
	  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: hovered ? theme.white : theme.navy, margin: '0 0 12px 0', transition: 'color 0.3s' }}>{title}</h3>
	  <p style={{ color: hovered ? '#94a3b8' : theme.textMuted, lineHeight: 1.7, margin: 0, transition: 'color 0.3s', fontSize: '0.95rem' }}>{desc}</p>
	</div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('ar');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [demoForm, setDemoForm] = useState({ 
	name: '', email: '', school: '', students: '1-200',
	country: COUNTRIES[0], phone: '' 
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const isAr = lang === 'ar';
  const t = translations[isAr ? 'ar' : 'en'];

  useEffect(() => {
	const onScroll = () => setScrolled(window.scrollY > 20);
	window.addEventListener('scroll', onScroll);
	return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
	{ title: t.f1Title, desc: t.f1Desc, icon: <Award size={28} /> },
	{ title: t.f2Title, desc: t.f2Desc, icon: <LineChart size={28} /> },
	{ title: t.f3Title, desc: t.f3Desc, icon: <ShieldCheck size={28} /> },
	{ title: t.f4Title, desc: t.f4Desc, icon: <Users size={28} /> },
  ];

  const handleDemoRequest = async (e: React.FormEvent) => {
	e.preventDefault();
	setIsSubmitting(true);
	
	const adminPayload = { 
	  action: 'sendEmail', to: TARGET_EMAIL, subject: `New EDU Lead: ${demoForm.school}`, 
	  body: `NEW OPERIX EDU DEMO REQUEST 🎓\n\nName: ${demoForm.name}\nEmail: ${demoForm.email}\nPhone: ${demoForm.country.dial} ${demoForm.phone}\nCountry: ${demoForm.country.name}\nSchool: ${demoForm.school}\nStudents: ${demoForm.students}`, 
	  senderName: 'Operix Edu', senderEmail: 'system@operix.com' 
	};
	
	const userPayload = { 
	  action: 'sendEmail', to: demoForm.email, subject: `Request Confirmed - Operix Edu`, 
	  body: `Hello ${demoForm.name},\n\nThank you for your interest in Operix Edu. Our academic team has received your details for ${demoForm.school}.\n\nAn educational systems expert will reach out to you shortly.\n\nBest regards,\nThe Operix Team`, 
	  senderName: 'Operix Team', senderEmail: 'system@operix.com' 
	};
	
	await Promise.all([gasCall(adminPayload), gasCall(userPayload)]);
	setIsSubmitting(false);
	setShowDemoModal(false);
	alert(isAr ? `تم الإرسال بنجاح يا ${demoForm.name}! سنتواصل معك قريباً.` : `Request sent, ${demoForm.name}! We will be in touch.`);
	setDemoForm({ name: '', email: '', school: '', students: '1-200', country: COUNTRIES[0], phone: '' });
  };

  const filteredCountries = COUNTRIES.filter(c => 
	c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
	c.nameAr.includes(countrySearch) || 
	c.dial.includes(countrySearch)
  );

  return (
	<div style={{ minHeight: '100vh', backgroundColor: theme.slate, direction: isAr ? 'rtl' : 'ltr', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

	  {/* ─── HEADER ─── */}
	  <header style={{ backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : theme.white, backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: `1px solid ${theme.border}`, padding: '14px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease', boxShadow: scrolled ? '0 4px 24px rgba(15,23,42,0.06)' : 'none' }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
		  <img src={logo} alt="OPERIX Edu" style={{ height: '38px', objectFit: 'contain' }} />
		</div>
		<nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
		  {[{ label: t.navFeatures, href: '#features' }, { label: t.navVision, href: '#academic' }].map((item, i) => (
			<a key={i} href={item.href} style={{ textDecoration: 'none', color: theme.textMuted, fontWeight: 700, padding: '8px 14px', borderRadius: '8px', fontSize: '0.9rem', transition: 'color 0.2s, background 0.2s' }}
			  onMouseOver={e => { e.currentTarget.style.color = theme.navy; e.currentTarget.style.background = theme.slate; }}
			  onMouseOut={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.background = 'transparent'; }}>
			  {item.label}
			</a>
		  ))}
		  <Link to="/subscriptions" style={{ textDecoration: 'none', color: theme.textMuted, fontWeight: 700, padding: '8px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>{t.pricing}</Link>
		  <div style={{ width: '1px', height: '20px', backgroundColor: theme.border, margin: '0 4px' }} />
		  <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
			<Globe size={16} /> {isAr ? 'EN' : 'عربي'}
		  </button>
		  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>{t.supportBtn}</button>
		  <button onClick={() => setShowDemoModal(true)} style={{ backgroundColor: theme.pencilLight, color: theme.pencilDark, border: `1.5px solid #fde68a`, padding: '9px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
			onMouseOver={e => { e.currentTarget.style.background = theme.pencil; e.currentTarget.style.color = theme.white; }}
			onMouseOut={e => { e.currentTarget.style.background = theme.pencilLight; e.currentTarget.style.color = theme.pencilDark; }}>
			{t.demoBtn}
		  </button>
		  <Link to="/login" style={{ backgroundColor: theme.navy, color: theme.white, textDecoration: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', transition: 'background 0.2s' }}>{t.login}</Link>
		</nav>
	  </header>

	  {/* ─── HERO ─── */}
	  <section style={{ padding: '80px 5% 100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '60px', backgroundColor: theme.white, position: 'relative', overflow: 'hidden' }}>
		<div style={{ position: 'absolute', top: '10%', [isAr ? 'left' : 'right']: '2%', opacity: 1, pointerEvents: 'none' }}>
		  <AcademicSketch color="#cbd5e1" size={220} />
		</div>
		<div style={{ position: 'absolute', bottom: '5%', [isAr ? 'right' : 'left']: '0%', opacity: 0.6, pointerEvents: 'none' }}>
		  <AcademicSketch color="#dbeafe" size={150} />
		</div>

		<div style={{ flex: '1 1 480px', maxWidth: '620px', position: 'relative', animation: 'slideInRight 0.7s ease' }}>
		  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff', color: theme.royal, padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', marginBottom: '28px', border: `1px solid #bfdbfe` }}>
			<Sparkles size={14} /> {t.badge}
		  </div>
		  <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 900, color: theme.navy, margin: '0 0 24px 0', lineHeight: 1.15, letterSpacing: '-1.5px' }}>
			{t.heroTitle1} <br/> <span style={{ color: theme.pencil, position: 'relative' }}>{t.heroTitle2}<span style={{ position: 'absolute', bottom: '-4px', [isAr ? 'right' : 'left']: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, ${theme.pencil}, transparent)`, borderRadius: '2px' }} /></span>
		  </h2>
		  <p style={{ fontSize: '1.1rem', color: theme.textMuted, lineHeight: 1.85, margin: '0 0 36px 0' }}>{t.heroSub}</p>

		  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
			{[t.trustBadge1, t.trustBadge2, t.trustBadge3].map((b, i) => (
			  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: theme.slate, border: `1.5px solid ${theme.border}`, borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 800, color: theme.navy }}>
				<CheckCircle size={13} color={theme.green} /> {b}
			  </span>
			))}
		  </div>

		  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
			<Link to="/login" style={{ backgroundColor: theme.royal, color: theme.white, textDecoration: 'none', padding: '15px 28px', borderRadius: '12px', fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 8px 24px ${theme.royal}40`, transition: 'all 0.2s' }}>
			  {t.platformBtn} {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
			</Link>
			<button onClick={() => setShowDemoModal(true)} style={{ backgroundColor: theme.pencil, color: theme.white, border: 'none', padding: '15px 28px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: `0 8px 24px ${theme.pencil}40`, transition: 'all 0.2s' }}>
			  {t.demoBtn}
			</button>
		  </div>
		</div>

		<div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', animation: 'slideInLeft 0.7s ease 0.15s both' }}>
		  <HeroDashboard isAr={isAr} />
		</div>
	  </section>

	  {/* ─── COMBINED STATS & VISION SECTION (NAVY BLUE) ─── */}
	  <section id="academic" style={{ backgroundColor: theme.navy, position: 'relative', overflow: 'hidden' }}>
		<div style={{ position: 'absolute', top: 0, [isAr ? 'right' : 'left']: '5%', opacity: 0.12, pointerEvents: 'none' }}>
		  <AcademicSketch color={theme.white} size={260} />
		</div>
		<div style={{ position: 'absolute', bottom: 0, [isAr ? 'left' : 'right']: '5%', opacity: 0.08, pointerEvents: 'none' }}>
		  <AcademicSketch color={theme.pencil} size={200} />
		</div>

		{/* Stats Row */}
		<div style={{ position: 'relative', zIndex: 1, padding: '80px 5% 40px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
		  {[
			{ value: 41, suffix: '', label: t.statsLabel1 },
			{ value: 5, suffix: '+', label: t.statsLabel2 },
			{ value: 3, suffix: '', label: t.statsLabel3 },
			{ value: 99.9, suffix: '%', label: t.statsLabel4 },
		  ].map((stat, i) => (
			<div key={i} style={{ flex: '1 1 200px', textAlign: 'center', padding: '0 24px', borderRight: i < 3 ? `1px solid rgba(255,255,255,0.08)` : 'none' }}>
			  <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, color: theme.pencil, fontFamily: 'monospace', lineHeight: 1.1 }}>
				<AnimatedCounter target={stat.value} suffix={stat.suffix} />
			  </div>
			  <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700, marginTop: '12px', lineHeight: 1.8 }}>
				{formatText(stat.label)}
			  </div>
			</div>
		  ))}
		</div>

		{/* Vision Text */}
		<div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '60px 5% 100px' }}>
		  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: `${theme.pencil}22`, borderRadius: '20px', marginBottom: '28px' }}>
			<BookOpen size={32} color={theme.pencil} />
		  </div>
		  <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, color: theme.white, marginBottom: '28px', lineHeight: 1.3 }}>
			{formatText(t.visionTitle)}
		  </h2>
		  <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 2.2, fontStyle: 'italic' }}>
			{formatText(t.visionDesc)}
		  </p>
		  <div style={{ position: 'absolute', top: '40px', [isAr ? 'right' : 'left']: '-20px', fontSize: '120px', color: `${theme.pencil}18`, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
		</div>
	  </section>

	  {/* ─── FEATURES ─── */}
	  <section id="features" style={{ padding: '100px 5%', background: theme.slate }}>
		<div style={{ textAlign: 'center', marginBottom: '64px' }}>
		  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.pencilLight, color: theme.pencilDark, padding: '7px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', marginBottom: '20px', border: `1px solid #fde68a` }}>
			<School size={14} /> {isAr ? 'المميزات الأكاديمية' : 'Academic Features'}
		  </div>
		  <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, color: theme.navy, margin: '0 0 16px 0' }}>{t.featuresTitle}</h2>
		  <p style={{ fontSize: '1.1rem', color: theme.textMuted, maxWidth: '560px', margin: '0 auto' }}>{t.featuresSub}</p>
		</div>
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
		  {features.map((feature, i) => <FeatureCard key={i} {...feature} index={i} />)}
		</div>
	  </section>

	  {/* ─── CTA STRIP ─── */}
	  <section style={{ padding: '80px 5%', background: `linear-gradient(135deg, ${theme.pencil}, ${theme.pencilDark})`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
		<div style={{ position: 'absolute', top: '10%', [isAr ? 'left' : 'right']: '5%', opacity: 0.2, pointerEvents: 'none' }}>
		  <AcademicSketch color={theme.white} size={180} />
		</div>
		<div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
		  <GraduationCap size={48} color="rgba(255,255,255,0.9)" style={{ marginBottom: '20px' }} />
		  <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: theme.navy, margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
			{t.ctaTitle}
		  </h2>
		  <p style={{ color: 'rgba(15,23,42,0.75)', fontSize: '1.05rem', margin: '0 0 32px 0', lineHeight: 1.7 }}>
			{t.ctaSub}
		  </p>
		  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
			<button onClick={() => setShowDemoModal(true)} style={{ background: theme.navy, color: theme.white, border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
			  {t.demoBtn}
			</button>
			<Link to="/subscriptions" style={{ background: 'rgba(255,255,255,0.25)', color: theme.navy, textDecoration: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', backdropFilter: 'blur(4px)', border: '1.5px solid rgba(255,255,255,0.5)' }}>
			  {t.pricing}
			</Link>
		  </div>
		</div>
	  </section>

	  {/* ─── FOOTER ─── */}
	  <footer style={{ backgroundColor: theme.white, borderTop: `1px solid ${theme.border}`, padding: '64px 5% 0' }}>
		<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
		  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', paddingBottom: '48px', borderBottom: `1px solid ${theme.border}` }}>
			<div>
			  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
				<img src={logo} alt="OPERIX" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
				<span style={{ fontSize: '1.1rem', fontWeight: 900, color: theme.navy }}>OPERIX <span style={{ color: theme.pencil }}>Edu</span></span>
			  </div>
			  <p style={{ color: theme.textMuted, fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 20px 0' }}>{t.footerTagline}</p>
			  <div style={{ display: 'flex', gap: '8px' }}>
				{['🇸🇦', '🇸🇩'].map((f, i) => (
				  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: theme.slate, border: `1px solid ${theme.border}`, fontSize: '16px' }}>{f}</span>
				))}
			  </div>
			</div>
			<div>
			  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.navy, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>{t.footerProduct}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<a href="#features" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>{t.footerLinks[0]}</a>
				<Link to="/subscriptions" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>{t.footerLinks[1]}</Link>
				<button onClick={() => setShowDemoModal(true)} style={{ background: 'none', border: 'none', padding: 0, textAlign: isAr ? 'right' : 'left', color: theme.textMuted, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>{t.footerLinks[2]}</button>
				<Link to="/login" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>{t.footerLinks[3]}</Link>
			  </div>
			</div>
			<div>
			  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.navy, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>{t.footerCompany}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				{t.footerCompanyLinks.map((link: string, i: number) => (
				  <a key={i} href="https://www.operix-solutions.com" target="_blank" rel="noreferrer" style={{ color: theme.textMuted, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>{link}</a>
				))}
			  </div>
			</div>
			<div>
			  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.navy, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>{t.footerContact}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				{[
				  { icon: <Mail size={15} />, val: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com' },
				  { icon: <HelpCircle size={15} />, val: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com' },
				  { icon: <Globe size={15} />, val: 'www.operix-solutions.com', href: 'https://www.operix-solutions.com' }
				].map((c, i) => (
				  <a key={i} href={c.href} target={i === 2 ? '_blank' : undefined} rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textMuted, textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
					<span style={{ color: theme.pencil }}>{c.icon}</span> {c.val}
				  </a>
				))}
			  </div>
			</div>
		  </div>
		  <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
			<div>
			  <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>{t.footerRights}</div>
			  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>{t.footerVat}</div>
			</div>
			<div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
			  <button onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
				<FileText size={15} /> {isAr ? 'الشروط والخصوصية' : 'Terms & Privacy'}
			  </button>
			  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
				<HelpCircle size={15} /> {t.supportBtn}
			  </button>
			</div>
		  </div>
		</div>
	  </footer>

	  {/* ─── DEMO MODAL WITH FIXED ORDER & DROPDOWN ─── */}
	  {showDemoModal && (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeInModal 0.2s ease' }}>
		  
		  <div style={{ background: theme.white, borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)', direction: isAr ? 'rtl' : 'ltr', zIndex: 9999, position: 'relative' }}>
			<div style={{ height: '5px', background: `linear-gradient(90deg, ${theme.pencil}, ${theme.royal})`, borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} />
			<div style={{ padding: '32px', maxHeight: '90vh', overflowY: 'auto' }} className="custom-scrollbar">
			  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
				<div>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
					<div style={{ background: theme.pencilLight, padding: '8px', borderRadius: '10px' }}><GraduationCap color={theme.pencil} size={22} /></div>
					<h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: theme.navy }}>{t.modalTitle}</h3>
				  </div>
				  <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{t.modalSub}</p>
				</div>
				<button onClick={() => setShowDemoModal(false)} style={{ background: theme.slate, border: `1px solid ${theme.border}`, borderRadius: '10px', width: '34px', height: '34px', cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
			  </div>
			  
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				
				{/* 1. الاسم الكامل */}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
				  <input type="text" style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
					value={demoForm.name} onChange={e => setDemoForm({ ...demoForm, name: e.target.value })} required
					onFocus={e => e.currentTarget.style.borderColor = theme.pencil}
					onBlur={e => e.currentTarget.style.borderColor = theme.border} />
				</div>

				{/* 2. الدولة ورقم الهاتف */}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{isAr ? 'الدولة ورقم الهاتف' : 'Country & Phone'}</label>
				  <div dir="ltr" style={{ position: 'relative', display: 'flex', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate }}>
					
					<div 
					  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
					  style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#e2e8f0', borderRight: `1px solid ${theme.border}`, borderTopLeftRadius: '8.5px', borderBottomLeftRadius: '8.5px' }}
					>
					  <span style={{ fontSize: '16px' }}>{demoForm.country.flag}</span>
					  <span style={{ fontWeight: 800, color: theme.navy, fontSize: '14px' }}>{demoForm.country.dial}</span>
					  <ChevronDown size={14} color={theme.textMuted} />
					</div>

					<input 
					  type="tel" required
					  placeholder={t.phonePlaceholder}
					  value={demoForm.phone} 
					  onChange={e => setDemoForm({ ...demoForm, phone: e.target.value.replace(/[^0-9]/g, '') })}
					  style={{ flex: 1, padding: '12px 16px', border: 'none', background: 'transparent', outline: 'none', color: theme.navy, fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }} 
					/>

					{/* القائمة المنسدلة للبحث */}
					{showCountryDropdown && (
					  <>
						{/* Invisible Backdrop for click-outside */}
						<div 
						  style={{ position: 'fixed', inset: 0, zIndex: 100000 }} 
						  onClick={(e) => { e.stopPropagation(); setShowCountryDropdown(false); }} 
						/>
						
						<div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', marginTop: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100001, overflow: 'hidden' }}>
						  <div style={{ padding: '10px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '8px', background: theme.slate }}>
							<Search size={16} color={theme.textMuted} />
							<input 
							  autoFocus
							  placeholder={t.searchCountry}
							  value={countrySearch}
							  onChange={(e) => setCountrySearch(e.target.value)}
							  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', direction: isAr ? 'rtl' : 'ltr' }}
							/>
						  </div>
						  <div style={{ maxHeight: '180px', overflowY: 'auto' }} className="custom-scrollbar">
							{filteredCountries.length > 0 ? filteredCountries.map((c) => (
							  <div 
								key={c.code}
								onMouseDown={() => { setDemoForm({ ...demoForm, country: c }); setShowCountryDropdown(false); setCountrySearch(''); }}
								style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: `1px solid ${theme.border}`, direction: isAr ? 'rtl' : 'ltr' }}
								onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
								onMouseOut={e => e.currentTarget.style.background = 'transparent'}
							  >
								<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								  <span style={{ fontSize: '18px' }}>{c.flag}</span>
								  <span style={{ fontSize: '13px', fontWeight: 600, color: theme.navy }}>{isAr ? c.nameAr : c.name}</span>
								</div>
								<span style={{ fontSize: '12px', fontWeight: 800, color: theme.textMuted, fontFamily: 'monospace' }} dir="ltr">{c.dial}</span>
							  </div>
							)) : (
							  <div style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>لا توجد نتائج</div>
							)}
						  </div>
						</div>
					  </>
					)}
				  </div>
				</div>

				{/* 3. اسم المنشأة التعليمية */}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{isAr ? 'اسم المنشأة التعليمية' : 'School/Institution Name'}</label>
				  <input type="text" style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
					value={demoForm.school} onChange={e => setDemoForm({ ...demoForm, school: e.target.value })} required
					onFocus={e => e.currentTarget.style.borderColor = theme.pencil}
					onBlur={e => e.currentTarget.style.borderColor = theme.border} />
				</div>

				{/* 4. البريد الإلكتروني للإدارة */}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{isAr ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}</label>
				  <input type="email" style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
					value={demoForm.email} onChange={e => setDemoForm({ ...demoForm, email: e.target.value })} required
					onFocus={e => e.currentTarget.style.borderColor = theme.pencil}
					onBlur={e => e.currentTarget.style.borderColor = theme.border} />
				</div>

				{/* 5. عدد الطلاب التقديري */}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{isAr ? 'عدد الطلاب التقديري' : 'Estimated Students'}</label>
				  <select style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }} value={demoForm.students} onChange={e => setDemoForm({ ...demoForm, students: e.target.value })}>
					<option value="1-200">1 - 200 {isAr ? 'طالب' : 'Students'}</option>
					<option value="201-500">201 - 500 {isAr ? 'طالب' : 'Students'}</option>
					<option value="501-1000">501 - 1000 {isAr ? 'طالب' : 'Students'}</option>
					<option value="1000+">1000+ {isAr ? 'طالب' : 'Students'}</option>
				  </select>
				</div>

				<button type="submit" onClick={handleDemoRequest} disabled={isSubmitting}
				  style={{ width: '100%', padding: '15px', background: isSubmitting ? theme.textMuted : `linear-gradient(135deg, ${theme.pencil}, ${theme.pencilDark})`, color: theme.white, border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 900, cursor: isSubmitting ? 'default' : 'pointer', marginTop: '4px', boxShadow: isSubmitting ? 'none' : `0 8px 24px ${theme.pencil}40`, transition: 'all 0.2s' }}>
				  {isSubmitting ? t.submitting : t.submit}
				</button>
			  </div>
			</div>
		  </div>
		</div>
	  )}

	  {showSupportModal && <SupportModal t={t} isAr={isAr} onClose={() => setShowSupportModal(false)} />}
	  {showTermsModal && <TermsModal t={t} isAr={isAr} onClose={() => setShowTermsModal(false)} />}

	  <style>{`
		@keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
		@keyframes slideInRight { from { opacity: 0; transform: translateX(${isAr ? '-' : ''}30px); } to { opacity: 1; transform: translateX(0); } }
		@keyframes slideInLeft { from { opacity: 0; transform: translateX(${isAr ? '' : '-'}30px); } to { opacity: 1; transform: translateX(0); } }
		@keyframes floatBadge { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
		* { box-sizing: border-box; }
		.custom-scrollbar::-webkit-scrollbar { width: 6px; }
		.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
		.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
	  `}</style>
	</div>
  );
}