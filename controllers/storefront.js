const Storefront = require('../models/Storefront');
const User = require('../models/User');
const { deleteObjFromS3 } = require('../utils/uploadToS3');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Visit = require('../models/Visit');
const moment = require('moment');
const {
  createSite,
  deleteSite,
  updateSiteName,
} = require('../utils/netlifyApi');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const getStorefront = async (req, res) => {
  try {
    const storefront = await Storefront.findById(req.params.storeId);
    return res.json(storefront);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getStorefrontById = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const storefront = await Storefront.findById(storeId);
    const storeOwner = await User.findById(storefront.userId);

    const stores = await Storefront.find({ userId: storeOwner._id });
    // const orders = await Order.find({ storeId: storefront });

    let successfulOrders = [];
    let storeIds = [];

    for (var i = 0; i < stores.length; i++) {
      storeIds.push({ id: stores[i]._id, url: stores[i].url });
      const orders = await Order.find({ storeId: stores[i]._id });

      for (var x = 0; x < orders.length; x++) {
        if (orders[x].paid) {
          successfulOrders.push(orders[x]);
        }
      }
    }

    return res.json({
      storefront: storefront,
      stripeOnboard: storeOwner.stripeOnboard,
      sellerProfile: {
        firstName: storeOwner.firstName,
        lastName: storeOwner.lastName,
        bio: storeOwner.sellerProfile.bio,
        instagram: storeOwner.sellerProfile.instagram,
        facebook: storeOwner.sellerProfile.facebook,
        youtube: storeOwner.sellerProfile.youtube,
        twitter: storeOwner.sellerProfile.twitter,
        tikok: storeOwner.sellerProfile.tiktok,
        profilePic: storeOwner.sellerProfile.picture.url,
        numberOfSales: successfulOrders.length,
      },
      storeIds: storeIds,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const addLogo = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const storefrontToEdit = await Storefront.findById(storeId);

    if (req.body.logoUrl !== '' && req.body.logoKey !== '') {
      storefrontToEdit.logo.url = req.body.logoUrl;
      storefrontToEdit.logo.key = req.body.logoKey;
    }
    storefrontToEdit.name = req.body.name;
    storefrontToEdit.url = `https://${req.body.name}.fruntt.com`;

    await updateSiteName({
      siteId: storefrontToEdit?.siteId,
      storeName: req.body.name,
    });

    await storefrontToEdit.save();
    return res.json('Logo added');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const deleteLogo = async (req, res) => {
  const { storeId, key } = req.body;

  try {
    const storefrontToEdit = await Storefront.findById(storeId);

    storefrontToEdit.logo.url = '';
    storefrontToEdit.logo.key = '';

    const deleteImgFromS3 = await deleteObjFromS3(key);

    await storefrontToEdit.save();
    return res.json('Logo deleted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const addSocialLinks = async (req, res) => {
  const { facebook, twitter, youtube, instagram, storeId } = req.body;

  try {
    const storefrontToEdit = await Storefront.findById(storeId);

    storefrontToEdit.links.facebook = facebook;
    storefrontToEdit.links.youtube = youtube;
    storefrontToEdit.links.instagram = instagram;
    storefrontToEdit.links.twitter = twitter;

    await storefrontToEdit.save();
    return res.json('Links added');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const editStyles = async (req, res) => {
  const storeId = req.params.storeId;

  const {
    navbarBG,
    pageBG,
    pageText,
    buttonColor,
    buttonTextColor,
    footerBG,
    buttonStyle,
    socialIcons,
    hideFooter,
    hideNav,
    borders,
    header,
    reviewBackground,
    faqBackground,
  } = req.body;

  try {
    const storefrontToEdit = await Storefront.findById(storeId);

    storefrontToEdit.style.pageBackground = pageBG;
    storefrontToEdit.style.navbarBackground = navbarBG;
    storefrontToEdit.style.footerBackground = footerBG;
    storefrontToEdit.style.pageText = pageText;
    storefrontToEdit.style.buttonColor = buttonColor;
    storefrontToEdit.style.buttonTextColor = buttonTextColor;
    storefrontToEdit.style.buttonStyle = buttonStyle;
    storefrontToEdit.style.socialIcons = socialIcons;
    storefrontToEdit.style.hideNav = hideNav;
    storefrontToEdit.style.hideFooter = hideFooter;
    storefrontToEdit.style.borderColor = borders;
    storefrontToEdit.style.headerColor = header;
    storefrontToEdit.style.reviewBackground = reviewBackground;
    storefrontToEdit.style.faqBackground = faqBackground;
    storefrontToEdit.designAdded = true;

    storefrontToEdit.lastEdited = new Date();

    await storefrontToEdit.save();
    return res.json({ msg: 'Styles saved', store: storefrontToEdit });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//adds one to the visit count for tracking visits
const addVisit = async (req, res) => {
  const { storeId } = req.body;

  try {
    const newVisit = new Visit({
      storeId: storeId,
      visitedOn: new Date(),
    });

    await newVisit.save();

    return res.json('Visit tracked');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getStoreStats = async (req, res) => {
  let revenue = 0;
  let numOfOrders = 0;
  let numOfUnfulfilledOrders = 0;
  let dataSet = [];

  try {
    const orders = await Order.find({
      storeId: req.params.storeId,
      paid: true,
    });
    const storefront = await Storefront.findById(req.params.storeId);
    const product = await Product.find({ storeId: req.params.storeId });
    const visits = await Visit.find({ storeId: req.params.storeId });

    for (var x = 0; x < orders.length; x++) {
      revenue += orders[x].total;
      numOfOrders += 1;
      let daysTotal = 0;
      let orderedOn = moment(orders[x].placedOn).format('MM/DD/YYYY');

      for (var i = 0; i < orders.length; i++) {
        if (orders[i].placedOn === orderedOn) daysTotal += orders[i].total;
      }

      dataSet.push({ date: orders[x].placedOn, daysTotal: daysTotal });

      if (orders[x].fulfilled === false) numOfUnfulfilledOrders += 1;
    }

    return res.json({
      revenue: revenue,
      numOfOrders: numOfOrders,
      numOfUnfulfilledOrders: numOfUnfulfilledOrders,
      visits: visits.length,
      conversion: (numOfOrders / visits.length) * 100,
      itemStock: product.length ? product[0].stock : 0,
      dataSet: dataSet,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const addStorefront = async (req, res) => {
  const { pageName } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const storeExists = await Storefront.find({ name: pageName });

    if (storeExists.length) return res.json({ msg: 'Already exists' });

    const storeFront = new Storefront({
      userId: req.user.id,
      name: pageName,
    });

    if (!user.subscriptionId) {
      const subscription = await stripe.subscriptions.create({
        customer: user.customerId,
        items: [{ price: process.env.PRICE }],
        default_payment_method: user.paymentMethod.id,
        proration_behavior: 'none',
      });

      user.subscriptionId = subscription.id;
      user.subscriptionItemId = subscription.items.data[0].id;
      await user.save();
    } else {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 300,
          currency: 'usd',
          payment_method_types: ['card'],
          customer: user.customerId,
        });

        await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: user.paymentMethod.id,
        });
      } catch (err) {
        console.log(err);
        return res.json({ msg: 'Payment failed' });
      }
    }

    const deployStore = await createSite(pageName, storeFront._id);

    storeFront.url = deployStore.url;
    storeFront.siteId = deployStore.id;

    await storeFront.save();

    const stores = await Storefront.find({ userId: req.user.id });
    let storeIds = [];
    for (var i = 0; i < stores.length; i++) {
      storeIds.push({ id: stores[i]._id, url: stores[i].url });
    }

    let quantity = storeIds.length > 1 ? storeIds.length - 1 : 1;

    //update subscriptionItem quantity based on amount of stores
    const subscriptionItem = await stripe.subscriptionItems.update(
      user.subscriptionItemId,
      {
        quantity: quantity,
        proration_behavior: 'none',
      }
    );

    return res.json({
      msg: 'Page added',
      storefront: storeFront,
      storeIds: storeIds,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const deleteStore = async (req, res) => {
  const { storeId } = req.body;

  try {
    const storefront = await Storefront.findById(storeId);
    const user = await User.findById(req.user.id);

    const deleteProduct = await Product.deleteMany({ storeId: storefront._id });
    const deletedStore = await deleteSite({ siteId: storefront.siteId });

    const deleteStoreDoc = await Storefront.findByIdAndDelete(storeId);

    const stores = await Storefront.find({ userId: req.user.id });

    //create new stripe Price (old - $5)
    //update the users stripe Subscription with new price but don't charge

    let storeIds = [];
    for (var i = 0; i < stores.length; i++) {
      storeIds.push({ id: stores[i]._id, url: stores[i].url });
    }

    const subscriptionItem = await stripe.subscriptionItems.retrieve(
      user.subscriptionItemId
    );

    //update subscriptionItem quantity based on amount of stores
    const updateSubscriptionItem = await stripe.subscriptionItems.update(
      user.subscriptionItemId,
      {
        quantity: subscriptionItem.quantity - 1,
        proration_behavior: 'none',
      }
    );

    return res.json({
      msg: 'Page deleted',
      storefront: stores[0],
      storeIds: storeIds,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getStorefront,
  getStorefrontById,
  editStyles,
  addLogo,
  deleteLogo,
  addSocialLinks,
  addVisit,
  getStoreStats,
  addStorefront,
  deleteStore,
};
