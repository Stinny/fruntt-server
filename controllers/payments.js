const stripe = require('stripe')(process.env.SK_TEST);

const getPaymentIntent = async () => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.status(200).json(paymentIntent);
  } catch (err) {
    res.status(500).json('Server error');
  }
};

module.exports = { getPaymentIntent };
