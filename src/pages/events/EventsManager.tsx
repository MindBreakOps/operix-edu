import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function EventsManager() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
	title: '', 
	description: '', 
	event_date: new Date().toISOString().split('T')[0],
	is_public: true 
  });

  const fetchEvents = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// Strict Portal Data Isolation
	const { data } = await supabase
	  .from('events_edu')
	  .select('*')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType)
	  .order('event_date', { ascending: true });

	if (data) setEvents(data);
	setIsLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { 
	  ...formData, 
	  workspace_id: workspace?.id,
	  portal_type: portalType 
	};

	const { error } = await supabase.from('events_edu').insert([payload]);
	if (!error) {
	  setIsModalOpen(false);
	  setFormData({ title: '', description: '', event_date: new Date().toISOString().split('T')[0], is_public: true });
	  fetchEvents();
	} else {
	  alert('حدث خطأ أثناء حفظ الفعالية.');
	}
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
	await supabase.from('events_edu').delete().eq('id', id);
	fetchEvents();
  };

  return (
	<PageShell 
	  title="الفعاليات والأنشطة" 
	  subtitle="إدارة التقويم الأكاديمي والأنشطة اللامنهجية لهذه البوابة"
	  actionButton={
		<button style={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
		  <Plus size={18} /> إضافة فعالية
		</button>
	  }
	>
	  {isLoading ? (
		<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>جاري جلب الفعاليات...</div>
	  ) : (
		<table style={{ width: '100%', borderCollapse: 'collapse' }}>
		  <thead>
			<tr>
			  <th style={styles.th}>التاريخ</th>
			  <th style={styles.th}>عنوان الفعالية</th>
			  <th style={styles.th}>التفاصيل</th>
			  <th style={styles.th}>الحالة</th>
			  <th className="no-print" style={styles.th}>إجراءات</th>
			</tr>
		  </thead>
		  <tbody>
			{events.map(ev => (
			  <tr key={ev.id}>
				<td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-royal)' }} dir="ltr">
				  {ev.event_date}
				</td>
				<td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<Calendar size={16} color="var(--color-royal)" />
					{ev.title}
				  </div>
				</td>
				<td style={styles.td}>{ev.description}</td>
				<td style={styles.td}>
				  <span style={{ backgroundColor: ev.is_public ? '#ecfdf5' : '#fef2f2', color: ev.is_public ? 'var(--color-success)' : 'var(--color-danger)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
					{ev.is_public ? 'عامة' : 'داخلية'}
				  </span>
				</td>
				<td className="no-print" style={styles.td}>
				  <button onClick={() => handleDelete(ev.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					<Trash2 size={16} />
				  </button>
				</td>
			  </tr>
			))}
			{events.length === 0 && (
			  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>لا توجد فعاليات مجدولة.</td></tr>
			)}
		  </tbody>
		</table>
	  )}

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>إضافة فعالية جديدة</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>عنوان الفعالية</label>
				<input required style={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: اليوم المفتوح" />
			  </div>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>التاريخ</label>
				<input type="date" required style={styles.input} value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
			  </div>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الوصف والتفاصيل</label>
				<textarea rows={3} style={{...styles.input, resize: 'vertical'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
			  </div>
			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>جدولة الفعالية</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</PageShell>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600 },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: { fontWeight: 800, color: 'var(--color-navy)', fontSize: '0.9rem' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, backgroundColor: 'var(--color-white)', color: 'var(--color-text-dark)' }
};