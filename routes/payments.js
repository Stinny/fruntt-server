const router = require('express').Router();
const payments = require('../controllers/payments');

router.post('/paymentintent', payments.getPaymentIntent);

module.exports = router;
