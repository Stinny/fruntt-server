const Customer = require('../models/Customer');
const Storefront = require('../models/Storefront');
const User = require('../models/User');
const { sendReviewLinkEmail } = require('../email/transactional');
const Order = require('../models/Order');

//gets all customers from a storeId
const getAll = async (req, res) => {
  try {
    const customers = await Customer.find({ storeId: req.user.storeId });
    return res.json(customers);
  } catch (err) {
    return res.status(500).json(err);
  }
};

//gets all customers from a productId and gathers reviews
// const getReviews = async (req, res) => {
//   try {
//     const reviews = [];

//     const customers = await Customer.find({
//       productId: req.params.productId,
//       reviewed: true,
//     });

//     console.log(req.params.productId);

//     for (var i = 0; i < customers.length; i++) {
//       reviews.push({
//         review: customers[i].review,
//         rating: customers[i].rating,
//         customerName: customers[i].firstName + '' + customers[i].lastName,
//         reviewedOn: customers[i].reviewedOn,
//       });
//     }

//     console.log(reviews);

//     return res.json(reviews);
//   } catch (err) {
//     return res.status(500).json('Server error');
//   }
// };

const getSingleCustomer = async (req, res) => {
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

  console.log(req.body);

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
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getAll,
  addReview,
  getSingleCustomer,
  sendReviewEmail,
};
