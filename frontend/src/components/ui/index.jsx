import React from 'react';

// ─── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color = 'blue', sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={20} /></div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{title}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

// ─── PageHeader ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-header-actions">{action}</div>}
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  Active: 'badge-green', Inactive: 'badge-gray', Terminated: 'badge-red',
  'On Leave': 'badge-yellow', Pending: 'badge-yellow', Approved: 'badge-green',
  Rejected: 'badge-red', Paid: 'badge-green', 'Payment Received': 'badge-green',
  Draft: 'badge-gray', Processed: 'badge-blue', Planning: 'badge-purple',
  Completed: 'badge-green', Cancelled: 'badge-red', 'On Hold': 'badge-yellow',
  Expired: 'badge-red', Closed: 'badge-gray',
  Present: 'badge-green', Absent: 'badge-red', 'Half Day': 'badge-yellow',
  'Work From Home': 'badge-blue', Holiday: 'badge-purple',
  High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-green', Critical: 'badge-red',
  Verified: 'badge-green', Unverified: 'badge-yellow',
};
export function Badge({ status }) {
  return <span className={`badge ${BADGE_MAP[status] || 'badge-gray'}`}>{status}</span>;
}

// ─── Button ─────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', size = '', loading, children, className = '', ...props }) {
  const varClass = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost' }[variant];
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button {...props} disabled={loading || props.disabled}
      className={`btn ${varClass} ${sizeClass} ${loading ? 'btn-spinning' : ''} ${className}`}>
      {loading && <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/></svg>}
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input {...props} className={`form-input ${error ? 'error' : ''} ${className}`} />
      {error && <p className="form-error">{error}</p>}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

// ─── Select ─────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select {...props} className={`form-select ${className}`}>{children}</select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────
export function Textarea({ label, error, rows = 3, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea rows={rows} {...props} className={`form-textarea ${error ? 'error' : ''}`} style={{ resize: 'vertical' }} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeClass = { sm: 'modal-sm', md: 'modal-md', lg: 'modal-lg', xl: 'modal-xl' }[size];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── LoadingSkeleton ─────────────────────────────────────────────────────────
export function LoadingSkeleton({ rows = 5, height = 48 }) {
  return (
    <div className="space-y-2" style={{ padding: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ title, message, icon: Icon }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={40} className="empty-icon" />}
      <p className="empty-title">{title}</p>
      {message && <p className="empty-msg">{message}</p>}
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button key={tab} className={`tab-btn ${active === tab ? 'active' : ''}`} onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── FilterPills ─────────────────────────────────────────────────────────────
export function FilterPills({ options, active, onChange }) {
  return (
    <div className="filter-pills">
      {options.map(opt => (
        <button key={opt.value ?? opt} className={`pill ${active === (opt.value ?? opt) ? 'active' : ''}`}
          onClick={() => onChange(opt.value ?? opt)}>
          {opt.label ?? opt}
        </button>
      ))}
    </div>
  );
}
