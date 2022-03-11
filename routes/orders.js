const orders = require('../controllers/orders');
const router = require('express').Router();

//gets single order
router.get('/:orderId', orders.getOrder);

//gets all orders related to a certain store
router.get('/store/:storeId', orders.getStoreOrders);

//creates an order
router.post('/create', orders.create);

//updates a speciffic order
router.put('/update/:orderId', orders.update);

module.exports = router;
