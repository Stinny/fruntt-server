const Customer = require('../models/Customer');

const getAll = async (req, res) => {
  try {
    const customers = await Customer.find({ storeId: req.user.storeId });
    return res.json(customers);
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = { getAll };
