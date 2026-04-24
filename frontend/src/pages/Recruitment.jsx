import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Input, Select, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Megaphone, ExternalLink, Calendar, Edit2, Trash2, Share2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { uploadsUrl } from '../services/api';

export default function Recruitment() {
  const { isAdmin } = useAuth();
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [form, setForm] = useState({ status: 'Active' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchRecruitments(); }, [filterStatus]);

  const fetchRecruitments = async () => {
    setLoading(true);
    try { const r = await api.get('/recruitment', { params: { status: filterStatus } }); setRecruitments(r.data.data); } catch {}
    setLoading(false);
  };

  const openCreate = () => { setEditRec(null); setForm({ status: 'Active' }); setImage(null); setShowModal(true); };
  const openEdit = (r) => { setEditRec(r); setForm({ ...r, lastDate: r.lastDate?.split('T')[0] }); setImage(null); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== '_id' && k !== '__v' && k !== 'createdBy' && k !== 'image') fd.append(k, v);
      });
      if (image) fd.append('image', image);
      if (editRec) { await api.put(`/recruitment/${editRec._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Updated!'); }
      else { await api.post('/recruitment', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Job posting published!'); }
      setShowModal(false); fetchRecruitments();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recruitment notice?')) return;
    try { await api.delete(`/recruitment/${id}`); toast.success('Deleted'); fetchRecruitments(); } catch { toast.error('Failed'); }
  };

  const handleShare = (rec) => {
    const text = `${rec.title}\n\nApply here: ${rec.googleFormLink}\nLast Date: ${format(new Date(rec.lastDate), 'MMM d, yyyy')}`;
    if (navigator.share) {
      navigator.share({ title: rec.title, text, url: rec.googleFormLink }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const displayList = filterStatus ? recruitments : recruitments;

  return (
    <DashboardLayout>
      <PageHeader
        title="Recruitment"
        subtitle="Job openings and recruitment notices"
        action={isAdmin && <Button onClick={openCreate}><Plus size={14} />Post Opening</Button>}
      />

      {/* Filter pills */}
      <div className="filter-pills">
        {['', 'Active', 'Draft', 'Expired', 'Closed'].map(s => (
          <button key={s} className={`pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSkeleton rows={3} height={160} />
        : recruitments.length === 0 ? (
          <EmptyState title="No recruitment notices" icon={Megaphone} message="Post your first job opening" />
        ) : (
          <div className="grid-auto">
            {displayList.map(rec => {
              const expired = rec.lastDate && isPast(new Date(rec.lastDate));
              return (
                <div key={rec._id} style={{
                  background: 'white', borderRadius: 16, border: '1px solid #e8edf5',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
                  {/* Banner image */}
                  {rec.image && (
                    <div style={{ height: 140, overflow: 'hidden', background: '#f1f5f9' }}>
                      <img src={`${uploadsUrl}/${rec.image}`} alt={rec.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{rec.title}</h3>
                      <Badge status={expired ? 'Expired' : rec.status} />
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rec.description}
                    </p>
                    {rec.lastDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: expired ? '#dc2626' : '#64748b', marginBottom: 16 }}>
                        <Calendar size={12} />
                        <span>Last Date: <strong>{format(new Date(rec.lastDate), 'MMM d, yyyy')}</strong></span>
                      </div>
                    )}
                    {rec.location && (
                      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>📍 {rec.location} {rec.openings && `· ${rec.openings} opening${rec.openings > 1 ? 's' : ''}`}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {rec.googleFormLink && (
                          <a href={rec.googleFormLink} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#2563eb', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            <ExternalLink size={11} /> View Application
                          </a>
                        )}
                        <button onClick={() => handleShare(rec)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f1f5f9', color: '#475569', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                          <Share2 size={11} /> Share
                        </button>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(rec)}
                            style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete(rec._id)}
                            style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editRec ? 'Edit Job Opening' : 'Post Job Opening'} size="lg">
        <div className="space-y-4">
          <Input label="Job Title *" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
          <div className="form-group">
            <label className="form-label">Job Description *</label>
            <textarea className="form-textarea" rows={4} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Describe role, responsibilities, requirements…" />
          </div>
          <Input label="Google Form Link *" type="url" value={form.googleFormLink || ''} onChange={e => set('googleFormLink', e.target.value)} placeholder="https://forms.google.com/…" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Last Date to Apply *" type="date" value={form.lastDate || ''} onChange={e => set('lastDate', e.target.value)} />
            <Select label="Status" value={form.status || 'Active'} onChange={e => set('status', e.target.value)}>
              {['Draft', 'Active', 'Expired', 'Closed'].map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Location" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g. Mumbai, Remote" />
            <Input label="No. of Openings" type="number" value={form.openings || 1} onChange={e => set('openings', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Banner Image (optional)</label>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)}
              style={{ fontSize: 12, color: '#64748b' }} />
            {editRec?.image && !image && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Current image kept unless a new one is selected.</p>}
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editRec ? 'Update' : 'Publish'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
