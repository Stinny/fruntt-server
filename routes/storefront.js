const router = require('express').Router();
const storefront = require('../controllers/storefront');
const setUser = require('../middleware/setUser');
const isTokenValid = require('../middleware/verifyToken');

router.get('/', isTokenValid, setUser, storefront.getStorefront);

router.get(
  '/storestats/:storeId',
  isTokenValid,
  setUser,
  storefront.getStoreStats
);

router.get('/get/:storeId', storefront.getStorefrontById);

router.post('/edit/:storeId', isTokenValid, setUser, storefront.editStyles);

router.post('/addlogo/:storeId', isTokenValid, setUser, storefront.addLogo);

router.post('/deletelogo', isTokenValid, setUser, storefront.deleteLogo);

router.post('/addsocials', isTokenValid, setUser, storefront.addSocialLinks);

router.post('/addvisit', storefront.addVisit);

module.exports = router;
