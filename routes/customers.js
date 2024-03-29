const customer = require('../controllers/customer');
const router = require('express').Router();
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.get('/store/:storeId', isTokenValid, setUser, customer.getAll);

router.get('/singlecustomer/:customerId', customer.getCustomerAndOrder);

router.post('/sendreviewemail', customer.sendReviewEmail);

router.post('/addreview', customer.addReview);

router.get('/reviews/:storeId', customer.getReviews);

module.exports = router;
