import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate } from '../utils/api';

const paymentIcons = { cash: '💵', bank_transfer: '🏦', upi: '📱', card: '💳', cheque: '📄', other: '🔗' };

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then(res => setPayments(res.data.payments)).finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payment History</h2>
          <p>{payments.length} payments received</p>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card success">
          <div className="stat-icon success">💰</div>
          <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon primary">🧾</div>
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Paid Invoices</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">📊</div>
          <div className="stat-value">{payments.length > 0 ? formatCurrency(totalRevenue / payments.length) : '₹0'}</div>
          <div className="stat-label">Average Invoice</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No payments yet</h3>
            <p>Mark invoices as paid to see them here</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${p._id}`)}>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.invoiceNumber}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.client?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)' }}>{p.client?.company}</div>
                    </td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>
                      <span style={{ fontSize: 15 }}>{paymentIcons[p.paymentMethod] || '🔗'}</span>{' '}
                      <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{p.paymentMethod?.replace('_', ' ')}</span>
                    </td>
                    <td><span style={{ fontWeight: 800, fontSize: 16, color: 'var(--success)' }}>{formatCurrency(p.total)}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--gray)' }}>{p.paymentNotes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
