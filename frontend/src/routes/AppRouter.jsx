import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import EmployeeDetail from '../pages/EmployeeDetail';
import Departments from '../pages/Departments';
import Projects from '../pages/Projects';
import Attendance from '../pages/Attendance';
import Payroll from '../pages/Payroll';
import Documents from '../pages/Documents';
import Recruitment from '../pages/Recruitment';
import Reports from '../pages/Reports';
import DailyReports from '../pages/DailyReports';
import OfferLetters from '../pages/OfferLetters';
import Settings from '../pages/Settings';
// Employee self-service pages
import MyProfile from '../pages/MyProfile';
import MyAttendance from '../pages/MyAttendance';
import MyPayroll from '../pages/MyPayroll';
import MyDocuments from '../pages/MyDocuments';
import MyProjects from '../pages/MyProjects';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'hr_admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}

export default function AppRouter() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'hr_admin' ? "/dashboard" : "/my-profile"} replace /> : <Login />} />
        <Route path="/" element={<Navigate to={user ? (user.role === 'hr_admin' ? "/dashboard" : "/my-profile") : "/login"} replace />} />

        {/* Protected: All authenticated users */}
        <Route path="/recruitment" element={<ProtectedRoute><Recruitment /></ProtectedRoute>} />

        {/* HR Admin only */}
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
        <Route path="/employees/:id" element={<AdminRoute><EmployeeDetail /></AdminRoute>} />
        <Route path="/departments" element={<AdminRoute><Departments /></AdminRoute>} />
        <Route path="/projects" element={<AdminRoute><Projects /></AdminRoute>} />
        <Route path="/daily-reports" element={<AdminRoute><DailyReports /></AdminRoute>} />
        <Route path="/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
        <Route path="/payroll" element={<AdminRoute><Payroll /></AdminRoute>} />
        <Route path="/documents" element={<AdminRoute><Documents /></AdminRoute>} />
        <Route path="/offer-letters" element={<AdminRoute><OfferLetters /></AdminRoute>} />
        <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* Employee self-service */}
        <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="/my-attendance" element={<ProtectedRoute><MyAttendance /></ProtectedRoute>} />
        <Route path="/my-payroll" element={<ProtectedRoute><MyPayroll /></ProtectedRoute>} />
        <Route path="/my-documents" element={<ProtectedRoute><MyDocuments /></ProtectedRoute>} />
        <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user?.role === 'hr_admin' ? "/dashboard" : "/my-profile"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
