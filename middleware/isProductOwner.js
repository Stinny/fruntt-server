const Product = require('../models/Product');

//compares req.user.id to userId for checking ownership
const isProductOwner = async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (req.user.id !== product.userId)
    return res.status(401).json('Acces denied');

  next();
};

module.exports = isProductOwner;
