const Product = require('../models/Product');
const Customer = require('../models/Customer');
const {
  uploadToS3,
  uploadFilesToS3,
  deleteObjFromS3,
  deleteFileleFromS3,
} = require('../utils/uploadToS3');
const Storefront = require('../models/Storefront');
const { validateBusAddress } = require('../utils/genShippingLabel');
const Review = require('../models/Review');

//gets all storefront products(for client/strorefront owners)
const getAll = async (req, res) => {
  try {
    const item = await Product.find({ storeId: req.params.storeId });

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
    const reviewsData = [];

    const product = await Product.findOne({
      storeId: storeId,
      published: true,
    }); //returns one

    if (product) {
      const reviews = await Review.find({
        productId: product._id,
      });

      for (var i = 0; i < reviews.length; i++) {
        totalRating += reviews[i].rating;
        reviewsData.push({
          review: reviews[i].review,
          rating: reviews[i].rating,
          name: reviews[i]?.name,
          reviewedOn: reviews[i].reviewedOn,
        });
      }
      const { content, files, ...filteredProduct } = product._doc;

      return res.json({
        item: filteredProduct,
        reviews: reviewsData,
        totalRating: totalRating / reviewsData.length,
      });
    } else {
      return res.json({
        item: {},
        reviews: reviewsData,
        totalRating: 0,
      });
    }
  } catch (err) {
    console.log(err);
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
    shippingPrice,
    storeId,
  } = req.body;

  try {
    const storefront = await Storefront.findById(storeId);
    //try to validate address
    const validAddress = await validateBusAddress({
      address,
      city,
      state,
      zip,
    });

    if (validAddress === 'Valid address') {
      const newProduct = new Product({
        title: title,
        description: description,
        price: price,
        userId: req.user.id,
        storeId: storeId,
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
        shippingPrice: shippingPrice,
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

      storefront.productAdded = true;

      await storefront.save();
      const savedProduct = await newProduct.save();
      return res.json({ msg: 'Item added', store: storefront });
    } else {
      return res.json('Invalid address');
    }
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
    shippingPrice,
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

    if (validAddress === 'Valid address') {
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
      productToUpdate.shippingPrice = shippingPrice;

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
    } else {
      res.json('Invalid address');
    }
  } catch (err) {
    console.log(err);
    res.status(500).json('Server Error');
  }
};

//deletes a specific product
const remove = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);
    const storefront = await Storefront.findById(product.storeId);

    await Product.findByIdAndDelete(productId);

    storefront.productAdded = false;
    await storefront.save();

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

//gets coverImage for digital products
const getCoverImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    const coverImage = product.coverImage;

    return res.json(coverImage);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

//gets all files for a specific digital product
const getAllFiles = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    const files = product.files;

    return res.json(files);
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
    console.log(err);
    res.status(500).json('Server error');
  }
};

const digitalFilesUpload = async (req, res) => {
  const files = req.files;

  let fileData = [];

  try {
    for (var i = 0; i < files.length; i++) {
      const uploadedFile = await uploadFilesToS3(files[i]);
      fileData.push({
        url: uploadedFile.Location,
        key: uploadedFile.Key,
        name: files[i].originalname,
      });
    }

    return res.json(fileData);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const createDigitalProduct = async (req, res) => {
  const {
    title,
    description,
    price,
    published,
    coverImage,
    files,
    storeId,
    digitalType,
    link,
    content,
    info,
    callToAction,
    payChoice,
    suggestedPrice,
    url,
  } = req.body;

  try {
    const storefront = await Storefront.findById(storeId);
    const newDigitalProduct = new Product({
      storeId: storeId,
      userId: req.user.id,
      title: title,
      price: price,
      description: description,
      published: published,
      digitalType: digitalType,
      coverImage: {
        url: coverImage[0].url,
        key: coverImage[0].key,
      },
      link: link,
      content: content,
      info: info,
      type: 'digital',
      callToAction: callToAction,
      payChoice: payChoice,
      suggestedPrice: suggestedPrice,
      url: url,
    });

    if (files.length) {
      for (var i = 0; i < files.length; i++) {
        newDigitalProduct.files.push({
          key: files[i].key,
          url: files[i].url,
          name: files[i].name,
        });
      }
    }

    storefront.productAdded = true;

    await newDigitalProduct.save();
    await storefront.save();

    return res.json({ msg: 'Product added', store: storefront });
  } catch (err) {
    console.log(err);
    return res.status(500).json();
  }
};

const editDigitalProduct = async (req, res) => {
  const {
    title,
    description,
    price,
    published,
    coverImageUrl,
    coverImageKey,
    files,
    digitalType,
    content,
    info,
    payChoice,
    suggestedPrice,
    callToAction,
    url,
  } = req.body;
  const productId = req.params.productId;

  try {
    const productToEdit = await Product.findById(productId);

    productToEdit.title = title;
    productToEdit.description = description;
    productToEdit.price = price;
    productToEdit.published = published;
    productToEdit.digitalType = digitalType;
    productToEdit.content = content;
    productToEdit.payChoice = payChoice;
    productToEdit.suggestedPrice = suggestedPrice;
    productToEdit.callToAction = callToAction;
    productToEdit.info = info;
    productToEdit.url = url;

    if (coverImageUrl && coverImageKey) {
      productToEdit.coverImage.url = coverImageUrl;
      productToEdit.coverImage.key = coverImageKey;
    }

    if (files.length) {
      for (var x = 0; x < files.length; x++) {
        productToEdit.files.push(files[x]);
      }
    }

    await productToEdit.save();

    return res.json('Product updated');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//deletes image from the Product doc and from our S3 bucket
const imageDelete = async (req, res) => {
  const { productId, imgId, key } = req.body;

  try {
    const product = await Product.findById(productId); //get product to access images

    if (product?.type === 'digital') {
      product.coverImage.url = '';
      product.coverImage.key = '';
    } else {
      await product.images.pull({ _id: imgId }); //delete the image by the id
    }
    await product.save();

    return res.json('Image deleted');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//deltes a file from a digital product
const deleteFile = async (req, res) => {
  const { productId, fileId, key } = req.body;

  try {
    const product = await Product.findById(productId);

    //remove from doc
    await product.files.pull({ _id: fileId });

    await product.save();

    // //delete from s3 bucket
    // const deleteFromS3 = await deleteFileleFromS3(key);

    return res.json('File deleted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const addDescription = async (req, res) => {
  const { description, productId } = req.body;

  try {
    const product = await Product.findById(productId);

    product.info = description;

    await product.save();

    return res.json('Description added');
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
  getCoverImage,
  addFAQ,
  deleteFAQ,
  digitalFilesUpload,
  createDigitalProduct,
  editDigitalProduct,
  deleteFile,
  getAllFiles,
  addDescription,
};
