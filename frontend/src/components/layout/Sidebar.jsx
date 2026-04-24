import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FolderKanban, CalendarCheck, DollarSign,
  Star, FileText, Megaphone, BarChart3, Settings, ChevronLeft,
  ChevronRight, Building2, ClipboardList, UserCircle, FileCheck2
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', to: '/employees', icon: Users },
  { label: 'Departments', to: '/departments', icon: Building2 },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Daily Reports', to: '/daily-reports', icon: ClipboardList },
  { label: 'Attendance & Leave', to: '/attendance', icon: CalendarCheck },
  { label: 'Payroll', to: '/payroll', icon: DollarSign },
  { label: 'Documents', to: '/documents', icon: FileText },
  { label: 'Offer Letters', to: '/offer-letters', icon: FileCheck2 },
  { label: 'Recruitment', to: '/recruitment', icon: Megaphone },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
];

const employeeNav = [
  { label: 'My Profile', to: '/my-profile', icon: UserCircle },
  { label: 'My Attendance', to: '/my-attendance', icon: CalendarCheck },
  { label: 'My Payslips', to: '/my-payroll', icon: DollarSign },
  { label: 'My Documents', to: '/my-documents', icon: FileText },
  { label: 'My Projects', to: '/my-projects', icon: FolderKanban },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, isAdmin } = useAuth();
  const nav = isAdmin ? adminNav : employeeNav;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">HR</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <h1>CRCCF HRMS</h1>
            <p>HR Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : ''}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} className="nav-link-icon" />
            {!collapsed && <span className="nav-link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="sidebar-user">
          <p className="sidebar-user-name">{user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.username}</p>
          <p className="sidebar-user-role">{user.role?.replace('_', ' ')}</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
