const router = require('express').Router();
const stripeEvents = require('../controllers/stripeEvents');

router.post('/webhook', stripeEvents.handleStripeEvents);

module.exports = router;
