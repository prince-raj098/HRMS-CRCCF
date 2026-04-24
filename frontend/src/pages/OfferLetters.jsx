import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Button, Input, Modal } from '../components/ui';
import {
  FileText, Briefcase, DollarSign, Calendar, Mail,
  FileCheck2, ChevronLeft, Printer, UserCheck, UserPlus,
  Search, Send, CheckCircle, AlertCircle, Users
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'standard', name: 'Standard Offer Letter', desc: 'Standard IT/Professional role offer letter including standard benefits.' },
  { id: 'executive', name: 'Executive Offer Letter', desc: 'Detailed offer for leadership roles including equity and special clauses.' },
  { id: 'contract', name: 'Contractor Agreement', desc: 'Clear terms for fixed-term or freelance contractor engagements.' }
];

/* ─── Stepper component ──────────────────────────────────────────────────── */
function Stepper({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#10b981' : active ? '#2563eb' : '#e2e8f0',
                color: done || active ? 'white' : '#94a3b8', fontWeight: 700, fontSize: 13,
                transition: '0.3s'
              }}>
                {done ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, color: active ? '#2563eb' : done ? '#10b981' : '#94a3b8', marginTop: 4, fontWeight: active ? 700 : 500, textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#10b981' : '#e2e8f0', transition: '0.3s', marginBottom: 18 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function OfferLetters() {
  // Step management: 0=custom template, 1=select template, 1.5=emp type, 2a=existing emp list, 2b=form, 3=preview
  const [step, setStep] = useState(1);
  const [empType, setEmpType] = useState(null); // 'existing' | 'new'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Custom templates
  const [customTemplates, setCustomTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hrms_offer_templates')) || []; } catch { return []; }
  });
  const [newTemplate, setNewTemplate] = useState({ name: '', desc: '', body: '' });

  // Employee picker
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [empLoading, setEmpLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    candidateName: '', role: '', department: '', email: '', salary: '',
    joiningDate: '', managerName: '', companyName: 'CRCCF HRMS Tech Ltd.', location: 'Headquarters'
  });

  // Email
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const allTemplates = [...TEMPLATES, ...customTemplates];

  // Fetch employees for search
  useEffect(() => {
    if (step === 'empList') {
      fetchEmployees();
    }
  }, [step, empSearch]);

  const fetchEmployees = async () => {
    setEmpLoading(true);
    try {
      const r = await api.get('/employees', { params: { search: empSearch, limit: 50 } });
      setEmployees(r.data.data || []);
    } catch { toast.error('Failed to load employees'); }
    setEmpLoading(false);
  };

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goNext = (t) => { setSelectedTemplate(t); setStep('empType'); setEmailSent(false); };
  const goBackToTemplates = () => { setStep(1); setSelectedTemplate(null); setEmpType(null); };

  const selectEmpType = (type) => {
    setEmpType(type);
    if (type === 'existing') {
      setStep('empList');
    } else {
      // New employee – open fresh form
      setFormData({ candidateName: '', role: '', department: '', email: '', salary: '', joiningDate: '', managerName: '', companyName: 'CRCCF HRMS Tech Ltd.', location: 'Headquarters' });
      setStep(2);
    }
  };

  const selectEmployee = (emp) => {
    const totalSalary = emp.salary
      ? ((emp.salary.basic || 0) + (emp.salary.hra || 0) + (emp.salary.allowances || 0))
      : '';
    setFormData({
      candidateName: `${emp.firstName} ${emp.lastName}`,
      role: emp.designation || '',
      department: emp.department?.name || '',
      email: emp.email || '',
      salary: totalSalary ? `₹${totalSalary.toLocaleString('en-IN')} p.a.` : '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      managerName: '',
      companyName: 'CRCCF HRMS Tech Ltd.',
      location: 'Headquarters',
    });
    setStep(2);
  };

  const handleGenerate = (e) => { e.preventDefault(); setStep(3); setEmailSent(false); };
  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    if (!formData.email) { toast.error('No email address on file. Please fill in the Email field.'); return; }
    setSendingEmail(true);
    try {
      await api.post('/email/offer-letter', { formData, templateName: selectedTemplate?.name });
      toast.success(`Offer letter sent to ${formData.email}!`);
      setEmailSent(true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send email');
    }
    setSendingEmail(false);
  };

  // ── Custom template save/delete ─────────────────────────────────────────
  const handleSaveCustomTemplate = (e) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.body) return;
    const tpl = { id: 'custom_' + Date.now(), name: newTemplate.name, desc: newTemplate.desc, body: newTemplate.body, isCustom: true };
    const updated = [...customTemplates, tpl];
    setCustomTemplates(updated);
    localStorage.setItem('hrms_offer_templates', JSON.stringify(updated));
    setNewTemplate({ name: '', desc: '', body: '' });
    setStep(1);
  };

  const deleteCustomTemplate = (e, id) => {
    e.stopPropagation();
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('hrms_offer_templates', JSON.stringify(updated));
  };

  // ── Step title for stepper ───────────────────────────────────────────────
  const STEPS = ['Template', 'Employee', 'Details', 'Preview'];
  const stepIndex = { 1: 0, empType: 1, empList: 1, 2: 2, 3: 3 }[step] ?? 0;

  return (
    <DashboardLayout>
      <PageHeader title="Offer Letters" subtitle="Generate and manage employee offer letters" />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-offer, #printable-offer * { visibility: visible; }
          #printable-offer { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
          .no-print { display: none !important; }
        }
        .emp-row-pick:hover { background: #eff6ff; cursor: pointer; }
        .emp-type-card:hover { border-color: #2563eb !important; transform: translateY(-2px); }
        .emp-type-card { transition: 0.2s; }
      `}</style>

      {/* ── Step 0: Custom template editor ─────────────────────────────── */}
      {step === 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf5', padding: 32, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Create Custom Template</h3>
          </div>
          <form onSubmit={handleSaveCustomTemplate} className="space-y-4">
            <Input label="Template Name *" required value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Intern Agreement" />
            <Input label="Description" value={newTemplate.desc} onChange={e => setNewTemplate({ ...newTemplate, desc: e.target.value })} placeholder="Brief description of this template" />
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Template Body *</label>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Use placeholders: <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>{'{candidateName}'}</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>{'{role}'}</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>{'{salary}'}</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>{'{joiningDate}'}</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>{'{companyName}'}</code>.</p>
              <textarea required rows={10} className="form-textarea" value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} placeholder="Dear {candidateName}..." />
            </div>
            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="secondary" type="button" onClick={() => setStep(1)}>Cancel</Button>
              <Button type="submit">Save Template</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Step 1: Select template ─────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Select an Offer Letter Template</h3>
            <Button onClick={() => setStep(0)} variant="secondary" size="sm">+ Create Custom Template</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {allTemplates.map(t => (
              <div key={t.id}
                style={{ position: 'relative', background: 'white', borderRadius: 16, border: '1px solid #e8edf5', padding: 24, transition: '0.2s', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                onClick={() => goNext(t)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf5'; e.currentTarget.style.transform = ''; }}>
                {t.isCustom && (
                  <button onClick={(e) => deleteCustomTemplate(e, t.id)} title="Delete Template" style={{ position: 'absolute', top: 16, right: 16, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                )}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: t.isCustom ? '#fdf4ff' : '#eff6ff', color: t.isCustom ? '#d946ef' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <FileText size={24} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{t.name}</h4>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{t.desc}</p>
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, color: t.isCustom ? '#d946ef' : '#2563eb', fontSize: 13, fontWeight: 600 }}>
                  Select Template <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step empType: Existing vs New employee ──────────────────────── */}
      {step === 'empType' && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf5', padding: 32, maxWidth: 700, margin: '0 auto' }}>
          <Stepper steps={STEPS} current={1} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <button onClick={goBackToTemplates} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Who is this offer for?</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Select whether you're generating an offer letter for an existing employee already in the system, or a brand-new hire.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Existing employee */}
            <div className="emp-type-card"
              style={{ background: 'white', borderRadius: 16, border: '2px solid #e2e8f0', padding: 28, cursor: 'pointer', textAlign: 'center' }}
              onClick={() => selectEmpType('existing')}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <UserCheck size={28} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Existing Employee</h4>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Pick from the current employee list. Their profile details will be auto-filled.</p>
            </div>
            {/* New employee */}
            <div className="emp-type-card"
              style={{ background: 'white', borderRadius: 16, border: '2px solid #e2e8f0', padding: 28, cursor: 'pointer', textAlign: 'center' }}
              onClick={() => selectEmpType('new')}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <UserPlus size={28} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>New Employee</h4>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Enter details for a new hire who is not yet in the system.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step empList: Search & select existing employee ─────────────── */}
      {step === 'empList' && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf5', padding: 32, maxWidth: 800, margin: '0 auto' }}>
          <Stepper steps={STEPS} current={1} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep('empType')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Select Employee</h3>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              className="form-input"
              placeholder="Search by name, ID or email…"
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Employee table */}
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'center' }}>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {empLoading ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Loading…</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No employees found</td></tr>
                  ) : employees.map(emp => (
                    <tr key={emp._id} className="emp-row-pick" onClick={() => selectEmployee(emp)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="emp-avatar">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                          <div>
                            <p className="emp-name">{emp.firstName} {emp.lastName}</p>
                            <p className="emp-sub">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{emp.department?.name || '—'}</td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{emp.email}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Button size="sm" onClick={() => selectEmployee(emp)}>Select</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Form ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf5', padding: 32, maxWidth: 800, margin: '0 auto' }}>
          <Stepper steps={STEPS} current={2} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <button onClick={() => setStep(empType === 'existing' ? 'empList' : 'empType')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={16} /> Back
            </button>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {empType === 'existing' ? 'Review & Edit Details' : 'New Employee Details'} — {selectedTemplate?.name}
              </h3>
              {empType === 'existing' && (
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Fields auto-filled from employee profile. You can override any value.</p>
              )}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Input label="Candidate Name *" required value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} icon={Users} />
              <Input label="Email Address *" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} icon={Mail} placeholder="candidate@example.com" />
              <Input label="Role / Designation *" required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} icon={Briefcase} />
              <Input label="Department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
              <Input label="Annual Salary *" required value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} placeholder="e.g. ₹8,50,000 p.a." icon={DollarSign} />
              <Input label="Joining Date *" type="date" required value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} icon={Calendar} />
              <Input label="Reporting Manager *" required value={formData.managerName} onChange={e => setFormData({ ...formData, managerName: e.target.value })} />
              <Input label="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="secondary" type="button" onClick={goBackToTemplates}>Cancel</Button>
              <Button type="submit"><FileCheck2 size={16} style={{ marginRight: 6 }} /> Generate Offer Letter</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Step 3: Preview ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ maxWidth: 850, margin: '0 auto' }}>
          {/* Action bar */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ChevronLeft size={16} style={{ marginRight: 6 }} /> Edit Details
            </Button>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={handlePrint} style={{ background: '#475569', color: 'white' }}>
                <Printer size={16} style={{ marginRight: 6 }} /> Print / PDF
              </Button>
              <Button
                onClick={handleSendEmail}
                loading={sendingEmail}
                style={{ background: emailSent ? '#10b981' : '#2563eb', color: 'white' }}
                disabled={emailSent}
              >
                {emailSent
                  ? <><CheckCircle size={16} style={{ marginRight: 6 }} /> Sent!</>
                  : <><Send size={16} style={{ marginRight: 6 }} /> Send via Email</>
                }
              </Button>
            </div>
          </div>

          {/* Email note */}
          {formData.email && !emailSent && (
            <div className="no-print" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} />
              <span>Will be sent to: <strong>{formData.email}</strong></span>
            </div>
          )}
          {emailSent && (
            <div className="no-print" style={{ background: '#ecfdf5', color: '#065f46', padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={14} />
              <span>Offer letter email sent successfully to <strong>{formData.email}</strong>!</span>
            </div>
          )}
          {!formData.email && (
            <div className="no-print" style={{ background: '#fef9c3', color: '#92400e', padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={14} />
              <span>No email address set. Go back to Edit Details to add one before sending.</span>
            </div>
          )}

          <div className="no-print" style={{ background: '#e0e7ff', color: '#3730a3', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={16} />
            <span><strong>Live editable document.</strong> Click anywhere on the text below to make manual adjustments before printing or sending.</span>
          </div>

          {/* Offer letter document */}
          <div id="printable-offer"
            contentEditable={true}
            suppressContentEditableWarning={true}
            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '60px 80px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#1e293b', fontSize: '15px', lineHeight: 1.6, fontFamily: 'serif', outline: 'none' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: 20, marginBottom: 40 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{formData.companyName}</h1>
                <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 13 }}>Enabling the Future of Work</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#475569' }}>
                <p style={{ margin: 0 }}>Date: {format(new Date(), 'MMMM d, yyyy')}</p>
                <p style={{ margin: '4px 0 0' }}>{formData.location}</p>
              </div>
            </div>

            {selectedTemplate?.isCustom ? (
              <div style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>
                {selectedTemplate.body
                  .replace(/\{candidateName\}/g, formData.candidateName || '[Candidate Name]')
                  .replace(/\{role\}/g, formData.role || '[Role]')
                  .replace(/\{salary\}/g, formData.salary || '[Salary]')
                  .replace(/\{joiningDate\}/g, formData.joiningDate ? format(new Date(formData.joiningDate), 'MMMM d, yyyy') : '[Joining Date]')
                  .replace(/\{companyName\}/g, formData.companyName || '[Company Name]')
                  .replace(/\{managerName\}/g, formData.managerName || '[Manager Name]')
                }
              </div>
            ) : (
              <>
                <p style={{ fontWeight: 600, fontSize: 16 }}>Dear {formData.candidateName},</p>
                <p style={{ marginTop: 20 }}>
                  We are absolutely delighted to extend to you an offer of employment at <strong>{formData.companyName}</strong>.
                  We were thoroughly impressed by your background and believe you will be an outstanding addition to our team.
                </p>
                <p style={{ marginTop: 16 }}>
                  You are being offered the position of <strong>{formData.role}</strong>, reporting directly to <strong>{formData.managerName}</strong>.
                  Your anticipated start date will be <strong>{formData.joiningDate ? format(new Date(formData.joiningDate), 'MMMM d, yyyy') : '[Date]'}</strong>.
                  {formData.department && <> This role will be within the <strong>{formData.department}</strong> department.</>}
                </p>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '30px 0 10px' }}>1. Compensation and Benefits</h3>
                <p>
                  Your initial compensation will be <strong>{formData.salary}</strong> per annum, subject to standard legally required deductions and withholdings.
                  This will be paid in accordance with the company's normal payroll procedures.
                  In addition, you will be eligible to participate in the company's standard employee benefits program.
                </p>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '30px 0 10px' }}>2. Terms of Employment</h3>
                <p>
                  Your employment with {formData.companyName} will be "at-will," meaning that either you or the company may terminate your employment at any time, with or without cause or advance notice.
                  This letter supersedes any prior agreements, representations, or promises regarding your employment.
                </p>
                {selectedTemplate?.id === 'executive' && (
                  <>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '30px 0 10px' }}>3. Executive Equity Grant</h3>
                    <p>
                      As an executive capacity team member, you will be subject to a restricted stock unit (RSU) grant. The details associated with the vesting schedule and terms of execution will be addressed in a separate Equity Grant document to be reviewed upon your formal acceptance.
                    </p>
                  </>
                )}
                <p style={{ marginTop: 40 }}>
                  If you accept this offer, please sign and date this letter below and return it to us.
                  We are excited to have you join our team and are confident that your employment at {formData.companyName} will be mutually rewarding.
                </p>
              </>
            )}

            <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 250 }}>
                <p style={{ margin: '0 0 50px', fontWeight: 600 }}>For {formData.companyName}:</p>
                <div style={{ borderTop: '1px solid #1e293b' }}></div>
                <p style={{ margin: '8px 0 0', fontWeight: 600 }}>HR Management</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>Authorized Signatory</p>
              </div>
              <div style={{ width: 250 }}>
                <p style={{ margin: '0 0 50px', fontWeight: 600 }}>Accepted by:</p>
                <div style={{ borderTop: '1px solid #1e293b' }}></div>
                <p style={{ margin: '8px 0 0', fontWeight: 600 }}>{formData.candidateName}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
