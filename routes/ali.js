const router = require('express').Router();
const aliEx = require('../controllers/aliEx');

router.get('/product/:productId', aliEx.getProductFromAli);

module.exports = router;
