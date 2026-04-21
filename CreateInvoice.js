import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatCurrency } from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdArrowBack } from 'react-icons/md';

const defaultItem = () => ({ name: '', description: '', quantity: 1, price: 0 });

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client: '', dueDate: '', taxRate: 0, discountRate: 0, notes: '', terms: 'Payment due within 30 days.'
  });
  const [items, setItems] = useState([defaultItem()]);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients)).catch(() => {});
  }, []);

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [...prev, defaultItem()]);
  const removeItem = (idx) => items.length > 1 && setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
  const discountAmount = (subtotal * (parseFloat(form.discountRate) || 0)) / 100;
  const taxAmount = ((subtotal - discountAmount) * (parseFloat(form.taxRate) || 0)) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client) return toast.error('Please select a client');
    if (!form.dueDate) return toast.error('Please set a due date');
    const validItems = items.filter(i => i.name && i.quantity > 0 && i.price >= 0);
    if (validItems.length === 0) return toast.error('Add at least one valid item');

    setLoading(true);
    try {
      const res = await api.post('/invoices', { ...form, items: validItems });
      toast.success('Invoice created successfully!');
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/invoices')}>
        <MdArrowBack /> Back to Invoices
      </button>

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ gap: 24, alignItems: 'flex-start' }}>
          {/* Left Column */}
          <div>
            {/* Client & Dates */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Invoice Details</span></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Client *</label>
                  <select className="form-control" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} required>
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                  </select>
                  {clients.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
                      No clients found. <span style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 600 }} onClick={() => navigate('/clients')}>Add a client first →</span>
                    </p>
                  )}
                </div>
                <div className="form-grid-2">
                  <div className="form-group mb-0">
                    <label className="form-label">Issue Date</label>
                    <input type="date" className="form-control" defaultValue={today} readOnly />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Due Date *</label>
                    <input type="date" className="form-control" value={form.dueDate} min={today} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="card">
              <div className="card-header"><span className="card-title">Notes & Terms</span></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Notes for Client</label>
                  <textarea className="form-control" placeholder="Thank you for your business!" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea className="form-control" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} rows={3} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Line Items */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Line Items</span></div>
              <div className="card-body">
                {items.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray)' }}>Item {idx + 1}</span>
                      {items.length > 1 && (
                        <button type="button" className="delete-btn" onClick={() => removeItem(idx)}><MdDelete /></button>
                      )}
                    </div>
                    <div className="form-group">
                      <input className="form-control" placeholder="Product / Service name *" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <input className="form-control" placeholder="Description (optional)" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group mb-0">
                        <label className="form-label">Quantity</label>
                        <input type="number" className="form-control" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                      </div>
                      <div className="form-group mb-0">
                        <label className="form-label">Price (₹)</label>
                        <input type="number" className="form-control" min="0" step="0.01" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
                      </div>
                      <div className="form-group mb-0">
                        <label className="form-label">Total</label>
                        <input className="form-control" value={formatCurrency((item.quantity || 0) * (item.price || 0))} readOnly style={{ background: 'var(--white)', fontWeight: 600 }} />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" className="add-item-btn" onClick={addItem}>
                  <MdAdd /> Add Item
                </button>
              </div>
            </div>

            {/* Tax & Discount */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Tax & Discount</span></div>
              <div className="card-body">
                <div className="form-grid-2">
                  <div className="form-group mb-0">
                    <label className="form-label">Discount (%)</label>
                    <input type="number" className="form-control" min="0" max="100" value={form.discountRate} onChange={e => setForm({ ...form, discountRate: e.target.value })} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Tax / GST (%)</label>
                    <input type="number" className="form-control" min="0" max="100" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card">
              <div className="card-header"><span className="card-title">Summary</span></div>
              <div className="card-body">
                <div className="invoice-totals">
                  <div className="total-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {form.discountRate > 0 && <div className="total-row" style={{ color: 'var(--success)' }}><span>Discount ({form.discountRate}%)</span><span>- {formatCurrency(discountAmount)}</span></div>}
                  {form.taxRate > 0 && <div className="total-row"><span>Tax ({form.taxRate}%)</span><span>+ {formatCurrency(taxAmount)}</span></div>}
                  <div className="total-row grand"><span>Total</span><span style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</span></div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} disabled={loading}>
                  {loading ? 'Creating...' : '✓ Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
