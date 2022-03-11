const Order = require('../models/Order');

//gets a single order
const getOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets orders related to certain store
const getStoreOrders = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const orders = await Order.find({ storeId: storeId });
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates order
const create = async (req, res) => {
  const newOrder = new Order(req.body);

  try {
    const savedOrder = await newOrder.save();
    return res.status(200).json(savedOrder);
  } catch (err) {
    return res.status(200).json('Server error');
  }
};

//upodates an order
const update = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: req.body,
      },
      { new: true }
    );
    return res.status(200).json(updatedOrder);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = { getOrder, getStoreOrders, create, update };
