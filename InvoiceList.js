import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate, getStatusBadge } from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdDelete, MdVisibility, MdEdit } from 'react-icons/md';

const statuses = ['all', 'paid', 'pending', 'overdue', 'draft'];

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: activeStatus };
      const res = await api.get('/invoices', { params });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>All Invoices</h2>
          <p>{total} total invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/invoices/create')}>
          <MdAdd /> Create Invoice
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <MdSearch />
          <input
            placeholder="Search invoice or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {statuses.map(s => (
          <button key={s} className={`filter-btn ${activeStatus === s ? 'active' : ''}`} onClick={() => setActiveStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <h3>No invoices found</h3>
              <p>Create your first invoice to get started</p>
              <button className="btn btn-primary" onClick={() => navigate('/invoices/create')}>
                <MdAdd /> Create Invoice
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv._id}`)}>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoiceNumber}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.client?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)' }}>{inv.client?.company}</div>
                    </td>
                    <td>{formatDate(inv.issueDate)}</td>
                    <td style={{ color: inv.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{formatDate(inv.dueDate)}</td>
                    <td style={{ fontWeight: 700, fontSize: 15 }}>{formatCurrency(inv.total)}</td>
                    <td>
                      <span className={getStatusBadge(inv.status)}>
                        <span className={`status-dot dot-${inv.status}`}></span>
                        {inv.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/invoices/${inv._id}`)}>
                          <MdVisibility />
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/invoices/${inv._id}/edit`)}>
                          <MdEdit />
                        </button>
                        <button className="delete-btn" onClick={(e) => handleDelete(inv._id, e)}>
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
