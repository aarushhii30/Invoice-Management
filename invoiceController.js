const Invoice = require('../models/Invoice');
const Client = require('../models/Client');

// @GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const { status, client, page = 1, limit = 10, search } = req.query;
    const query = { user: req.user._id };
    
    if (status && status !== 'all') query.status = status;
    if (client) query.client = client;
    
    // Update overdue status
    await Invoice.updateMany(
      { user: req.user._id, status: 'pending', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );
    
    const invoices = await Invoice.find(query)
      .populate('client', 'name email company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(query);
    
    res.json({ success: true, invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    const { client, items, taxRate, discountRate, dueDate, notes, terms } = req.body;
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountAmount = (subtotal * (discountRate || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
    const total = taxableAmount + taxAmount;
    
    const itemsWithTotal = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));
    
    const invoice = await Invoice.create({
      user: req.user._id,
      client,
      items: itemsWithTotal,
      subtotal,
      taxRate: taxRate || 0,
      taxAmount,
      discountRate: discountRate || 0,
      discountAmount,
      total,
      dueDate,
      notes,
      terms
    });
    
    // Update client stats
    await Client.findByIdAndUpdate(client, {
      $inc: { totalInvoices: 1, totalAmount: total }
    });
    
    const populated = await invoice.populate('client', 'name email company');
    res.status(201).json({ success: true, invoice: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client')
      .populate('user', 'name email company phone address');
    
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const { items, taxRate, discountRate, dueDate, notes, terms, status } = req.body;
    
    let updateData = { dueDate, notes, terms, status };
    
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const discountAmount = (subtotal * (discountRate || 0)) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
      const total = taxableAmount + taxAmount;
      
      updateData = {
        ...updateData,
        items: items.map(item => ({ ...item, total: item.quantity * item.price })),
        subtotal, taxRate, taxAmount, discountRate, discountAmount, total
      };
    }
    
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    ).populate('client', 'name email company');
    
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/invoices/:id/pay  
exports.markAsPaid = async (req, res) => {
  try {
    const { paymentMethod, paymentDate, paymentNotes } = req.body;
    
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'paid', paymentMethod, paymentDate: paymentDate || new Date(), paymentNotes },
      { new: true }
    ).populate('client', 'name email company');
    
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice, message: 'Invoice marked as paid!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
