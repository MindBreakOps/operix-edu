import React, { useEffect, useState } from 'react';
import { useTenant } from "../../context/TenantContext";

// أيقونة قفل SVG احترافية
const LockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
	<rect x="3" y="11" width="18" height="11" rx="0" ry="0" />
	<path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { workspace } = useTenant();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
	if (workspace) {
	  // التحقق من باقة التعليم (OPERIX EDU)
	  if (!workspace.operix_edu_active) {
		setIsLocked(true);
		return;
	  }

	  // التحقق من حالة الاشتراك وتاريخ الانتهاء
	  const today = new Date();
	  const expiryDate = workspace.sub_end_date ? new Date(workspace.sub_end_date) : null;
	  
	  if (workspace.sub_status === 'hold' || (expiryDate && today > expiryDate)) {
		setIsLocked(true);
	  } else {
		setIsLocked(false);
	  }
	}
  }, [workspace]);

  if (isLocked) {
	const styles: { [key: string]: React.CSSProperties } = {
	  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', direction: 'rtl' },
	  card: { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '48px', width: '100%', maxWidth: '500px', textAlign: 'center', borderTop: '4px solid #dc2626', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
	  title: { fontSize: '1.5rem', fontWeight: 900, color: '#111827', margin: '24px 0 8px 0', letterSpacing: '-0.5px' },
	  text: { fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.6, margin: '0 0 32px 0' },
	  orgName: { fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', marginBottom: '24px' },
	  btn: { backgroundColor: '#111827', color: '#ffffff', border: 'none', padding: '12px 24px', fontWeight: 800, cursor: 'pointer', width: '100%', fontSize: '0.95rem' }
	};

	return (
	  <div style={styles.container}>
		<div style={styles.card}>
		  <LockIcon />
		  <h1 style={styles.title}>تم تعليق مساحة العمل</h1>
		  <div style={styles.orgName}>
			{workspace?.name || 'مؤسسة تعليمية'}
		  </div>
		  <p style={styles.text}>
			نعتذر، لا يمكن الوصول إلى بيانات نظام <strong>OPERIX Edu</strong> حالياً نظراً لانتهاء فترة الاشتراك أو إيقاف الباقة من قبل الإدارة المركزية. يرجى التواصل مع الدعم الفني لتجديد الاشتراك واستعادة الوصول للبيانات.
		  </p>
		  <button style={styles.btn} onClick={() => window.location.href = 'mailto:support@operix-solutions.com'}>
			التواصل مع الدعم الفني
		  </button>
		</div>
	  </div>
	);
  }

  // إذا كان الاشتراك نشطاً، يتم عرض التطبيق بشكل طبيعي
  return <>{children}</>;
}