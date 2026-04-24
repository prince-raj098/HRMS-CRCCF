import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Input, Select, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Download, Plus, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { uploadsUrl } from '../services/api';

const DOC_TYPES = ['ID Proof', 'Address Proof', 'Educational', 'Experience', 'Contract', 'Other'];

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'Other' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try { const r = await api.get('/documents'); setDocuments(r.data.data); } catch {}
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    if (!form.title) { toast.error('Please enter a document title'); return; }
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

  const getFileIcon = (mime) => {
    if (!mime) return '📁';
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    return '📁';
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="My Documents"
        subtitle={`${documents.length} documents`}
        action={<Button onClick={() => setShowModal(true)}><Plus size={14} />Upload Document</Button>}
      />

      {loading ? <LoadingSkeleton />
        : documents.length === 0 ? <EmptyState title="No documents uploaded" icon={FileText} message="Upload your documents for HR verification" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {documents.map(doc => (
              <div key={doc._id} style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{getFileIcon(doc.mimeType)}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{doc.title}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{doc.fileName}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{doc.type}</span>
                    <Badge status={doc.isVerified ? 'Verified' : 'Pending'} />
                  </div>
                  <a href={`${uploadsUrl}/${doc.filePath}`} target="_blank" rel="noreferrer"
                    style={{ width: 30, height: 30, borderRadius: 7, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={13} />
                  </a>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>Uploaded {format(new Date(doc.createdAt), 'MMM d, yyyy')}</p>
              </div>
            ))}
          </div>
        )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFile(null); setForm({ type: 'Other' }); }} title="Upload Document" size="sm">
        <div className="space-y-4">
          <Input label="Document Title *" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Aadhaar Card" />
          <Select label="Document Type" value={form.type || 'Other'} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>File *</label>
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}
              onClick={() => document.getElementById('myDocFile').click()}>
              <input id="myDocFile" type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <p style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>✓ {file.name}</p>
              ) : (
                <>
                  <Upload size={22} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#64748b' }}>Click to select file</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>PDF, Images, Word (max 10MB)</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setFile(null); }}>Cancel</Button>
          <Button loading={saving} onClick={handleUpload}>Upload</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
