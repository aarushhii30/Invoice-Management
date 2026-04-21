const Invoice = require('../models/Invoice');
const Client = require('../models/Client');

// @GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Update overdue
    await Invoice.updateMany(
      { user: userId, status: 'pending', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const [invoiceCounts, revenueData, recentInvoices, topClients] = await Promise.all([
      // Invoice status counts
      Invoice.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
      ]),
      
      // Monthly revenue (last 6 months)
      Invoice.aggregate([
        { $match: { user: userId, status: 'paid', paymentDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { month: { $month: '$paymentDate' }, year: { $year: '$paymentDate' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      
      // Recent invoices
      Invoice.find({ user: userId }).populate('client', 'name company').sort({ createdAt: -1 }).limit(5),
      
      // Top clients
      Client.find({ user: userId }).sort({ totalAmount: -1 }).limit(5)
    ]);

    // Build summary
    const summary = { total: 0, paid: 0, pending: 0, overdue: 0, draft: 0, totalRevenue: 0, pendingRevenue: 0, overdueRevenue: 0 };
    invoiceCounts.forEach(item => {
      summary[item._id] = item.count;
      summary.total += item.count;
      if (item._id === 'paid') summary.totalRevenue = item.total;
      if (item._id === 'pending') summary.pendingRevenue = item.total;
      if (item._id === 'overdue') summary.overdueRevenue = item.total;
    });

    const totalClients = await Client.countDocuments({ user: userId });

    res.json({
      success: true,
      summary: { ...summary, totalClients },
      monthlyRevenue: revenueData,
      recentInvoices,
      topClients
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
