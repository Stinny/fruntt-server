const Order = require('../models/Order');
const Storefront = require('../models/Storefront');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { genShippingLabel } = require('../utils/genShippingLabel');
const stripe = require('stripe')(process.env.SK_TEST);

//gets a single order
const getOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);

    return res.json(order);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets orders related to certain store
const getStoreOrders = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const orders = await Order.find({
      storeId: req.user.storeId,
      paid: true,
    });
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates order
const create = async (req, res) => {
  try {
    const { total, storeId, item, qty } = req.body;
    // const storeId = req.params.storeId;

    const storeFront = await Storefront.findById(storeId);
    const storeFrontOwner = await User.findById(storeFront.userId);

    //need to get the stores stripe account ID and add to paymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      on_behalf_of: storeFrontOwner.stripeId,
      transfer_data: {
        destination: storeFrontOwner.stripeId,
      },
    });

    const newOrder = new Order({
      paymentId: paymentIntent.id,
      clientId: paymentIntent.client_secret,
      storeId: storeId,
      item: item,
      qty: qty,
    });

    await newOrder.save();

    res.json({ orderId: newOrder._id });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

//upodates an order
const update = async (req, res) => {
  const orderId = req.params.orderId;
  const {
    firstName,
    lastName,
    email,
    address,
    city,
    state,
    zip,
    total,
    qty,
  } = req.body;

  try {
    const orderToUpdate = await Order.findById(orderId);
    orderToUpdate.firstName = firstName;
    orderToUpdate.lastName = lastName;
    orderToUpdate.email = email;
    orderToUpdate.shippingAddress.country = 'US';
    orderToUpdate.shippingAddress.city = city;
    orderToUpdate.shippingAddress.state = state;
    orderToUpdate.shippingAddress.zipcode = zip;
    orderToUpdate.shippingAddress.street = address;
    orderToUpdate.qty = qty;
    orderToUpdate.total = total;
    orderToUpdate.placedOn = new Date();
    orderToUpdate.paid = true;

    //generate the shipping label
    const labelUrl = await genShippingLabel({
      firstName: firstName,
      lastName: lastName,
      address: address,
      city: city,
      state: state,
      zip: zip,
      weight: orderToUpdate.item.weight,
      height: orderToUpdate.item.height,
      width: orderToUpdate.item.width,
      length: orderToUpdate.item.length,
    });

    orderToUpdate.labelUrl = labelUrl;

    //update paymentIntent attached to order
    const paymentIntent = await stripe.paymentIntents.update(
      orderToUpdate.paymentId,
      {
        amount: total * 100,
      }
    );

    const newCustomer = new Customer({
      firstName: firstName,
      lastName: lastName,
      email: email,
      address: {
        street: address,
        city: city,
        state: state,
        zipcode: zip,
      },
      storeId: orderToUpdate.storeId,
      orderId: orderToUpdate._id,
    });

    await newCustomer.save();
    const savedOrder = await orderToUpdate.save();
    return res.json(savedOrder);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const markOrderAsFulfilled = async (req, res) => {
  //here we will retrieve the order from db based on ID
  //mark it as fulfilled
  //and send the customer a shipping confirmation email with
  //tracking number
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    order.fulfiledOn = new Date();
    order.fulfilled = true;

    //send a 'shipping confirmed' email to the customer of this order
    //email should also have the tracking ID OR the url

    await order.save();

    return res.json('Order fulfilled');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const requestReview = async (req, res) => {
  //here we will get a customer with an orderId
  //we want to send an email requesting a review of the item
  //within the order
  //we also want to create a review doc
  //containing the customerId, orderId, and review content(text, rating)
};

module.exports = {
  getOrder,
  getStoreOrders,
  create,
  update,
  markOrderAsFulfilled,
};
