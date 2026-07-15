import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { Printer, Plus, Edit, BookOpen, Trash2, Upload, Download, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const VALID_STAGES = ['رياض أطفال', 'ابتدائي', 'متوسط', 'ثانوي'];

type ImportRow = {
  name: string;
  stage: string;
  total_mark: number;
  passing_mark: number;
  _rowError?: string;
};

export default function SubjectsEdu() {
  const { workspace } = useTenant();
  const { portalType } = useParams<{ portalType: string }>();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
	name: '', 
	stage: getDefaultStage(), 
	total_mark: 100, 
	passing_mark: 50 
  });

  const fetchSubjects = async () => {
	if (!workspace || !portalType) return;
	setIsLoading(true);
	
	// Strict Data Isolation per portal
	const { data } = await supabase
	  .from('subjects_edu')
	  .select('*')
	  .eq('workspace_id', workspace.id)
	  .eq('portal_type', portalType)
	  .order('stage')
	  .order('name');
	  
	if (data) setSubjects(data);
	setIsLoading(false);
  };

  useEffect(() => { fetchSubjects(); }, [workspace, portalType]);

  const handleSave = async (e: React.FormEvent) => {
	e.preventDefault();
	const payload = { 
	  ...formData, 
	  workspace_id: workspace?.id,
	  portal_type: portalType
	};

	if (editingId) {
	  await supabase.from('subjects_edu').update(payload).eq('id', editingId);
	} else {
	  await supabase.from('subjects_edu').insert([payload]);
	}
	setIsModalOpen(false);
	fetchSubjects();
  };

  const handleDelete = async (id: string) => {
	if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع درجات الطلاب المرتبطة بها!')) return;
	await supabase.from('subjects_edu').delete().eq('id', id);
	fetchSubjects();
  };

  const openModal = (subject: any = null) => {
	if (subject) {
	  setEditingId(subject.id);
	  setFormData({ 
		name: subject.name, 
		stage: subject.stage, 
		total_mark: subject.total_mark, 
		passing_mark: subject.passing_mark 
	  });
	} else {
	  setEditingId(null);
	  setFormData({ 
		name: '', 
		stage: getDefaultStage(), 
		total_mark: 100, 
		passing_mark: 50 
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

  const mapObjectRowToSubject = (row: Record<string, any>): ImportRow => {
	const nameKey = findKey(row, ['مادة', 'name', 'subject']);
	const stageKey = findKey(row, ['مرحلة', 'stage']);
	const totalKey = findKey(row, ['عظمى', 'كلية', 'total', 'max']);
	const passKey = findKey(row, ['نجاح', 'passing', 'pass']);

	const name = nameKey ? String(row[nameKey] ?? '').trim() : '';
	let stage = stageKey ? String(row[stageKey] ?? '').trim() : '';
	if (!VALID_STAGES.includes(stage)) stage = getDefaultStage();

	const totalRaw = totalKey ? row[totalKey] : 100;
	const passRaw = passKey ? row[passKey] : 50;
	const total_mark = parseInt(String(totalRaw), 10);
	const passing_mark = parseInt(String(passRaw), 10);

	let _rowError = '';
	if (!name) _rowError = 'اسم المادة مفقود';
	else if (isNaN(total_mark) || isNaN(passing_mark)) _rowError = 'قيم الدرجات غير صحيحة';

	return {
	  name,
	  stage,
	  total_mark: isNaN(total_mark) ? 100 : total_mark,
	  passing_mark: isNaN(passing_mark) ? 50 : passing_mark,
	  _rowError
	};
  };

  const mapDelimitedLineToSubject = (cells: string[]): ImportRow => {
	const [name = '', stage = '', total = '', pass = ''] = cells.map(c => c.trim());
	let normalizedStage = stage;
	if (!VALID_STAGES.includes(normalizedStage)) normalizedStage = getDefaultStage();
	const total_mark = parseInt(total, 10);
	const passing_mark = parseInt(pass, 10);

	let _rowError = '';
	if (!name) _rowError = 'اسم المادة مفقود';

	return {
	  name,
	  stage: normalizedStage,
	  total_mark: isNaN(total_mark) ? 100 : total_mark,
	  passing_mark: isNaN(passing_mark) ? 50 : passing_mark,
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
	return json.map(mapObjectRowToSubject);
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
	  .map(line => {
		const cells = line.includes('\t') ? line.split('\t') : line.split(',');
		return cells;
	  })
	  .filter(cells => cells.length >= 1 && cells[0].trim())
	  .map(mapDelimitedLineToSubject);
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
	} catch (err: any) {
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
		name: r.name,
		stage: r.stage,
		total_mark: r.total_mark,
		passing_mark: r.passing_mark,
		workspace_id: workspace.id,
		portal_type: portalType
	  }));
	  const { error } = await supabase.from('subjects_edu').insert(payload);
	  if (error) throw error;
	  closeImportModal();
	  fetchSubjects();
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
	  { 'المادة': 'الرياضيات', 'المرحلة': getDefaultStage(), 'الدرجة العظمى': 100, 'درجة النجاح': 50 }
	];
	const ws = XLSX.utils.json_to_sheet(sample);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'المواد');
	XLSX.writeFile(wb, 'قالب_استيراد_المواد.xlsx');
  };

  return (
	<div>
	  <div className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>المواد الدراسية</h1>
		  <p style={styles.subtitle}>إعداد المقررات ودرجات النجاح لبوابة ({getDefaultStage()})</p>
		</div>
		<div style={{ display: 'flex', gap: '12px' }}>
		  <button style={styles.btnSecondary} onClick={() => window.print()}>
			<Printer size={18} /> طباعة
		  </button>
		  <button style={styles.btnSecondary} onClick={openImportModal}>
			<Upload size={18} /> استيراد من ملف
		  </button>
		  <button style={styles.btnPrimary} onClick={() => openModal()}>
			<Plus size={18} /> إضافة مادة
		  </button>
		</div>
	  </div>

	  <div id="printable-area" style={styles.card}>
		{isLoading ? (
		  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 800 }}>
			جاري التحميل...
		  </div>
		) : (
		  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
			<thead>
			  <tr>
				<th style={styles.th}>المادة</th>
				<th style={styles.th}>المرحلة</th>
				<th style={styles.th}>الدرجة العظمى</th>
				<th style={styles.th}>درجة النجاح</th>
				<th className="no-print" style={styles.th}>إجراءات</th>
			  </tr>
			</thead>
			<tbody>
			  {subjects.map(s => (
				<tr key={s.id}>
				  <td style={{ ...styles.td, fontWeight: 800, color: 'var(--color-navy)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					  <BookOpen size={16} color="var(--color-royal)" /> 
					  {s.name}
					</div>
				  </td>
				  <td style={styles.td}>
					<span style={{ backgroundColor: 'var(--color-slate)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
					  {s.stage}
					</span>
				  </td>
				  <td style={{ ...styles.td, fontWeight: 900 }}>{s.total_mark}</td>
				  <td style={{ ...styles.td, fontWeight: 900, color: 'var(--color-success)' }}>{s.passing_mark}</td>
				  <td className="no-print" style={styles.td}>
					<button onClick={() => openModal(s)} style={{ background: 'none', border: 'none', color: 'var(--color-royal)', cursor: 'pointer', marginLeft: '12px' }}>
					  <Edit size={16} />
					</button>
					<button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
					  <Trash2 size={16} />
					</button>
				  </td>
				</tr>
			  ))}
			  {subjects.length === 0 && (
				<tr>
				  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
					لا توجد مواد مسجلة لهذه البوابة.
				  </td>
				</tr>
			  )}
			</tbody>
		  </table>
		)}
	  </div>

	  {isModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<h2 style={{ margin: '0 0 24px 0', color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>
			  {editingId ? 'تعديل مادة' : 'إضافة مادة'}
			</h2>
			<form onSubmit={handleSave}>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>اسم المادة</label>
				<input required style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
			  </div>
			  <div style={styles.inputGroup}>
				<label style={styles.label}>المرحلة</label>
				<select style={styles.input} value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
				  <option>رياض أطفال</option>
				  <option>ابتدائي</option>
				  <option>متوسط</option>
				  <option>ثانوي</option>
				</select>
			  </div>
			  <div style={{ display: 'flex', gap: '16px' }}>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>الدرجة العظمى</label>
				  <input type="number" required style={styles.input} value={formData.total_mark} onChange={e => setFormData({...formData, total_mark: parseInt(e.target.value)})} />
				</div>
				<div style={{ ...styles.inputGroup, flex: 1 }}>
				  <label style={styles.label}>درجة النجاح</label>
				  <input type="number" required style={styles.input} value={formData.passing_mark} onChange={e => setFormData({...formData, passing_mark: parseInt(e.target.value)})} />
				</div>
			  </div>
			  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
				<button type="submit" style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>حفظ</button>
				<button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnSecondary}>إلغاء</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}

	  {isImportModalOpen && (
		<div className="no-print" style={styles.modalOverlay}>
		  <div style={{ backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
			  <h2 style={{ margin: 0, color: 'var(--color-navy)', fontSize: '1.4rem', fontWeight: 900 }}>
				استيراد مواد من ملف
			  </h2>
			  <button onClick={closeImportModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
				<X size={22} />
			  </button>
			</div>

			{importStep === 'select' && (
			  <>
				<p style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '16px', fontSize: '0.9rem' }}>
				  يمكنك استيراد قائمة المواد دفعة واحدة من ملف Excel أو CSV أو Word أو PDF. للحصول على أفضل دقة، ننصح باستخدام قالب Excel أدناه.
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
					  اسم المادة, المرحلة, الدرجة العظمى, درجة النجاح (مفصولة بفاصلة)، ثم اضغط "إعادة التحليل".
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
						<th style={styles.previewTh}>المادة</th>
						<th style={styles.previewTh}>المرحلة</th>
						<th style={styles.previewTh}>العظمى</th>
						<th style={styles.previewTh}>النجاح</th>
						<th style={styles.previewTh}>الحالة</th>
						<th style={styles.previewTh}></th>
					  </tr>
					</thead>
					<tbody>
					  {previewRows.map((row, idx) => (
						<tr key={idx} style={row._rowError ? { backgroundColor: '#fef2f2' } : undefined}>
						  <td style={styles.previewTd}>{row.name || '—'}</td>
						  <td style={styles.previewTd}>{row.stage}</td>
						  <td style={styles.previewTd}>{row.total_mark}</td>
						  <td style={styles.previewTd}>{row.passing_mark}</td>
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
						  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
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
					{isImporting ? 'جاري الاستيراد...' : `استيراد ${validRowsCount} مادة`}
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

const styles: { [key: string]: React.CSSProperties } = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 },
  card: { backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
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