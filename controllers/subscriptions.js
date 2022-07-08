const stripe = require('stripe')(process.env.SK_TEST);
const User = require('../models/User');

const freePriceId = 'price_1LIIb3Lhd2AdaEiSOq7MXooU'; //from stripe dashboard
const paidPriceId = 'prod_Ly3KSlLMWnyzTd'; //from the stripe dashboard

const updateSubscription = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json('Server error');
  }
};

// const createFreeSubscription = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     const subscription = await stripe.subscriptions.create({
//       customer: user.customerId,
//       items: [{ price: freePriceId }],
//     });

//     user.subscriptionId = subscription.id;
//     await user.save();

//     return res.json(subscription);
//   } catch (err) {
//     return res.status(500).json('Server error');
//   }
// };

// const createPaidSubscription = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     const subscription = await stripe.subscriptions.create({
//       customer: user.customerId,
//       items: [{ price: paidPriceId }],
//     });

//     user.subscriptionId = subscription.id;
//     await user.save();

//     return res.json(subscription);
//   } catch (err) {
//     return res.status(500).json('Server error');
//   }
// };

module.exports = { updateSubscription };
