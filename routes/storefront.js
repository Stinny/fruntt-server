const router = require('express').Router();
const storefront = require('../controllers/storefront');
const setUser = require('../middleware/setUser');
const isTokenValid = require('../middleware/verifyToken');

router.get('/store/:storeId', isTokenValid, setUser, storefront.getStorefront);

router.get(
  '/storestats/:storeId/:view',
  isTokenValid,
  setUser,
  storefront.getStoreStats
);

router.get('/get/:storeId', storefront.getStorefrontById);

router.get('/featured', storefront.getFeaturedStores);

router.post('/edit/:storeId', isTokenValid, setUser, storefront.editStyles);

router.post('/delete', isTokenValid, setUser, storefront.deleteStore);

router.post('/addlogo/:storeId', isTokenValid, setUser, storefront.changeName);

router.post('/deletelogo', isTokenValid, setUser, storefront.deleteLogo);

router.post('/addsocials', isTokenValid, setUser, storefront.addSocialLinks);

router.post('/addvisit', storefront.addVisit);

router.post('/addpage', isTokenValid, setUser, storefront.addStorefront);

router.post('/hidesections', isTokenValid, setUser, storefront.hideSections);

module.exports = router;
