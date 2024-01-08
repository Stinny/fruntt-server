const orders = require('../controllers/orders');
const router = require('express').Router();
const setUser = require('../middleware/setUser');
const isTokenValid = require('../middleware/verifyToken');

//gets all orders related to a certain store
router.get('/store/:storeId', isTokenValid, setUser, orders.getStoreOrders);

router.get('/userorders', isTokenValid, setUser, orders.getUsersOrders);

//creates an order
router.post('/create', orders.create);

//updates a speciffic order
router.put('/update/:orderId', orders.update);

//gets single order
router.get('/:orderId', orders.getOrder);

//gets single digital order
router.get('/digital/:orderId', orders.getDigitalOrder);

router.get('/reviews/:storeId', orders.getReviews);

router.get('/reviews/r/:reviewId', orders.getReview);

router.post('/add/review', orders.addReview);

router.post('/view/:orderId', orders.markAsViewed);

router.post('/updateorderamount', orders.updateOrderAmount);

module.exports = router;
