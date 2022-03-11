const Product = require('../models/Product');
const uploadToS3 = require('../utils/uploadToS3');

//gets all products
const getAll = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json('Server error');
  }
};

//gets a single product
const getProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//creates a product
//recieves data {title, desc, price, etc.} and image upload data
const create = async (req, res) => {
  const { title, description, price, imagesData } = req.body;

  if (!title || !description || !price)
    return res.status(401).json('Not all fields were filled out');

  const newProduct = new Product({
    title: title,
    description: description,
    price: price,
    userId: req.user.id,
  });

  //push images data to newProduct doc
  if (imagesData.length) {
    for (var i = 0; i < imagesData.length; i++) {
      newProduct.images.push({
        url: imagesData[i].url,
        key: imagesData[i].key,
      });
    }
  }

  try {
    const savedProduct = await newProduct.save();
    return res.status(200).json(savedProduct);
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

module.exports = { getAll, getProduct, create, update, remove, imageUpload };
