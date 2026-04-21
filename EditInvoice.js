import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdArrowBack } from 'react-icons/md';

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ client: '', dueDate: '', taxRate: 0, discountRate: 0, notes: '', terms: '' });
  const [items, setItems] = useState([{ name: '', description: '', quantity: 1, price: 0 }]);

  useEffect(() => {
    Promise.all([
      api.get(`/invoices/${id}`),
      api.get('/clients')
    ]).then(([invRes, clientRes]) => {
      const inv = invRes.data.invoice;
      setForm({
        client: inv.client?._id || inv.client,
        dueDate: inv.dueDate?.split('T')[0],
        taxRate: inv.taxRate, discountRate: inv.discountRate,
        notes: inv.notes || '', terms: inv.terms || ''
      });
      setItems(inv.items.map(i => ({ name: i.name, description: i.description || '', quantity: i.quantity, price: i.price })));
      setClients(clientRes.data.clients);
    }).catch(() => { toast.error('Failed to load invoice'); navigate('/invoices'); })
    .finally(() => setFetching(false));
  }, [id]);

  const updateItem = (idx, field, value) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const addItem = () => setItems(prev => [...prev, { name: '', description: '', quantity: 1, price: 0 }]);
  const removeItem = (idx) => items.length > 1 && setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
  const discountAmount = (subtotal * (parseFloat(form.discountRate) || 0)) / 100;
  const taxAmount = ((subtotal - discountAmount) * (parseFloat(form.taxRate) || 0)) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/invoices/${id}`, { ...form, items });
      toast.success('Invoice updated!');
      navigate(`/invoices/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate(`/invoices/${id}`)}>
        <MdArrowBack /> Back to Invoice
      </button>

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Invoice Details</span></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select className="form-control" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Notes & Terms</span></div>
              <div className="card-body">
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
                <div className="form-group mb-0"><label className="form-label">Terms</label><textarea className="form-control" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} rows={3} /></div>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Items</span></div>
              <div className="card-body">
                {items.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>Item {idx + 1}</span>
                      {items.length > 1 && <button type="button" className="delete-btn" onClick={() => removeItem(idx)}><MdDelete /></button>}
                    </div>
                    <div className="form-group"><input className="form-control" placeholder="Name" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} /></div>
                    <div className="form-group"><input className="form-control" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} /></div>
                    <div className="form-grid-3">
                      <div className="form-group mb-0"><label className="form-label">Qty</label><input type="number" className="form-control" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></div>
                      <div className="form-group mb-0"><label className="form-label">Price (₹)</label><input type="number" className="form-control" min="0" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} /></div>
                      <div className="form-group mb-0"><label className="form-label">Total</label><input className="form-control" value={formatCurrency((item.quantity || 0) * (item.price || 0))} readOnly /></div>
                    </div>
                  </div>
                ))}
                <button type="button" className="add-item-btn" onClick={addItem}><MdAdd /> Add Item</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Tax & Discount</span></div>
              <div className="card-body">
                <div className="form-grid-2">
                  <div className="form-group mb-0"><label className="form-label">Discount (%)</label><input type="number" className="form-control" min="0" max="100" value={form.discountRate} onChange={e => setForm({ ...form, discountRate: e.target.value })} /></div>
                  <div className="form-group mb-0"><label className="form-label">Tax (%)</label><input type="number" className="form-control" min="0" max="100" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} /></div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="invoice-totals">
                  <div className="total-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {form.discountRate > 0 && <div className="total-row" style={{ color: 'var(--success)' }}><span>Discount ({form.discountRate}%)</span><span>- {formatCurrency(discountAmount)}</span></div>}
                  {form.taxRate > 0 && <div className="total-row"><span>Tax ({form.taxRate}%)</span><span>+ {formatCurrency(taxAmount)}</span></div>}
                  <div className="total-row grand"><span>Total</span><span style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</span></div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} disabled={loading}>
                  {loading ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;
