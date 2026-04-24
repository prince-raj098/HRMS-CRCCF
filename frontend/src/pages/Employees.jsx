import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Modal, Button, Input, Select, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Key, Users, Mail, Send, CheckSquare, Square, X } from 'lucide-react';
import { format } from 'date-fns';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const STATUSES = ['Active', 'Inactive', 'On Leave', 'Terminated'];

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Bulk email state ────────────────────────────────────────────────────
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [bulkStep, setBulkStep] = useState(1); // 1=select, 2=compose, 3=done
  const [allEmployeesForBulk, setAllEmployeesForBulk] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkSearch, setBulkSearch] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  useEffect(() => { fetchDepts(); }, []);
  useEffect(() => { fetchEmployees(); }, [search, statusFilter, page]);

  const fetchDepts = async () => {
    try { const r = await api.get('/departments'); setDepartments(r.data.data); } catch {}
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const r = await api.get('/employees', { params: { search, status: statusFilter, page, limit: 10 } });
      setEmployees(r.data.data); setTotal(r.data.total);
    } catch { toast.error('Failed to fetch employees'); }
    setLoading(false);
  };

  const openCreate = () => { setEditEmp(null); setForm({}); setShowModal(true); };
  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ ...emp, department: emp.department?._id, dateOfBirth: emp.dateOfBirth?.split('T')[0], joiningDate: emp.joiningDate?.split('T')[0] });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload._id; delete payload.__v; delete payload.user;
      if (payload['salary.basic'] !== undefined) {
        payload.salary = {
          basic: Number(payload['salary.basic'] || payload.salary?.basic || 0),
          hra: Number(payload['salary.hra'] || payload.salary?.hra || 0),
          allowances: Number(payload['salary.allowances'] || payload.salary?.allowances || 0),
        };
        delete payload['salary.basic']; delete payload['salary.hra']; delete payload['salary.allowances'];
      }
      if (editEmp) {
        await api.put(`/employees/${editEmp._id}`, payload);
        toast.success('Employee updated!');
      } else {
        const r = await api.post('/employees', payload);
        toast.success(`Created! ID: ${r.data.credentials?.username} | Pass: ${r.data.credentials?.defaultPassword}`, { duration: 8000 });
      }
      setShowModal(false); fetchEmployees();
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee? This cannot be undone.')) return;
    try { await api.delete(`/employees/${id}`); toast.success('Employee deleted'); fetchEmployees(); }
    catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const handleResetPassword = async () => {
    try {
      const r = await api.post(`/employees/${resetModal._id}/reset-password`);
      toast.success(`Password reset to: ${r.data.newPassword}`, { duration: 8000 });
      setResetModal(null);
    } catch { toast.error('Reset failed'); }
  };

  // ── Bulk email helpers ──────────────────────────────────────────────────
  const openBulkEmail = async () => {
    setBulkStep(1);
    setSelectedIds(new Set());
    setEmailSubject('');
    setEmailMessage('');
    setSendResults(null);
    setBulkSearch('');
    setShowBulkEmail(true);
    setBulkLoading(true);
    try {
      const r = await api.get('/employees', { params: { limit: 500, status: 'Active' } });
      setAllEmployeesForBulk(r.data.data || []);
    } catch { toast.error('Failed to load employees'); }
    setBulkLoading(false);
  };

  const filteredBulkEmps = allEmployeesForBulk.filter(e => {
    const q = bulkSearch.toLowerCase();
    return `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q);
  });

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredBulkEmps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBulkEmps.map(e => e._id)));
    }
  };

  const handleSendBulk = async () => {
    if (selectedIds.size === 0) { toast.error('Select at least one recipient.'); return; }
    if (!emailSubject.trim()) { toast.error('Subject is required.'); return; }
    if (!emailMessage.trim()) { toast.error('Message is required.'); return; }

    setSending(true);
    try {
      const recipients = allEmployeesForBulk
        .filter(e => selectedIds.has(e._id))
        .map(e => ({ email: e.email, name: `${e.firstName} ${e.lastName}` }));

      const r = await api.post('/email/bulk', { recipients, subject: emailSubject, message: emailMessage });
      setSendResults(r.data);
      setBulkStep(3);
      toast.success(r.data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send emails');
    }
    setSending(false);
  };

  const closeBulkEmail = () => {
    setShowBulkEmail(false);
    setBulkStep(1);
    setSelectedIds(new Set());
    setSendResults(null);
  };

  const pages = Math.ceil(total / 10);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const allSelected = filteredBulkEmps.length > 0 && selectedIds.size === filteredBulkEmps.length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Employee Management"
        subtitle={`${total} total employees`}
        action={isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Bulk Email button */}
            <Button variant="secondary" onClick={openBulkEmail} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={15} /> Send Mail
            </Button>
            <Button onClick={openCreate}><Plus size={15} />Add Employee</Button>
          </div>
        )}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input className="form-input" placeholder="Search name, ID, email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>{['Employee', 'ID', 'Department', 'Designation', 'Type', 'Status', 'Joined', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><LoadingSkeleton /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={8}><EmptyState title="No employees found" icon={Users} /></td></tr>
              ) : employees.map(emp => (
                <tr key={emp._id}>
                  <td>
                    <Link to={`/employees/${emp._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="emp-avatar">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                      <div>
                        <p className="emp-name">{emp.firstName} {emp.lastName}</p>
                        <p className="emp-sub">{emp.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{emp.employeeId}</td>
                  <td style={{ color: '#64748b' }}>{emp.department?.name || '—'}</td>
                  <td style={{ color: '#64748b' }}>{emp.designation || '—'}</td>
                  <td style={{ color: '#64748b' }}>{emp.employmentType}</td>
                  <td><Badge status={emp.status} /></td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : '—'}</td>
                  <td>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="action-btn" title="Edit" onClick={() => openEdit(emp)} style={{ color: '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="action-btn" title="Reset Password" onClick={() => setResetModal(emp)} style={{ color: '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fefce8'; e.currentTarget.style.color = '#a16207'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}>
                          <Key size={14} />
                        </button>
                        <button className="action-btn" title="Delete" onClick={() => handleDelete(emp._id)} style={{ color: '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="pagination">
            <p style={{ fontSize: 12, color: '#64748b' }}>Showing {employees.length} of {total}</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ──────────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editEmp ? 'Edit Employee' : 'Add Employee'} size="xl">
        <div className="grid-2">
          <Input label="First Name *" value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
          <Input label="Last Name *" value={form.lastName || ''} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
          <Input label="Email *" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          <Input label="Phone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 xxxxx xxxxx" />
          <Input label="Date of Birth *" type="date" value={form.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} />
          <Input label="Joining Date *" type="date" value={form.joiningDate || ''} onChange={e => set('joiningDate', e.target.value)} />
          <Select label="Department" value={form.department || ''} onChange={e => set('department', e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Select>
          <Input label="Designation" value={form.designation || ''} onChange={e => set('designation', e.target.value)} placeholder="e.g., Senior Developer" />
          <Select label="Employment Type" value={form.employmentType || 'Full-time'} onChange={e => set('employmentType', e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Select label="Status" value={form.status || 'Active'} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
          {editEmp && <Input label="Employee ID" value={form.employeeId || ''} onChange={e => set('employeeId', e.target.value)} />}
          <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <Input label="Basic Salary (₹)" type="number" value={form['salary.basic'] || form.salary?.basic || ''} onChange={e => set('salary.basic', e.target.value)} />
            <Input label="HRA (₹)" type="number" value={form['salary.hra'] || form.salary?.hra || ''} onChange={e => set('salary.hra', e.target.value)} />
            <Input label="Allowances (₹)" type="number" value={form['salary.allowances'] || form.salary?.allowances || ''} onChange={e => set('salary.allowances', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editEmp ? 'Update Employee' : 'Create Employee'}</Button>
        </div>
      </Modal>

      {/* ── Reset Password Modal ──────────────────────────────────────── */}
      <Modal isOpen={!!resetModal} onClose={() => setResetModal(null)} title="Reset Password" size="sm">
        <p style={{ fontSize: 13, color: '#64748b' }}>Reset password for <strong>{resetModal?.firstName} {resetModal?.lastName}</strong>? It will revert to the default <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>firstname+mmdd</code> pattern.</p>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setResetModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleResetPassword}>Reset Password</Button>
        </div>
      </Modal>

      {/* ── Bulk Email Modal ──────────────────────────────────────────── */}
      <Modal isOpen={showBulkEmail} onClose={closeBulkEmail} title="Send Bulk Email" size="xl">
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
          {['Select Recipients', 'Compose Email', 'Done'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bulkStep > i + 1 ? '#10b981' : bulkStep === i + 1 ? '#2563eb' : '#e2e8f0',
                  color: bulkStep >= i + 1 ? 'white' : '#94a3b8', fontWeight: 700, fontSize: 12,
                }}>
                  {bulkStep > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: bulkStep === i + 1 ? 700 : 400, color: bulkStep === i + 1 ? '#2563eb' : '#64748b' }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: '#e2e8f0', margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select recipients */}
        {bulkStep === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={toggleAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                  {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.size > 0 && (
                  <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  className="form-input"
                  placeholder="Search employees…"
                  value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                  style={{ paddingLeft: 30, fontSize: 13, padding: '7px 12px 7px 30px', width: 220 }}
                />
              </div>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
              {bulkLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading employees…</div>
              ) : filteredBulkEmps.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No employees found</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      <th style={{ width: 40, padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}></th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBulkEmps.map(emp => (
                      <tr key={emp._id}
                        onClick={() => toggleSelect(emp._id)}
                        style={{ cursor: 'pointer', background: selectedIds.has(emp._id) ? '#eff6ff' : 'white', transition: '0.15s' }}
                        onMouseEnter={e => { if (!selectedIds.has(emp._id)) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = selectedIds.has(emp._id) ? '#eff6ff' : 'white'; }}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedIds.has(emp._id) ? '#2563eb' : '#d1d5db'}`, background: selectedIds.has(emp._id) ? '#2563eb' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}>
                            {selectedIds.has(emp._id) && <X size={10} color="white" strokeWidth={3} />}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="emp-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{emp.firstName} {emp.lastName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>{emp.email}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>{emp.department?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="secondary" onClick={closeBulkEmail}>Cancel</Button>
              <Button onClick={() => setBulkStep(2)} disabled={selectedIds.size === 0}>
                Next: Compose Email ({selectedIds.size} selected)
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Compose */}
        {bulkStep === 2 && (
          <>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color="#0369a1" />
              <span style={{ fontSize: 13, color: '#0369a1' }}>
                Sending to <strong>{selectedIds.size}</strong> recipient{selectedIds.size > 1 ? 's' : ''}. Each email is personalized with the recipient's name.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Subject *"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="e.g. Important Company Announcement"
              />
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea
                  rows={8}
                  className="form-textarea"
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  placeholder="Type your message here…&#10;&#10;The email will start with 'Dear [Employee Name],' automatically."
                  style={{ resize: 'vertical' }}
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Each email is addressed to the individual employee's name automatically.</p>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setBulkStep(1)}>← Back</Button>
              <Button
                loading={sending}
                onClick={handleSendBulk}
                style={{ background: '#2563eb', color: 'white' }}
                disabled={!emailSubject.trim() || !emailMessage.trim()}
              >
                <Send size={15} style={{ marginRight: 6 }} />
                Send to {selectedIds.size} Recipient{selectedIds.size > 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Results */}
        {bulkStep === 3 && sendResults && (
          <>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Mail size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Emails Sent!</h3>
              <p style={{ fontSize: 14, color: '#64748b' }}>{sendResults.message}</p>
            </div>

            {sendResults.results && (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                {sendResults.results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <span style={{ color: '#0f172a' }}>{r.email}</span>
                    <span style={{ fontWeight: 600, color: r.status === 'sent' ? '#10b981' : '#dc2626' }}>
                      {r.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer">
              <Button onClick={closeBulkEmail}>Done</Button>
            </div>
          </>
        )}
      </Modal>
    </DashboardLayout>
  );
}
