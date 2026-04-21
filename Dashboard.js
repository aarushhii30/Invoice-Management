import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { formatCurrency, formatDate, getStatusBadge } from '../utils/api';
import { MdReceipt, MdCheckCircle, MdPending, MdWarning, MdPeople, MdAdd, MdTrendingUp } from 'react-icons/md';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const chartData = data?.monthlyRevenue?.map(m => ({
    name: monthNames[m._id.month - 1],
    revenue: m.revenue,
    invoices: m.count
  })) || [];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const { summary, recentInvoices, topClients } = data || {};

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon primary"><MdReceipt /></div>
          <div className="stat-value">{summary?.total || 0}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon success"><MdCheckCircle /></div>
          <div className="stat-value">{formatCurrency(summary?.totalRevenue)}</div>
          <div className="stat-label">Revenue Collected ({summary?.paid || 0} paid)</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning"><MdPending /></div>
          <div className="stat-value">{formatCurrency(summary?.pendingRevenue)}</div>
          <div className="stat-label">Pending ({summary?.pending || 0} invoices)</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon danger"><MdWarning /></div>
          <div className="stat-value">{formatCurrency(summary?.overdueRevenue)}</div>
          <div className="stat-label">Overdue ({summary?.overdue || 0} invoices)</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon primary"><MdPeople /></div>
          <div className="stat-value">{summary?.totalClients || 0}</div>
          <div className="stat-label">Total Clients</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Revenue</span>
            <MdTrendingUp style={{ color: 'var(--success)', fontSize: 20 }} />
          </div>
          <div className="card-body">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)' }}>
                <p>No payment data yet. Mark invoices as paid to see revenue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Status Overview</span>
          </div>
          <div className="card-body">
            {[
              { label: 'Paid', count: summary?.paid || 0, color: 'var(--success)', bg: '#d1fae5', pct: summary?.total ? Math.round((summary.paid / summary.total) * 100) : 0 },
              { label: 'Pending', count: summary?.pending || 0, color: 'var(--warning)', bg: '#fef3c7', pct: summary?.total ? Math.round((summary.pending / summary.total) * 100) : 0 },
              { label: 'Overdue', count: summary?.overdue || 0, color: 'var(--danger)', bg: '#fee2e2', pct: summary?.total ? Math.round((summary.overdue / summary.total) * 100) : 0 },
              { label: 'Draft', count: summary?.draft || 0, color: 'var(--gray)', bg: '#f1f5f9', pct: summary?.total ? Math.round((summary.draft / summary.total) * 100) : 0 },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--gray)' }}>{item.count} ({item.pct}%)</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 100, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Invoices</span>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices?.length > 0 ? recentInvoices.map(inv => (
                  <tr key={inv._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv._id}`)}>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</span></td>
                    <td>{inv.client?.name || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                    <td><span className={getStatusBadge(inv.status)}>{inv.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--gray)' }}>No invoices yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Clients */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Clients</span>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/clients')}>View All</button>
          </div>
          <div className="card-body">
            {topClients?.length > 0 ? topClients.map((client, idx) => (
              <div key={client._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < topClients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>{client.totalInvoices} invoices</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(client.totalAmount)}</div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray)' }}>
                <p>No clients yet</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/clients')}>
                  <MdAdd /> Add Client
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
