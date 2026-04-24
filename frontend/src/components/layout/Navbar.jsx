import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

export default function Navbar({ setMobileOpen }) {
  const { user, logout, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowNotifs(false);
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try { const r = await api.get('/dashboard/notifications'); setNotifications(r.data.data || []); } catch {}
  };
  const markAllRead = async () => {
    try { await api.put('/dashboard/notifications/read-all'); fetchNotifications(); } catch {}
  };
  const unread = notifications.filter(n => !n.isRead).length;
  const initials = user?.employee
    ? `${user.employee.firstName?.[0] || ''}${user.employee.lastName?.[0] || ''}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';
  const displayName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username;

  return (
    <header className="navbar">
      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="navbar-search">
        <Search size={14} className="navbar-search-icon" />
        <input placeholder="Search employees, projects..." />
      </div>

      <div className="navbar-actions" ref={wrapRef}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="navbar-icon-btn" onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}>
            <Bell size={17} />
            {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {showNotifs && (
            <div className="dropdown notif-dropdown">
              <div className="notif-header">
                <h3>Notifications</h3>
                {unread > 0 && <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={markAllRead}>Mark all read</button>}
              </div>
              <div className="notif-scroll">
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications</p>
                ) : notifications.map(n => (
                  <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                    <p>{n.title}</p>
                    <span style={{ color: '#64748b', fontSize: 12, marginTop: 2, display: 'block' }}>{n.message}</span>
                    <span>{format(new Date(n.createdAt), 'MMM d, hh:mm a')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button className="profile-btn" onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }}>
            <div className="avatar"><span>{initials}</span></div>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{user?.role?.replace('_', ' ')}</span>
            </div>
            <ChevronDown size={13} style={{ color: '#94a3b8', marginLeft: 2 }} />
          </button>
          {showProfile && (
            <div className="dropdown" style={{ width: 200 }}>
              <Link to={isAdmin ? '/settings' : '/my-profile'} className="dropdown-item" onClick={() => setShowProfile(false)}>
                <User size={15} /> Profile & Settings
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={logout} style={{ width: '100%' }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
