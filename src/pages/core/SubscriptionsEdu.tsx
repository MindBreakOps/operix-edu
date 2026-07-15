import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, X, Globe, Mail, FileText,
  HelpCircle, ShieldCheck, GraduationCap, Building2,
  Sparkles, Star, Zap, ArrowRight, ChevronLeft, Award
} from 'lucide-react';
import logo from '../../assets/logo.png';

const OPS_API = 'https://script.google.com/macros/s/AKfycbxzwlFPfOFiUS5atnjkAuXDcr-L_-LSY33_S9d6t12P36qmTWthc00ywCKpReFxzLY/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';

const theme = { 
  navy: '#0f172a', 
  navyMid: '#1e293b',
  royal: '#2563eb',
  royalLight: '#3b82f6',
  pencil: '#f59e0b',
  pencilLight: '#fef3c7',
  pencilDark: '#d97706',
  slate: '#f8fafc', 
  white: '#ffffff', 
  border: '#e2e8f0', 
  textMuted: '#64748b',
  success: '#10b981',
  successLight: '#ecfdf5',
  danger: '#ef4444'
};

const gasCall = async (payload: any) => {
  try {
	await fetch(OPS_API, { method: 'POST', mode: 'no-cors', cache: 'no-cache', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
	return { success: true };
  } catch (e) { return { success: false }; }
};

function useScrollVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
	const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
	if (ref.current) obs.observe(ref.current);
	return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── ACADEMIC SKETCH ───
function AcademicSketch({ color = '#e2e8f0', size = 160 }: { color?: string; size?: number }) {
  return (
	<svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
	  <rect x="30" y="40" width="100" height="80" rx="4" stroke={color} strokeWidth="2" fill="none"/>
	  <line x1="30" y1="60" x2="130" y2="60" stroke={color} strokeWidth="1.5"/>
	  <line x1="45" y1="74" x2="115" y2="74" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="45" y1="85" x2="115" y2="85" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <line x1="45" y1="96" x2="90" y2="96" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
	  <circle cx="55" cy="50" r="5" fill={color}/>
	  <circle cx="70" cy="50" r="5" fill={color}/>
	  <circle cx="85" cy="50" r="5" fill={color}/>
	  <path d="M68 20 L80 14 L92 20 L80 26 Z" stroke={color} strokeWidth="1.5" fill="none"/>
	  <line x1="80" y1="26" x2="80" y2="36" stroke={color} strokeWidth="1.5"/>
	  <path d="M20 140 L28 120 L32 140" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
	  <path d="M128 130 L136 110 L140 130" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
	</svg>
  );
}

// ─── TRANSLATIONS ───
const translations: Record<string, any> = {
  en: {
	title: "Simple, Transparent Pricing",
	subtitle: "Choose the perfect plan for your educational institution. All plans include continuous updates and dedicated technical support.",
	monthly: "Monthly",
	annual: "Annual",
	annualSave: "Save 20%",
	currencySAR: "SAR",
	currencyUSD: "USD",
	vatNote: "All prices exclude 15% VAT. Fully compliant with ZATCA Fatoorah Phase 1 & 2.",
	USDNote: "International pricing. Local taxes may apply per jurisdiction.",
	popular: "Most Popular",
	startBtn: "Get Started",
	demoBtn: "Request Custom Quote",
	perMonthSAR: "/ SAR mo",
	perYearSAR: "/ SAR yr",
	perMonthUSD: "/ USD mo",
	perYearUSD: "/ USD yr",
	custom: "Custom",
	faq1Q: "Is my data secure?",
	faq1A: "Yes. All data is encrypted with AES-256 at rest and TLS 1.3 in transit. We never share data with third parties.",
	faq2Q: "Can I switch plans later?",
	faq2A: "Absolutely. You can upgrade or downgrade at any billing cycle with prorated adjustments.",
	faq3Q: "Is the platform ZATCA compliant?",
	faq3A: "Yes. OPERIX Edu is fully compliant with ZATCA e-invoicing requirements (Fatoorah) Phases 1 & 2 for Saudi Arabia.",
	modalTitle: "Request a Demo / Quote",
	modalSub: "Fill out your school's details and our academic systems team will contact you.",
	submit: "Send Request",
	submitting: "Sending...",
	supportTitle: "Support Center",
	supportSub: "We're here to help you 24/7.",
	termsTitle: "Terms of Use & Privacy Policy",
	termsEffective: "Effective Date: January 1, 2026 | Version 2.1",
	termsClose: "I Understand & Agree",
  },
  ar: {
	title: "أسعار بسيطة وشفافة",
	subtitle: "اختر الباقة الأنسب لمنشأتك التعليمية. جميع الباقات تشمل التحديثات المستمرة والدعم الفني المتخصص.",
	monthly: "شهري",
	annual: "سنوي",
	annualSave: "وفّر 20%",
	currencySAR: "ر.س",
	currencyUSD: "دولار",
	vatNote: "الأسعار لا تشمل ضريبة القيمة المضافة 15%. النظام متوافق كلياً مع متطلبات هيئة الزكاة والضريبة (فاتورة المرحلة الأولى والثانية).",
	USDNote: "تسعير دولي. قد تُطبق الضرائب المحلية حسب دولتك.",
	popular: "الأكثر طلباً",
	startBtn: "ابدأ الآن",
	demoBtn: "طلب عرض سعر خاص",
	perMonthSAR: "/ ر.س شهرياً",
	perYearSAR: "/ ر.س سنوياً",
	perMonthUSD: "/ $ شهرياً",
	perYearUSD: "/ $ سنوياً",
	custom: "مخصص",
	faq1Q: "هل بياناتي آمنة؟",
	faq1A: "نعم. جميع البيانات مشفرة بمعيار AES-256 أثناء التخزين وTLS 1.3 أثناء النقل. لا نشارك البيانات مع أطراف ثالثة.",
	faq2Q: "هل يمكنني تغيير الباقة لاحقاً؟",
	faq2A: "بالتأكيد. يمكنك الترقية أو التخفيض في أي دورة فوترة مع تعديل تناسبي للرسوم.",
	faq3Q: "هل المنصة متوافقة مع ZATCA؟",
	faq3A: "نعم. OPERIX Edu متوافقة بالكامل مع متطلبات الفوترة الإلكترونية (فاتورة) بمرحلتيها الأولى والثانية من هيئة الزكاة.",
	modalTitle: "طلب عرض تجريبي",
	modalSub: "أدخل بيانات المدرسة وسيتواصل معك فريق الأنظمة الأكاديمية قريباً.",
	submit: "إرسال الطلب",
	submitting: "جاري الإرسال...",
	supportTitle: "مركز الدعم",
	supportSub: "نحن هنا لمساعدتك على مدار الساعة.",
	termsTitle: "شروط الاستخدام وسياسة الخصوصية",
	termsEffective: "تاريخ السريان: 1 يناير 2026 | الإصدار 2.1",
	termsClose: "أوافق وأفهم",
  }
};

// ─── PRICING PLANS ───
const pricingPlans = [
  {
	id: 'basic',
	icon: <GraduationCap size={24} />,
	nameAr: 'الأساسية',
	nameEn: 'Basic',
	descAr: 'للمدارس الناشئة ورياض الأطفال',
	descEn: 'For emerging schools & kindergartens',
	monthlyPriceSAR: 499,
	annualPriceSAR: 4790,
	monthlyPriceUSD: 135,
	annualPriceUSD: 1290,
	featuresAr: ['سجلات الطلاب (حتى 200 طالب)', 'الحضور والانصراف الأساسي', 'بوابة أولياء الأمور', 'تقارير أكاديمية أساسية', 'دعم فني عبر البريد'],
	featuresEn: ['Student Records (up to 200)', 'Basic Attendance Tracking', 'Parents Portal', 'Basic Academic Reports', 'Email Support'],
	isPopular: false,
	color: theme.royal,
  },
  {
	id: 'pro',
	icon: <Award size={24} />,
	nameAr: 'الاحترافية',
	nameEn: 'Professional',
	descAr: 'الخيار المتكامل للمدارس المتوسطة والثانوية',
	descEn: 'Comprehensive choice for K-12 schools',
	monthlyPriceSAR: 999,
	annualPriceSAR: 9590,
	monthlyPriceUSD: 265,
	annualPriceUSD: 2590,
	featuresAr: ['عدد طلاب غير محدود', 'نظام الرصد الأكاديمي والشهادات', 'إدارة الرسوم المالية (ZATCA)', 'السلوك والمواظبة المتقدم', 'Dox Studio للشهادات', 'دعم فني مع أولوية الرد'],
	featuresEn: ['Unlimited Students', 'Academic Grading & Certificates', 'Financials & Fees (ZATCA)', 'Advanced Behavior Tracking', 'Dox Studio Certificates', 'Priority Support'],
	isPopular: true,
	color: theme.pencil,
  },
  {
	id: 'enterprise',
	icon: <Building2 size={24} />,
	nameAr: 'الشركات التعليمية',
	nameEn: 'Enterprise',
	descAr: 'للمجمعات التعليمية وإدارة الفروع المتعددة',
	descEn: 'For school districts & multiple branches',
	monthlyPriceSAR: null,
	annualPriceSAR: null,
	monthlyPriceUSD: null,
	annualPriceUSD: null,
	featuresAr: ['إدارة فروع متعددة', 'Dox Studio بقوالب مخصصة', 'ربط API مع أنظمة الوزارة', 'مدير حساب مخصص', 'استضافة سحابية خاصة', 'اتفاقية مستوى خدمة SLA مخصصة'],
	featuresEn: ['Multi-branch Management', 'Dox Studio Custom Templates', 'Ministry API Integrations', 'Dedicated Account Manager', 'Private Cloud Hosting', 'Custom SLA Agreement'],
	isPopular: false,
	color: theme.navyMid,
  }
];

// ─── EXPANDED TERMS (shared with Landing) ───
function getTermsSections(isAr: boolean) {
  if (isAr) return [
	{ title: '١. القبول والموافقة على الاتفاقية', body: 'باستخدامك منصة OPERIX Edu أو الاشتراك في أيٍّ من باقاتها، فإنك تقر بأنك مخوّل قانونياً للتعاقد نيابةً عن المؤسسة التعليمية التي تمثلها، وتوافق على الالتزام الكامل بهذه الشروط والأحكام. تُعدّ هذه الاتفاقية سارية المفعول اعتباراً من تاريخ أول استخدام للمنصة أو توقيع عقد الاشتراك، أيهما أسبق.' },
	{ title: '٢. الامتثال للأنظمة والقوانين - المملكة العربية السعودية', body: 'تعمل OPERIX Edu في المملكة العربية السعودية وفقاً لنظام حماية البيانات الشخصية (PDPL)، ومتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) للفوترة الإلكترونية، وأنظمة وزارة التعليم السعودية، وإطار الأمن السيبراني الوطني (NCA). تلتزم الشركة بالإبلاغ عن أي اختراق للبيانات خلال المهل الزمنية النظامية.' },
	{ title: '٣. الامتثال للأنظمة والقوانين - جمهورية السودان', body: 'في ما يخص المستخدمين في جمهورية السودان، تلتزم OPERIX Solutions بأحكام قانون الاتصالات السوداني، وتوجيهات هيئة تنظيم الاتصالات السودانية، ولوائح وزارة التربية والتعليم السودانية المتعلقة بأرشفة السجلات المدرسية الرقمية.' },
	{ title: '٤. طبيعة الخدمة وحدود مسؤولية OPERIX Solutions', body: 'تقدم شركة OPERIX Solutions منصة OPERIX Edu بوصفها حلاً تقنياً بحتاً (Technology Solution Provider). الشركة لا تتحمل أي مسؤولية قانونية أو تربوية أو مالية عن المحتوى المُدخل في المنصة، بما يشمل: بيانات الطلاب، السجلات الأكاديمية، القرارات الإدارية، محتوى الشهادات، الرسوم الدراسية وطرق احتسابها، والمراسلات مع أولياء الأمور. تقتصر مسؤولية الشركة على ضمان توافر المنصة وأمانها التقني وفق اتفاقية مستوى الخدمة (SLA) المبرمة. المؤسسة التعليمية وحدها مسؤولة عن صحة البيانات المُدخلة وقانونيتها.' },
	{ title: '٥. حماية بيانات الطلاب والخصوصية', body: 'تُطبّق OPERIX Edu تشفير AES-256 أثناء التخزين وTLS 1.3 أثناء النقل على جميع البيانات. لا تُباع البيانات ولا تُشارك مع جهات إعلانية. يحق للمؤسسة طلب تصدير كامل لبياناتها أو حذفها عند إنهاء الاشتراك. يُحظر على موظفي الشركة الاطلاع على بيانات الطلاب إلا في حالات الدعم الفني المُصرَّح بها خطياً. يُحتفظ بسجلات الوصول لمدة لا تقل عن سنة.' },
	{ title: '٦. الفوترة والاشتراكات والإلغاء', body: 'تُحتسب رسوم الاشتراك وفق الباقة المختارة (شهرية أو سنوية). تخضع جميع الفواتير داخل المملكة لضريبة القيمة المضافة 15% وفق نظام الفاتورة الإلكترونية (FATOORAH). لا تُستردّ الرسوم المسددة عند الإلغاء قبل انتهاء الفترة، إلا في حالات خلل تقني موثق يُعزى للشركة. يجب تقديم طلب الإلغاء كتابياً قبل 30 يوماً من تاريخ التجديد.' },
	{ title: '٧. مستوى الخدمة وضمان التوافر (SLA)', body: 'تلتزم الشركة بتوافر المنصة بنسبة لا تقل عن 99.5% شهرياً بعد استثناء أوقات الصيانة المُعلَنة. في حال انخفض التوافر لأسباب تقنية خاضعة لسيطرة الشركة، تستحق المؤسسة رصيداً بالفترة القادمة. لا تتحمل الشركة أي خسائر غير مباشرة ناتجة عن توقف الخدمة.' },
	{ title: '٨. حقوق الملكية الفكرية', body: 'جميع عناصر المنصة من كود وتصميم وخوارزميات هي ملكية فكرية خالصة لشركة OPERIX Solutions. يحق للمؤسسة المشتركة استخدام المنصة لأغراضها الداخلية فحسب. يُحظر إعادة البيع أو المحاكاة أو نسخ التصميم. بيانات المؤسسة تظل ملكاً لها دائماً.' },
	{ title: '٩. تعديل الشروط والإشعارات', body: 'تحتفظ الشركة بحق تعديل الشروط مع إشعار المؤسسة كتابياً (عبر البريد المسجل) قبل 30 يوماً من سريان التعديلات. الاستمرار في الاستخدام يُعدّ قبولاً صريحاً.' },
	{ title: '١٠. القانون الواجب التطبيق والتقاضي', body: 'تخضع هذه الاتفاقية لأحكام نظام المعاملات التجارية السعودي. النزاعات تُعرض أولاً على الوساطة الودية، ثم مركز التحكيم التجاري لدول الخليج. للعمليات السودانية، يُطبَّق قانون التحكيم السوداني رقم (6) لسنة 2016.' },
  ];
  return [
	{ title: '1. Acceptance & Binding Agreement', body: 'By accessing OPERIX Edu or subscribing to any plan, you confirm you are legally authorized to bind the educational institution you represent. This agreement is effective from the date of first use or contract signing, whichever comes first.' },
	{ title: '2. Regulatory Compliance — Kingdom of Saudi Arabia', body: 'OPERIX Edu operates in Saudi Arabia in compliance with: the Saudi Personal Data Protection Law (PDPL); ZATCA e-invoicing requirements (Fatoorah) Phases 1 & 2; Ministry of Education guidelines on student data; and NCA Essential Cybersecurity Controls. Data breaches affecting KSA users are reported within regulatory timeframes.' },
	{ title: '3. Regulatory Compliance — Republic of Sudan', body: 'For Sudan-based operations, OPERIX Solutions complies with the Sudanese Telecommunications Act, TPRA guidelines, and Ministry of Education directives on digital archiving of school records.' },
	{ title: '4. Nature of Service & Limitation of Liability', body: 'OPERIX Solutions is a Technology Solution Provider only. The company bears no legal, educational, or financial responsibility for content entered by institutions, including: student data, academic records, administrative decisions, certificate content, fee structures, or parent communications. The company\'s liability is limited to platform availability and technical security per the agreed SLA.' },
	{ title: '5. Student Data Protection & Privacy', body: 'All data is encrypted with AES-256 at rest and TLS 1.3 in transit. Data is never sold or shared with advertisers. Institutions may request full data export or deletion upon cancellation. Staff may not access student data except in authorized technical support cases. Access logs are retained for a minimum of one year.' },
	{ title: '6. Billing, Subscriptions & Cancellation', body: 'Fees are per the selected plan (monthly or annual). KSA invoices are subject to 15% VAT per ZATCA Fatoorah mandates. No refunds for prepaid periods unless caused by documented company-side technical failure. Cancellation requires 30 days\' written notice before renewal.' },
	{ title: '7. Service Level Agreement (SLA)', body: 'Platform availability of no less than 99.5% per month is guaranteed, excluding announced maintenance. Downtime below this threshold due to company-side issues entitles the institution to service credit. Indirect losses from downtime are not covered.' },
	{ title: '8. Intellectual Property', body: 'All platform components are the exclusive IP of OPERIX Solutions. Institutions may use the platform for internal administration only. Re-selling, reverse engineering, or design copying is prohibited. Institution data remains the institution\'s property at all times.' },
	{ title: '9. Amendments & Notices', body: 'Terms may be amended with 30 days\' written notice to the institution\'s registered email. Continued use after this period constitutes acceptance of amended Terms.' },
	{ title: '10. Governing Law & Dispute Resolution', body: 'This agreement is governed by Saudi commercial transaction law. Disputes are first referred to friendly mediation, then to the GCC Commercial Arbitration Center. For Sudan operations, the Sudanese Arbitration Act No. 6 of 2016 applies.' },
  ];
}

// ─── SUPPORT MODAL ───
function SupportModal({ t, isAr, onClose }: any) {
  const contacts = [
	{ icon: <Mail size={18} />, label: isAr ? 'الاستفسارات العامة' : 'General Inquiries', value: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com' },
	{ icon: <HelpCircle size={18} />, label: isAr ? 'الدعم الفني' : 'Technical Support', value: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com' },
	{ icon: <FileText size={18} />, label: isAr ? 'الاشتراكات' : 'Subscriptions', value: 'subscription@operix-solutions.com', href: 'mailto:subscription@operix-solutions.com' },
  ];
  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }} onClick={onClose}>
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
			<a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '14px', border: `1.5px solid ${theme.border}`, background: theme.slate, textDecoration: 'none', color: theme.navy, transition: 'all 0.2s' }}
			  onMouseOver={e => { e.currentTarget.style.borderColor = theme.royal; e.currentTarget.style.boxShadow = `0 4px 12px ${theme.royal}22`; }}
			  onMouseOut={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none'; }}>
			  <div style={{ color: theme.royal, background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>{c.icon}</div>
			  <div>
				<div style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
				<div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{c.value}</div>
			  </div>
			</a>
		  ))}
		  <button onClick={onClose} style={{ marginTop: '8px', width: '100%', padding: '14px', background: theme.navy, color: theme.white, border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>{t.termsClose}</button>
		</div>
	  </div>
	</div>
  );
}

// ─── TERMS MODAL ───
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

// ─── PRICING CARD ───
function PricingCard({ plan, isAr, t, currency, isAnnual, onRequestDemo, index }: any) {
  const { ref, visible } = useScrollVisible();
  const [hovered, setHovered] = useState(false);
  const isCustom = plan.monthlyPriceSAR === null;
  const price = currency === 'SAR' ? (isAnnual ? plan.annualPriceSAR : plan.monthlyPriceSAR) : (isAnnual ? plan.annualPriceUSD : plan.monthlyPriceUSD);
  const perLabel = currency === 'SAR' ? (isAnnual ? t.perYearSAR : t.perMonthSAR) : (isAnnual ? t.perYearUSD : t.perMonthUSD);

  return (
	<div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
	  style={{ background: plan.isPopular ? `linear-gradient(160deg, ${theme.navy} 0%, ${theme.navyMid} 100%)` : theme.white, borderRadius: '24px', border: `2px solid ${plan.isPopular ? 'transparent' : hovered ? plan.color : theme.border}`, padding: '40px 32px', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: plan.isPopular ? `0 24px 48px rgba(37,99,235,0.18)` : hovered ? `0 16px 40px rgba(0,0,0,0.08)` : '0 4px 16px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', opacity: visible ? 1 : 0, transform: visible ? (plan.isPopular ? 'scale(1.03)' : 'translateY(0)') : 'translateY(20px)', transitionDelay: `${index * 0.1}s` }}>
	  
	  {plan.isPopular && (
		<div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(90deg, ${theme.pencil}, ${theme.pencilDark})`, color: theme.navy, padding: '6px 20px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
		  <Star size={12} fill="currentColor" /> {t.popular}
		</div>
	  )}

	  {/* Plan icon & name */}
	  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
		<div style={{ width: '48px', height: '48px', borderRadius: '14px', background: plan.isPopular ? `${theme.pencil}22` : `${plan.color}18`, color: plan.isPopular ? theme.pencil : plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
		  {plan.icon}
		</div>
		<div>
		  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: plan.isPopular ? theme.white : theme.navy, margin: 0 }}>{isAr ? plan.nameAr : plan.nameEn}</h3>
		  <p style={{ color: plan.isPopular ? '#94a3b8' : theme.textMuted, margin: 0, fontSize: '0.85rem', marginTop: '2px' }}>{isAr ? plan.descAr : plan.descEn}</p>
		</div>
	  </div>

	  {/* Price */}
	  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '24px 0 28px 0' }}>
		{isCustom ? (
		  <span style={{ fontSize: '2rem', fontWeight: 900, color: plan.isPopular ? theme.white : theme.navy }}>{t.custom}</span>
		) : (
		  <>
			<span style={{ fontSize: '2.6rem', fontWeight: 900, color: plan.isPopular ? theme.pencil : theme.navy, fontFamily: 'monospace', lineHeight: 1 }}>{price?.toLocaleString()}</span>
			<span style={{ color: plan.isPopular ? '#94a3b8' : theme.textMuted, fontWeight: 700, fontSize: '0.85rem' }}>{perLabel}</span>
		  </>
		)}
	  </div>

	  {/* Features */}
	  <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', flex: 1, marginBottom: '28px' }}>
		{(isAr ? plan.featuresAr : plan.featuresEn).map((feat: string, idx: number) => (
		  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
			<div style={{ color: plan.isPopular ? theme.pencil : theme.success, marginTop: '1px', flexShrink: 0 }}><Check size={16} strokeWidth={3} /></div>
			<span style={{ color: plan.isPopular ? '#e2e8f0' : theme.navy, fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4 }}>{feat}</span>
		  </div>
		))}
	  </div>

	  {/* CTA */}
	  <button onClick={onRequestDemo}
		style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: plan.isPopular ? `linear-gradient(135deg, ${theme.pencil}, ${theme.pencilDark})` : hovered ? plan.color : `${plan.color}14`, color: plan.isPopular ? theme.navy : hovered ? theme.white : plan.color, fontWeight: 900, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: plan.isPopular ? `0 8px 24px ${theme.pencil}44` : 'none' }}>
		{isCustom ? t.demoBtn : t.startBtn}
		{isAr ? <ChevronLeft size={16} /> : <ArrowRight size={16} />}
	  </button>
	</div>
  );
}

// ─── MAIN COMPONENT ───
export default function SubscriptionsEdu() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('ar');
  const [currency, setCurrency] = useState('SAR');
  const [isAnnual, setIsAnnual] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', school: '', students: '1-200' });
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isAr = lang === 'ar';
  const t = translations[isAr ? 'ar' : 'en'];

  useEffect(() => {
	const onScroll = () => setScrolled(window.scrollY > 20);
	window.addEventListener('scroll', onScroll);
	return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDemoRequest = async (e: React.FormEvent) => {
	e.preventDefault();
	setIsSubmitting(true);
	const adminPayload = { action: 'sendEmail', to: TARGET_EMAIL, subject: `New EDU Lead: ${demoForm.school}`, body: `NEW OPERIX EDU DEMO REQUEST 🎓\n\nName: ${demoForm.name}\nEmail: ${demoForm.email}\nSchool: ${demoForm.school}\nStudents: ${demoForm.students}`, senderName: 'Operix Edu', senderEmail: 'system@operix.com' };
	const userPayload = { action: 'sendEmail', to: demoForm.email, subject: `Request Confirmed - Operix Edu`, body: `Hello ${demoForm.name},\nThank you for your interest in Operix Edu.\n\nAn educational systems expert will reach out to you shortly.\n\nBest regards,\nThe Operix Team`, senderName: 'Operix Team', senderEmail: 'system@operix.com' };
	await Promise.all([gasCall(adminPayload), gasCall(userPayload)]);
	setIsSubmitting(false);
	setShowDemoModal(false);
	alert(isAr ? `تم الإرسال بنجاح يا ${demoForm.name}! سنتواصل معك قريباً.` : `Request sent, ${demoForm.name}! We will be in touch.`);
	setDemoForm({ name: '', email: '', school: '', students: '1-200' });
  };

  const faqs = [
	{ q: t.faq1Q, a: t.faq1A },
	{ q: t.faq2Q, a: t.faq2A },
	{ q: t.faq3Q, a: t.faq3A },
  ];

  return (
	<div style={{ minHeight: '100vh', backgroundColor: theme.slate, direction: isAr ? 'rtl' : 'ltr', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

	  {/* ─── HEADER ─── */}
	  <header style={{ backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : theme.white, backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: `1px solid ${theme.border}`, padding: '14px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s', boxShadow: scrolled ? '0 4px 24px rgba(15,23,42,0.06)' : 'none' }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
		  <img src={logo} alt="OPERIX Edu" style={{ height: '38px', objectFit: 'contain' }} />
		 <span style={{ fontSize: '1.3rem', fontWeight: 900, color: theme.navy, letterSpacing: '-0.3px' }}>
		   OPERIX <span style={{ color: theme.pencil }}>Edu</span>
		 </span>
		</div>
		<nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
		  <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
			<Globe size={16} /> {isAr ? 'EN' : 'عربي'}
		  </button>
		  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
			{isAr ? 'الدعم الفني' : 'Support'}
		  </button>
		  <button onClick={() => navigate('/login')} style={{ backgroundColor: theme.navy, color: theme.white, border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
			{isAr ? 'تسجيل الدخول' : 'Login'}
		  </button>
		</nav>
	  </header>

	  {/* ─── HERO HEADER ─── */}
	  <section style={{ padding: '80px 5% 48px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: theme.white, borderBottom: `1px solid ${theme.border}` }}>
		<div style={{ position: 'absolute', top: '10%', left: '3%', opacity: 1, pointerEvents: 'none' }}>
		  <AcademicSketch color="#e2e8f0" size={180} />
		</div>
		<div style={{ position: 'absolute', top: '10%', right: '3%', opacity: 1, pointerEvents: 'none' }}>
		  <AcademicSketch color="#dbeafe" size={160} />
		</div>
		<div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
		  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.pencilLight, color: theme.pencilDark, padding: '7px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', marginBottom: '24px', border: `1px solid #fde68a` }}>
			<Sparkles size={14} /> {isAr ? 'خطط مرنة لكل مؤسسة' : 'Flexible Plans for Every Institution'}
		  </div>
		  <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: theme.navy, marginBottom: '18px', letterSpacing: '-1px', lineHeight: 1.2 }}>{t.title}</h1>
		  <p style={{ fontSize: '1.1rem', color: theme.textMuted, maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>{t.subtitle}</p>

		  {/* Toggles */}
		  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
			{/* Billing */}
			<div style={{ display: 'inline-flex', background: theme.slate, padding: '4px', borderRadius: '14px', border: `1.5px solid ${theme.border}`, position: 'relative' }}>
			  <button onClick={() => setIsAnnual(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: !isAnnual ? theme.navy : 'transparent', color: !isAnnual ? theme.white : theme.textMuted, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>{t.monthly}</button>
			  <button onClick={() => setIsAnnual(true)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: isAnnual ? theme.navy : 'transparent', color: isAnnual ? theme.white : theme.textMuted, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
				{t.annual}
				{isAnnual && <span style={{ background: theme.pencil, color: theme.navy, padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 900 }}>{t.annualSave}</span>}
			  </button>
			  {!isAnnual && <span style={{ position: 'absolute', top: '-2px', [isAr ? 'left' : 'right']: '-2px', background: theme.pencil, color: theme.navy, padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 900, whiteSpace: 'nowrap' }}>{t.annualSave}</span>}
			</div>
			{/* Currency */}
			<div style={{ display: 'inline-flex', background: theme.slate, padding: '4px', borderRadius: '14px', border: `1.5px solid ${theme.border}` }}>
			  <button onClick={() => setCurrency('SAR')} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: currency === 'SAR' ? theme.royal : 'transparent', color: currency === 'SAR' ? theme.white : theme.textMuted, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>🇸🇦 {t.currencySAR}</button>
			  <button onClick={() => setCurrency('USD')} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: currency === 'USD' ? theme.royal : 'transparent', color: currency === 'USD' ? theme.white : theme.textMuted, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>🌐 {t.currencyUSD}</button>
			</div>
		  </div>
		</div>
	  </section>

	  {/* ─── PRICING CARDS ─── */}
	  <section style={{ padding: '60px 5% 80px' }}>
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', maxWidth: '1100px', margin: '0 auto', alignItems: 'start' }}>
		  {pricingPlans.map((plan, i) => (
			<PricingCard key={plan.id} plan={plan} isAr={isAr} t={t} currency={currency} isAnnual={isAnnual} onRequestDemo={() => setShowDemoModal(true)} index={i} />
		  ))}
		</div>
	  </section>

	  {/* ─── ZATCA NOTE ─── */}
	  <div style={{ textAlign: 'center', padding: '0 5% 60px' }}>
		<div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#eff6ff', color: theme.navy, padding: '16px 24px', borderRadius: '14px', border: `1.5px solid #bfdbfe`, maxWidth: '700px', flexWrap: 'wrap', justifyContent: 'center' }}>
		  <ShieldCheck color={theme.royal} size={20} />
		  <span style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>{currency === 'SAR' ? t.vatNote : t.USDNote}</span>
		</div>
	  </div>

	  {/* ─── FAQ ─── */}
	  <section style={{ padding: '40px 5% 80px', maxWidth: '700px', margin: '0 auto' }}>
		<h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: theme.navy, textAlign: 'center', marginBottom: '40px' }}>
		  {isAr ? 'أسئلة شائعة' : 'Frequently Asked Questions'}
		</h2>
		{faqs.map((faq, i) => (
		  <div key={i} style={{ background: theme.white, borderRadius: '14px', border: `1.5px solid ${openFaq === i ? theme.royal : theme.border}`, marginBottom: '12px', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
			<div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			  <span style={{ fontWeight: 800, color: theme.navy, fontSize: '0.95rem' }}>{faq.q}</span>
			  <span style={{ color: openFaq === i ? theme.royal : theme.textMuted, fontWeight: 900, fontSize: '1.3rem', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0 }}>+</span>
			</div>
			{openFaq === i && (
			  <div style={{ padding: '0 22px 20px', color: theme.textMuted, lineHeight: 1.7, fontSize: '0.92rem', animation: 'fadeIn 0.2s ease', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
				{faq.a}
			  </div>
			)}
		  </div>
		))}
	  </section>

	  {/* ─── FOOTER ─── */}
	  <footer style={{ backgroundColor: theme.white, borderTop: `1px solid ${theme.border}`, padding: '28px 5%', textAlign: 'center' }}>
		<div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
		  <button onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
			<FileText size={15} /> {isAr ? 'الشروط والخصوصية' : 'Terms & Privacy'}
		  </button>
		  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
			<HelpCircle size={15} /> {isAr ? 'مركز الدعم' : 'Support Center'}
		  </button>
		</div>
		<div style={{ color: theme.navy, fontWeight: 900, fontSize: '1.1rem', marginBottom: '6px' }}>OPERIX <span style={{ color: theme.pencil }}>Edu</span></div>
		<p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: '0 0 6px 0' }}>{isAr ? 'إحدى منتجات شركة OPERIX Solutions للأنظمة الرقمية.' : 'A product by OPERIX Solutions for digital systems.'}</p>
		<p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>© 2026 {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
	  </footer>

	  {/* ─── DEMO MODAL ─── */}
	  {showDemoModal && (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }}>
		  <div style={{ background: theme.white, borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)', direction: isAr ? 'rtl' : 'ltr' }}>
			<div style={{ height: '5px', background: `linear-gradient(90deg, ${theme.pencil}, ${theme.royal})` }} />
			<div style={{ padding: '32px' }}>
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
				{[{ label: isAr ? 'الاسم الكامل' : 'Full Name', field: 'name', type: 'text' }, { label: isAr ? 'البريد الإلكتروني للإدارة' : 'Admin Email', field: 'email', type: 'email' }, { label: isAr ? 'اسم المنشأة التعليمية' : 'School/Institution Name', field: 'school', type: 'text' }].map(({ label, field, type }) => (
				  <div key={field}>
					<label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{label}</label>
					<input type={type} style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
					  value={(demoForm as any)[field]} onChange={e => setDemoForm({ ...demoForm, [field]: e.target.value })} required
					  onFocus={e => e.currentTarget.style.borderColor = theme.pencil}
					  onBlur={e => e.currentTarget.style.borderColor = theme.border} />
				  </div>
				))}
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '7px', color: theme.navy }}>{isAr ? 'عدد الطلاب التقديري' : 'Estimated Students'}</label>
				  <select style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.slate, color: theme.navy, fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }} value={demoForm.students} onChange={e => setDemoForm({ ...demoForm, students: e.target.value })}>
					<option value="1-200">1 - 200 {isAr ? 'طالب' : 'Students'}</option>
					<option value="201-500">201 - 500 {isAr ? 'طالب' : 'Students'}</option>
					<option value="501-1000">501 - 1000 {isAr ? 'طالب' : 'Students'}</option>
					<option value="1000+">1000+ {isAr ? 'طالب' : 'Students'}</option>
				  </select>
				</div>
				<button onClick={handleDemoRequest} disabled={isSubmitting}
				  style={{ width: '100%', padding: '15px', background: isSubmitting ? theme.textMuted : `linear-gradient(135deg, ${theme.pencil}, ${theme.pencilDark})`, color: theme.navy, border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 900, cursor: isSubmitting ? 'default' : 'pointer', marginTop: '4px', boxShadow: isSubmitting ? 'none' : `0 8px 24px ${theme.pencil}44`, transition: 'all 0.2s' }}>
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
		@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
		* { box-sizing: border-box; }
		::-webkit-scrollbar { width: 6px; }
		::-webkit-scrollbar-track { background: transparent; }
		::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
	  `}</style>
	</div>
  );
}