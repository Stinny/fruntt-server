const customer = require('../controllers/customer');
const router = require('express').Router();
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.get('/', isTokenValid, setUser, customer.getAll);

module.exports = router;
