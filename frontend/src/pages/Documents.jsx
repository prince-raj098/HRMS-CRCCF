import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Input, Select, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Download, Shield, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { uploadsUrl } from '../services/api';

const DOC_TYPES = ['ID Proof', 'Address Proof', 'Educational', 'Experience', 'Contract', 'Offer Letter', 'Payslip', 'Other'];

export default function Documents() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'Other' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');

  useEffect(() => { fetchDocuments(); if (isAdmin) fetchEmployees(); }, [filterType]);

  const fetchDocuments = async () => {
    setLoading(true);
    try { const r = await api.get('/documents', { params: { type: filterType } }); setDocuments(r.data.data); } catch {}
    setLoading(false);
  };
  const fetchEmployees = async () => {
    try { const r = await api.get('/employees', { params: { limit: 200 } }); setEmployees(r.data.data); } catch {}
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded!');
      setShowModal(false); setFile(null); setForm({ type: 'Other' }); fetchDocuments();
    } catch (e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    setSaving(false);
  };

  const handleVerify = async (id) => {
    try { await api.put(`/documents/${id}/verify`); toast.success('Document verified!'); fetchDocuments(); } catch { toast.error('Failed'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.delete(`/documents/${id}`); toast.success('Deleted!'); fetchDocuments(); } catch { toast.error('Failed'); }
  };

  const getFileIcon = (mime) => {
    if (!mime) return '📁';
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    return '📁';
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardLayout>
      <PageHeader
        title="Document Management"
        subtitle={`${documents.length} documents`}
        action={<Button onClick={() => setShowModal(true)}><Plus size={14} />Upload Document</Button>}
      />

      {/* Type Filter Tabs */}
      <div className="tabs">
        {['', ...DOC_TYPES].map(t => (
          <button key={t} className={`tab-btn ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
            {t || 'All Types'}
          </button>
        ))}
      </div>

      {/* View Toggle / Breadcrumb */}
      {selectedEmployee && (
        <div style={{ marginBottom: 20 }}>
          <Button variant="secondary" size="sm" onClick={() => setSelectedEmployee(null)}>
            ← Back to All Employees
          </Button>
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Documents for {selectedEmployee.firstName} {selectedEmployee.lastName}
            </h3>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!selectedEmployee ? (
        // EMPLOYEE LIST VIEW
        loading ? <LoadingSkeleton /> : employees.length === 0 ? (
          <EmptyState title="No employees found" icon={Users} />
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Documents</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const empDocs = documents.filter(d => d.employee?._id === emp._id);
                    const pendingDocs = empDocs.filter(d => !d.isVerified).length;
                    return (
                      <tr key={emp._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="emp-avatar">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                            <div>
                              <p className="emp-name">{emp.firstName} {emp.lastName}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8' }}>{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{emp.department?.name || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{empDocs.length}</span>
                          {pendingDocs > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4 }}>{pendingDocs} pending</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Button size="sm" variant="secondary" onClick={() => setSelectedEmployee(emp)}>
                            View Documents
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // SPECIFIC EMPLOYEE DOCUMENTS VIEW
        loading ? <LoadingSkeleton /> : documents.filter(d => d.employee?._id === selectedEmployee._id).length === 0 ? (
          <EmptyState title="No documents" icon={FileText} message="This employee has no documents" />
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.filter(d => d.employee?._id === selectedEmployee._id).map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{getFileIcon(doc.mimeType)}</span>
                          <div>
                            <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{doc.title}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{doc.type}</span></td>
                      <td style={{ fontSize: 12, color: '#94a3b8' }}>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</td>
                      <td>
                        {doc.isVerified
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#16a34a', fontSize: 12, fontWeight: 600 }}><Shield size={13} /> Verified</span>
                          : <span style={{ color: '#b45309', fontSize: 12, fontWeight: 600 }}>Pending Verification</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <a href={`${uploadsUrl}/${doc.filePath}`} target="_blank" rel="noreferrer" title="View Document"
                            style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Download size={13} />
                          </a>
                          {isAdmin && !doc.isVerified && (
                            <button onClick={() => handleVerify(doc._id)} title="Verify"
                              style={{ width: 28, height: 28, borderRadius: 7, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                              <Shield size={13} />
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleDelete(doc._id)} title="Delete"
                              style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Upload Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFile(null); setForm({ type: 'Other' }); }} title="Upload Document" size="sm">
        <div className="space-y-4">
          {isAdmin && (
            <Select label="Employee" value={form.employee || ''} onChange={e => set('employee', e.target.value)}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
            </Select>
          )}
          <Input label="Document Title *" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Aadhaar Card" />
          <Select label="Document Type" value={form.type || 'Other'} onChange={e => set('type', e.target.value)}>
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>File *</label>
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}
              onClick={() => document.getElementById('docFile').click()}>
              <input id="docFile" type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <p style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>✓ {file.name}</p>
              ) : (
                <>
                  <FileText size={24} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#64748b' }}>Click to select file</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>PDF, Images, Word (max 10MB)</p>
                </>
              )}
            </div>
          </div>
          <Input label="Notes (optional)" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setFile(null); }}>Cancel</Button>
          <Button loading={saving} onClick={handleUpload}>Upload</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
