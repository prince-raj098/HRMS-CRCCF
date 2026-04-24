import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { StatCard } from '../components/ui';
import api from '../services/api';
import { Users, FolderKanban, UserCheck, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Badge } from '../components/ui';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const growthData = data?.employeeGrowth?.map(g => ({ name: MONTHS[g._id.month - 1], count: g.count })) || [];
  const projectDist = data?.projectDistribution?.map(p => ({ name: p._id, value: p.count })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
        ) : (
          <div className="grid-4">
            <StatCard title="Total Employees" value={data?.stats?.totalEmployees || 0} icon={Users} color="blue" />
            <StatCard title="Active Employees" value={data?.stats?.activeEmployees || 0} icon={UserCheck} color="green" />
            <StatCard title="Active Projects" value={data?.stats?.activeProjects || 0} icon={FolderKanban} color="purple" />
            <StatCard title="Pending Leaves" value={data?.stats?.pendingLeaves || 0} icon={Clock} color="orange" />
          </div>
        )}

        {/* Charts */}
        <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Growth Chart */}
          <div className="section">
            <div className="section-header">
              <span className="section-title"><TrendingUp size={16} style={{ color: '#2563eb' }} />Employee Growth (6 months)</span>
            </div>
            <div className="section-body">
              {growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={growthData} barSize={28}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No data yet</div>}
            </div>
          </div>

          {/* Project Distribution */}
          <div className="section">
            <div className="section-header">
              <span className="section-title"><FolderKanban size={16} style={{ color: '#7c3aed' }} />Projects by Status</span>
            </div>
            <div className="section-body">
              {projectDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={projectDist} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {projectDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, color: '#6b7280' }}>{v}</span>} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No data yet</div>}
            </div>
          </div>
        </div>

        {/* Active Employees on Projects */}
        <div className="section">
          <div className="section-header">
            <span className="section-title"><AlertCircle size={16} style={{ color: '#2563eb' }} />Active Employees on Projects</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>{['Employee', 'ID', 'Designation', 'Project', 'Role', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Loading…</td></tr>
                ) : !data?.activeOnProjects?.length ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No active project assignments</td></tr>
                ) : data.activeOnProjects.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="emp-avatar">{a.employee?.firstName?.[0]}{a.employee?.lastName?.[0]}</div>
                        <span className="emp-name">{a.employee?.firstName} {a.employee?.lastName}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{a.employee?.employeeId}</td>
                    <td style={{ color: '#64748b' }}>{a.employee?.designation || '—'}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{a.project?.name}</td>
                    <td style={{ color: '#64748b' }}>{a.role}</td>
                    <td><Badge status={a.project?.status || 'Active'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
