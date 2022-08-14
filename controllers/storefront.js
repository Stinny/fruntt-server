const Storefront = require('../models/Storefront');
const User = require('../models/User');

const getStorefront = async (req, res) => {
  try {
    const storefront = await Storefront.find({ userId: req.user.id });
    return res.json(storefront[0]);
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
    buttonBG,
    buttonTextColor,
    footerBG,
  } = req.body;

  console.log(req.body);

  try {
    const storefrontToEdit = await Storefront.findById(storeId);

    storefrontToEdit.style.pageBackground = pageBG;
    storefrontToEdit.style.navbarBackground = navbarBG;
    storefrontToEdit.style.footerBackground = footerBG;
    storefrontToEdit.style.pageText = pageText;
    storefrontToEdit.style.buttonBackground = buttonBG;
    storefrontToEdit.style.buttonTextColor = buttonTextColor;

    await storefrontToEdit.save();
    return res.json('Styles saved');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getStorefront,
  editStyles,
};
