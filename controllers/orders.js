const Order = require('../models/Order');
const Storefront = require('../models/Storefront');
const Customer = require('../models/Customer');
const User = require('../models/User');
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
    const orders = await Order.find({ storeId: req.user.storeId });
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates order
const create = async (req, res) => {
  try {
    const { amount, storeId } = req.body;
    // const storeId = req.params.storeId;

    const storeFront = await Storefront.findById(storeId);
    const storeFrontOwner = await User.findById(storeFront.userId);

    //need to get the stores stripe account ID and add to paymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      payment_method_types: ['card'],
      on_behalf_of: storeFrontOwner.stripeId,
      transfer_data: {
        destination: storeFrontOwner.stripeId,
      },
    });

    const newOrder = new Order({
      paymentId: paymentIntent.id,
      clientId: paymentIntent.client_secret,
      storeId: storeId,
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
    orderItems,
  } = req.body;

  console.log(orderItems);

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
    orderToUpdate.paid = true;

    for (var i = 0; i < orderItems.length; i++) {
      orderToUpdate.items.push(orderItems[i]);
    }

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
    });

    await newCustomer.save();
    const savedOrder = await orderToUpdate.save();
    return res.json(savedOrder);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getOrder,
  getStoreOrders,
  create,
  update,
};
