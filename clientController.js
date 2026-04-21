const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

// @GET /api/clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/clients
exports.createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/clients/:id
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    
    const invoices = await Invoice.find({ client: req.params.id, user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, client, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/clients/:id
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
