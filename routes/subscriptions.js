const router = require('express').Router();
const subscriptions = require('../controllers/subscriptions');

router.post('/update', subscriptions.updateSubscription);

module.exports = router;
