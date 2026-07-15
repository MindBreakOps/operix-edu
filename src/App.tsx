import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';

// --- Layouts & Guards ---
import SubscriptionGuard from './components/layout/SubscriptionGuard';
//import AppShell from './components/layout/AppShell';
import PortalLayout from './components/layout/PortalLayout';
// --- Core Module ---
import Landing from './pages/core/Landing';
import SubscriptionsEdu from './pages/core/SubscriptionsEdu';
import Login from './pages/core/Login';
import Dashboard from './pages/core/Dashboard';
import Settings from './pages/core/Settings';
import NotFound from './pages/core/NotFound';
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

// --- Events Module ---
import EventsManager from './pages/events/EventsManager';

// --- Finance Module ---
import FeesEdu from './pages/finance/FeesEdu';
import Salaries from './pages/finance/Salaries';
import Logistics from './pages/finance/Logistics';
import Transportation from './pages/finance/Transportation';
import Debts from './pages/finance/Debts';
import KindergartenFinance from './pages/finance/KindergartenFinance';
import SpecialServices from './pages/finance/SpecialServices';

// --- Dox Studio Module ---
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
            {/* -----------------------------
                Public & Authentication Routes
                ----------------------------- */}
            <Route path="/" element={<Landing />} />
            <Route path="/subscriptions" element={<SubscriptionsEdu />} />  
            <Route path="/login" element={<Login />} />

            {/* -----------------------------
                Portal Gateway
                Redirects bare /app to a default portal or portal selection screen
                ----------------------------- */}
            <Route 
              path="/app" 
              element={<ProtectedRoute><Navigate to="/app/elementary/dashboard" replace /></ProtectedRoute>} 
            />

            {/* -----------------------------
                Protected Multi-Portal Routes
                The :portalType parameter isolates context (elementary, intermediate, etc.)
                ----------------------------- */}
          <Route path="/app/:portalType" element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
          {/* The rest of your nested routes remain the same */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
              {/* Core Views */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />

              {/* Users Views */}
              <Route path="students" element={<StudentsEdu />} />
              <Route path="parents" element={<ParentsEdu />} />
              <Route path="teachers" element={<TeachersEdu />} />

              {/* Academic Views */}
              <Route path="attendance" element={<AttendanceEdu />} />
              <Route path="timetable" element={<TimetableEdu />} />
              <Route path="behavior" element={<BehaviorEdu />} />
              <Route path="assignments" element={<AssignmentsEdu />} />
              <Route path="subjects" element={<SubjectsEdu />} />
              <Route path="results" element={<ResultsEdu />} />

              {/* Events Views */}
              <Route path="events" element={<EventsManager />} />

              {/* Finance Views (Nested Routing for Enterprise Ledger) */}
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

              {/* Tools */}
              <Route path="dox-studio" element={<DoxStudio />} />

              {/* 404 Catch-All inside Portal */}
              <Route path="*" element={<div style={{padding: '40px', textAlign: 'center', fontWeight: 900, color: '#0f172a'}}>الصفحة غير موجودة في هذه البوابة (404)</div>} />
            </Route>

          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}