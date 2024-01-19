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
const User = require('../models/User');

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
  let reviews = [];
  let productData = [];

  try {
    const product = await Product.find({
      storeId: storeId,
      published: true,
    }); //returns one

    for (var x = 0; x < product.length; x++) {
      const reviewsData = await Review.find({
        productId: product[x]._id,
      });

      for (var r = 0; r < reviewsData.length; r++) {
        reviews.push(reviewsData[r]);
        totalRating += reviewsData[r]?.rating;
      }

      const { content, files, ...filteredProduct } = product[x]._doc;

      productData.push({
        item: filteredProduct,
        reviews: reviews,
        totalRating: totalRating / reviews.length,
      });

      reviews = [];
      totalRating = 0;
    }

    return res.json({
      products: productData,
    });
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
    free,
    marketplace,
    category,
  } = req.body;

  try {
    const storefront = await Storefront.findById(storeId);
    const user = await User.findById(req.user.id);

    const newDigitalProduct = new Product({
      storeId: storeId,
      storeUrl: storefront.url,
      userId: req.user.id,
      title: title,
      price: free ? 0 : price,
      description: description,
      published: published,
      digitalType: digitalType,
      free: free,
      coverImage: {
        url: coverImage[0].url,
        key: coverImage[0].key,
      },
      coverImages: coverImage,
      link: link,
      content: content,
      info: info,
      type: 'digital',
      callToAction: callToAction,
      payChoice: payChoice,
      suggestedPrice: suggestedPrice,
      url: url,
      marketplace: marketplace,
      category: category,
      userName: user.name,
      userPicture: user.sellerProfile.picture.url,
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
    free,
    category,
    marketplace,
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
    productToEdit.free = free;
    productToEdit.category = category;
    productToEdit.marketplace = marketplace;

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

const getMarketProducts = async (req, res) => {
  const filter = req.params.filter;
  let products;

  try {
    if (filter === 'all') {
      products = await Product.find({ marketplace: true });
    } else {
      products = await Product.find({ marketplace: true, digitalType: filter });
    }

    return res.json(products.sort(() => Math.random() - 0.5));
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ marketplace: true, featured: true });

    return res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getAll,
  getStoreProducts,
  getMarketProducts,
  getFeaturedProducts,
  getProduct,
  create,
  remove,
  imageUpload,
  imageDelete,
  getItemImages,
  getCoverImage,
  digitalFilesUpload,
  createDigitalProduct,
  editDigitalProduct,
  deleteFile,
  getAllFiles,
};
