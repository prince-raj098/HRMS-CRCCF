import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Modal, Button, Input, Select, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderKanban, Edit2, Trash2, Clock, Calendar, Users } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', role: 'Developer' });
  const [editProj, setEditProj] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchProjects(); fetchEmployees(); }, [statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const r = await api.get('/projects', { params: { status: statusFilter, limit: 50 } });
      setProjects(r.data.data); setTotal(r.data.total);
    } catch { toast.error('Failed to load projects'); }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const r = await api.get('/employees', { params: { limit: 1000, status: 'Active' } });
      setEmployees(r.data.data);
    } catch {}
  };

  const fetchProjectMembers = async (projId) => {
    setFetchingMembers(true);
    try {
      const r = await api.get(`/projects/${projId}`);
      setProjectMembers(r.data.data.assignments || []);
    } catch { toast.error('Failed to load team members'); }
    setFetchingMembers(false);
  };

  const handleAssignMember = async () => {
    if (!assignForm.employeeId || !assignForm.role) return toast.error('Select employee and role');
    setSaving(true);
    try {
      await api.post(`/projects/${showMembersModal._id}/assign`, assignForm);
      toast.success('Employee assigned!');
      setAssignForm({ employeeId: '', role: 'Developer' });
      fetchProjectMembers(showMembersModal._id);
    } catch (e) { toast.error(e.response?.data?.message || 'Assignment failed'); }
    setSaving(false);
  };

  const handleRemoveMember = async (empId) => {
    if (!window.confirm('Remove this employee from the project?')) return;
    try {
      await api.delete(`/projects/${showMembersModal._id}/assign/${empId}`);
      toast.success('Employee removed');
      fetchProjectMembers(showMembersModal._id);
    } catch { toast.error('Failed to remove employee'); }
  };

  const openCreate = () => { setEditProj(null); setForm({ status: 'Planning', priority: 'Medium' }); setShowModal(true); };
  const openEdit = (p) => {
    setEditProj(p);
    setForm({ ...p, department: p.department?._id, manager: p.manager?._id, startDate: p.startDate?.split('T')[0], expectedCompletionDate: p.expectedCompletionDate?.split('T')[0] });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editProj) { await api.put(`/projects/${editProj._id}`, form); toast.success('Project updated!'); }
      else { await api.post('/projects', form); toast.success('Project created!'); }
      setShowModal(false); fetchProjects();
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try { await api.delete(`/projects/${id}`); toast.success('Deleted'); fetchProjects(); } catch { toast.error('Failed'); }
  };

  const getProgress = (proj) => {
    if (!proj.startDate || !proj.givenTime) return 0;
    const elapsed = differenceInDays(new Date(), new Date(proj.startDate));
    return Math.min(100, Math.max(0, Math.round((elapsed / proj.givenTime) * 100)));
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardLayout>
      <PageHeader
        title="Project Management"
        subtitle={`${total} total projects`}
        action={isAdmin && <Button onClick={openCreate}><Plus size={14} />New Project</Button>}
      />

      {/* Status Tabs */}
      <div className="tabs">
        {['', ...STATUSES].map(s => (
          <button key={s} className={`tab-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s || 'All Projects'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSkeleton rows={4} height={180} />
        : projects.length === 0 ? <EmptyState title="No projects found" icon={FolderKanban} message="Create your first project" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {projects.map(proj => {
              const progress = getProgress(proj);
              const daysLeft = proj.expectedCompletionDate ? differenceInDays(new Date(proj.expectedCompletionDate), new Date()) : 0;
              const progressColor = progress > 90 ? '#ef4444' : progress > 70 ? '#eab308' : '#3b82f6';
              return (
                <div key={proj._id} style={{
                  background: 'white', borderRadius: 16, border: '1px solid #e8edf5', overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8' }}>{proj.projectId}</span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{proj.name}</h3>
                      </div>
                      <Badge status={proj.priority} />
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {proj.description}
                    </p>

                    {/* Progress */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                        <span>Time elapsed</span><span style={{ fontWeight: 600 }}>{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%`, background: progressColor }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={11} />{proj.givenTime || '?'}d allotted</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: daysLeft < 7 && daysLeft >= 0 ? '#dc2626' : '#64748b' }}>
                        <Calendar size={11} />{daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                      </div>
                    </div>

                    {/* Team Members Button */}
                    <button onClick={() => { setShowMembersModal(proj); fetchProjectMembers(proj._id); }} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Users size={11} /> Manage Team Members
                    </button>
                  </div>

                  <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #f0f4f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge status={proj.status} />
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(proj)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(proj._id)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Members Modal */}
      {showMembersModal && (
        <Modal isOpen={!!showMembersModal} onClose={() => { setShowMembersModal(null); setProjectMembers([]); }} title={`${showMembersModal.name} — Team`} size="md">
          {isAdmin && (
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign New Employee</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <Select label="Employee" value={assignForm.employeeId} onChange={e => setAssignForm(p => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.designation})</option>)}
                </Select>
                <Input label="Role" value={assignForm.role} onChange={e => setAssignForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Lead Dev" />
                <Button loading={saving} onClick={handleAssignMember} style={{ height: 38 }}>Assign</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Team</p>
            {fetchingMembers ? <LoadingSkeleton rows={3} /> : projectMembers.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>No team members assigned yet.</p>
              : projectMembers.map((m) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'white', border: '1px solid #e8edf5', borderRadius: 10 }}>
                  <div className="emp-avatar">{m.employee?.firstName?.[0]}{m.employee?.lastName?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.employee?.firstName} {m.employee?.lastName}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{m.role}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleRemoveMember(m.employee?._id)} title="Remove from project" style={{ width: 26, height: 26, borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
          </div>
          <div className="modal-footer"><Button variant="secondary" onClick={() => setShowMembersModal(null)}>Close</Button></div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProj ? 'Edit Project' : 'New Project'} size="lg">
        <div className="grid-2">
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Project Name *" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Project name" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" style={{ marginTop: 4 }} rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Project description…" />
          </div>
          <Select label="Status" value={form.status || 'Planning'} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Priority" value={form.priority || 'Medium'} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </Select>
          <Input label="Start Date" type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} />
          <Input label="Expected Completion" type="date" value={form.expectedCompletionDate || ''} onChange={e => set('expectedCompletionDate', e.target.value)} />
          <Input label="Given Time (Days)" type="number" value={form.givenTime || ''} onChange={e => set('givenTime', e.target.value)} placeholder="e.g. 90" />
          <Input label="Budget (₹)" type="number" value={form.budget || ''} onChange={e => set('budget', e.target.value)} placeholder="e.g. 500000" />
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Client Name" value={form.client || ''} onChange={e => set('client', e.target.value)} placeholder="Client name (optional)" />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editProj ? 'Update' : 'Create Project'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
