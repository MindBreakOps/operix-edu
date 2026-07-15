import React from 'react';
import { Printer } from 'lucide-react';

interface PageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onPrint?: () => void;
  actionButton?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ title, subtitle, children, onPrint, actionButton }) => (
  <div style={{ padding: '40px', minHeight: '100%' }}>
	<header className="no-print" style={styles.header}>
	  <div>
		<h1 style={styles.title}>{title}</h1>
		<p style={styles.subtitle}>{subtitle}</p>
	  </div>
	  <div style={{ display: 'flex', gap: '12px' }}>
		{onPrint && (
		  <button style={styles.btnSecondary} onClick={onPrint}>
			<Printer size={18} /> طباعة التقرير
		  </button>
		)}
		{actionButton}
	  </div>
	</header>
	<div id="printable-area" style={styles.card}>
	  {children}
	</div>
  </div>
);

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 },
  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};