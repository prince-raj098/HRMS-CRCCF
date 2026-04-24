import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, DollarSign, CalendarCheck, FolderKanban } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const growthData = data?.employeeGrowth?.map(g => ({ name: MONTHS[g._id.month - 1], count: g.count })) || [];
  const projectDist = data?.projectDistribution?.map(p => ({ name: p._id, value: p.count })) || [];
  const deptDist = data?.departmentDistribution?.map(d => ({ name: d._id, value: d.count })) || [];

  const summaryCards = [
    { label: 'Total Employees', value: data?.stats?.totalEmployees || 0, icon: Users, color: '#eff6ff', iconColor: '#2563eb' },
    { label: 'Active Projects', value: data?.stats?.activeProjects || 0, icon: FolderKanban, color: '#f5f3ff', iconColor: '#7c3aed' },
    { label: 'Pending Leaves', value: data?.stats?.pendingLeaves || 0, icon: CalendarCheck, color: '#fefce8', iconColor: '#a16207' },
    { label: 'Payroll This Month', value: `₹${(data?.stats?.totalPayroll || 0).toLocaleString()}`, icon: DollarSign, color: '#f0fdf4', iconColor: '#16a34a' },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Reports & Analytics" subtitle="Overview of your organization's key metrics" />

      {/* Summary Cards */}
      <div className="grid-4 mb-6">
        {summaryCards.map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={19} style={{ color: iconColor }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{loading ? '—' : value}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Employee Growth */}
        <div className="section">
          <div className="section-header"><span className="section-title">Employee Growth (6 months)</span></div>
          <div className="section-body">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={growthData} barSize={28}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: 48, fontSize: 13 }}>No data</p>}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="section">
          <div className="section-header"><span className="section-title">Employees by Department</span></div>
          <div className="section-body">
            {deptDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deptDist} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {deptDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={projectDist} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {projectDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Project Status Distribution */}
      <div className="section">
        <div className="section-header"><span className="section-title">Project Status Overview</span></div>
        <div className="section-body">
          {projectDist.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {projectDist.map((p, i) => (
                <div key={p.name} style={{ flex: '1 1 120px', padding: '16px 20px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e8edf5', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{p.value}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{p.name}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#94a3b8', fontSize: 13 }}>No project data available</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
