import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Modal, Input, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try { const r = await api.get('/departments'); setDepartments(r.data.data); } catch {}
    setLoading(false);
  };

  const openCreate = () => { setEditDept(null); setForm({ name: '', code: '', description: '' }); setShowModal(true); };
  const openEdit = (d) => { setEditDept(d); setForm({ name: d.name, code: d.code, description: d.description || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Department name is required');
    if (!form.code.trim()) return toast.error('Department code is required');
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      if (editDept) { await api.put(`/departments/${editDept._id}`, payload); toast.success('Department updated!'); }
      else { await api.post('/departments', payload); toast.success('Department created!'); }
      setShowModal(false); fetchDepartments();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await api.delete(`/departments/${id}`); toast.success('Deleted'); fetchDepartments(); } catch { toast.error('Failed — department may have employees assigned'); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments`}
        action={<Button onClick={openCreate}><Plus size={14} />Add Department</Button>}
      />

      {loading ? <LoadingSkeleton /> : departments.length === 0 ? (
        <EmptyState title="No departments yet" icon={Building2} message="Create your first department" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {departments.map(dept => (
            <div key={dept._id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf5', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Building2 size={20} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(dept)} style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(dept._id)} style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 14 }}>
                {dept.name} <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: 4, marginLeft: 6, verticalAlign: 'middle' }}>{dept.code}</span>
              </h3>
              {dept.description && <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{dept.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
                <Users size={12} />{dept.employeeCount || 0} employees
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editDept ? 'Edit Department' : 'Add Department'} size="sm">
        <div className="space-y-4">
          <Input label="Department Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Engineering" />
          <Input label="Department Code *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. ENG" />
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description…" />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>{editDept ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
