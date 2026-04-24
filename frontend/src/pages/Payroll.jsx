import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, Button, Select, Input, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Download, Plus, CheckCircle, Send } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Payroll() {
  const { isAdmin } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [genForm, setGenForm] = useState({ employeeId: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
  const [generating, setGenerating] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => { fetchPayrolls(); }, [filterMonth, filterYear]);
  useEffect(() => { if (isAdmin) fetchEmployees(); }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const r = await api.get('/payroll', { params: { month: filterMonth, year: filterYear } });
      setPayrolls(r.data.data); setTotal(r.data.total);
    } catch {} setLoading(false);
  };
  const fetchEmployees = async () => {
    try { const r = await api.get('/employees', { params: { limit: 200, status: 'Active' } }); setEmployees(r.data.data); } catch {}
  };

  const handleGenerate = async () => {
    if (!genForm.employeeId) return toast.error('Please select an employee');
    setGenerating(true);
    try {
      await api.post('/payroll/generate', genForm);
      toast.success('Payroll generated!'); fetchPayrolls();
    } catch (e) { toast.error(e.response?.data?.message || 'Generation failed'); }
    setGenerating(false);
  };

  // Mark as paid (HR sends notification, employee confirms)
  const handleSendNotification = async (id) => {
    try {
      await api.put(`/payroll/${id}/pay`);
      toast.success('Marked as Paid & notification sent!');
      fetchPayrolls();
    } catch { toast.error('Failed'); }
  };

  const downloadPayslip = (id) => {
    const token = localStorage.getItem('hrms_token');
    window.open(`${import.meta.env.VITE_API_URL}/payroll/${id}/pdf?token=${token}`, '_blank');
  };

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
  const setGen = (k, v) => setGenForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardLayout>
      <PageHeader title="Payroll Management" subtitle={`${total} payroll records`} />

      {/* Generate Payroll */}
      {isAdmin && (
        <div className="section mb-6">
          <div className="section-header">
            <span className="section-title"><Plus size={15} style={{ color: '#2563eb' }} />Generate Payroll</span>
          </div>
          <div className="section-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <Select label="Employee" value={genForm.employeeId} onChange={e => setGen('employeeId', e.target.value)}>
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
                </Select>
              </div>
              <div>
                <Select label="Month" value={genForm.month} onChange={e => setGen('month', e.target.value)}>
                  {MONTHS.map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
                </Select>
              </div>
              <div>
                <Select label="Year" value={genForm.year} onChange={e => setGen('year', e.target.value)}>
                  {years.map(y => <option key={y}>{y}</option>)}
                </Select>
              </div>
              <Button loading={generating} onClick={handleGenerate}>Generate</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Select label="" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
        </Select>
        <Select label="" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          {years.map(y => <option key={y}>{y}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>{['Employee', 'Period', 'Gross', 'Deductions', 'Net Salary', 'Days Worked', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><LoadingSkeleton /></td></tr>
                : payrolls.length === 0 ? <tr><td colSpan={8}><EmptyState title="No payroll records" icon={DollarSign} /></td></tr>
                : payrolls.map(p => (
                  <tr key={p._id}>
                    <td>
                      <p style={{ fontWeight: 600, color: '#1e293b' }}>{p.employee?.firstName} {p.employee?.lastName}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>{p.employee?.employeeId}</p>
                    </td>
                    <td style={{ color: '#64748b' }}>{MONTHS[p.month - 1]} {p.year}</td>
                    <td style={{ color: '#374151' }}>₹{p.grossSalary?.toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>-₹{p.totalDeductions?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>₹{p.netSalary?.toLocaleString()}</td>
                    <td style={{ color: '#64748b' }}>{p.daysWorked} days</td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button title="Download Payslip" onClick={() => downloadPayslip(p._id)}
                          style={{ width: 30, height: 30, borderRadius: 7, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                          <Download size={14} />
                        </button>
                        {isAdmin && p.status !== 'Paid' && p.status !== 'Payment Received' && (
                          <button title="Send Notification & Mark Paid" onClick={() => handleSendNotification(p._id)}
                            style={{ width: 30, height: 30, borderRadius: 7, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <Send size={14} />
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
    </DashboardLayout>
  );
}
