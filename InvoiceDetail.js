import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { formatCurrency, formatDate, getStatusBadge } from '../utils/api';
import toast from 'react-hot-toast';
import { MdArrowBack, MdEdit, MdDelete, MdPayment, MdPrint } from 'react-icons/md';
import PaymentModal from '../components/PaymentModal';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => { fetchInvoice(); }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.invoice);
    } catch {
      toast.error('Invoice not found');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice permanently?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch { toast.error('Failed to delete'); }
  };

  const handlePaymentSuccess = (updatedInvoice) => {
    setInvoice(updatedInvoice);
    setShowPayModal(false);
    toast.success('Invoice marked as paid! 🎉');
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!invoice) return null;

  const { client, user } = invoice;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/invoices')}>
        <MdArrowBack /> Back to Invoices
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={getStatusBadge(invoice.status)} style={{ fontSize: 13, padding: '6px 14px' }}>
            <span className={`status-dot dot-${invoice.status}`}></span>
            {invoice.status.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {invoice.status !== 'paid' && (
            <button className="btn btn-success" onClick={() => setShowPayModal(true)}>
              <MdPayment /> Mark as Paid
            </button>
          )}
          <button className="btn btn-outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <MdEdit /> Edit
          </button>
          <button className="btn btn-outline" onClick={handlePrint}>
            <MdPrint /> Print
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <MdDelete />
          </button>
        </div>
      </div>

      <div className="invoice-preview">
        {/* Header */}
        <div className="invoice-preview-header">
          <div className="invoice-from">
            <div className="company-name">{user?.company || user?.name}</div>
            <p>{user?.email}</p>
            <p>{user?.phone}</p>
            <p>{user?.address}</p>
          </div>
          <div className="invoice-number-badge">
            <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 4 }}>INVOICE</div>
            <div className="inv-num">{invoice.invoiceNumber}</div>
            <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 8 }}>
              <div>Issue: {formatDate(invoice.issueDate)}</div>
              <div style={{ color: invoice.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>Due: {formatDate(invoice.dueDate)}</div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 10 }}>Bill To</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{client?.name}</div>
            <div style={{ color: 'var(--gray)', fontSize: 14 }}>{client?.company}</div>
            <div style={{ color: 'var(--gray)', fontSize: 14 }}>{client?.email}</div>
            <div style={{ color: 'var(--gray)', fontSize: 14 }}>{client?.phone}</div>
            {client?.address && (
              <div style={{ color: 'var(--gray)', fontSize: 14, marginTop: 4 }}>
                {[client.address.street, client.address.city, client.address.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          {invoice.status === 'paid' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 10 }}>Payment Info</div>
              <div style={{ padding: 16, background: '#d1fae5', borderRadius: 12 }}>
                <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 4 }}>✓ PAID</div>
                <div style={{ fontSize: 13, color: '#065f46' }}>Date: {formatDate(invoice.paymentDate)}</div>
                <div style={{ fontSize: 13, color: '#065f46' }}>Method: {invoice.paymentMethod?.replace('_', ' ')}</div>
                {invoice.paymentNotes && <div style={{ fontSize: 12, color: '#065f46', marginTop: 4 }}>{invoice.paymentNotes}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="items-table" style={{ marginBottom: 28 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item / Service</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--gray)', fontSize: 13 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 12, color: 'var(--gray)' }}>{item.description}</div>}
                  </td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 320 }}>
            <div className="invoice-totals">
              <div className="total-row"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              {invoice.discountRate > 0 && (
                <div className="total-row" style={{ color: 'var(--success)' }}>
                  <span>Discount ({invoice.discountRate}%)</span>
                  <span>- {formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div className="total-row">
                  <span>GST/Tax ({invoice.taxRate}%)</span>
                  <span>+ {formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="total-row grand">
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(invoice.notes || invoice.terms) && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 28, paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {invoice.notes && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Notes</div>
                <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6 }}>{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Terms & Conditions</div>
                <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6 }}>{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showPayModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default InvoiceDetail;
