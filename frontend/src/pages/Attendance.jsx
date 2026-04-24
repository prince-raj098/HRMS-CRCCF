import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Input, Select, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, X, CalendarCheck, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

const LEAVE_TYPES = ['Casual', 'Sick', 'Annual', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

export default function Attendance() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('leaves');
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({});
  const [attForm, setAttForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    checkIn: '09:00',
    checkOut: '18:30',
  });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchLeaves();
    if (isAdmin) { fetchAttendance(); fetchEmployees(); }
  }, [filterStatus]);

  const fetchLeaves = async () => {
    setLoading(true);
    try { const r = await api.get('/leaves', { params: { status: filterStatus } }); setLeaves(r.data.data); } catch {}
    setLoading(false);
  };
  const fetchAttendance = async () => {
    try { const r = await api.get('/attendance', { params: { limit: 100 } }); setAttendance(r.data.data); } catch {}
  };
  const fetchEmployees = async () => {
    try { const r = await api.get('/employees', { params: { limit: 200, status: 'Active' } }); setEmployees(r.data.data); } catch {}
  };

  const handleApplyLeave = async () => {
    setSaving(true);
    try { await api.post('/leaves', leaveForm); toast.success('Leave applied!'); setShowLeaveModal(false); setLeaveForm({}); fetchLeaves(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleApprove = async (id, status) => {
    try { await api.put(`/leaves/${id}/approve`, { status }); toast.success(`Leave ${status}!`); fetchLeaves(); }
    catch { toast.error('Failed'); }
  };

  // Mark attendance for one employee
  const handleMarkAttendance = async () => {
    if (!attForm.employee) return toast.error('Select an employee');
    setSaving(true);
    try {
      // Build checkIn/checkOut as full datetime strings
      const dateStr = attForm.date;
      const checkInDt = attForm.checkIn ? `${dateStr}T${attForm.checkIn}:00` : undefined;
      const checkOutDt = attForm.checkOut ? `${dateStr}T${attForm.checkOut}:00` : undefined;
      await api.post('/attendance', { ...attForm, checkIn: checkInDt, checkOut: checkOutDt });
      toast.success('Attendance marked!');
      setShowAttModal(false);
      fetchAttendance();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const set = (obj, setObj) => (k, v) => setObj(p => ({ ...p, [k]: v }));
  const setLeave = set(leaveForm, setLeaveForm);
  const setAtt = set(attForm, setAttForm);

  return (
    <DashboardLayout>
      <PageHeader
        title="Attendance & Leave Management"
        subtitle="Track attendance and manage leave requests"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {!isAdmin && <Button onClick={() => setShowLeaveModal(true)}><Plus size={14} />Apply Leave</Button>}
            {isAdmin && <Button onClick={() => setShowAttModal(true)}><CalendarCheck size={14} />Mark Attendance</Button>}
          </div>
        }
      />

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'leaves' ? 'active' : ''}`} onClick={() => setTab('leaves')}>Leave Requests</button>
        {isAdmin && <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>Attendance Records</button>}
      </div>

      {tab === 'leaves' && (
        <>
          {/* Filter pills */}
          <div className="filter-pills">
            {['', 'Pending', 'Approved', 'Rejected'].map(s => (
              <button key={s} className={`pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>{['Employee', 'Leave Type', 'Dates', 'Days', 'Reason', 'Status', ...(isAdmin ? ['Actions'] : [])].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={7}><LoadingSkeleton /></td></tr>
                    : leaves.length === 0 ? <tr><td colSpan={7}><EmptyState title="No leave requests" icon={CalendarCheck} /></td></tr>
                    : leaves.map(l => (
                      <tr key={l._id}>
                        <td><span style={{ fontWeight: 600, color: '#1e293b' }}>{l.employee?.firstName} {l.employee?.lastName}</span></td>
                        <td style={{ color: '#64748b' }}>{l.leaveType}</td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>
                          {format(new Date(l.startDate), 'MMM d')} – {format(new Date(l.endDate), 'MMM d, yyyy')}
                        </td>
                        <td style={{ color: '#64748b' }}>{l.totalDays}d</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{l.reason}</td>
                        <td><Badge status={l.status} /></td>
                        {isAdmin && (
                          <td>
                            {l.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button title="Approve" onClick={() => handleApprove(l._id, 'Approved')}
                                  style={{ width: 28, height: 28, borderRadius: 7, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                  <Check size={14} />
                                </button>
                                <button title="Reject" onClick={() => handleApprove(l._id, 'Rejected')}
                                  style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'attendance' && isAdmin && (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>{['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {attendance.length === 0
                  ? <tr><td colSpan={6}><EmptyState title="No attendance records" icon={Clock} /></td></tr>
                  : attendance.map(a => (
                    <tr key={a._id}>
                      <td><span style={{ fontWeight: 600 }}>{a.employee?.firstName} {a.employee?.lastName}</span></td>
                      <td style={{ color: '#64748b' }}>{format(new Date(a.date), 'MMM d, yyyy')}</td>
                      <td style={{ color: '#64748b' }}>{a.checkIn ? format(new Date(a.checkIn), 'hh:mm a') : '—'}</td>
                      <td style={{ color: '#64748b' }}>{a.checkOut ? format(new Date(a.checkOut), 'hh:mm a') : '—'}</td>
                      <td style={{ color: '#64748b' }}>{a.workHours?.toFixed(1) || '0'}h</td>
                      <td><Badge status={a.status} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal (employees) */}
      <Modal isOpen={showLeaveModal} onClose={() => { setShowLeaveModal(false); setLeaveForm({}); }} title="Apply for Leave" size="sm">
        <div className="space-y-4">
          <Select label="Leave Type" value={leaveForm.leaveType || ''} onChange={e => setLeave('leaveType', e.target.value)}>
            <option value="">Select type</option>
            {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Start Date" type="date" value={leaveForm.startDate || ''} onChange={e => setLeave('startDate', e.target.value)} />
          <Input label="End Date" type="date" value={leaveForm.endDate || ''} onChange={e => setLeave('endDate', e.target.value)} />
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" rows={3} value={leaveForm.reason || ''} onChange={e => setLeave('reason', e.target.value)} placeholder="Please provide reason for leave…" />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowLeaveModal(false); setLeaveForm({}); }}>Cancel</Button>
          <Button loading={saving} onClick={handleApplyLeave}>Submit Leave Request</Button>
        </div>
      </Modal>

      {/* Mark Attendance Modal (HR) */}
      <Modal isOpen={showAttModal} onClose={() => setShowAttModal(false)} title="Mark Attendance" size="sm">
        <div className="space-y-4">
          <Select label="Employee *" value={attForm.employee || ''} onChange={e => setAtt('employee', e.target.value)}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
          </Select>
          <Input label="Date" type="date" value={attForm.date || ''} onChange={e => setAtt('date', e.target.value)} />
          <Select label="Status" value={attForm.status || 'Present'} onChange={e => setAtt('status', e.target.value)}>
            {['Present', 'Absent', 'Half Day', 'On Leave', 'Work From Home', 'Holiday'].map(s => <option key={s}>{s}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Check In Time</label>
              <input className="form-input" type="time" value={attForm.checkIn || '09:00'} onChange={e => setAtt('checkIn', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Check Out Time</label>
              <input className="form-input" type="time" value={attForm.checkOut || '18:30'} onChange={e => setAtt('checkOut', e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Default times: 9:00 AM – 6:30 PM. Click fields to edit.</p>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowAttModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleMarkAttendance}>Mark Attendance</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
