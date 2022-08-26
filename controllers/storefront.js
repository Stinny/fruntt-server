const Storefront = require('../models/Storefront');
const User = require('../models/User');
const { deleteObjFromS3 } = require('../utils/uploadToS3');
const Order = require('../models/Order');

const getStorefront = async (req, res) => {
  try {
    const storefront = await Storefront.find({ userId: req.user.id });
    return res.json(storefront[0]);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getStorefrontById = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const storefront = await Storefront.findById(storeId);
    return res.json(storefront);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const addLogo = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const storefrontToEdit = await Storefront.findById(storeId);

    storefrontToEdit.logo.url = req.body.logoUrl;
    storefrontToEdit.logo.key = req.body.logoKey;
    storefrontToEdit.name = req.body.name;

    await storefrontToEdit.save();
    return res.json('Logo added');
  } catch (err) {
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

    await storefrontToEdit.save();
    return res.json('Styles saved');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//adds one to the visit count for tracking visits
const addVisit = async (req, res) => {
  const { storeId } = req.body;

  try {
    const storefront = await Storefront.findById(storeId);

    storefront.visits += 1;

    await storefront.save();

    return res.json('Visit tracked');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getStoreStats = async (req, res) => {
  let revenue = 0;
  let numOfOrders = 0;

  try {
    const orders = await Order.find({
      storeId: req.params.storeId,
      paid: true,
    });
    const storefront = await Storefront.findById(req.params.storeId);

    for (var x = 0; x < orders.length; x++) {
      revenue += orders[x].total;
      numOfOrders += 1;
    }

    return res.json({
      revenue: revenue,
      numOfOrders: numOfOrders,
      visits: storefront.visits,
      conversion: (numOfOrders / storefront.visits) * 100,
    });
  } catch (err) {
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
};
