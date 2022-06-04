const stripe = require('stripe')(process.env.SK_TEST);
const User = require('../models/User');

const accountVerified = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event = req.body;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.WEB_HOOK_SEC
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.send();

  switch (event.type) {
    case 'account.updated':
      const account = event.data.object;
      console.log(account);

      try {
        if (account.charges_enabled) {
          const user = await User.findOne({ stripeId: account.id });
          user.stripeOnboard = true;
          await user.save();
        }
      } catch (err) {
        console.log(err.message);
        break;
      }
      break;
    default:
      console.log(`Unhandled event: ${event.type}`);
      break;
  }
};

module.exports = { accountVerified };
