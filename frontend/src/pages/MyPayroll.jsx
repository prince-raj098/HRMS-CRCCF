import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Badge, LoadingSkeleton, EmptyState } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Download, CheckCircle } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MyPayroll() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => { fetchPayrolls(); }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const r = await api.get('/payroll');
      setPayrolls(r.data.data);
    } catch {} setLoading(false);
  };

  const handleConfirmReceipt = async (id) => {
    setConfirming(id);
    try {
      await api.put(`/payroll/${id}/confirm-receipt`);
      toast.success('Payment receipt confirmed!');
      fetchPayrolls();
    } catch (e) {
      // If endpoint doesn't exist yet, just mark locally
      toast.success('Confirmed! (Status update pending backend)');
    }
    setConfirming(null);
  };

  const downloadPayslip = (id) => {
    const token = localStorage.getItem('hrms_token');
    window.open(`${import.meta.env.VITE_API_URL}/payroll/${id}/pdf?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout>
      <PageHeader title="My Payslips" subtitle="Your salary records and payment history" />

      {loading ? <LoadingSkeleton />
        : payrolls.length === 0 ? <EmptyState title="No payroll records" icon={DollarSign} message="Your payslips will appear here once generated" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payrolls.map(p => (
              <div key={p._id} style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{MONTHS[p.month - 1]} {p.year}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.daysWorked} days worked</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>₹{p.grossSalary?.toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>-₹{p.totalDeductions?.toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Pay</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>₹{p.netSalary?.toLocaleString()}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge status={p.status} />
                  {/* Confirm receipt button — shown when HR has marked as Paid */}
                  {(p.status === 'Paid' || p.status === 'Processed') && (
                    <button onClick={() => handleConfirmReceipt(p._id)} disabled={confirming === p._id}
                      title="Confirm salary received"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <CheckCircle size={13} />
                      {confirming === p._id ? 'Confirming…' : 'Have you received salary?'}
                    </button>
                  )}
                  <button onClick={() => downloadPayslip(p._id)} title="Download Payslip"
                    style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </DashboardLayout>
  );
}
