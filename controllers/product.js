const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { uploadToS3, deleteObjFromS3 } = require('../utils/uploadToS3');
const Storefront = require('../models/Storefront');
const { validateBusAddress } = require('../utils/genShippingLabel');

//gets all storefront products(for client/strorefront owners)
const getAll = async (req, res) => {
  try {
    const item = await Product.find({ storeId: req.user.storeId });

    return res.json(item);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets a single item for a storefront and any reviews
const getStoreProducts = async (req, res) => {
  const storeId = req.params.storeId;
  let totalRating = 0;

  try {
    const reviews = [];
    const product = await Product.find({ storeId: storeId }); //returns an array
    const item = product[0]; //first item in the returned array from line above

    const customers = await Customer.find({
      productId: item._id,
      reviewed: true,
    });

    for (var i = 0; i < customers.length; i++) {
      totalRating += customers[i].rating;
      reviews.push({
        review: customers[i].review,
        rating: customers[i].rating,
        customerName: `${customers[i].firstName} ${customers[i].lastName}`,
        reviewedOn: customers[i].reviewedOn,
      });
    }

    return res.json({
      item: item,
      reviews: reviews,
      totalRating: totalRating / customers.length,
    });
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
  const {
    title,
    description,
    price,
    stock,
    published,
    weightUnit,
    weight,
    imageData,
    address,
    city,
    state,
    country,
    zip,
    options,
  } = req.body;

  //try to validate address
  const validAddress = await validateBusAddress({ address, city, state, zip });
  if (validAddress === 'Invalid address') return res.json('Invalid address');

  const newProduct = new Product({
    title: title,
    description: description,
    price: price,
    userId: req.user.id,
    storeId: req.user.storeId,
    stock: stock,
    weightUnit: weightUnit,
    weight: weight,
    published: published,
    shipsFrom: {
      address: address,
      country: country,
      city: city,
      state: state,
      zipcode: zip,
    },
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

  //push the options data
  if (options.length) {
    for (var i = 0; i < options.length; i++) {
      newProduct.options.push(options[i]);
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
  const {
    title,
    description,
    price,
    stock,
    published,
    weightUnit,
    weight,
    address,
    country,
    state,
    city,
    zipcode,
    options,
    imageData,
  } = req.body;

  try {
    const productToUpdate = await Product.findById(productId);

    //try to validate address
    const validAddress = await validateBusAddress({
      address,
      city,
      state,
      zip: zipcode,
    });
    console.log(validAddress);
    if (validAddress === 'Invalid address') return res.json('Invalid address');

    //make updates
    productToUpdate.title = title;
    productToUpdate.description = description;
    productToUpdate.price = price;
    productToUpdate.stock = stock;
    productToUpdate.published = published;
    productToUpdate.weightUnit = weightUnit;
    productToUpdate.weight = weight;
    productToUpdate.shipsFrom.address = address;
    productToUpdate.shipsFrom.country = country;
    productToUpdate.shipsFrom.state = state;
    productToUpdate.shipsFrom.city = city;
    productToUpdate.shipsFrom.zipcode = zipcode;

    //push image data to doc
    if (imageData.length) {
      for (var i = 0; i < imageData.length; i++) {
        productToUpdate.images.push({
          url: imageData[i].url,
          key: imageData[i].key,
        });
      }
    }

    //push options data to doc
    productToUpdate.options = options;

    //save the updates to the product doc
    await productToUpdate.save();

    res.status(200).json('Item updated');
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

    res.status(200).json('Item deleted');
  } catch (err) {
    res.status(500).json('Server error');
  }
};

//gets an item from the DB and returns just the image data(url, key, _id)
const getItemImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    const images = product.images;
    return res.json(images);
  } catch (err) {
    return res.status(500).json('Server error');
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

//deletes image from the Product doc and from our S3 bucket
const imageDelete = async (req, res) => {
  const { productId, imgId, key } = req.body;

  try {
    const product = await Product.findById(productId); //get product to access images

    await product.images.pull({ _id: imgId }); //delete the image by the id
    await product.save();

    const deletedImgReq = await deleteObjFromS3(key); //delete obj from S3 bucket by the key
    return res.json('Image deleted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const addFAQ = async (req, res) => {
  const { productId, question, answer } = req.body;

  try {
    const product = await Product.findById(productId);

    product.faqs.push({ question: question, answer: answer });
    await product.save();
    return res.json('FAQ added');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const deleteFAQ = async (req, res) => {
  const { productId, faqId } = req.body;

  try {
    const product = await Product.findById(productId);

    await product.faqs.pull({ _id: faqId });
    await product.save();

    return res.json('FAQ deleted');
  } catch (err) {
    return res.status(500).json('Server error');
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
  imageDelete,
  getItemImages,
  addFAQ,
  deleteFAQ,
};
