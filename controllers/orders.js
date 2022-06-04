const Order = require('../models/Order');
const stripe = require('stripe')(process.env.SK_TEST);

//creates onboard url for linking stripe account to storefronts
const getOboardUrl = async (req, res) => {
  try {
    const stripeAcc = await stripe.accounts.retrieve(req.user.stripeId);
    const onboardUrl = await stripe.accountLinks.create({
      account: req.user.stripeId,
      refresh_url: 'http://localhost:3000/settings',
      return_url: 'http://localhost:3000/settings',
      type: 'account_onboarding',
    });

    return res.status(200).json(onboardUrl);
  } catch (err) {
    return res.status(500).json(err);
  }
};

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
  try {
    const { amount, storeId, orderItems } = req.body;
    // const storeId = req.params.storeId;

    //need to get the stores stripe account ID and add to paymentIntent
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount * 100,
        currency: 'usd',
        payment_method_types: ['card'],
      }
      // { stripeAccount: 'jsjfhjhf' }
    );

    const newOrder = new Order({
      paymentId: paymentIntent.id,
      clientId: paymentIntent.client_secret,
      storeId: storeId,
      //need to add on storeId
    });

    //adds all items from the cart to the order
    // if (orderItems.length) {
    //   for (var i = 0; i < orderItems.length; i++) {
    //     newOrder.products.push(orderItems[i]);
    //   }
    // }

    await newOrder.save();

    res.json(newOrder._id);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const updateOrderPaymentIntent = async (req, res) => {
  const orderId = req.params.orderId;
  const { amount } = req.body;

  try {
    const order = await Order.findById(orderId);

    const paymentIntent = await stripe.paymentIntents.update(order.paymentId, {
      amount: amount * 100,
    });

    console.log('order payment updated');
    return res.json({ status: 'Ok', msg: '', data: order });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json('Server error');
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
    orderToUpdate.total = total;

    const savedOrder = await orderToUpdate.save();
    return res.json({ status: 'Ok', msg: '', data: savedOrder });
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getOrder,
  getStoreOrders,
  getOboardUrl,
  create,
  updateOrderPaymentIntent,
  update,
};
