import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import SubscriptionGuard from './components/layout/SubscriptionGuard';
import AppShell from './components/layout/AppShell';

import Landing from './pages/Landing';
import SubscriptionsEdu from './pages/SubscriptionsEdu';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsEdu from './pages/StudentsEdu';
import ParentsEdu from './pages/ParentsEdu';
import AttendanceEdu from './pages/AttendanceEdu';
import TimetableEdu from './pages/TimetableEdu';
import BehaviorEdu from './pages/BehaviorEdu';
import AssignmentsEdu from './pages/AssignmentsEdu';
import SubjectsEdu from './pages/SubjectsEdu';
import ResultsEdu from './pages/ResultsEdu';
import DoxStudio from './pages/DoxStudio';
import TeachersEdu from './pages/TeachersEdu';
import Settings from './pages/Settings';
import FeesEdu from './pages/FeesEdu';

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
            <Route path="/" element={<Landing />} />
            <Route path="subscriptions" element={<SubscriptionsEdu />} />  
            <Route path="/login" element={<Login />} />

            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<StudentsEdu />} />
              <Route path="parents" element={<ParentsEdu />} />
              <Route path="attendance" element={<AttendanceEdu />} />
              <Route path="timetable" element={<TimetableEdu />} />
              <Route path="behavior" element={<BehaviorEdu />} />
              <Route path="assignments" element={<AssignmentsEdu />} />
              <Route path="subjects" element={<SubjectsEdu />} />
              <Route path="results" element={<ResultsEdu />} />
              <Route path="dox-studio" element={<DoxStudio />} />
              <Route path="teachers" element={<TeachersEdu />} />
              <Route path="settings" element={<Settings />} />
              <Route path="fees" element={<FeesEdu />} />
              <Route path="*" element={<div style={{padding: '40px', textAlign: 'center', fontWeight: 900, color: '#0f172a'}}>الصفحة غير موجودة (404)</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}