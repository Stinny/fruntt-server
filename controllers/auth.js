const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { createSite, deleteSite } = require('../utils/netlifyApi');
const jwt = require('jsonwebtoken');
const { sendSignupEmail } = require('../email/transactional');

const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // const user2 = await User.find({ email: req.body.email });
    // conosle.log(user2);
    if (!user) return res.status(400).json('Invalid credentials try again');

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.status(400).json('Invalid credentials try again');

    const storeFront = await Storefront.findOne({ userId: user._id });
    const stores = await Storefront.find({ userId: user._id });

    let storeIds = [];
    for (var i = 0; i < stores.length; i++) {
      storeIds.push({ id: stores[i]._id, url: stores[i].url });
    }

    const accessToken = user.genAccessToken();
    const refreshToken = user.genRefreshToken();

    const { password, ...otherInfo } = user._doc;

    return res.json({
      accessToken,
      refreshToken,
      userInfo: { ...otherInfo, store: storeFront._doc, storeIds: storeIds },
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
      return res.status(400).json({
        error: 'Email already in use',
      });

    //check if store name is already in use
    const storeNameInUse = await Storefront.find({
      name: req.body.storeName,
    });
    if (storeNameInUse.length)
      return res.status(400).json({
        error: 'Storefront name already in use',
      });

    //create the new user mongo doc
    const newUser = new User({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
      sellerProfile: {
        bio: req.body.bio,
        picture: {
          url: req.body.profilePicUrl,
          key: req.body.profilePicKey,
        },
      },
    });

    const stripeCustomer = await stripe.customers.create({
      email: req.body.email,
    });

    newUser.customerId = stripeCustomer.id;

    //create the new storefront mongo doc
    const storeFront = new Storefront({
      userId: newUser._id,
      name: req.body.storeName,
    });

    newUser.storeId = storeFront._id;

    const deployStore = await createSite(req.body.storeName, storeFront._id);
    const createEnvs = await createEnv({
      storeName: req.body.storeName,
      storeId: storeFront._id,
      siteId: deployStore.id,
    });

    storeFront.url = deployStore.url;
    storeFront.siteId = deployStore.id;

    const accessToken = newUser.genAccessToken();
    const refreshToken = newUser.genRefreshToken();

    await sendSignupEmail(req.body.email, newUser._id);

    //deconstructs the newUser doc so we don't return the password
    const { password, ...otherInfo } = newUser._doc;

    let storeIds = [
      {
        id: storeFront._id,
        url: storeFront.url,
      },
    ];

    await newUser.save();
    await storeFront.save();
    return res.json({
      accessToken,
      refreshToken,
      userInfo: {
        ...otherInfo,
        store: storeFront,
        storeIds: storeIds,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const updatedUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { password, ...otherInfo } = user._doc;
    const storeFront = await Storefront.findOne({ userId: user._id });
    const stores = await Storefront.find({ userId: user._id });

    let storeIds = [];
    for (var i = 0; i < stores.length; i++) {
      storeIds.push({ id: stores[i]._id, url: stores[i].url });
    }

    return res.json({ ...otherInfo, store: storeFront, storeIds: storeIds });
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

//issues a new accessToken from valid refreshtoken
const getNewAccessToken = async (req, res) => {
  const refreshToken = req.params.refreshTkn;

  jwt.verify(refreshToken, process.env.REFRESH_SEC, async (err, user) => {
    if (err) return res.status(401).send('Access denied');

    const getUser = await User.findById(user.id);
    const accessToken = getUser.genAccessToken();

    console.log('new token issued');

    return res.json(accessToken);
  });
};

//creates onboard url for linking stripe account to storefronts
const getOnboardUrl = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.stripeId) {
      //creates stripe account
      const stripeAcc = await stripe.accounts.create({
        type: 'standard',
        business_type: 'individual',
      });
      user.stripeId = stripeAcc.id;
    }

    const savedUser = await user.save();

    // const stripeAcc = await stripe.accounts.retrieve(req.user.stripeId);
    const onboardUrl = await stripe.accountLinks.create({
      account: savedUser.stripeId,
      refresh_url: 'https://fruntt.com/settings',
      return_url: 'https://fruntt.com/settings',
      type: 'account_onboarding',
    });

    return res.json(onboardUrl);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const disconnectStripe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const storefront = await Storefront.findById(req.user.storeId);

    user.stripeOnboard = false;
    user.stripeId = '';
    storefront.stripeId = '';

    await user.save();
    await storefront.save();
    res.json('Stripe disconnected');
  } catch (err) {
    res.status(500).json('Server error');
  }
};

const updateAccountInfo = async (req, res) => {
  try {
    const { email } = req.body;

    const userToUpdate = await User.findById(req.user.id);

    userToUpdate.email = email;

    await userToUpdate.save();
    return res.json('User updated');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const updateSellerProfile = async (req, res) => {
  const {
    firstName,
    lastName,
    bio,
    facebook,
    youtube,
    twitter,
    instagram,
    tiktok,
    profilePicUrl,
    profilePicKey,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    user.sellerProfile.bio = bio;
    user.sellerProfile.facebook = facebook;
    user.sellerProfile.instagram = instagram;
    user.sellerProfile.youtube = youtube;
    user.sellerProfile.twitter = twitter;
    user.sellerProfile.tiktok = tiktok;
    user.sellerProfile.picture.url = profilePicUrl;
    user.sellerProfile.picture.key = profilePicKey;
    user.firstName = firstName;
    user.lastName = lastName;

    await user.save();

    return res.json('Profile updated');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const updateNotifications = async (req, res) => {
  try {
    const {
      sendUpdates,
      sendItemOutOfStock,
      sendOrderPlaced,
      sendReviewCollected,
    } = req.body;

    const userToUpdate = await User.findById(req.user.id);
    userToUpdate.sendUpdates = sendUpdates;
    userToUpdate.sendItemOutOfStock = sendItemOutOfStock;
    userToUpdate.sendOrderPlaced = sendOrderPlaced;
    userToUpdate.sendReviewCollected = sendReviewCollected;

    await userToUpdate.save();
    return res.json('User updated');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const confirmEmail = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.user.id);

    userToUpdate.emailConfirmed = true;

    await userToUpdate.save();
    return res.json('User updated');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const addPaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.customerId,
    });

    console.log(paymentMethod);

    user.paymentAdded = true;
    user.paymentMethod.id = paymentMethodId;
    user.paymentMethod.brand = paymentMethod.card.brand;
    user.paymentMethod.lastFour = paymentMethod.card.last4;

    await user.save();

    return res.json('Payment added');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//removes paymentMethod from stripe customer and from the user doc
const deletePaymentMethod = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const detatchPaymentMethod = await stripe.paymentMethods.detach(
      user.paymentMethod.id
    );

    user.paymentMethod = {};

    user.paymentAdded = false;

    await user.save();

    return res.json('Payment deleted');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//creates a setupIntent for adding payments to account
const getSetupIntent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const setupIntent = await stripe.setupIntents.create({
      customer: user.customerId,
      usage: 'on_session',
    });

    return res.json({ success: true, setupIntent: setupIntent });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    await User.findByIdAndDelete(req.user.id);

    const stores = await Storefront.find({ userId: req.user.id });

    for (var x = 0; x < stores.length; x++) {
      await deleteSite({ siteId: stores[x].siteId });
    }

    await Storefront.deleteMany({ userId: req.user.id });

    //delete any orders
    //delete any customers
    //delete any products
    //deactivate stripe subscriptions

    return res.json('Account deleted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = {
  login,
  register,
  updatedUser,
  getNewAccessToken,
  getOnboardUrl,
  disconnectStripe,
  updateAccountInfo,
  updateNotifications,
  confirmEmail,
  getSetupIntent,
  addPaymentMethod,
  deletePaymentMethod,
  updateSellerProfile,
  deleteAccount,
};
