import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPerson, MdClose } from 'react-icons/md';

const defaultForm = { name: '', email: '', phone: '', company: '', notes: '', address: { street: '', city: '', state: '', zip: '', country: 'India' } };

const ClientModal = ({ client, onClose, onSuccess }) => {
  const [form, setForm] = useState(client || defaultForm);
  const [loading, setLoading] = useState(false);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm(f => ({ ...f, address: { ...f.address, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email required');
    setLoading(true);
    try {
      if (client?._id) {
        const res = await api.put(`/clients/${client._id}`, form);
        onSuccess(res.data.client, 'updated');
      } else {
        const res = await api.post('/clients', form);
        onSuccess(res.data.client, 'created');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</span>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Client name" />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-control" value={form.company} onChange={e => setField('company', e.target.value)} placeholder="Company name" />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="client@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" value={form.address?.city} onChange={e => setAddr('city', e.target.value)} placeholder="Mumbai" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-control" value={form.address?.state} onChange={e => setAddr('state', e.target.value)} placeholder="Maharashtra" />
              </div>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Notes</label>
              <textarea className="form-control" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any additional notes about this client..." rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [clientInvoices, setClientInvoices] = useState([]);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.clients);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  };

  const handleModalSuccess = (client, action) => {
    toast.success(`Client ${action} successfully!`);
    setShowModal(false);
    setEditClient(null);
    fetchClients();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? Their invoices will remain.')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      fetchClients();
    } catch { toast.error('Failed to delete client'); }
  };

  const handleViewClient = async (client) => {
    setViewClient(client);
    try {
      const res = await api.get(`/clients/${client._id}`);
      setClientInvoices(res.data.invoices || []);
    } catch {}
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Clients</h2>
          <p>{clients.length} total clients</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <MdAdd /> Add Client
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MdPerson /></div>
          <h3>No clients yet</h3>
          <p>Add your first client to start creating invoices</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> Add Client</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map(client => (
            <div key={client._id} className="card" style={{ padding: 24, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              onClick={() => handleViewClient(client)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0 }}>
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{client.name}</div>
                    {client.company && <div style={{ fontSize: 13, color: 'var(--gray)' }}>{client.company}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditClient(client); setShowModal(true); }}><MdEdit /></button>
                  <button className="delete-btn" onClick={() => handleDelete(client._id)}><MdDelete /></button>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, color: 'var(--gray)' }}>✉️ {client.email}</div>
                {client.phone && <div style={{ fontSize: 13, color: 'var(--gray)' }}>📞 {client.phone}</div>}
                {client.address?.city && <div style={{ fontSize: 13, color: 'var(--gray)' }}>📍 {client.address.city}, {client.address.state}</div>}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{client.totalInvoices || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>Invoices</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)' }}>{formatCurrency(client.totalAmount || 0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>Total Billed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Detail Drawer */}
      {viewClient && (
        <div className="modal-overlay" onClick={() => setViewClient(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{viewClient.name}'s Invoices</span>
              <button className="modal-close" onClick={() => setViewClient(null)}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div><div style={{ fontWeight: 700, color: 'var(--primary)' }}>{clientInvoices.length}</div><div style={{ fontSize: 12, color: 'var(--gray)' }}>Total Invoices</div></div>
                  <div><div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(viewClient.totalAmount)}</div><div style={{ fontSize: 12, color: 'var(--gray)' }}>Total Billed</div></div>
                </div>
              </div>
              {clientInvoices.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray)', padding: 24 }}>No invoices for this client yet</p>
              ) : clientInvoices.map(inv => (
                <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => { setViewClient(null); navigate(`/invoices/${inv._id}`); }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>{new Date(inv.issueDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(inv.total)}</div>
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editClient}
          onClose={() => { setShowModal(false); setEditClient(null); }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Clients;
