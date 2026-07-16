import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { PageShell } from '../../components/layout/PageShell';
import { Scale, FileText, Printer, ShieldCheck, Plus, X, Edit3, Trash2, CheckCircle2, AlertCircle, Search, BookOpen } from 'lucide-react';

export default function RegulationsEdu() {
  const { workspace } = useTenant();
  const [regulations, setRegulations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs & Search State
  const [activeTab, setActiveTab] = useState<'edit' | 'print'>('edit');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  
  const [formData, setFormData] = useState({
	title: '',
	content: '',
	category: 'regulations',
	status: 'draft'
  });

  useEffect(() => {
	if (workspace) fetchRegulations();
  }, [workspace]);

  const fetchRegulations = async () => {
	setIsLoading(true);
	const { data } = await supabase
	  .from('regulations_edu')
	  .select('*')
	  .eq('workspace_id', workspace?.id)
	  .order('created_at', { ascending: false });

	if (data) setRegulations(data);
	setIsLoading(false);
  };

  const openModal = (doc = null) => {
	if (doc) {
	  setSelectedDoc(doc);
	  setFormData({ title: doc.title, content: doc.content, category: doc.category, status: doc.status });
	} else {
	  setSelectedDoc(null);
	  setFormData({ title: '', content: '', category: 'regulations', status: 'draft' });
	}
	setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!workspace) return;
	setIsSubmitting(true);

	const payload = {
	  workspace_id: workspace.id,
	  title: formData.title,
	  content: formData.content,
	  category: formData.category,
	  status: formData.status
	};

	if (selectedDoc) {
	  await supabase.from('regulations_edu').update(payload).eq('id', selectedDoc.id);
	} else {
	  await supabase.from('regulations_edu').insert([payload]);
	}

	await fetchRegulations();
	setIsModalOpen(false);
	setIsSubmitting(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
	const newStatus = currentStatus === 'published' ? 'draft' : 'published';
	await supabase.from('regulations_edu').update({ status: newStatus }).eq('id', id);
	fetchRegulations();
  };

  const handleDelete = async (id: string) => {
	if (window.confirm('هل أنت متأكد من حذف هذه الوثيقة نهائياً؟')) {
	  await supabase.from('regulations_edu').delete().eq('id', id);
	  fetchRegulations();
	}
  };

  const getCategoryIcon = (category: string) => {
	switch (category) {
	  case 'rules': return <Scale size={20} color="#ea580c" />;
	  case 'permissions': return <ShieldCheck size={20} color="#059669" />;
	  default: return <FileText size={20} color="#2563eb" />;
	}
  };

  const getCategoryLabel = (category: string) => {
	switch (category) {
	  case 'rules': return 'القوانين';
	  case 'permissions': return 'الصلاحيات';
	  default: return 'اللوائح التنظيمية';
	}
  };

  const filteredDocs = regulations.filter(doc => 
	doc.title.includes(searchQuery) || doc.content.includes(searchQuery)
  );

  return (
	<PageShell 
	  title="القوانين والصلاحيات واللوائح" 
	  subtitle="إدارة الوثائق التنظيمية وصلاحيات الهيئة الإدارية والتعليمية بشكل رسمي"
	>
	  <style>{`
		@keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
		@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
		
		/* Modern Segmented Control for Tabs */
		.segmented-control {
		  display: inline-flex;
		  background-color: #f1f5f9;
		  padding: 6px;
		  border-radius: 12px;
		  margin-bottom: 24px;
		  border: 1px solid #e2e8f0;
		}
		.segment-btn {
		  padding: 10px 24px;
		  border: none;
		  background: transparent;
		  font-weight: 800;
		  color: #64748b;
		  cursor: pointer;
		  border-radius: 8px;
		  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		  font-size: 0.95rem;
		  display: flex;
		  align-items: center;
		  gap: 8px;
		}
		.segment-btn.active {
		  background-color: #fff;
		  color: var(--color-royal);
		  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
		}
		.segment-btn:hover:not(.active) { color: var(--color-navy); }
		
		.doc-card-hover:hover {
		  transform: translateY(-4px);
		  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
		  border-color: #bfdbfe;
		}

		/* إعدادات الطباعة للوثيقة الرسمية */
		@media print {
		  body * { visibility: hidden; }
		  .print-container, .print-container * { visibility: visible; }
		  .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
		  .no-print { display: none !important; }
		  .print-doc { box-shadow: none !important; border: 1px solid #000 !important; page-break-inside: avoid; margin-bottom: 40px; }
		}
	  `}</style>

	  {/* Modern Tabs Navigation */}
	  <div className="no-print" style={{ display: 'flex', justifyContent: 'center' }}>
		<div className="segmented-control">
		  <button className={`segment-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
			<Edit3 size={18} /> إدارة الوثائق والصياغة
		  </button>
		  <button className={`segment-btn ${activeTab === 'print' ? 'active' : ''}`} onClick={() => setActiveTab('print')}>
			<Printer size={18} /> معاينة الطباعة والنشر
		  </button>
		</div>
	  </div>

	  {isLoading ? (
		<div style={styles.loadingState}>جاري تحميل الوثائق...</div>
	  ) : (
		<>
		  {/* ==========================================
			  TAB 1: التحرير والصياغة
		  ========================================== */}
		  {activeTab === 'edit' && (
			<div className="no-print" style={{ animation: 'fadeIn 0.3s ease-out' }}>
			  
			  {/* Header Actions: Search & Add */}
			  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px' }}>
				  <Search size={20} color="#94a3b8" />
				  <input 
					type="text" 
					placeholder="ابحث في القوانين واللوائح..." 
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-navy)' }}
				  />
				</div>
				<button onClick={() => openModal()} style={styles.btnPrimary}>
				  <Plus size={18} /> صياغة وثيقة جديدة
				</button>
			  </div>

			  {/* Grid of Documents */}
			  <div style={styles.grid}>
				{filteredDocs.map((doc, idx) => (
				  <div key={doc.id} className="doc-card-hover" style={{...styles.card, animation: `slideUp 0.4s ease forwards ${idx * 0.05}s`, opacity: 0}}>
					
					<div style={styles.cardHeader}>
					  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
						<div style={styles.iconBox}>{getCategoryIcon(doc.category)}</div>
						<div>
						  <h3 style={{ margin: '0 0 6px 0', color: 'var(--color-navy)', fontSize: '1.15rem' }}>{doc.title}</h3>
						  <span style={styles.categoryLabel}>{getCategoryLabel(doc.category)}</span>
						</div>
					  </div>
					</div>

					<div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginTop: '20px', border: '1px solid #f1f5f9' }}>
					  <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
						{doc.content}
					  </p>
					</div>

					<div style={styles.cardFooter}>
					  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{...styles.statusBadge, backgroundColor: doc.status === 'published' ? '#ecfdf5' : '#fef2f2', color: doc.status === 'published' ? '#059669' : '#dc2626'}}>
						  {doc.status === 'published' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
						  {doc.status === 'published' ? 'منشور رسمياً' : 'مسودة غير معتمدة'}
						</span>
					  </div>
					  <div style={{ display: 'flex', gap: '6px' }}>
						<button onClick={() => toggleStatus(doc.id, doc.status)} style={styles.iconBtn} title={doc.status === 'published' ? 'إلغاء النشر' : 'نشر واعتماد'}>
						  {doc.status === 'published' ? <AlertCircle size={18} color="#dc2626" /> : <CheckCircle2 size={18} color="#059669" />}
						</button>
						<button onClick={() => openModal(doc)} style={styles.iconBtn} title="تعديل"><Edit3 size={18} color="#2563eb" /></button>
						<button onClick={() => handleDelete(doc.id)} style={styles.iconBtn} title="حذف"><Trash2 size={18} color="#ef4444" /></button>
					  </div>
					</div>
				  </div>
				))}
				
				{/* Premium Empty State */}
				{filteredDocs.length === 0 && (
				  <div style={{ gridColumn: '1 / -1', padding: '80px 20px', textAlign: 'center', backgroundColor: '#fff', border: '2px dashed #cbd5e1', borderRadius: '24px' }}>
					<BookOpen size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
					<h2 style={{ color: 'var(--color-navy)', margin: '0 0 8px 0' }}>لا توجد وثائق مطابقة</h2>
					<p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
					  لم يتم العثور على قوانين أو لوائح مسجلة. يمكنك البدء بصياغة وثيقة تنظيمية جديدة للمنشأة.
					</p>
				  </div>
				)}
			  </div>
			</div>
		  )}

		  {/* ==========================================
			  TAB 2: الوثائق والطباعة
		  ========================================== */}
		  {activeTab === 'print' && (
			<div style={{ animation: 'fadeIn 0.3s ease-out' }}>
			  <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
				<div>
				  <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-navy)' }}>جاهز للطباعة والنشر</h3>
				  <p style={{ margin: 0, color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>ستظهر فقط الوثائق المعتمدة ذات الحالة <span style={{color: '#059669', fontWeight: 800}}>منشور</span> في هذه الشاشة.</p>
				</div>
				<button onClick={() => window.print()} style={{...styles.btnPrimary, backgroundColor: 'var(--color-navy)', padding: '14px 28px', fontSize: '1rem' }}>
				  <Printer size={20} /> طباعة الوثائق
				</button>
			  </div>

			  {/* Print Container */}
			  <div className="print-container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
				{regulations.filter(r => r.status === 'published').map((doc) => (
				  <div key={doc.id} className="print-doc" style={styles.officialDocument}>
					<div style={styles.docHeader}>
					  <h1 style={styles.docTitle}>{doc.title}</h1>
					  <div style={styles.docMeta}>
						<span>التصنيف: {getCategoryLabel(doc.category)}</span>
						<span>تاريخ الإصدار: {new Date(doc.created_at).toLocaleDateString('ar-SA')}</span>
					  </div>
					</div>
					<div style={styles.docContent}>
					  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: '2' }}>
						{doc.content}
					  </pre>
					</div>
					<div style={styles.docFooter}>
					  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>يعتمد،</span>
					  <span style={{ fontSize: '1.2rem' }}>إدارة الموارد البشرية والشؤون القانونية</span>
					</div>
				  </div>
				))}

				{regulations.filter(r => r.status === 'published').length === 0 && (
				  <div className="no-print" style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
					<ShieldCheck size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
					<h3 style={{ color: '#64748b', margin: 0 }}>لا توجد وثائق منشورة جاهزة للطباعة.</h3>
				  </div>
				)}
			  </div>
			</div>
		  )}
		</>
	  )}

	  {/* ==========================================
		  MODAL: إضافة / تعديل
	  ========================================== */}
	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{...styles.modalContent, animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'}}>
			<div style={styles.modalHeader}>
			  <h2 style={{ margin: 0, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '12px' }}>
				{selectedDoc ? <Edit3 size={24} color="var(--color-royal)" /> : <Plus size={24} color="var(--color-royal)" />}
				{selectedDoc ? 'تعديل الوثيقة التنظيمية' : 'صياغة وثيقة جديدة'}
			  </h2>
			  <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}><X size={24} /></button>
			</div>

			<form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
				<div style={styles.inputGroup}>
				  <label style={styles.label}>التصنيف القانوني</label>
				  <select style={styles.input} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
					<option value="regulations">لائحة تنظيمية (سياسات عامة)</option>
					<option value="rules">قانون / شرط (إلزامي)</option>
					<option value="permissions">صلاحيات ومهام (وصف وظيفي)</option>
				  </select>
				</div>
				<div style={styles.inputGroup}>
				  <label style={styles.label}>حالة النشر والاعتماد</label>
				  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
					<option value="draft">مسودة (قيد المراجعة)</option>
					<option value="published">منشور (معتمد للطباعة)</option>
				  </select>
				</div>
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>عنوان الوثيقة</label>
				<input required style={{...styles.input, fontSize: '1.1rem'}} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: لائحة الغياب والتأخير للهيئة التعليمية" />
			  </div>

			  <div style={styles.inputGroup}>
				<label style={styles.label}>النص التفصيلي (البنود والشروط)</label>
				<textarea 
				  required 
				  style={{ ...styles.input, minHeight: '250px', resize: 'vertical', lineHeight: '1.8', fontSize: '1.05rem' }} 
				  value={formData.content} 
				  onChange={e => setFormData({...formData, content: e.target.value})} 
				  placeholder="اكتب بنود القوانين واللوائح هنا بدقة..." 
				/>
			  </div>

			  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary} disabled={isSubmitting}>إلغاء الأمر</button>
				<button type="submit" style={styles.btnPrimary} disabled={isSubmitting}>
				  {isSubmitting ? 'جاري الحفظ...' : 'حفظ واعتماد الوثيقة'}
				</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</PageShell>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  loadingState: { padding: '60px', textAlign: 'center', fontWeight: 800, color: '#94a3b8', fontSize: '1.2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBox: { width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: '0.8rem', color: '#64748b', fontWeight: 800 },
  statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' },
  iconBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: '10px', transition: 'all 0.2s' },
  
  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  modalContent: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' },
  closeBtn: { background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '10px', borderRadius: '50%', transition: 'background 0.2s' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-navy)' },
  input: { width: '100%', padding: '16px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', backgroundColor: '#f8fafc', transition: 'border-color 0.2s, background-color 0.2s' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', transition: 'background-color 0.2s' },
  btnSecondary: { backgroundColor: 'transparent', color: '#64748b', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' },

  // Official Document Styles (For Print Tab)
  officialDocument: { backgroundColor: '#fff', padding: '60px 80px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' },
  docHeader: { borderBottom: '3px solid var(--color-navy)', paddingBottom: '24px', marginBottom: '40px', textAlign: 'center' },
  docTitle: { color: 'var(--color-navy)', fontSize: '2.2rem', margin: '0 0 20px 0', fontWeight: 900 },
  docMeta: { display: 'flex', justifyContent: 'center', gap: '40px', color: '#64748b', fontSize: '1rem', fontWeight: 800 },
  docContent: { color: '#0f172a', fontSize: '1.15rem', textAlign: 'justify' },
  docFooter: { marginTop: '80px', paddingTop: '30px', borderTop: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', color: 'var(--color-navy)', fontWeight: 900 }
};