import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';

// --- Layouts & Guards ---
import SubscriptionGuard from './components/layout/SubscriptionGuard';
import PortalLayout from './components/layout/PortalLayout';

// --- Core Module ---
import Landing from './pages/core/Landing';
import SubscriptionsEdu from './pages/core/SubscriptionsEdu';
import Login from './pages/core/Login';
import Dashboard from './pages/core/Dashboard';
import Settings from './pages/core/Settings';
import TeacherApp from './pages/pwa/TeacherApp'; // استيراد تطبيق المعلم

// --- Users Module ---
import StudentsEdu from './pages/users/StudentsEdu';
import ParentsEdu from './pages/users/ParentsEdu';
import TeachersEdu from './pages/users/TeachersEdu';

// --- Academic Module ---
import AttendanceEdu from './pages/academic/AttendanceEdu';
import TimetableEdu from './pages/academic/TimetableEdu';
import BehaviorEdu from './pages/academic/BehaviorEdu';
import AssignmentsEdu from './pages/academic/AssignmentsEdu';
import SubjectsEdu from './pages/academic/SubjectsEdu';
import ResultsEdu from './pages/academic/ResultsEdu';
import ExaminationsEdu from './pages/academic/ExaminationsEdu';
// --- Events & Finance & Dox ---
import EventsManager from './pages/events/EventsManager';
import FeesEdu from './pages/finance/FeesEdu';
import Salaries from './pages/finance/Salaries';
import Logistics from './pages/finance/Logistics';
import Transportation from './pages/finance/Transportation';
import Debts from './pages/finance/Debts';
import KindergartenFinance from './pages/finance/KindergartenFinance';
import SpecialServices from './pages/finance/SpecialServices';
import DoxStudio from './pages/dox/DoxStudio';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 900, fontSize: '1.2rem' }}>
        جاري تحميل منصة OPERIX Edu...
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            {/* =========================================
                1. PUBLIC ROUTES (بدون حماية)
            ========================================= */}
            <Route path="/" element={<Landing />} />
            <Route path="/subscriptions" element={<SubscriptionsEdu />} />  
            <Route path="/login" element={<Login />} />

            {/* =========================================
                2. MOBILE PWA APP (مسار مستقل تماماً)
                وضعناه هنا في المستوى الأول لكي لا يتعارض مع بوابة سطح المكتب
            ========================================= */}
            <Route path="/teacher-app/*" element={<TeacherApp />} />

            {/* =========================================
                3. DESKTOP PORTAL GATEWAY (التوجيه الافتراضي)
            ========================================= */}
            <Route 
              path="/app" 
              element={<ProtectedRoute><Navigate to="/app/elementary/dashboard" replace /></ProtectedRoute>} 
            />

            {/* =========================================
                4. PROTECTED DESKTOP MULTI-PORTAL ROUTES
            ========================================= */}
            <Route path="/app/:portalType" element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
              
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />

              <Route path="students" element={<StudentsEdu />} />
              <Route path="parents" element={<ParentsEdu />} />
              <Route path="teachers" element={<TeachersEdu />} />

              <Route path="attendance" element={<AttendanceEdu />} />
              <Route path="timetable" element={<TimetableEdu />} />
              <Route path="behavior" element={<BehaviorEdu />} />
              <Route path="assignments" element={<AssignmentsEdu />} />
              <Route path="subjects" element={<SubjectsEdu />} />
              <Route path="results" element={<ResultsEdu />} />
              <Route path="examinations" element={<ExaminationsEdu />} />
              <Route path="events" element={<EventsManager />} />

              <Route path="finance">
                <Route index element={<Navigate to="fees" replace />} />
                <Route path="fees" element={<FeesEdu />} />
                <Route path="salaries" element={<Salaries />} />
                <Route path="logistics" element={<Logistics />} />
                <Route path="transportation" element={<Transportation />} />
                <Route path="debts" element={<Debts />} />
                <Route path="kindergarten" element={<KindergartenFinance />} />
                <Route path="special-services" element={<SpecialServices />} />
              </Route>

              <Route path="dox-studio" element={<DoxStudio />} />
              
              {/* مسار اصطياد الأخطاء يجب أن يكون دائماً في النهاية */}
              <Route path="*" element={<div style={{padding: '40px', textAlign: 'center', fontWeight: 900, color: '#0f172a'}}>الصفحة غير موجودة في هذه البوابة (404)</div>} />
            </Route>

          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}