const express = require('express');
const router = express.Router();
const stripeEvents = require('../controllers/stripeEvents');

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeEvents.handleStripeEvents
);

module.exports = router;
