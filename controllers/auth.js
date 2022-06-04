const CryptoJS = require('crypto-js');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const stripe = require('stripe')(process.env.SK_TEST);
const { createSite } = require('../utils/netlifyApi');

const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // const user2 = await User.find({ email: req.body.email });
    // conosle.log(user2);
    if (!user)
      return res.json({
        status: 'error',
        msg: 'Invalid credentials try again',
        data: {},
      });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.json({
        status: 'error',
        msg: 'Invalid credentials try again',
        data: {},
      });

    const storeFront = await Storefront.findOne({ userId: user._id });

    const accessToken = user.genAccessToken();
    const { password, ...otherInfo } = user._doc;

    return res.status(200).json({
      status: 'Ok',
      msg: '',
      data: { accessToken, ...otherInfo, store: storeFront._doc },
    });
  } catch (err) {
    res.status(500).json('Server error');
  }
};

const register = async (req, res) => {
  try {
    //creates salt
    //then creates the hash from salt and password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);

    //checks if email is already in use
    const emailInUse = await User.find({ email: req.body.email });
    if (emailInUse.length)
      return res.json({
        status: 'Error',
        msg: 'Email already in use',
        data: {},
      });

    //check if store name is already in use
    const storeNameInUse = await Storefront.find({
      name: req.body.storeName,
    });
    if (storeNameInUse.length)
      return res.json({
        status: 'Error',
        msg: 'Storefront name already in use',
        data: {},
      });

    //create the new user mongo doc
    const newUser = new User({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
    });

    //creates stripe account
    const stripeAcc = await stripe.accounts.create({
      type: 'standard',
      email: req.body.email,
      business_type: 'individual',
      individual: {
        phone: '000-000-0000',
      },
    });

    //create the new storefront mongo doc
    const storeFront = new Storefront({
      userId: newUser._id,
      name: req.body.storeName,
      stripeId: stripeAcc.id,
    });

    newUser.storeId = storeFront._id;
    newUser.stripeId = stripeAcc.id;

    // const deployStore = await createSite(req.body.storeName, storeFront._id);

    storeFront.url = 'youtube.com';

    const accessToken = newUser.genAccessToken();

    //deconstructs the newUser doc so we don't return the password
    const { password, ...otherInfo } = newUser._doc;

    await newUser.save();
    await storeFront.save();
    res.status(200).json({
      status: 'Ok',
      msg: '',
      data: { accessToken, ...otherInfo, store: storeFront },
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

const updatedUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const accessToken = user.genAccessToken();
    const { password, ...otherInfo } = user._doc;

    const storeFront = await Storefront.findOne({ userId: user._id });

    res.json({
      status: 'Ok',
      msg: '',
      data: { accessToken, ...otherInfo, store: storeFront },
    });
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

const updateStripeOnboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const stripeAcc = await stripe.accounts.retrieve(req.user.stripeId);

    if (stripeAcc.details_submitted) {
      user.stripeOnboard = true;
      await user.save();
    }

    const { password, ...otherInfo } = user._doc;
    return res.status(200).json(...otherInfo);
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = { login, register, updatedUser, updateStripeOnboard };
