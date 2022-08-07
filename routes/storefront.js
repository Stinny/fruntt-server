const router = require('express').Router();
const storefront = require('../controllers/storefront');
const setUser = require('../middleware/setUser');
const isTokenValid = require('../middleware/verifyToken');

router.get('/', isTokenValid, setUser, storefront.getStorefront);

router.post('/edit/:storeId', isTokenValid, setUser, storefront.editStyles);

module.exports = router;
