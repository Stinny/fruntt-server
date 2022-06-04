const router = require('express').Router();
const product = require('../controllers/product');
const multer = require('multer');
const isTokenValid = require('../middleware/verifyToken');
const isProductOwner = require('../middleware/isProductOwner');

//multer config
const storage = multer.memoryStorage();
const multipleUpload = multer({ storage: storage }).array('productImages');

//gets all products
router.get('/', product.getAll);

router.get('/store/:storeId', product.getStoreProducts);

//gets single product
router.get('/:productId', product.getProduct);

//creates product
router.post('/create', isTokenValid, product.create);

//updates product
router.put('/edit/:productId', isTokenValid, isProductOwner, product.update);

//deletes product
router.delete('/delete/:productId', isTokenValid, product.remove);

router.post('/imageupload', multipleUpload, product.imageUpload);

module.exports = router;
