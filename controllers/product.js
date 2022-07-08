const Product = require('../models/Product');
const uploadToS3 = require('../utils/uploadToS3');
const Storefront = require('../models/Storefront');

//gets all storefront products(for client/strorefront owners)
const getAll = async (req, res) => {
  try {
    const products = await Product.find({ storeId: req.user.storeId });

    return res.json(products);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets all storefront products
const getStoreProducts = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const products = await Product.find({ storeId: storeId });
    return res.json(products);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets a single product
const getProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);
    return res.json(product);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates a product
//recieves data {title, desc, price, etc.} and image upload data
const create = async (req, res) => {
  const { title, description, price, stock, published, imageData } = req.body;

  if (!title || !description || !price || !stock)
    return res.status(401).json('Not all fields were filled out');

  const storeFront = await Storefront.findById(req.user.storeId);

  const newProduct = new Product({
    title: title,
    description: description,
    price: price,
    userId: req.user.id,
    storeId: req.user.storeId,
    stock: stock,
    published: published,
  });

  //push images data to newProduct doc
  if (imageData.length) {
    for (var i = 0; i < imageData.length; i++) {
      newProduct.images.push({
        url: imageData[i].url,
        key: imageData[i].key,
      });
    }
  }

  try {
    const savedProduct = await newProduct.save();
    return res.json(savedProduct);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server Error');
  }
};

//updates single product
const update = async (req, res) => {
  const productId = req.params.productId;
  const { title, description, price } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title: title,
        description: description,
        price: price,
      },
      { new: true } //thi is so it returns the updated product doc
    );

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.log(err);
    res.status(500).json('Server Error');
  }
};

//deletes a specific product
const remove = async (req, res) => {
  const productId = req.params.productId;

  try {
    await Product.findByIdAndDelete(productId);

    res.status(200).json(productId);
  } catch (err) {
    res.status(500).json('Server error');
  }
};

//image upload enpoint
//uploads files to s3 bucket
const imageUpload = async (req, res) => {
  const files = req.files;

  //this array gets filled with the S3 image upload data like {url, key}
  const urls = [];

  try {
    for (var i = 0; i < files.length; i++) {
      const uploadedFile = await uploadToS3(files[i]);
      urls.push({ url: uploadedFile.Location, key: uploadedFile.Key });
    }

    res.status(200).json(urls);
  } catch (err) {
    res.status(500).json('Server error');
  }
};

module.exports = {
  getAll,
  getStoreProducts,
  getProduct,
  create,
  update,
  remove,
  imageUpload,
};
