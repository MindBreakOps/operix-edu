import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Search, Printer, Plus, Edit, User, Upload, Download, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

const VALID_STAGES = ['رياض أطفال', 'ابتدائي', 'متوسط', 'ثانوي'];

type ImportRow = {
  full_name: string;
  national_id: string;
  stage: string;
  grade_level: string;
  section: string;
  _rowError?: string;
};

export default function StudentsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Import feature state ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'select' | 'preview'>('select');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSourceLabel, setImportSourceLabel] = useState('');
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [importGlobalError, setImportGlobalError] = useState('');
  const [rawTextFallback, setRawTextFallback] = useState('');
  const [showRawTextEditor, setShowRawTextEditor] = useState(false);
  
  // Set default stage based on portal
  const getDefaultStage = () => {
	switch(portalType) {
	  case 'kindergarten': return 'رياض أطفال';
	  case 'elementary': return 'ابتدائي';
	  case 'intermediate': return 'متوسط';
	  case 'secondary': return 'ثانوي';
	  default: return 'ابتدائي';
	}
  };

  const [formData, setFormData] = useState({ 
	full_name: '', 
	national_id: '', 
	stage: getDefaultStage(), 
	grade_level: 'الصف الأول', 
	section: 'أ' 
  });

  const fetchStudents = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// Strict Data Isolation: Filter by Workspace AND Portal Type
	let query = supabase
	  .from('students_edu')
	  .select('*')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType)
	  .order('created_at', { ascending: false });

	if (searchTerm.trim()) {
	  query = query.or(`full_name.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`).limit(20);
	} else {
	  query = query.limit(15); 
	}

	const { data, error } = await query;
	if (!error && data) setStudents(data);
	setIsLoading(false);
  };

  useEffect(() => {
	const delay = setTimeout(() => fetchStudents(), 500);
	return () => clearTimeout(delay);
  }, [searchTerm, workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	// Inject Portal Isolation Context
	const payload = { 
	  ...formData, 
	  workspace_id: workspace?.id,
	  portal_type: portalType 
	};

	if (editingId) {
	  await supabase.from('students_edu').update(payload).eq('id', editingId);
	} else {
	  await supabase.from('students_edu').insert([payload]);
	}
	setIsModalOpen(false);
	setSearchTerm(''); // Trigger re-fetch
  };

  const openModal = (student: any = null) => {
	if (student) {
	  setEditingId(student.id);
	  setFormData({ 
		full_name: student.full_name, 
		national_id: student.national_id || '', 
		stage: student.stage, 
		grade_level: student.grade_level, 
		section: student.section || 'أ' 
	  });
	} else {
	  setEditingId(null);
	  setFormData({ 
		full_name: '', 
		national_id: '', 
		stage: getDefaultStage(), 
		grade_level: 'الصف الأول', 
		section: 'أ' 
	  });
	}
	setIsModalOpen(true);
  };

  // ============ IMPORT LOGIC ============

  const resetImportState = () => {
	setImportStep('select');
	setIsParsing(false);
	setIsImporting(false);
	setImportSourceLabel('');
	setPreviewRows([]);
	setImportGlobalError('');
	setRawTextFallback('');
	setShowRawTextEditor(false);
  };

  const openImportModal = () => {
	resetImportState();
	setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
	setIsImportModalOpen(false);
	resetImportState();
  };

  const normalizeHeader = (h: any) => String(h ?? '').trim().toLowerCase();

  const findKey = (row: Record<string, any>, keywords: string[]) => {
	const keys = Object.keys(row);
	for (const k of keys) {
	  const nk = normalizeHeader(k);
	  if (keywords.some(kw => nk.includes(kw))) return k;
	}
	return null;
  };

  const mapObjectRowToStudent = (row: Record<string, any>): ImportRow => {
	const nameKey = findKey(row, ['اسم', 'name']);
	const idKey = findKey(row, ['هوية', 'إقامة', 'اقامة', 'id']);
	const stageKey = findKey(row, ['مرحلة', 'stage']);
	const gradeKey = findKey(row, ['صف', 'grade']);
	const sectionKey = findKey(row, ['شعبة', 'فصل', 'section']);

	const full_name = nameKey ? String(row[nameKey] ?? '').trim() : '';
	const national_id = idKey ? String(row[idKey] ?? '').trim() : '';
	let stage = stageKey ? String(row[stageKey] ?? '').trim() : '';
	if (!VALID_STAGES.includes(stage)) stage = getDefaultStage();
	const grade_level = gradeKey ? String(row[gradeKey] ?? '').trim() || 'الصف الأول' : 'الصف الأول';
	const section = sectionKey ? String(row[sectionKey] ?? '').trim() || 'أ' : 'أ';

	let _rowError = '';
	if (!full_name) _rowError = 'اسم الطالب مفقود';

	return { full_name, national_id, stage, grade_level, section, _rowError };
  };

  const mapDelimitedLineToStudent = (cells: string[]): ImportRow => {
	const [full_name = '', national_id = '', stage = '', grade_level = '', section = ''] = cells.map(c => c.trim());
	let normalizedStage = stage;
	if (!VALID_STAGES.includes(normalizedStage)) normalizedStage = getDefaultStage();

	let _rowError = '';
	if (!full_name) _rowError = 'اسم الطالب مفقود';

	return {
	  full_name,
	  national_id,
	  stage: normalizedStage,
	  grade_level: grade_level || 'الصف الأول',
	  section: section || 'أ',
	  _rowError
	};
  };

  const parseExcelFile = async (file: File) => {
	const XLSX = await import('xlsx');
	const buffer = await file.arrayBuffer();
	const workbook = XLSX.read(buffer, { type: 'array' });
	const firstSheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[firstSheetName];
	const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, any>[];
	if (!json.length) throw new Error('لم يتم العثور على بيانات في الملف.');
	return json.map(mapObjectRowToStudent);
  };

  const parseWordFile = async (file: File) => {
	const mammoth = await import('mammoth');
	const buffer = await file.arrayBuffer();
	const result = await mammoth.extractRawText({ arrayBuffer: buffer });
	return result.value || '';
  };

  const parsePdfFile = async (file: File) => {
	const pdfjsLib: any = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
	const buffer = await file.arrayBuffer();
	const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
	let fullText = '';
	for (let i = 1; i <= doc.numPages; i++) {
	  const page = await doc.getPage(i);
	  const content = await page.getTextContent();
	  const pageText = content.items.map((it: any) => it.str).join(' ');
	  fullText += pageText + '\n';
	}
	return fullText;
  };

  const parseRawTextToRows = (text: string): ImportRow[] => {
	const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
	return lines
	  .map(line => (line.includes('\t') ? line.split('\t') : line.split(',')))
	  .filter(cells => cells.length >= 1 && cells[0].trim())
	  .map(mapDelimitedLineToStudent);
  };

  const handleFileSelected = async (file: File | null) => {
	if (!file) return;
	setImportGlobalError('');
	setIsParsing(true);
	setImportSourceLabel(file.name);
	try {
	  const ext = file.name.split('.').pop()?.toLowerCase();
	  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
		const rows = await parseExcelFile(file);
		setPreviewRows(rows);
		setImportStep('preview');
	  } else if (ext === 'docx' || ext === 'doc') {
		const text = await parseWordFile(file);
		setRawTextFallback(text);
		const rows = parseRawTextToRows(text);
		setPreviewRows(rows);
		setShowRawTextEditor(rows.length === 0);
		setImportStep('preview');
	  } else if (ext === 'pdf') {
		const text = await parsePdfFile(file);
		setRawTextFallback(text);
		const rows = parseRawTextToRows(text);
		setPreviewRows(rows);
		setShowRawTextEditor(rows.length === 0);
		setImportStep('preview');
	  } else {
		setImportGlobalError('صيغة الملف غير مدعومة. الرجاء استخدام Excel أو CSV أو Word أو PDF.');
	  }
	} catch (err) {
	  console.error(err);
	  setImportGlobalError('حدث خطأ أثناء قراءة الملف. تأكد من أن الملف غير تالف.');
	} finally {
	  setIsParsing(false);
	}
  };

  const reparseFromRawText = () => {
	const rows = parseRawTextToRows(rawTextFallback);
	setPreviewRows(rows);
  };

  const removePreviewRow = (index: number) => {
	setPreviewRows(prev => prev.filter((_, i) => i !== index));
  };

  const validRowsCount = previewRows.filter(r => !r._rowError).length;

  const handleConfirmImport = async () => {
	const rowsToImport = previewRows.filter(r => !r._rowError);
	if (!rowsToImport.length || !workspace || !portalType) return;
	setIsImporting(true);
	try {
	  const payload = rowsToImport.map(r => ({
		full_name: r.full_name,
		national_id: r.national_id,
		stage: r.stage,
		grade_level: r.grade_level,
		section: r.section,
		workspace_id: workspace.id,
		portal_type: portalType
	  }));
	  const { error } = await supabase.from('students_edu').insert(payload);
	  if (error) throw error;
	  closeImportModal();
	  fetchStudents();
	} catch (err) {
	  console.error(err);
	  setImportGlobalError('فشل حفظ البيانات في قاعدة البيانات. حاول مرة أخرى.');
	} finally {
	  setIsImporting(false);
	}
  };

  const downloadTemplate = async () => {
	const XLSX = await import('xlsx');
	const sample = [
	  {
		'الاسم الرباعي': 'محمد أحمد علي الشمري',
		'رقم الهوية / الإقامة': '1012345678',
		'المرحلة': getDefaultStage(),
		'الصف الدراسي': 'الصف الأول',
		'الشعبة': 'أ'
	  }
	];
	const ws = XLSX.utils.json_to_sheet(sample);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
	XLSX.writeFile(wb, 'قالب_استيراد_الطلاب.xlsx');
  };

  return (
	<div>
	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>سجل الطلاب</h1>
		  <p style={styles.subtitle}>إدارة بيانات الطلاب الأكاديمية (البوابة الحالية)</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}>
			<Printer size={18} /> طباعة الكشف
		  </button>
		  <button style={styles.btnSecondary} onClick={openImportModal}>
			<Upload size={18} /> استيراد من ملف
		  </button>
		  <button style={styles.btnPrimary} onClick={() => openModal()}>
			<Plus size={18} /> تسجيل طالب
		  </button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		<div className="no-print" style={styles.controlBar}>
		  <div style={styles.searchBox}>
			<Search size={18} color="var(--color-text-muted)" />
			<input 
			  type="text" 
			  placeholder="بحث بالاسم أو رقم الهوية..." 
			  style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--color-text-dark)' }}
			  value={searchTerm}
			  onChange={(e) => setSearchTerm(e.target.value)}
			/>
		  </div>
		</div>

		{isLoading ? (
		  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
			جاري جلب البيانات...
		  </div>
		) : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>الاسم الرباعي</th>
				<th style={styles.th}>رقم الهوية / الإقامة</th>
				<th style={styles.th}>المرحلة</th>
				<th style={styles.th}>الصف الدراسي</th>
				<th style={styles.th}>الشعبة</th>
				<th className="no-print" style={styles.th}>إجراءات</th>
			  </tr>
			</thead>
			<tbody>
			  {students.map(s => (
				<tr key={s.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-royal)' }}>
						<User size={16} />
					  </div>
					  {s.full_name}
					</div>
				  </td>
				  <td style={{ ...styles.td, fontFamily: 'monospace' }}>{s.national_id || '—'}</td>
				  <td style={styles.td}>
					<span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
					  {s.stage}
					</span>
				  </td>
				  <td style={styles.td}>{s.grade_level}</td>
				  <td style={styles.td}>{s.section}</td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => openModal(s)} style={{ background: 'none', border: 'none', color: 'var(--color-royal)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
					  <Edit size={14} /> تعديل
					</button>
				  </td>
				</tr>
			  ))}
			  {students.length === 0 && (
				<tr>
				  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
					لا توجد بيانات تطابق بحثك في هذه البوابة.
				  </td>
				</tr>
			  )}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>
			  {editingId ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}
			</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الاسم الرباعي</label>
				<input required style={styles.input} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
			  </div>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>رقم الهوية / الإقامة</label>
				<input style={styles.input} value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} />
			  </div>
			  
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>المرحلة الدراسية</label>
				  <select style={styles.input} value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
					<option>رياض أطفال</option>
					<option>ابتدائي</option>
					<option>متوسط</option>
					<option>ثانوي</option>
				  </select>
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الصف</label>
				  <input required style={styles.input} value={formData.grade_level} onChange={e => setFormData({...formData, grade_level: e.target.value})} placeholder="مثال: الصف الأول" />
				</div>
			  </div>
			  
			  <div style={styles.inputGroup}>
				<label style={styles.label}>الشعبة / الفصل</label>
				<input style={styles.input} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="مثال: أ أو 1" />
			  </div>

			  <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>
				  حفظ البيانات
				</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>
				  إلغاء
				</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}

	  {isImportModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
			  <h2 style={{ margin: 0, color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>
				استيراد طلاب من ملف
			  </h2>
			  <button onClick={closeImportModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
				<X size={22} />
			  </button>
			</div>

			{importStep === 'select' && (
			  <>
				<p style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '16px', fontSize: '0.9rem' }}>
				  يمكنك استيراد قائمة الطلاب دفعة واحدة من ملف Excel أو CSV أو Word أو PDF. للحصول على أفضل دقة، ننصح باستخدام قالب Excel أدناه.
				</p>
				<button onClick={downloadTemplate} style={{ ...styles.btnSecondary, marginBottom: '20px' }}>
				  <Download size={16} /> تحميل قالب Excel
				</button>
				<label style={styles.dropzone}>
				  <FileSpreadsheet size={32} color="var(--color-royal)" />
				  <span style={{ fontWeight: 800, color: 'var(--color-navy)', marginTop: '8px' }}>
					اختر ملفاً للاستيراد
				  </span>
				  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
					Excel (.xlsx, .xls) · CSV · Word (.docx) · PDF
				  </span>
				  <input
					type="file"
					accept=".xlsx,.xls,.csv,.docx,.doc,.pdf"
					style={{ display: 'none' }}
					onChange={e => handleFileSelected(e.target.files?.[0] || null)}
				  />
				</label>
				{isParsing && (
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--color-royal)', fontWeight: 700 }}>
					<Loader2 size={18} className="spin" /> جاري تحليل الملف...
				  </div>
				)}
				{importGlobalError && (
				  <div style={styles.errorBanner}>
					<AlertCircle size={16} /> {importGlobalError}
				  </div>
				)}
			  </>
			)}

			{importStep === 'preview' && (
			  <>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
				  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)' }}>
					الملف: {importSourceLabel}
				  </p>
				  <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 800 }}>
					{validRowsCount} من {previewRows.length} صف صالح للاستيراد
				  </span>
				</div>

				{showRawTextEditor && (
				  <div style={{ marginBottom: '16px' }}>
					<p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
					  لم يتم اكتشاف جدول تلقائياً في هذا الملف. يمكنك تعديل النص أدناه بحيث يكون كل صف بالترتيب:
					  الاسم الرباعي, رقم الهوية, المرحلة, الصف, الشعبة (مفصولة بفاصلة)، ثم اضغط "إعادة التحليل".
					</p>
					<textarea
					  style={styles.textarea}
					  rows={6}
					  value={rawTextFallback}
					  onChange={e => setRawTextFallback(e.target.value)}
					/>
					<button onClick={reparseFromRawText} style={{ ...styles.btnSecondary, marginTop: '8px' }}>
					  إعادة التحليل
					</button>
				  </div>
				)}

				{importGlobalError && (
				  <div style={styles.errorBanner}>
					<AlertCircle size={16} /> {importGlobalError}
				  </div>
				)}

				<div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
				  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
					  <tr>
						<th style={styles.previewTh}>الاسم</th>
						<th style={styles.previewTh}>الهوية</th>
						<th style={styles.previewTh}>المرحلة</th>
						<th style={styles.previewTh}>الصف</th>
						<th style={styles.previewTh}>الشعبة</th>
						<th style={styles.previewTh}>الحالة</th>
						<th style={styles.previewTh}></th>
					  </tr>
					</thead>
					<tbody>
					  {previewRows.map((row, idx) => (
						<tr key={idx} style={row._rowError ? { backgroundColor: '#fef2f2' } : undefined}>
						  <td style={styles.previewTd}>{row.full_name || '—'}</td>
						  <td style={styles.previewTd}>{row.national_id || '—'}</td>
						  <td style={styles.previewTd}>{row.stage}</td>
						  <td style={styles.previewTd}>{row.grade_level}</td>
						  <td style={styles.previewTd}>{row.section}</td>
						  <td style={styles.previewTd}>
							{row._rowError ? (
							  <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
								<AlertCircle size={13} /> {row._rowError}
							  </span>
							) : (
							  <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
								<CheckCircle2 size={13} /> جاهز
							  </span>
							)}
						  </td>
						  <td style={styles.previewTd}>
							<button onClick={() => removePreviewRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
							  <Trash2 size={14} />
							</button>
						  </td>
						</tr>
					  ))}
					  {previewRows.length === 0 && (
						<tr>
						  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
							لا توجد صفوف لعرضها.
						  </td>
						</tr>
					  )}
					</tbody>
				  </table>
				</div>

				<div style={{ display: 'flex', gap: '12px' }}>
				  <button
					onClick={handleConfirmImport}
					disabled={!validRowsCount || isImporting}
					style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center', opacity: (!validRowsCount || isImporting) ? 0.6 : 1 }}
				  >
					{isImporting ? 'جاري الاستيراد...' : `استيراد ${validRowsCount} طالب`}
				  </button>
				  <button type="button" onClick={() => { resetImportState(); }} style={styles.btnSecondary}>
					رجوع
				  </button>
				  <button type="button" onClick={closeImportModal} style={styles.btnSecondary}>
					إلغاء
				  </button>
				</div>
			  </>
			)}
		  </div>
		</div>
	  )}
	</div>
  );
}

// Strictly leveraging global CSS variables to eliminate color desync
const styles: { [key: string]: React.CSSProperties } = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 },
  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  controlBar: { display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fcfcfd' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 16px', width: '300px' },
  btnPrimary: { backgroundColor: 'var(--color-royal)', color: 'var(--color-white)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  btnSecondary: { backgroundColor: 'var(--color-white)', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  th: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.85rem', padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600 },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: { fontWeight: 800, color: 'var(--color-navy)', fontSize: '0.9rem' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, backgroundColor: 'var(--color-white)', color: 'var(--color-text-dark)' },
  dropzone: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', border: '2px dashed var(--color-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fcfcfd' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', marginTop: '12px' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-dark)', resize: 'vertical' },
  previewTh: { backgroundColor: 'var(--color-slate)', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '0.78rem', padding: '10px', textAlign: 'right', borderBottom: '1px solid var(--color-border)' },
  previewTd: { padding: '10px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dark)', fontWeight: 600, fontSize: '0.85rem' }
};