const router = require('express').Router();
const product = require('../controllers/product');
const multer = require('multer');
const isTokenValid = require('../middleware/verifyToken');
const isProductOwner = require('../middleware/isProductOwner');
const setUser = require('../middleware/setUser');

//multer config
const storage = multer.memoryStorage();
const multipleUpload = multer({ storage: storage }).array('productImages');

//gets all products
router.get('/', isTokenValid, setUser, product.getAll);

router.get('/store/:storeId', product.getStoreProducts);

//gets single product
router.get('/:productId', product.getProduct);

//creates product
router.post('/create', isTokenValid, setUser, product.create);

router.post('/addfaq', isTokenValid, setUser, product.addFAQ);

router.post('/deletefaq', isTokenValid, setUser, product.deleteFAQ);

//updates product
router.post(
  '/edit/:productId',
  isTokenValid,
  setUser,
  isProductOwner,
  product.update
);

//deletes product
router.delete('/delete/:productId', isTokenValid, product.remove);

router.post('/imageupload', multipleUpload, product.imageUpload);

router.post('/image/delete/', product.imageDelete);

router.get('/images/:productId', product.getItemImages);

module.exports = router;
