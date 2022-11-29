const Customer = require('../models/Customer');
const Storefront = require('../models/Storefront');
const User = require('../models/User');
const { sendReviewLinkEmail } = require('../email/transactional');
const Order = require('../models/Order');
const Product = require('../models/Product');

//gets all customers from a storeId
const getAll = async (req, res) => {
  try {
    const customers = await Customer.find({ storeId: req.params.storeId });
    return res.json(customers);
  } catch (err) {
    return res.status(500).json(err);
  }
};

//gets the customer and order
const getCustomerAndOrder = async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const customer = await Customer.findById(customerId);
    const order = await Order.findById(customer?.orderId);

    return res.json({ customer: customer, order: order });
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//adds review to the cusomer doc
const addReview = async (req, res) => {
  const { rating, content, customerId } = req.body;

  try {
    const customer = await Customer.findById(customerId);

    customer.review = content;
    customer.rating = rating;
    customer.reviewed = true;
    customer.reviewedOn = new Date();

    await customer.save();

    return res.json('Review added');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//sends email to customer
const sendReviewEmail = async (req, res) => {
  const { customerId, storeId } = req.body;

  try {
    const customer = await Customer.findById(customerId);
    const storefront = await Storefront.findById(storeId);
    const storefrontOwner = await User.findById(storefront.userId);

    await sendReviewLinkEmail({
      customerEmail: customer.email,
      customerId: customerId,
      customerName: customer.firstName,
      storeUrl: storefront.url,
      storeName: storefront.name,
      storeEmail: storefrontOwner.email,
    });

    customer.emailSent = true;

    await customer.save();

    return res.json('Email sent');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getReviews = async (req, res) => {
  const storeId = req.params.storeId;
  const reviews = [];
  let totalRating = 0;

  try {
    const product = await Product.find({ storeId: storeId });

    //if there is a product, then go ahead and get the customers/reviews
    if (product.length) {
      const customers = await Customer.find({
        productId: product[0]._id,
        reviewed: true,
      });

      for (var i = 0; i < customers.length; i++) {
        reviews.push({
          review: customers[i].review,
          rating: customers[i].rating,
          customerName: `${customers[i].firstName} ${customers[i].lastName}`,
          reviewedOn: customers[i].reviewedOn,
        });
        totalRating += customers[i].rating;
      }
    }

    return res.json({
      item: product.length ? product[0] : {},
      reviews: reviews,
      totalRating: totalRating / reviews.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getAll,
  addReview,
  getCustomerAndOrder,
  sendReviewEmail,
  getReviews,
};
