import React, { useState } from 'react';
import api, { formatCurrency } from '../utils/api';
import toast from 'react-hot-toast';

const paymentMethods = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'card', label: '💳 Card' },
  { value: 'cheque', label: '📄 Cheque' },
  { value: 'other', label: '🔗 Other' },
];

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentNotes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/invoices/${invoice._id}/pay`, form);
      onSuccess(res.data.invoice);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">💰 Record Payment</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--primary-light)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Invoice {invoice.invoiceNumber}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', letterSpacing: -1 }}>
              {formatCurrency(invoice.total)}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {paymentMethods.map(m => (
                  <button
                    key={m.value} type="button"
                    style={{
                      padding: '10px 12px', borderRadius: 10, border: '1.5px solid',
                      borderColor: form.paymentMethod === m.value ? 'var(--primary)' : 'var(--border)',
                      background: form.paymentMethod === m.value ? 'var(--primary-light)' : 'var(--white)',
                      color: form.paymentMethod === m.value ? 'var(--primary)' : 'var(--dark)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: 'var(--font-body)'
                    }}
                    onClick={() => setForm({ ...form, paymentMethod: m.value })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input type="date" className="form-control" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows={2} placeholder="Transaction ID, reference, etc." value={form.paymentNotes} onChange={e => setForm({ ...form, paymentNotes: e.target.value })} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : '✓ Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
