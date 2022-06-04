const orders = require('../controllers/orders');
const router = require('express').Router();

//gets all orders related to a certain store
router.get('/store/:storeId', orders.getStoreOrders);

//creates an order
router.post('/create', orders.create);

//updates a speciffic order
router.put('/update/:orderId', orders.update);

//updates the paymentIntent attached to order
router.post('/updatepayment/:orderId', orders.updateOrderPaymentIntent);

//gets an onboard url for onboarding users to stripe
router.get('/onboardurl', orders.getOboardUrl);

//gets single order
router.get('/:orderId', orders.getOrder);

module.exports = router;
