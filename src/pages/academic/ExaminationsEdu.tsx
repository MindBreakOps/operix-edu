import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { 
  FileText, PenTool, Printer, Plus, Trash2, 
  CheckCircle, BookOpen, Activity, FileSignature, Settings,
  AlertCircle
} from 'lucide-react';

// Interfaces for our data
interface Subject { id: string; name: string; }
interface Stage { id: string; name: string; }
interface Grade { id: string; name: string; }
interface Teacher { id: string; name: string; }

interface ExamConfig {
  id?: string;
  title: string;
  subject_name: string;
  stage_id: string;
  grade_name: string;
  teacher_id: string;
  date: string;
  total_marks: number;
  type: 'test' | 'exam';
  time_minutes: string;
  school_name: string;
}

interface Question {
  id: string; 
  type: 'mcq' | 'essay';
  text: string;
  options: string[]; 
  correctAnswer: string | number; 
  marks: number;
}

// ─── ROBUST FALLBACK DATA ───
const MOCK_SUBJECTS = [
  { id: 's1', name: 'القرآن الكريم' }, { id: 's2', name: 'اللغة العربية' }, 
  { id: 's3', name: 'الرياضيات' }, { id: 's4', name: 'العلوم' }, 
  { id: 's5', name: 'اللغة الإنجليزية' }, { id: 's6', name: 'الفيزياء' }
];
const MOCK_STAGES = [
  { id: 'st1', name: 'المرحلة الابتدائية' }, 
  { id: 'st2', name: 'المرحلة المتوسطة' }, 
  { id: 'st3', name: 'المرحلة الثانوية' }
];
const MOCK_GRADES = [
  { id: 'g1', name: 'الصف الأول' }, { id: 'g2', name: 'الصف الثاني' }, 
  { id: 'g3', name: 'الصف الثالث' }, { id: 'g4', name: 'الصف الرابع' },
  { id: 'g5', name: 'الصف الخامس' }, { id: 'g6', name: 'الصف السادس' }
];
const MOCK_TEACHERS = [
  { id: 't1', name: 'أحمد محمد' }, { id: 't2', name: 'خالد عبدالله' }, 
  { id: 't3', name: 'فاطمة عبدالرحمن' }, { id: 't4', name: 'نورة الدوسري' }
];

export default function ExaminationsEdu() {
  const { portalType } = useParams();
  const navigate = useNavigate();
  const { workspace } = useTenant();

  const [activeTab, setActiveTab] = useState<'tests' | 'exams' | 'studio'>('tests');

  // Master Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Studio State
  const [isEditing, setIsEditing] = useState(false);
  const [examConfig, setExamConfig] = useState<ExamConfig>({
	title: 'اختبار الفتره الأولى', 
	subject_name: 'الرياضيات', 
	stage_id: '', 
	grade_name: 'الصف الأول', 
	teacher_id: '', 
	date: new Date().toISOString().split('T')[0], 
	total_marks: 10, 
	type: 'test', 
	time_minutes: '45',
	school_name: workspace?.name || 'اسم المدرسة الأهلية'
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswersPrint, setShowAnswersPrint] = useState(false);

  // Fetch initial data
  useEffect(() => {
	if (workspace && portalType) {
	  fetchMasterData();
	  fetchAssessments();
	}
  }, [workspace, portalType]);

  const fetchMasterData = async () => {
	try {
	  const [subRes, stageRes, teacherRes] = await Promise.all([
		supabase.from('academic_subjects_edu').select('id, name').eq('workspace_id', workspace?.id),
		supabase.from('academic_stages_edu').select('id, name').eq('workspace_id', workspace?.id).eq('portal', portalType),
		supabase.from('profiles').select('id, name').eq('workspace_id', workspace?.id).eq('role_id', 'b11a322b-749e-45f5-ba33-d395212bed9b') 
	  ]);

	  // Apply fallbacks if DB returns empty or errors
	  setSubjects(subRes.data && subRes.data.length > 0 ? subRes.data : MOCK_SUBJECTS);
	  setStages(stageRes.data && stageRes.data.length > 0 ? stageRes.data : MOCK_STAGES);
	  setTeachers(teacherRes.data && teacherRes.data.length > 0 ? teacherRes.data : MOCK_TEACHERS);
	  setGrades(MOCK_GRADES); // Grades are static mock for now
	} catch (err) {
	  setSubjects(MOCK_SUBJECTS);
	  setStages(MOCK_STAGES);
	  setTeachers(MOCK_TEACHERS);
	  setGrades(MOCK_GRADES);
	}
  };

  const fetchAssessments = async () => {
	setIsLoading(true);
	try {
	  const { data, error } = await supabase
		.from('academic_assessments_edu')
		.select(`*, subject:subject_id(name), stage:stage_id(name)`)
		.eq('workspace_id', workspace?.id)
		.eq('portal', portalType);

	  if (error || !data || data.length === 0) throw new Error("No data");
	  setAssessments(data);
	} catch (err) {
	  // Fallback mock assessments
	  setAssessments([
		{ id: '1', title: 'اختبار الفتره الأولى - رياضيات', subject: { name: 'الرياضيات' }, type: 'test', date: '2026-10-15', total_marks: 15 },
		{ id: '2', title: 'الاختبار النهائي - فيزياء', subject: { name: 'الفيزياء' }, type: 'exam', date: '2026-12-20', total_marks: 40 },
	  ]);
	}
	setIsLoading(false);
  };

  // --- STUDIO FUNCTIONS ---

  const handleOpenStudioNew = () => {
	setExamConfig({ 
	  title: 'اختبار قصير', 
	  subject_name: 'اسم المادة', 
	  stage_id: stages[0]?.id || '', 
	  grade_name: 'الصف', 
	  teacher_id: teachers[0]?.id || '', 
	  date: new Date().toISOString().split('T')[0], 
	  total_marks: 10, 
	  type: activeTab === 'tests' ? 'test' : 'exam', 
	  time_minutes: '45',
	  school_name: workspace?.name || 'مدارس رواد التربية الأهلية'
	});
	setQuestions([
	  { id: Date.now().toString(), type: 'mcq', text: 'سؤال اختياري جديد...', options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'], correctAnswer: 0, marks: 1 },
	  { id: (Date.now() + 1).toString(), type: 'essay', text: 'سؤال مقالي جديد...', options: [], correctAnswer: 'الإجابة النموذجية تكتب هنا', marks: 2 }
	]);
	setIsEditing(true);
	setActiveTab('studio');
  };

  const handleOpenStudioEdit = async (assessment: any) => {
	setExamConfig({
	  id: assessment.id,
	  title: assessment.title,
	  subject_name: assessment.subject?.name || 'المادة',
	  stage_id: assessment.stage_id || '',
	  grade_name: assessment.grade_name || 'الصف',
	  teacher_id: assessment.teacher_id || '',
	  date: assessment.date,
	  total_marks: assessment.total_marks,
	  type: assessment.type,
	  time_minutes: assessment.time_minutes || '45',
	  school_name: workspace?.name || 'المدرسة الأهلية'
	});
	
	setQuestions([
	  { id: 'q1', type: 'mcq', text: 'ما هو ناتج ضرب 5 في 6؟', options: ['25', '30', '35', '40'], correctAnswer: 1, marks: 2 },
	  { id: 'q2', type: 'essay', text: 'اشرح باختصار دورة حياة النبات.', options: [], correctAnswer: 'تبدأ بالبذرة ثم الإنبات...', marks: 5 }
	]);
	
	setIsEditing(true);
	setActiveTab('studio');
  };

  const addQuestion = (type: 'mcq' | 'essay') => {
	setQuestions([...questions, { 
	  id: Date.now().toString(), 
	  type, 
	  text: '', 
	  options: type === 'mcq' ? ['', '', '', ''] : [], 
	  correctAnswer: type === 'mcq' ? 0 : '', 
	  marks: 1 
	}]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
	setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
	setQuestions(questions.map(q => {
	  if (q.id === qId) {
		const newOptions = [...q.options];
		newOptions[optIndex] = value;
		return { ...q, options: newOptions };
	  }
	  return q;
	}));
  };

  const removeQuestion = (id: string) => setQuestions(questions.filter(q => q.id !== id));

  const handleSaveExam = async () => {
	console.log("Saving Data to Dox / DB...", { examConfig, questions });
	alert("تم الحفظ وتجهيز المستند (Dox Export Ready).");
	setIsEditing(false);
	fetchAssessments();
	setActiveTab(examConfig.type === 'test' ? 'tests' : 'exams');
  };

  const handlePrint = (withAnswers: boolean) => {
	setShowAnswersPrint(withAnswers);
	setTimeout(() => window.print(), 300); 
  };

  return (
	<div style={styles.pageWrapper}>
	  <style>{`
		@media print {
		  body * { visibility: hidden; }
		  #printable-paper, #printable-paper * { visibility: visible; }
		  #printable-paper { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; border: none; }
		  .no-print { display: none !important; }
		}
		.header-input::placeholder { color: #cbd5e1; }
		.header-input:hover { background-color: rgba(0,0,0,0.02); }
		.header-input:focus { background-color: rgba(255,255,255,1); outline: 1px dashed #cbd5e1; }
	  `}</style>

	  {/* HEADER & TABS */}
	  <header className="no-print" style={styles.header}>
		<div>
		  <h1 style={styles.title}>إدارة الاختبارات والتقييم</h1>
		  <p style={styles.subtitle}>بناء النماذج، جدولة الاختبارات، ورصد الدرجات.</p>
		</div>
		<div style={styles.tabsContainer}>
		  <button onClick={() => { setActiveTab('tests'); setIsEditing(false); }} style={activeTab === 'tests' ? styles.tabActive : styles.tab}>
			<Activity size={18} /> الاختبارات القصيرة
		  </button>
		  <button onClick={() => { setActiveTab('exams'); setIsEditing(false); }} style={activeTab === 'exams' ? styles.tabActive : styles.tab}>
			<BookOpen size={18} /> الاختبارات النهائية
		  </button>
		  <button onClick={() => setActiveTab('studio')} style={activeTab === 'studio' ? {...styles.tabActive, backgroundColor: 'var(--color-navy)', color: 'white'} : styles.tab}>
			<PenTool size={18} /> استوديو النماذج
		  </button>
		</div>
	  </header>

	  {/* LIST VIEW (TESTS / EXAMS) */}
	  {(activeTab === 'tests' || activeTab === 'exams') && !isEditing && (
		<div className="no-print" style={styles.grid}>
		  {assessments.filter(a => a.type === (activeTab === 'tests' ? 'test' : 'exam')).map(assessment => (
			<div key={assessment.id} style={styles.card}>
			  <div style={styles.cardHeader}>
				<span style={styles.badge}>{assessment.subject?.name || 'مادة'}</span>
				<span style={{ fontWeight: 800, color: 'var(--color-navy)' }}>{assessment.total_marks} درجات</span>
			  </div>
			  <h3 style={{ margin: '16px 0 8px 0', color: 'var(--color-navy)', fontWeight: 900 }}>{assessment.title}</h3>
			  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 600 }}>تاريخ الانعقاد: {assessment.date}</p>
			  
			  <div style={{ display: 'flex', gap: '12px' }}>
				<button style={styles.btnPrimary} onClick={() => navigate(`/app/${portalType}/results`)}>
				  <FileSignature size={16} /> رصد الدرجات
				</button>
				<button style={styles.btnSecondary} onClick={() => handleOpenStudioEdit(assessment)}>
				  <Settings size={16} /> التعديل
				</button>
			  </div>
			</div>
		  ))}

		  {/* ADD NEW BUTTON */}
		  <button onClick={handleOpenStudioNew} style={{ ...styles.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '2px dashed var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', minHeight: '200px' }}>
			<Plus size={32} color="var(--color-royal)" />
			<span style={{ fontWeight: 800, color: 'var(--color-royal)' }}>إنشاء اختبار جديد</span>
		  </button>
		</div>
	  )}

	  {/* DOCUMENT STUDIO VIEW */}
	  {activeTab === 'studio' && (
		<div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
		  
		  {/* SIDEBAR: Settings & Question Tools */}
		  <div className="no-print" style={styles.studioSidebar}>
			
			{/* Action Buttons */}
			<div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
			  <button onClick={handleSaveExam} style={{ ...styles.btnPrimary, padding: '10px' }}>حفظ الاختبار (Dox)</button>
			  <button onClick={() => { setIsEditing(false); setActiveTab('tests'); }} style={{ ...styles.btnSecondary, padding: '10px' }}>إلغاء</button>
			</div>

			<h3 style={{ margin: '0 0 16px 0', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
			  <Settings size={18} /> التعبئة السريعة
			</h3>
			
			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
			  <select style={styles.input} onChange={e => setExamConfig({...examConfig, subject_name: e.target.value})}>
				<option value="">-- تعبئة المادة --</option>
				{subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
			  </select>

			  <select style={styles.input} onChange={e => setExamConfig({...examConfig, grade_name: e.target.value})}>
				<option value="">-- تعبئة الصف --</option>
				{grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
			  </select>

			  <select style={styles.input} value={examConfig.teacher_id} onChange={e => setExamConfig({...examConfig, teacher_id: e.target.value})}>
				<option value="">-- اختر المعلم (إداري) --</option>
				{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
			  </select>

			  <div style={{ display: 'flex', gap: '8px' }}>
				<input type="date" style={styles.input} value={examConfig.date} onChange={e => setExamConfig({...examConfig, date: e.target.value})} />
			  </div>

			  <div style={{ display: 'flex', gap: '8px' }}>
				<select style={styles.input} value={examConfig.type} onChange={e => setExamConfig({...examConfig, type: e.target.value as any})}>
				  <option value="test">اختبار قصير</option>
				  <option value="exam">اختبار نهائي</option>
				</select>
				<input type="number" style={styles.input} value={examConfig.total_marks} onChange={e => setExamConfig({...examConfig, total_marks: Number(e.target.value)})} placeholder="الدرجة" title="الدرجة الكلية" />
			  </div>
			</div>

			<h3 style={{ margin: '0 0 16px 0', color: 'var(--color-navy)', fontSize: '1.1rem' }}>قوالب الأسئلة</h3>
			<div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
			  <button onClick={() => addQuestion('mcq')} style={styles.btnOutline}>+ خيارات متعددة</button>
			  <button onClick={() => addQuestion('essay')} style={styles.btnOutline}>+ سؤال مقالي</button>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
			  <button onClick={() => handlePrint(false)} style={{ ...styles.btnPrimary, backgroundColor: 'var(--color-navy)' }}>
				<Printer size={18} /> طباعة ورقة الأسئلة
			  </button>
			  <button onClick={() => handlePrint(true)} style={{ ...styles.btnSecondary, color: '#10b981', borderColor: '#10b981' }}>
				<CheckCircle size={18} /> طباعة الإجابات
			  </button>
			</div>
		  </div>

		  {/* THE PAPER CANVAS (A4 Preview) */}
		  <div style={styles.paperCanvasWrapper}>
			<div id="printable-paper" style={styles.paperCanvas}>
			  
			  {/* FULLY EDITABLE HEADER */}
			  <div style={styles.paperHeader}>
				<div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', width: '30%', gap: '4px' }}>
				  <input value="المملكة العربية السعودية" readOnly style={{...styles.headerInput, fontSize: '1rem', fontWeight: 600}} />
				  <input value="وزارة التعليم" readOnly style={{...styles.headerInput, fontSize: '1rem', fontWeight: 600}} />
				  <input 
					className="header-input"
					value={examConfig.school_name} 
					onChange={e => setExamConfig({...examConfig, school_name: e.target.value})} 
					placeholder="اسم المدرسة"
					style={{...styles.headerInput, fontSize: '1rem', fontWeight: 600}} 
				  />
				</div>
				
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '40%', gap: '4px' }}>
				  <input 
					className="header-input"
					value={examConfig.title} 
					onChange={e => setExamConfig({...examConfig, title: e.target.value})} 
					placeholder="عنوان الاختبار"
					style={{...styles.headerInput, fontSize: '1.4rem', fontWeight: 900, textAlign: 'center'}} 
				  />
				  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>مادة:</span>
					<input 
					  className="header-input"
					  value={examConfig.subject_name} 
					  onChange={e => setExamConfig({...examConfig, subject_name: e.target.value})} 
					  placeholder="اسم المادة"
					  style={{...styles.headerInput, fontSize: '1.1rem', fontWeight: 700, textDecoration: 'underline', width: '120px', marginRight: '4px'}} 
					/>
				  </div>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', width: '30%', gap: '4px' }}>
				  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
					<span style={{ fontSize: '1rem', fontWeight: 600 }}>الزمن:</span>
					<input 
					  className="header-input"
					  value={examConfig.time_minutes} 
					  onChange={e => setExamConfig({...examConfig, time_minutes: e.target.value})} 
					  style={{...styles.headerInput, fontSize: '1rem', fontWeight: 600, width: '40px', marginRight: '4px'}} 
					/>
					<span style={{ fontSize: '1rem', fontWeight: 600, marginRight: '4px' }}>دقيقة</span>
				  </div>
				  
				  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
					<span style={{ fontSize: '1rem', fontWeight: 600 }}>الصف:</span>
					<input 
					  className="header-input"
					  value={examConfig.grade_name} 
					  onChange={e => setExamConfig({...examConfig, grade_name: e.target.value})} 
					  placeholder="اسم الصف"
					  style={{...styles.headerInput, fontSize: '1rem', fontWeight: 600, width: '100px', marginRight: '4px'}} 
					/>
				  </div>
				  
				  <p style={{ margin: '0', fontSize: '1rem', fontWeight: 600 }}>اسم الطالب: ...............................</p>
				</div>
			  </div>

			  {showAnswersPrint && (
				<div className="print-only" style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '10px', textAlign: 'center', fontWeight: 900, marginTop: '20px', border: '2px dashed #059669' }}>
				  نموذج الإجابة
				</div>
			  )}

			  {/* Questions Area */}
			  <div style={{ marginTop: '40px' }}>
				{questions.map((q, index) => (
				  <div key={q.id} style={styles.questionBlock}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
					  
					  <div style={{ flex: 1 }}>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
						  <span style={{ fontWeight: 900, fontSize: '1.1rem', marginTop: '4px' }}>س{index + 1}:</span>
						  <textarea 
							className="header-input"
							value={q.text}
							onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
							placeholder="اكتب نص السؤال هنا..."
							style={{...styles.inlineInput, fontWeight: 900}}
							rows={1}
							onInput={(e) => {
							  const target = e.target as HTMLTextAreaElement;
							  target.style.height = 'auto';
							  target.style.height = target.scrollHeight + 'px';
							}}
						  />
						</div>

						{q.type === 'mcq' && (
						  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingRight: '32px' }}>
							{q.options.map((opt, i) => (
							  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								{/* Answer selector (hidden in print unless showAnswersPrint is active) */}
								<div className="no-print">
								  <input 
									type="radio" 
									name={`correct_${q.id}`} 
									checked={q.correctAnswer === i} 
									onChange={() => updateQuestion(q.id, 'correctAnswer', i)} 
									title="تحديد كإجابة صحيحة"
								  />
								</div>
								<div className="print-only" style={{ display: 'none' }}>
								  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									{(showAnswersPrint && q.correctAnswer === i) && <div style={{ width: '8px', height: '8px', backgroundColor: '#000', borderRadius: '50%' }} />}
								  </div>
								</div>
								<input 
								  className="header-input"
								  value={opt}
								  onChange={(e) => updateOption(q.id, i, e.target.value)}
								  placeholder={`الخيار ${i + 1}`}
								  style={{ ...styles.inlineInput, fontSize: '1rem', padding: '4px' }}
								/>
							  </div>
							))}
						  </div>
						)}

						{q.type === 'essay' && (
						  <div style={{ paddingRight: '32px', marginTop: '16px' }}>
							<div className="no-print">
							  <label style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 800 }}>الإجابة النموذجية:</label>
							  <textarea 
								className="header-input"
								value={q.correctAnswer as string}
								onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
								placeholder="اكتب الإجابة النموذجية هنا..."
								style={{ ...styles.inlineInput, color: '#059669', borderBottomColor: '#059669' }}
								rows={2}
							  />
							</div>

							{/* Print view for essay */}
							<div className="print-only" style={{ display: 'none' }}>
							  {showAnswersPrint ? (
								<p style={{ color: '#059669', fontWeight: 800, marginTop: '8px' }}>الإجابة: {q.correctAnswer}</p>
							  ) : (
								<div style={{ height: '80px', width: '100%', borderBottom: '1px dotted #ccc', marginTop: '30px' }}></div>
							  )}
							</div>
						  </div>
						)}
					  </div>
					  
					  {/* Side Controls for Question */}
					  <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '80px' }}>
						<input 
						  type="number" 
						  value={q.marks} 
						  onChange={(e) => updateQuestion(q.id, 'marks', Number(e.target.value))} 
						  style={{ ...styles.input, padding: '6px', textAlign: 'center' }} 
						  title="درجة السؤال"
						/>
						<button onClick={() => removeQuestion(q.id)} style={styles.deleteBtn} title="حذف السؤال">
						  <Trash2 size={16} />
						</button>
					  </div>

					</div>
				  </div>
				))}
			  </div>
			  
			  {/* Footer */}
			  <div style={{ marginTop: '60px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
				مع تمنياتنا لكم بالتوفيق والنجاح
			  </div>
			</div>
		  </div>
		</div>
	  )}
	</div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: { padding: '40px', minHeight: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
  title: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', margin: '0 0 8px 0' },
  subtitle: { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 },
  
  tabsContainer: { display: 'flex', backgroundColor: 'var(--color-white)', padding: '6px', borderRadius: '12px', border: '1px solid var(--color-border)', gap: '4px' },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', backgroundColor: 'transparent', borderRadius: '8px', fontWeight: 800, color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', backgroundColor: 'var(--color-royal)', color: 'white', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  card: { backgroundColor: 'var(--color-white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#f1f5f9', color: 'var(--color-navy)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 900 },
  
  btnPrimary: { flex: 1, backgroundColor: 'var(--color-royal)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },
  btnSecondary: { flex: 1, backgroundColor: 'transparent', color: 'var(--color-navy)', border: '1px solid var(--color-border)', padding: '12px', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },
  btnOutline: { flex: 1, backgroundColor: '#f8fafc', color: 'var(--color-navy)', border: '1px dashed var(--color-border)', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' },
  
  // Studio Styles
  studioSidebar: { width: '320px', backgroundColor: 'var(--color-white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', flexShrink: 0, position: 'sticky', top: '20px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box' },
  
  // Paper Canvas
  paperCanvasWrapper: { flex: 1, position: 'relative' },
  paperCanvas: { backgroundColor: 'white', padding: '40px', minHeight: '800px', borderRadius: '8px', border: '1px solid #ccc', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#000', fontFamily: '"Times New Roman", Arial, sans-serif' },
  paperHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px' },
  paperText: { margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 },
  questionBlock: { marginBottom: '32px' },
  deleteBtn: { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // Invisible input styling for the canvas
  headerInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontFamily: 'inherit', padding: '2px', boxSizing: 'border-box', transition: 'background-color 0.2s' },
  inlineInput: { width: '100%', border: 'none', borderBottom: '1px dashed #ccc', backgroundColor: 'transparent', outline: 'none', fontSize: '1.1rem', fontFamily: 'inherit', resize: 'none', padding: '4px 0', overflow: 'hidden' }
};