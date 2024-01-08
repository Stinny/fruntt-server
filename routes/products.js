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
router.get('/client/:storeId', isTokenValid, setUser, product.getAll);

router.get('/store/:storeId', product.getStoreProducts);

//gets single product
router.get('/:productId', product.getProduct);

//gets marketplace products
router.get('/market/:filter', product.getMarketProducts);

//gets featured products
router.get('/featured/c', product.getFeaturedProducts);

//creates product
router.post('/create', isTokenValid, setUser, product.create);

//creates product
router.post(
  '/create/digital',
  isTokenValid,
  setUser,
  product.createDigitalProduct
);

//updates digital product
router.post(
  '/editdigital/:productId',
  isTokenValid,
  setUser,
  isProductOwner,
  product.editDigitalProduct
);

//deletes product
router.delete('/delete/:productId', isTokenValid, product.remove);

router.post('/imageupload', multipleUpload, product.imageUpload);

router.post('/filesupload', multipleUpload, product.digitalFilesUpload);

router.post('/image/delete/', product.imageDelete);

router.post('/file/delete/', product.deleteFile);

router.get('/images/:productId', product.getItemImages);

router.get('/coverimage/:productId', product.getCoverImage);

router.get('/files/:productId', product.getAllFiles);

module.exports = router;
