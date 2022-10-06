const customer = require('../controllers/customer');
const router = require('express').Router();
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.get('/', isTokenValid, setUser, customer.getAll);

router.get('/singlecustomer/:customerId', customer.getSingleCustomer);

router.post('/addreview', customer.addReview);

module.exports = router;
