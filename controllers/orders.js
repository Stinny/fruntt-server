const Order = require('../models/Order');
const Storefront = require('../models/Storefront');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { genShippingLabel } = require('../utils/genShippingLabel');
const Product = require('../models/Product');
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
      application_fee_amount: total * 0.02 * 100,
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
    const updateItem = await Product.findById(orderToUpdate.item._id);

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

    updateItem.stock -= 1;

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
    await updateItem.save();
    const savedOrder = await orderToUpdate.save();
    return res.json({ msg: 'Order updated', order: savedOrder });
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
  const { trackingNum, fulfillType } = req.body;

  try {
    const order = await Order.findById(orderId);

    order.fulfiledOn = new Date();
    order.fulfilled = true;

    //generate the shipping label and tracking number if fulfill type is auto
    //else
    //set order tracking number as the manually submitted tracking number

    if (fulfillType === 'auto') {
      const labelAndTracking = await genShippingLabel({
        firstName: order.firstName,
        lastName: order.lastName,
        address: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zip: order.shippingAddress.zipcode,
        weight: order.item.weight,
        height: order.item.height,
        width: order.item.width,
        length: order.item.length,
        fromName: 'Fruntt Storefront',
        fromAddress: order?.item?.shipsFrom?.address,
        fromState: order?.item?.shipsFrom?.state,
        fromCity: order?.item?.shipsFrom?.city,
        fromZip: order?.item?.shipsFrom?.zipcode,
      });

      if (labelAndTracking.error) return res.json('Error');

      order.labelUrl = labelAndTracking.url;
      order.trackingNumber = labelAndTracking.trackingNumber;
    } else if (fulfillType === 'manu') {
      order.trackingNumber = trackingNum;
      order.manualTrackingNumber = true;
    }

    // //send a 'shipping confirmed' email to the customer of this order
    // //email should also have the tracking ID OR the url

    await order.save();

    return res.json('Order fulfilled');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const editShippingAddress = async (req, res) => {
  const { orderId, address, country, city, state, zipcode } = req.body;

  console.log(req.body);

  try {
    const order = await Order.findById(orderId);

    order.shippingAddress.street = address;
    order.shippingAddress.country = country;
    order.shippingAddress.city = city;
    order.shippingAddress.state = state;
    order.shippingAddress.zipcode = zipcode;

    await order.save();

    return res.json('Shipping address updated');
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
  editShippingAddress,
};
