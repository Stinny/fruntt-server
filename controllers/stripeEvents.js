const stripe = require('stripe')(process.env.STRIPE_KEY);
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const Order = require('../models/Order');

const handleStripeEvents = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig?.toString(),
      process.env.WEB_HOOK_SEC
    );
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event?.type) {
    case 'account.updated':
      const account = event?.data?.object;
      try {
        if (account.charges_enabled) {
          const user = await User.findOne({ stripeId: account.id });

          user.stripeOnboard = true;
          await user.save();
        }
        break;
      } catch (err) {
        console.log(err.message);
        break;
      }
    case 'payment_intent.succeeded':
      const paymentIntent = event?.data?.object;
      try {
        const order = await Order.findOne({ paymentId: paymentIntent?.id });
        order.paid = true;

        await order.save();
        break;
      } catch (err) {
        console.log(err.message);
        break;
      }
    default:
      break;
  }

  return res.send();
};

module.exports = { handleStripeEvents };
