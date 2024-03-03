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
    //adds stripe account and bank/stripe status
    case 'account.updated':
      const account = event?.data?.object;

      try {
        const user = await User.findOne({ stripeId: account.id });
        if (account.type === 'custom') {
          if (account.payouts_enabled) {
            user.bankAdded = true;
            user.bankPending = false;

            await user.save();
          } else if (!account.payouts_enabled) {
            user.bankAdded = false;
            user.bankPending = true;
          }
        } else if (account.type === 'standard') {
          if (account.charges_enabled) {
            user.stripeOnboard = true;
            user.stripePending = false;
            await user.save();
          } else if (!account.charges_enabled) {
            user.stripeOnboard = false;
            user.stripePending = true;
          }
        }
        break;
      } catch (err) {
        console.log(err.message);
        break;
      }
    //marks order as paid
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
    //adds bank account Id to User doc
    case 'account.external_account.created':
      const extAccount = event?.data?.object;

      try {
        const user = await User.findOne({ stripeId: extAccount.account });

        user.bankId = extAccount.id;

        await user.save();
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
