import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function NotFound() {
  const navigate = useNavigate();
  const { portalType } = useParams<{ portalType: string }>();

  return (
	<PageShell 
	  title="صفحة غير موجودة (404)" 
	  subtitle="المسار الذي تحاول الوصول إليه غير متاح."
	>
	  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
		<div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
		<h2 style={{ color: 'var(--color-navy)' }}>الصفحة المطلوبة غير متوفرة</h2>
		<button 
		  onClick={() => navigate(`/app/${portalType || 'elementary'}/dashboard`)}
		  style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '10px', background: 'var(--color-royal)', color: 'white', border: 'none', cursor: 'pointer' }}
		>
		  العودة للوحة القيادة <ArrowRight size={18} />
		</button>
	  </div>
	</PageShell>
  );
}