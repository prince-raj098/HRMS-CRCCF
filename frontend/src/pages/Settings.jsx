import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Button, Input } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Building2, Bell } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to change password'); }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Settings" subtitle="System and account settings" />

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Account Info */}
        <div className="section">
          <div className="section-header"><span className="section-title"><Shield size={15} style={{ color: '#2563eb' }} />Account Information</span></div>
          <div className="section-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Username', user?.username],
                ['Role', user?.role?.replace('_', ' ')],
                ['Employee ID', user?.employee?.employeeId || '—'],
                ['System Version', 'HRMS v2.0'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="section">
          <div className="section-header"><span className="section-title"><KeyRound size={15} style={{ color: '#2563eb' }} />Change Password</span></div>
          <div className="section-body">
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" required />
                <Input label="New Password" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 6 characters" required />
                <Input label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" required />
              </div>
              <div style={{ marginTop: 20 }}>
                <Button type="submit" loading={saving}>Update Password</Button>
              </div>
            </form>
          </div>
        </div>

        {/* System Info */}
        <div className="section">
          <div className="section-header"><span className="section-title"><Building2 size={15} style={{ color: '#2563eb' }} />System Information</span></div>
          <div className="section-body">
            {[
              ['Organization', 'CRCCF'],
              ['System', 'HRMS v2.0 (React + Vite)'],
              ['Backend', 'Node.js + Express + MongoDB'],
              ['API URL', import.meta.env.VITE_API_URL],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: label === 'API URL' ? 'monospace' : 'inherit', fontSize: label === 'API URL' ? 11 : 13 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
