import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Input, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Upload, FileText, Users, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { uploadsUrl } from '../services/api';

export default function MyProjects() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(null); // holds project assignment
  const [reportFile, setReportFile] = useState(null);
  const [reportForm, setReportForm] = useState({ tasksCompleted: '', tasksRemaining: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchMyProjects(); }, []);

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const r = await api.get('/projects/my-projects');
      setAssignments(r.data.data || []);
    } catch {
      // Fallback: fetch all active employee-project assignments and filter by current user's employee
      try {
        const r = await api.get('/projects/active-employees');
        const empId = user?.employee?._id || user?.employee;
        setAssignments(r.data.data?.filter(a => a.employee?._id === empId || a.employee === empId) || []);
      } catch {}
    }
    setLoading(false);
  };

  const handleSubmitReport = async () => {
    if (!reportForm.tasksCompleted) { toast.error('Please describe tasks completed'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (reportFile) fd.append('file', reportFile);
      fd.append('taskCompleted', reportForm.tasksCompleted);
      fd.append('taskRemaining', reportForm.tasksRemaining || '');
      fd.append('project', showReportModal?.project?._id || showReportModal?._id || '');
      
      await api.post('/reports/daily', fd);
      toast.success('Daily report submitted!');
      setShowReportModal(null); setReportFile(null); setReportForm({ tasksCompleted: '', tasksRemaining: '' });
    } catch (e) {
      toast.error('Failed to submit report. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <PageHeader title="My Projects" subtitle="Your current project assignments" />

      {loading ? <LoadingSkeleton rows={3} height={160} />
        : assignments.length === 0 ? <EmptyState title="No project assignments" icon={FolderKanban} message="You have not been assigned to any projects yet" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {assignments.map(a => {
              const proj = a.project || a;
              const daysLeft = proj.expectedCompletionDate ? differenceInDays(new Date(proj.expectedCompletionDate), new Date()) : null;
              return (
                <div key={a._id} style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{proj.projectId}</p>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{proj.name}</h3>
                      </div>
                      <Badge status={proj.status || 'Active'} />
                    </div>

                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {proj.description}
                    </p>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={11} />My Role: <strong style={{ color: '#475569' }}>{a.role}</strong>
                      </div>
                      {daysLeft !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: daysLeft < 7 && daysLeft >= 0 ? '#dc2626' : '#94a3b8' }}>
                          <Calendar size={11} />{daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                        </div>
                      )}
                    </div>

                    {/* Team Members */}
                    {proj.members?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Team</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {proj.members.slice(0, 4).map((m, i) => (
                            <div key={i} title={`${m.employee?.firstName} ${m.employee?.lastName}`}
                              style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #bfdbfe, #93c5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>
                              {m.employee?.firstName?.[0]}{m.employee?.lastName?.[0]}
                            </div>
                          ))}
                          {proj.members.length > 4 && <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>+{proj.members.length - 4}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f0f4f9' }}>
                    <Button size="sm" variant="secondary" onClick={() => { setShowReportModal(a); setReportForm({ tasksCompleted: '', tasksRemaining: '' }); setReportFile(null); }}>
                      <Upload size={12} />Submit Daily Report
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Daily Report Modal */}
      <Modal isOpen={!!showReportModal} onClose={() => setShowReportModal(null)} title={`Daily Report — ${showReportModal?.project?.name || ''}`} size="md">
        <div className="space-y-4">
          <p style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: 10 }}>
            📅 Report for <strong>{format(new Date(), 'MMMM d, yyyy')}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Tasks Completed Today *</label>
            <textarea className="form-textarea" rows={3} value={reportForm.tasksCompleted} onChange={e => setReportForm(p => ({ ...p, tasksCompleted: e.target.value }))} placeholder="Describe what you completed today…" />
          </div>
          <div className="form-group">
            <label className="form-label">Tasks Remaining / Planned for Tomorrow</label>
            <textarea className="form-textarea" rows={3} value={reportForm.tasksRemaining} onChange={e => setReportForm(p => ({ ...p, tasksRemaining: e.target.value }))} placeholder="What's pending or planned next…" />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Attach Report (PDF / Word) *</label>
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}
              onClick={() => document.getElementById('reportFile').click()}>
              <input id="reportFile" type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx"
                onChange={e => setReportFile(e.target.files?.[0] || null)} />
              {reportFile ? (
                <p style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>✓ {reportFile.name}</p>
              ) : (
                <>
                  <FileText size={22} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#64748b' }}>Click to attach file</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>PDF or Word document</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowReportModal(null)}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmitReport}>Submit Report</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
