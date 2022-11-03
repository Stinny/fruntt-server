const stripe = require('stripe')(process.env.STRIPE_KEY);
const User = require('../models/User');
const Storefront = require('../models/Storefront');

const handleStripeEvents = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event = req.body;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.WEB_HOOK_SEC
    );
    const account = event.data.object;

    switch (event.type) {
      case 'account.updated':
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

      default:
        break;
    }

    return res.send();
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = { handleStripeEvents };
