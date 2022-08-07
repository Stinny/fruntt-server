const orders = require('../controllers/orders');
const router = require('express').Router();
const setUser = require('../middleware/setUser');
const isTokenValid = require('../middleware/verifyToken');

//gets all orders related to a certain store
router.get('/store/', isTokenValid, setUser, orders.getStoreOrders);

//creates an order
router.post('/create', orders.create);

//updates a speciffic order
router.put('/update/:orderId', orders.update);

//gets single order
router.get('/:orderId', orders.getOrder);

router.post('/fulfill/:orderId', orders.markOrderAsFulfilled);

module.exports = router;
