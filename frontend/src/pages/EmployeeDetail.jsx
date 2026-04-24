import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Button } from '../components/ui';
import api from '../services/api';
import { uploadsUrl } from '../services/api';
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const TABS = ['Overview', 'Documents', 'Attendance', 'Payroll', 'Performance', 'Projects'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [tabData, setTabData] = useState(null);

  useEffect(() => { fetchEmployee(); }, [id]);
  useEffect(() => { if (employee) fetchTabData(); }, [activeTab, employee]);

  const fetchEmployee = async () => {
    try { const r = await api.get(`/employees/${id}`); setEmployee(r.data.data); } catch {}
    setLoading(false);
  };

  const fetchTabData = async () => {
    setTabData(null);
    try {
      if (activeTab === 'Documents') {
        const r = await api.get('/documents', { params: { employeeId: id } }); setTabData(r.data.data);
      } else if (activeTab === 'Payroll') {
        const r = await api.get('/payroll', { params: { employeeId: id } }); setTabData(r.data.data);
      } else if (activeTab === 'Performance') {
        const r = await api.get('/performance', { params: { employeeId: id } }); setTabData(r.data.data);
      } else if (activeTab === 'Projects') {
        const r = await api.get('/projects/active-employees');
        setTabData(r.data.data.filter(a => a.employee?._id === id || a.employee === id));
      } else if (activeTab === 'Attendance') {
        const now = new Date();
        const r = await api.get(`/attendance/summary/${id}`, { params: { month: now.getMonth() + 1, year: now.getFullYear() } });
        setTabData(r.data.data);
      }
    } catch {}
  };

  if (loading) return <DashboardLayout><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></DashboardLayout>;
  if (!employee) return <DashboardLayout><p style={{ color: '#64748b' }}>Employee not found.</p></DashboardLayout>;

  const initials = `${employee.firstName?.[0]}${employee.lastName?.[0]}`.toUpperCase();

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/employees')} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Employee Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="section">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 80, height: 80, borderRadius: 18, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                {employee.profileImage ? <img src={`${uploadsUrl}/${employee.profileImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{employee.firstName} {employee.lastName}</h2>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{employee.designation || 'No designation set'}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <code style={{ fontSize: 12, background: '#f1f5f9', padding: '3px 10px', borderRadius: 8, color: '#475569', fontFamily: 'monospace' }}>{employee.employeeId}</code>
                      <Badge status={employee.status} />
                      <span style={{ fontSize: 12, background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 8, fontWeight: 600 }}>{employee.employmentType}</span>
                    </div>
                  </div>
                  <Link to="/employees"><Button variant="secondary" size="sm">Edit Employee</Button></Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 20 }}>
                  {[
                    { icon: Mail, val: employee.email },
                    { icon: Phone, val: employee.phone || '—' },
                    { icon: Briefcase, val: employee.department?.name || '—' },
                    { icon: Calendar, val: employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM d, yyyy') : '—' },
                  ].map(({ icon: Icon, val }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <Icon size={14} style={{ color: '#94a3b8', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="section">
          <div style={{ padding: 24 }}>
            {activeTab === 'Overview' && (
              <div className="grid-2">
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Personal Information</h3>
                  {[
                    ['Date of Birth', employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMM d, yyyy') : '—'],
                    ['Gender', employee.gender || '—'],
                    ['Address', employee.address ? `${employee.address.city || ''}, ${employee.address.state || ''}` : '—'],
                    ['Skills', employee.skills?.join(', ') || '—'],
                    ['Emergency Contact', employee.emergencyContact?.name ? `${employee.emergencyContact.name} (${employee.emergencyContact.relationship})` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="info-row">
                      <span className="info-label">{label}</span>
                      <span className="info-value">{value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Salary Structure</h3>
                  {[
                    { label: 'Basic', value: employee.salary?.basic, bold: false },
                    { label: 'HRA', value: employee.salary?.hra, bold: false },
                    { label: 'Allowances', value: employee.salary?.allowances, bold: false },
                    { label: 'Gross CTC', value: (employee.salary?.basic || 0) + (employee.salary?.hra || 0) + (employee.salary?.allowances || 0), bold: true },
                  ].map(({ label, value, bold }) => (
                    <div key={label} className="info-row">
                      <span className="info-label">{label}</span>
                      <span className="info-value" style={bold ? { fontWeight: 700, color: '#2563eb' } : {}}>₹{(value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Bank Details</h3>
                    {[
                      ['Bank', employee.bankDetails?.bankName || '—'],
                      ['Account No.', employee.bankDetails?.accountNumber || '—'],
                      ['IFSC', employee.bankDetails?.ifscCode || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="info-row">
                        <span className="info-label">{label}</span>
                        <span className="info-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Attendance' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Attendance Summary (This Month)</h3>
                {!tabData ? <div className="skeleton" style={{ height: 100, borderRadius: 12 }} /> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Present', value: tabData.summary?.present, bg: '#f0fdf4', color: '#15803d' },
                      { label: 'Absent', value: tabData.summary?.absent, bg: '#fef2f2', color: '#b91c1c' },
                      { label: 'Half Day', value: tabData.summary?.halfDay, bg: '#fefce8', color: '#a16207' },
                      { label: 'On Leave', value: tabData.summary?.onLeave, bg: '#eff6ff', color: '#1d4ed8' },
                      { label: 'WFH', value: tabData.summary?.wfh, bg: '#f5f3ff', color: '#6d28d9' },
                      { label: 'Total Hours', value: `${tabData.summary?.totalHours?.toFixed(0) || 0}h`, bg: '#f8fafc', color: '#475569' },
                    ].map(({ label, value, bg, color }) => (
                      <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: bg, textAlign: 'center' }}>
                        <p style={{ fontSize: 26, fontWeight: 800, color }}>{value ?? 0}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, color, marginTop: 3 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Documents' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Employee Documents</h3>
                {!tabData ? <div className="skeleton" style={{ height: 80, borderRadius: 12 }} /> :
                  !tabData.length ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No documents uploaded.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tabData.map(doc => (
                        <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{doc.title}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{doc.type} · {doc.fileName}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Badge status={doc.isVerified ? 'Verified' : 'Unverified'} />
                            <a href={`${uploadsUrl}/${doc.filePath}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>View</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'Payroll' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Payroll History</h3>
                {!tabData ? <div className="skeleton" style={{ height: 80, borderRadius: 12 }} /> :
                  !tabData.length ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No payroll records.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tabData.map(p => (
                        <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{MONTHS[p.month - 1]} {p.year}</p>
                            <Badge status={p.status} />
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>₹{p.netSalary?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'Performance' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Performance Reviews</h3>
                {!tabData ? <div className="skeleton" style={{ height: 80, borderRadius: 12 }} /> :
                  !tabData.length ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No reviews yet.</p> : (
                    tabData.map(r => (
                      <div key={r._id} style={{ padding: '16px', background: '#f8fafc', borderRadius: 12, marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>⭐ {r.overallRating?.toFixed(1)}/5</span>
                          <Badge status={r.status} />
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b' }}>{r.feedback}</p>
                      </div>
                    ))
                  )}
              </div>
            )}

            {activeTab === 'Projects' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Project Assignments</h3>
                {!tabData ? <div className="skeleton" style={{ height: 80, borderRadius: 12 }} /> :
                  !tabData.length ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No project assignments.</p> : (
                    tabData.map(a => (
                      <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{a.project?.name}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Role: {a.role}</p>
                        </div>
                        <Badge status={a.project?.status || 'Active'} />
                      </div>
                    ))
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
