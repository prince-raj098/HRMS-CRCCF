import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Select, Input, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Plus } from 'lucide-react';
import { format } from 'date-fns';

const LEAVE_TYPES = ['Casual', 'Sick', 'Annual', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

export default function MyAttendance() {
  const { user } = useAuth();
  const [tab, setTab] = useState('attendance');
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendanceSummary();
    fetchMyLeaves();
  }, []);

  const fetchAttendanceSummary = async () => {
    try {
      const empId = user?.employee?._id || user?.employee;
      if (!empId) return;
      const now = new Date();
      const r = await api.get(`/attendance/summary/${empId}`, { params: { month: now.getMonth() + 1, year: now.getFullYear() } });
      setAttendance(r.data.data);
    } catch {}
    setLoading(false);
  };

  const fetchMyLeaves = async () => {
    try { const r = await api.get('/leaves'); setLeaves(r.data.data); } catch {}
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      await api.post('/leaves', leaveForm);
      toast.success('Leave request submitted!');
      setShowLeaveModal(false); setLeaveForm({});
      fetchMyLeaves();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const set = (k, v) => setLeaveForm(p => ({ ...p, [k]: v }));

  const summaryItems = [
    { label: 'Present', value: attendance?.summary?.present, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Absent', value: attendance?.summary?.absent, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Half Day', value: attendance?.summary?.halfDay, color: '#a16207', bg: '#fefce8' },
    { label: 'On Leave', value: attendance?.summary?.onLeave, color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'WFH', value: attendance?.summary?.wfh, color: '#6d28d9', bg: '#f5f3ff' },
    { label: 'Total Hours', value: `${attendance?.summary?.totalHours?.toFixed(0) || 0}h`, color: '#475569', bg: '#f8fafc' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="My Attendance"
        subtitle="Your attendance records and leave requests"
        action={<Button onClick={() => setShowLeaveModal(true)}><Plus size={14} />Apply for Leave</Button>}
      />

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>This Month</button>
        <button className={`tab-btn ${tab === 'leaves' ? 'active' : ''}`} onClick={() => setTab('leaves')}>My Leave Requests</button>
      </div>

      {tab === 'attendance' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
            Attendance Summary — {format(new Date(), 'MMMM yyyy')}
          </h3>
          {loading ? <LoadingSkeleton rows={2} height={80} />
            : !attendance ? <EmptyState title="No attendance data" icon={CalendarCheck} />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                {summaryItems.map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 32, fontWeight: 800, color }}>{value ?? 0}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color, marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
            )}

          {/* Daily Records */}
          {attendance?.records?.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 24 }}>
              <div className="table-scroll">
                <table>
                  <thead><tr>{['Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {attendance.records.map(r => (
                      <tr key={r._id}>
                        <td>{format(new Date(r.date), 'MMM d, yyyy')}</td>
                        <td style={{ color: '#64748b' }}>{r.checkIn ? format(new Date(r.checkIn), 'hh:mm a') : '—'}</td>
                        <td style={{ color: '#64748b' }}>{r.checkOut ? format(new Date(r.checkOut), 'hh:mm a') : '—'}</td>
                        <td style={{ color: '#64748b' }}>{r.workHours?.toFixed(1) || '0'}h</td>
                        <td><Badge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'leaves' && (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead><tr>{['Leave Type', 'Dates', 'Days', 'Reason', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {leaves.length === 0
                  ? <tr><td colSpan={5}><EmptyState title="No leave requests" icon={CalendarCheck} message="Apply for leave using the button above" /></td></tr>
                  : leaves.map(l => (
                    <tr key={l._id}>
                      <td style={{ fontWeight: 600 }}>{l.leaveType}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{format(new Date(l.startDate), 'MMM d')} – {format(new Date(l.endDate), 'MMM d, yyyy')}</td>
                      <td style={{ color: '#64748b' }}>{l.totalDays}d</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{l.reason}</td>
                      <td><Badge status={l.status} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={showLeaveModal} onClose={() => { setShowLeaveModal(false); setLeaveForm({}); }} title="Apply for Leave" size="sm">
        <div className="space-y-4">
          <Select label="Leave Type *" value={leaveForm.leaveType || ''} onChange={e => set('leaveType', e.target.value)}>
            <option value="">Select type</option>
            {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Start Date *" type="date" value={leaveForm.startDate || ''} onChange={e => set('startDate', e.target.value)} />
          <Input label="End Date *" type="date" value={leaveForm.endDate || ''} onChange={e => set('endDate', e.target.value)} />
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" rows={3} value={leaveForm.reason || ''} onChange={e => set('reason', e.target.value)} placeholder="Please provide reason for leave…" />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowLeaveModal(false); setLeaveForm({}); }}>Cancel</Button>
          <Button loading={saving} onClick={handleApplyLeave}>Submit Request</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
