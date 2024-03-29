const Order = require('../models/Order');
const Storefront = require('../models/Storefront');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Review = require('../models/Review');
const {
  genShippingLabel,
  getShippingRates,
  trackOrderUsingNumber,
} = require('../utils/genShippingLabel');
const Product = require('../models/Product');
const {
  sendOrderConfirmEmail,
  sendOrderFulfilledEmail,
  sendDigitalConfirmEmail,
  sendOrderPlacedEmail,
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
      storeId: storeId,
      paid: true,
    });

    //sort orders by date newest-oldest
    const sortedOrders = orders.reverse();
    return res.status(200).json(sortedOrders);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates order
const create = async (req, res) => {
  try {
    const { total, storeId, item, options } = req.body;

    const storeFront = await Storefront.findById(storeId);
    const storeFrontOwner = await User.findById(storeFront.userId);
    const itemWithContent = await Product.findById(item._id);

    const amount = Math.round(total * 100);

    const feePercentage = 0.01;
    const feeAmount = Math.round(total * feePercentage * 100);

    const newOrder = new Order({
      storeId: storeId,
      item: itemWithContent,
      options: options,
      total: total,
    });

    if (total > 0) {
      //need to get the stores stripe account ID and add to paymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        application_fee_amount: total < 10 ? 50 : 100,
        on_behalf_of: storeFrontOwner.stripeId,
        transfer_data: {
          destination: storeFrontOwner.stripeId,
        },
        description: 'Fruntt - order payment',
      });

      newOrder.paymentId = paymentIntent.id;
      newOrder.clientId = paymentIntent.client_secret;
    }

    await newOrder.save();

    res.json({ orderId: newOrder._id });
  } catch (err) {
    console.log(err);
    res.status(500).json(err.message);
  }
};

//updates the paymentIntent on the order
const updateOrderAmount = async (req, res) => {
  const { orderId, total } = req.body;

  try {
    const order = await Order.findById(orderId);

    //initial amount calculated
    const amount = total;
    //final amount converted to cents
    const finalAmount = amount.toFixed(2) * 100;

    const platformFee = amount.toFixed(2) * 0.01;
    const finalFee = platformFee.toFixed(2) * 100;

    //formatted better for setting paymentIntent amount
    const formattedAmount = Number(finalAmount.toFixed(2));
    const formattedFee = Number(finalFee.toFixed(2));

    //update paymentIntent attached to order
    const paymentIntent = await stripe.paymentIntents.update(order.paymentId, {
      amount: formattedAmount,
      application_fee_amount: amount < 10 ? 50 : 100,
    });

    return res.json('Amount updated');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//updates an order with final data
const update = async (req, res) => {
  const orderId = req.params.orderId;
  const { email, country, zipcode, name } = req.body;

  try {
    const orderToUpdate = await Order.findById(orderId);
    const storefront = await Storefront.findById(orderToUpdate?.storeId);
    const storefrontOwner = await User.findById(storefront?.userId);
    const product = await Product.findById(orderToUpdate?.item?._id);
    const customer = await Customer.findOne({
      email: email,
      storeId: storefront._id,
    });

    orderToUpdate.email = email;
    orderToUpdate.country = country;
    orderToUpdate.zipcode = zipcode;
    orderToUpdate.name = name;
    orderToUpdate.placedOn = new Date();
    orderToUpdate.fulfilled = true;
    product.numberOfSales += 1;

    if (orderToUpdate.total == 0) orderToUpdate.paid = true;

    if (customer) {
      customer.numberOfOrders += 1;
      await customer.save();
    } else {
      const newCustomer = new Customer({
        name: name,
        country: country,
        email: email,
        zipcode: zipcode,
        storeId: storefront?._id,
      });
      newCustomer.numberOfOrders += 1;
      await newCustomer.save();
    }

    const stripeCustomer = await stripe.customers.create({
      name: name,
      email: email,
      description: `Fruntt - customer of ${storefront?.url}`,
    });

    if (orderToUpdate.total > 0) {
      const paymentIntent = await stripe.paymentIntents.update(
        orderToUpdate.paymentId,
        {
          customer: stripeCustomer.id,
        }
      );
    }

    await sendDigitalConfirmEmail({
      customerEmail: orderToUpdate.email,

      orderId: orderToUpdate?._id,
      orderItem: orderToUpdate?.item.title,
      orderItemPrice: orderToUpdate?.item.price,
      orderTotal: orderToUpdate?.total,
      storeEmail: storefrontOwner?.email,
      storeName: storefront?.name,
    });

    await sendOrderPlacedEmail({
      email: storefrontOwner?.email,
      total: orderToUpdate?.total,
      title: orderToUpdate?.item?.title,
    });

    storefrontOwner.sellerProfile.numberOfSales += 1;

    await storefrontOwner.save();
    await product.save();

    const savedOrder = await orderToUpdate.save();
    return res.json({ msg: 'Order updated', order: savedOrder });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const getDigitalOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    const storeFront = await Storefront.findById(order?.storeId);

    if (order.paid) {
      return res.json({ order: order, store: storeFront });
    } else {
      return res.json('Order not paid for.');
    }
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//get users orders based on email
const getUsersOrders = async (req, res) => {
  try {
    const orders = await Order.find({ email: req.user.email });

    return res.json(orders);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates a new review and marks order as reviewed
const addReview = async (req, res) => {
  const { rating, review, orderId, name, customerEmail } = req.body;

  try {
    const order = await Order.findById(orderId);

    const newReview = new Review({
      productId: order?.item?._id,
      rating: rating,
      review: review,
      email: customerEmail,
      orderId: orderId,
      storeId: order?.storeId,
      name: name,
    });

    order.reviewed = true;
    order.reviewId = newReview._id;
    order.review.content = review;
    order.review.rating = rating;

    await newReview.save();
    await order.save();

    return res.json('Review added');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets all reviews for a storefront
const getReviews = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const reviews = await Review.find({ storeId: storeId });

    const orderedReviews = reviews.reverse();

    return res.json(orderedReviews);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const markAsViewed = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);

    order.viewed = true;

    await order.save();

    return res.json('Order viewed');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getReview = async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    const review = await Review.findById(reviewId);

    return res.json(review);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getOrder,
  getStoreOrders,
  create,
  update,
  updateOrderAmount,
  getDigitalOrder,
  addReview,
  getReviews,
  getReview,
  getUsersOrders,
  markAsViewed,
};
