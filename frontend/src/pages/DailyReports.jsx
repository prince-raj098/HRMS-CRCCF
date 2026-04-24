import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Button, Modal, LoadingSkeleton, EmptyState } from '../components/ui';
import api, { uploadsUrl } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Eye, Download, Calendar, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState(null);

  // ── Project filter state ───────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchReports(); }, [selectedProject]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const r = await api.get('/projects');
      setProjects(r.data.data || []);
    } catch {
      // Silently fail — filter just won't populate
    }
    setProjectsLoading(false);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProject) params.project = selectedProject;
      const r = await api.get('/reports/daily', { params });
      setReports(r.data.data || []);
    } catch {
      toast.error('Failed to fetch daily reports');
    }
    setLoading(false);
  };

  const clearFilter = () => setSelectedProject('');

  const selectedProjectName = projects.find(p => p._id === selectedProject)?.name || '';

  return (
    <DashboardLayout>
      <PageHeader
        title="Daily Project Reports"
        subtitle="Review employee daily progress and submissions"
      />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #e8edf5',
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 600 }}>
          <Filter size={15} />
          <span>Filter by Project:</span>
        </div>

        <div style={{ position: 'relative', minWidth: 220 }}>
          <select
            className="form-select"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{ paddingRight: selectedProject ? 36 : 12 }}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <button
            onClick={clearFilter}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer'
            }}>
            <span>{selectedProjectName}</span>
            <X size={12} />
          </button>
        )}

        {/* Report count badge */}
        <span style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
          {loading ? '…' : reports.length} report{reports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Reports table ───────────────────────────────────────────────── */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Project</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><LoadingSkeleton /></td></tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title={selectedProject ? `No reports for "${selectedProjectName}"` : 'No reports found'}
                      message={selectedProject ? 'Try selecting a different project or clear the filter.' : undefined}
                      icon={FileText}
                    />
                  </td>
                </tr>
              ) : reports.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="emp-avatar">{r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}</div>
                      <div>
                        <p className="emp-name">{r.employee?.firstName} {r.employee?.lastName}</p>
                        <p className="emp-sub">{r.employee?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>{r.project?.name || 'Unknown Project'}</span></td>
                  <td style={{ color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} /> {format(new Date(r.date), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Button onClick={() => setViewReport(r)} variant="secondary" size="sm">
                      <Eye size={14} style={{ marginRight: 6 }} /> View Report
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Report Modal ────────────────────────────────────────────── */}
      <Modal isOpen={!!viewReport} onClose={() => setViewReport(null)} title="Daily Report Details" size="md">
        {viewReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>EMPLOYEE</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{viewReport.employee?.firstName} {viewReport.employee?.lastName}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>{viewReport.project?.name}</span>
                <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>{format(new Date(viewReport.date), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Task Completed</p>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 14, borderRadius: 10, color: '#065f46', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {viewReport.taskCompleted || 'No details provided'}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Task Remaining</p>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 14, borderRadius: 10, color: '#92400e', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {viewReport.taskRemaining || 'No details provided'}
              </div>
            </div>

            {viewReport.fileUrl && (
              <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Attached File / Report</p>
                <a href={`${uploadsUrl}/${viewReport.fileUrl}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eff6ff', color: '#2563eb', padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe' }}>
                  <Download size={16} /> Download Attachment
                </a>
              </div>
            )}
          </div>
        )}
        <div className="modal-footer" style={{ marginTop: 24 }}>
          <Button onClick={() => setViewReport(null)} style={{ width: '100%' }}>Close</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
