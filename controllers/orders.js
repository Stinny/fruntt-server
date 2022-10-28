const Order = require('../models/Order');
const Storefront = require('../models/Storefront');
const Customer = require('../models/Customer');
const User = require('../models/User');
const {
  genShippingLabel,
  getShippingRates,
  trackOrderUsingNumber,
} = require('../utils/genShippingLabel');
const Product = require('../models/Product');
const {
  sendOrderConfirmEmail,
  sendOrderFulfilledEmail,
} = require('../email/transactional');
const stripe = require('stripe')(process.env.STRIPE_KEY);

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
    const { total, storeId, item, qty, options } = req.body;

    const storeFront = await Storefront.findById(storeId);
    const storeFrontOwner = await User.findById(storeFront.userId);

    const amount = Number((total * 100).toFixed(2));

    //need to get the stores stripe account ID and add to paymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      on_behalf_of: storeFrontOwner.stripeId,
      transfer_data: {
        destination: storeFrontOwner.stripeId,
      },
      description: 'Fruntt - order payment',
    });

    const newOrder = new Order({
      paymentId: paymentIntent.id,
      clientId: paymentIntent.client_secret,
      storeId: storeId,
      item: item,
      qty: qty,
      options: options,
      shipsFrom: {
        address: item.shipsFrom.address,
        country: item.shipsFrom.country,
        state: item.shipsFrom.state,
        city: item.shipsFrom.city,
        zipcode: item.shipsFrom.zipcode,
      },
    });

    await newOrder.save();

    res.json({ orderId: newOrder._id });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

//updates the paymentIntent on the order
const updateOrderAmount = async (req, res) => {
  const { orderId, total } = req.body;

  try {
    const order = await Order.findById(orderId);

    const finalAmount = Number(
      ((total + order.item.shippingPrice) * 100).toFixed(2)
    );

    const applicationFee = ((finalAmount / 100) * 0.02).toFixed(2) * 100;

    //update paymentIntent attached to order
    const paymentIntent = await stripe.paymentIntents.update(order.paymentId, {
      amount: finalAmount,
      // application_fee_amount: applicationFee.toFixed(),
    });

    return res.json('Amount updated');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//upodates an order with final data
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
    options,
  } = req.body;

  try {
    const orderToUpdate = await Order.findById(orderId);
    const updateItem = await Product.findById(orderToUpdate.item._id);
    const storefront = await Storefront.findById(orderToUpdate.storeId);

    orderToUpdate.firstName = firstName;
    orderToUpdate.lastName = lastName;
    orderToUpdate.email = email;
    orderToUpdate.shippingAddress.country = 'US';
    orderToUpdate.shippingAddress.city = city;
    orderToUpdate.shippingAddress.state = state;
    orderToUpdate.shippingAddress.zipcode = zip;
    orderToUpdate.shippingAddress.address = address;
    orderToUpdate.qty = qty;
    orderToUpdate.total = total + updateItem.shippingPrice;
    orderToUpdate.placedOn = new Date();
    orderToUpdate.paid = true;
    orderToUpdate.options = options;

    updateItem.stock -= 1;

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
      orderedOn: new Date(),
      productId: orderToUpdate.item._id,
    });

    orderToUpdate.customerId = newCustomer._id;

    await sendOrderConfirmEmail({
      customerEmail: orderToUpdate.email,
      customerName: orderToUpdate.firstName,
      orderId: orderToUpdate._id,
      orderItem: orderToUpdate.item.title,
      orderItemPrice: orderToUpdate.item.price,
      orderTotal: orderToUpdate.total,
      orderQty: orderToUpdate.qty,
      storeEmail: storefront.email,
      storeName: storefront.name,
    });

    await newCustomer.save();
    await updateItem.save();
    const savedOrder = await orderToUpdate.save();
    return res.json({ msg: 'Order updated', order: savedOrder });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const markOrderAsFulfilled = async (req, res) => {
  const orderId = req.params.orderId;
  const { trackingNum, fulfillType, carrierCode } = req.body;

  console.log(req.body);

  let trackingUrl;

  try {
    const order = await Order.findById(orderId);
    const storefront = await Storefront.findById(order.storeId);

    order.fulfilled = true;
    order.fulfiledOn = new Date();

    if (fulfillType === 'manu') {
      order.trackingNumber = trackingNum;
      order.manualTrackingNumber = true;
      trackingUrl = await trackOrderUsingNumber({
        carrierCode: carrierCode,
        trackingNumer: trackingNum,
      });
    } else if (fulfillType === 'auto') {
      trackingUrl = await trackOrderUsingNumber({
        carrierCode: 'ups',
        trackingNumer: order.trackingNumber,
      });
    }

    await sendOrderFulfilledEmail({
      customerEmail: order?.email,
      customerName: order?.firstName,
      storeName: storefront?.name,
      storeUrl: storefront?.url,
      orderId: order._id,
      trackingUrl: trackingUrl,
    });

    await order.save();

    return res.json('Order fulfilled');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const getShippingLabel = async (req, res) => {
  const { orderId, rateId, amount } = req.body;

  try {
    const order = await Order.findById(orderId);
    const user = await User.findById(req.user.id);

    const finalAmount = Number((amount * 100).toFixed(2));

    if (user?.paymentMethod?.id) {
      const labelPaymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: 'usd',
        customer: user.customerId,
        payment_method: user.paymentMethod.id,
        confirm: true,
        description: 'Shipping label purschase',
      });

      if (labelPaymentIntent.status === 'succeeded') {
        const labelAndTracking = await genShippingLabel({ rateId: rateId });

        order.labelId = labelAndTracking.labelId;
        order.trackingNumber = labelAndTracking.trackingNumber;
        order.labelUrl = labelAndTracking.url;

        await order.save();

        return res.json({ error: false, msg: 'Label created' });
      } else {
        return res.json({
          error: true,
          msg: 'There was an error with the payment on this account',
        });
      }
    } else {
      return res.json({
        error: true,
        msg: 'You have no payment method added, add one in settings',
      });
    }
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const editShippingAddress = async (req, res) => {
  const { orderId, address, country, city, state, zipcode } = req.body;

  try {
    const order = await Order.findById(orderId);

    order.shippingAddress.address = address;
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

const editShipsFromAddress = async (req, res) => {
  const { orderId, address, country, city, state, zipcode } = req.body;

  console.log(req.body);

  try {
    const order = await Order.findById(orderId);

    order.shipsFrom.address = address;
    order.shipsFrom.country = country;
    order.shipsFrom.state = state;
    order.shipsFrom.city = city;
    order.shipsFrom.zipcode = zipcode;

    await order.save();

    return res.json('Address updated');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const getOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  let trackOrderReq;

  console.log(orderId);

  try {
    const order = await Order.findById(orderId);

    if (order.labelId) {
      trackOrderReq = await trackOrderUsingLabelId(order.labelId);
    }

    return res.json(trackOrderReq);
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const getRates = async (req, res) => {
  const orderId = req.params.orderId;
  const rates = [];

  try {
    const order = await Order.findById(orderId);

    if (order.fulfilled || order.labelUrl) return res.json(rates);

    const rateResponse = await getShippingRates({
      address: order.shippingAddress.address,
      country: order.shippingAddress.country,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zip: order.shippingAddress.zipcode,
      weight: order.item.weight,
      unit: order.item.weightUnit,
      fromAddress: order.shipsFrom.address,
      fromCity: order.shipsFrom.city,
      fromState: order.shipsFrom.state,
      fromZip: order.shipsFrom.zipcode,
    });

    const ratesArr = rateResponse.rates;

    for (var i = 0; i < ratesArr.length; i++) {
      rates.push({
        rateId: ratesArr[i].rateId,
        amount: ratesArr[i].shippingAmount.amount,
        date: ratesArr[i].estimatedDeliveryDate,
        service: ratesArr[i].serviceType,
      });
    }

    return res.json(rates);
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getOrder,
  getStoreOrders,
  create,
  update,
  markOrderAsFulfilled,
  editShippingAddress,
  editShipsFromAddress,
  getOrderStatus,
  getRates,
  getShippingLabel,
  updateOrderAmount,
};
