import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Input, Select } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Mail, Phone, MapPin, Calendar, Briefcase, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { uploadsUrl } from '../services/api';

export default function MyProfile() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      if (user?.employee?._id || user?.employee) {
        const id = user.employee._id || user.employee;
        const r = await api.get(`/employees/${id}`);
        setEmployee(r.data.data);
        setForm({
          phone: r.data.data.phone || '',
          'address.street': r.data.data.address?.street || '',
          'address.city': r.data.data.address?.city || '',
          'address.state': r.data.data.address?.state || '',
          skills: r.data.data.skills?.join(', ') || '',
          'emergencyContact.name': r.data.data.emergencyContact?.name || '',
          'emergencyContact.relationship': r.data.data.emergencyContact?.relationship || '',
          'emergencyContact.phone': r.data.data.emergencyContact?.phone || '',
          'bankDetails.bankName': r.data.data.bankDetails?.bankName || '',
          'bankDetails.accountNumber': r.data.data.bankDetails?.accountNumber || '',
          'bankDetails.ifscCode': r.data.data.bankDetails?.ifscCode || '',
        });
      }
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const id = user.employee._id || user.employee;
      const payload = {
        phone: form.phone,
        address: { street: form['address.street'], city: form['address.city'], state: form['address.state'] },
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContact: { name: form['emergencyContact.name'], relationship: form['emergencyContact.relationship'], phone: form['emergencyContact.phone'] },
        bankDetails: { bankName: form['bankDetails.bankName'], accountNumber: form['bankDetails.accountNumber'], ifscCode: form['bankDetails.ifscCode'] },
      };
      await api.put(`/employees/${id}`, payload);
      toast.success('Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed'); }
    setSaving(false);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <DashboardLayout><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></DashboardLayout>;

  const initials = `${employee?.firstName?.[0] || ''}${employee?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <DashboardLayout>
      <PageHeader
        title="My Profile"
        subtitle="Your personal and employment information"
        action={
          editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setEditing(false)}><X size={14} />Cancel</Button>
              <Button loading={saving} onClick={handleSave}><Save size={14} />Save Changes</Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}><Edit2 size={14} />Edit Profile</Button>
          )
        }
      />

      {/* Profile Header */}
      <div className="section mb-4">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 18, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
              {employee?.profileImage ? <img src={`${uploadsUrl}/${employee.profileImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{employee?.firstName} {employee?.lastName}</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{employee?.designation || 'No designation'}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#475569' }}>{employee?.employeeId}</code>
                <Badge status={employee?.status} />
                <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{employee?.employmentType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Personal Info */}
        <div className="section">
          <div className="section-header"><span className="section-title">Personal Information</span></div>
          <div className="section-body">
            {editing ? (
              <div className="space-y-4">
                <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 xxxxx xxxxx" />
                <Input label="Street Address" value={form['address.street']} onChange={e => set('address.street', e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input label="City" value={form['address.city']} onChange={e => set('address.city', e.target.value)} />
                  <Input label="State" value={form['address.state']} onChange={e => set('address.state', e.target.value)} />
                </div>
                <Input label="Skills (comma separated)" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, Python" />
              </div>
            ) : (
              <>
                {[
                  ['Email', employee?.email, Mail],
                  ['Phone', employee?.phone || '—', Phone],
                  ['Address', employee?.address?.city ? `${employee.address.city}, ${employee.address.state}` : '—', MapPin],
                  ['Date of Birth', employee?.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMM d, yyyy') : '—', Calendar],
                  ['Gender', employee?.gender || '—', UserCircle],
                  ['Department', employee?.department?.name || '—', Briefcase],
                  ['Joining Date', employee?.joiningDate ? format(new Date(employee.joiningDate), 'MMM d, yyyy') : '—', Calendar],
                ].map(([label, val, Icon]) => (
                  <div key={label} className="info-row">
                    <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={13} style={{ color: '#94a3b8' }} />{label}</span>
                    <span className="info-value">{val}</span>
                  </div>
                ))}
                {employee?.skills?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {employee.skills.map(s => <span key={s} style={{ padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bank & Emergency */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section">
            <div className="section-header"><span className="section-title">Bank Details</span></div>
            <div className="section-body">
              {editing ? (
                <div className="space-y-4">
                  <Input label="Bank Name" value={form['bankDetails.bankName']} onChange={e => set('bankDetails.bankName', e.target.value)} />
                  <Input label="Account Number" value={form['bankDetails.accountNumber']} onChange={e => set('bankDetails.accountNumber', e.target.value)} />
                  <Input label="IFSC Code" value={form['bankDetails.ifscCode']} onChange={e => set('bankDetails.ifscCode', e.target.value)} />
                </div>
              ) : (
                <>
                  {[['Bank', employee?.bankDetails?.bankName || '—'], ['Account No.', employee?.bankDetails?.accountNumber || '—'], ['IFSC Code', employee?.bankDetails?.ifscCode || '—']].map(([l, v]) => (
                    <div key={l} className="info-row"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="section">
            <div className="section-header"><span className="section-title">Emergency Contact</span></div>
            <div className="section-body">
              {editing ? (
                <div className="space-y-4">
                  <Input label="Name" value={form['emergencyContact.name']} onChange={e => set('emergencyContact.name', e.target.value)} />
                  <Input label="Relationship" value={form['emergencyContact.relationship']} onChange={e => set('emergencyContact.relationship', e.target.value)} />
                  <Input label="Phone" value={form['emergencyContact.phone']} onChange={e => set('emergencyContact.phone', e.target.value)} />
                </div>
              ) : (
                <>
                  {[['Name', employee?.emergencyContact?.name || '—'], ['Relationship', employee?.emergencyContact?.relationship || '—'], ['Phone', employee?.emergencyContact?.phone || '—']].map(([l, v]) => (
                    <div key={l} className="info-row"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
