const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { createSite, deleteSite, createEnv } = require('../utils/netlifyApi');
const jwt = require('jsonwebtoken');
const {
  sendSignupEmail,
  sendPasswordResetEmail,
} = require('../email/transactional');
const Product = require('../models/Product');
const Oauth = require('oauth');
const Twitter = require('twitter');
const countryToCurrency = require('country-to-currency');
const Message = require('../models/Message');

//for twitter oauth
const oauth = new Oauth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_API,
  process.env.TWITTER_SEC,
  '1.0A',
  null,
  'HMAC-SHA1'
);

const login = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      twitterAuth: false,
    });
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
      password: hash,
    });

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

    const stripeCustomer = await stripe.customers.create({
      email: req.body.email,
      description: 'Fruntt - seller',
    });

    newUser.customerId = stripeCustomer.id;

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

    user.stripeOnboard = false;
    user.stripeId = '';

    await user.save();
    res.json('Stripe disconnected');
  } catch (err) {
    res.status(500).json('Server error');
  }
};

const updateAccountInfo = async (req, res) => {
  try {
    const { email, country, zipcode } = req.body;

    console.log(req.body);

    const userToUpdate = await User.findById(req.user.id);

    userToUpdate.email = email;
    userToUpdate.country = country;
    userToUpdate.zipcode = zipcode;

    await userToUpdate.save();
    return res.json('User updated');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const updateSellerProfile = async (req, res) => {
  const {
    name,
    bio,
    facebook,
    youtube,
    twitter,
    instagram,
    tiktok,
    linkedin,
    link,
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
    user.sellerProfile.linkedin = linkedin;
    user.sellerProfile.link = link;
    user.sellerProfile.picture.url = profilePicUrl;
    user.sellerProfile.picture.key = profilePicKey;
    user.name = name;

    await Product.updateMany(
      { userId: user._id },
      { userPicture: profilePicUrl, userName: name }
    );

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

    const deleteStripeCus = await stripe.customers.del(user.customerId);

    await User.findByIdAndDelete(req.user.id);

    const stores = await Storefront.find({ userId: req.user.id });

    for (var x = 0; x < stores.length; x++) {
      await deleteSite({ siteId: stores[x].siteId });
    }

    await Storefront.deleteMany({ userId: req.user.id });
    await Product.deleteMany({ userId: req.user.id });

    return res.json('Account deleted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const sendPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const token = jwt.sign({ email: email }, process.env.JWT_SEC, {
      expiresIn: '30m',
    });

    //send email with token
    await sendPasswordResetEmail(email, token);

    return res.json('Email sent');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const checkResetToken = async (req, res) => {
  const { token } = req.body;

  try {
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err) return res.json({ valid: false });

      return res.json({ valid: true, email: user.email });
    });
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    //creates salt
    //then creates the hash from salt and password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    user.password = hash;

    await user.save();

    return res.json('Password reset');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const changePassword = async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    //check if oldPassword matches the password on server
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return res.json('Invalid password');

    //creates salt
    //then creates the hash from salt and password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    user.password = hash;

    await user.save();

    return res.json('Password changed');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

const twitterAuth = (req, res) => {
  const type = req.params.type;

  const requestParams = {
    include_email: true,
  };

  oauth.getOAuthRequestToken(
    requestParams,
    (error, oauthToken, oauthTokenSecret, results) => {
      if (error) {
        console.error('Error getting OAuth request token:', error);
        res.status(500).send('Error getting OAuth request token');
      } else {
        // Save the obtained oauthToken and oauthTokenSecret to be used in the callback route
        // req.session.oauthToken = oauthToken;
        // req.session.oauthTokenSecret = oauthTokenSecret;

        // Redirect the user to the Twitter authorization URL
        res.json({
          url: `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`,
          oauthSecret: oauthTokenSecret,
          type: type,
        });
      }
    }
  );
};

const twitterLogin = async (req, res) => {
  const { oauthToken, oauthSecret, oauthVerifier } = req.body;

  oauth.getOAuthAccessToken(
    oauthToken,
    oauthSecret,
    oauthVerifier,
    (error, accessToken, accessTokenSecret) => {
      if (error) {
        console.log(error);
      } else {
        const client = new Twitter({
          consumer_key: process.env.TWITTER_API,
          consumer_secret: process.env.TWITTER_SEC,
          access_token_key: accessToken,
          access_token_secret: accessTokenSecret,
        });

        const profileParams = {
          include_email: true, // Add this parameter to include the email address in the profile data
        };

        client.get(
          'account/verify_credentials',
          profileParams,
          async (error, profileData, response) => {
            if (error) {
              console.error('Error fetching user profile data:', error);
              res.status(500).send('Error fetching user profile data');
            } else {
              //see if user exists via twitter auth
              const user = await User.findOne({
                email: profileData?.email,
                twitterAuth: true,
              });

              if (!user)
                return res.status(400).json('That account does not exist');

              const accessToken = user.genAccessToken();
              const refreshToken = user.genRefreshToken();

              const { password, ...otherInfo } = user._doc;

              const storeFront = await Storefront.findOne({ userId: user._id });
              const stores = await Storefront.find({ userId: user._id });

              let storeIds = [];
              for (var i = 0; i < stores.length; i++) {
                storeIds.push({ id: stores[i]._id, url: stores[i].url });
              }

              return res.json({
                accessToken,
                refreshToken,
                userInfo: {
                  ...otherInfo,
                  store: storeFront ? storeFront._doc : {},
                  storeIds: storeIds,
                },
              });
            }
          }
        );
      }
    }
  );
};

const twitterRegister = async (req, res) => {
  const { oauthToken, oauthSecret, oauthVerifier, storeName } = req.body;

  try {
    oauth.getOAuthAccessToken(
      oauthToken,
      oauthSecret,
      oauthVerifier,
      (error, accessToken, accessTokenSecret) => {
        if (error) {
          console.log(error);
        } else {
          const client = new Twitter({
            consumer_key: process.env.TWITTER_API,
            consumer_secret: process.env.TWITTER_SEC,
            access_token_key: accessToken,
            access_token_secret: accessTokenSecret,
          });

          const profileParams = {
            include_email: true, // Add this parameter to include the email address in the profile data
          };

          client.get(
            'account/verify_credentials',
            profileParams,
            async (error, profileData, response) => {
              if (error) {
                console.error('Error fetching user profile data:', error);
                res.status(500).send('Error fetching user profile data');
              } else {
                //checks if email is already in use
                const emailInUse = await User.find({
                  email: profileData?.email,
                });
                if (emailInUse.length)
                  return res.status(400).json({
                    error: 'Email already in use',
                  });

                //check if store name is already in use
                const storeNameInUse = await Storefront.find({
                  name: storeName,
                });
                if (storeNameInUse.length)
                  return res.status(400).json({
                    error: 'Storefront name already in use',
                  });

                //create the new user mongo doc
                const newUser = new User({
                  email: profileData.email,
                  twitterAuth: true,
                  twitterId: profileData?.id,
                  emailConfirmed: true,
                  name: profileData?.name,
                });

                newUser.sellerProfile.picture.url =
                  profileData?.profile_image_url_https;

                newUser.sellerProfile.twitter = `https://twitter.com/${profileData?.screen_name}`;

                const accessToken = newUser.genAccessToken();
                const refreshToken = newUser.genRefreshToken();

                const stripeCustomer = await stripe.customers.create({
                  email: profileData?.email,
                });

                newUser.customerId = stripeCustomer.id;

                //deconstructs the newUser doc so we don't return the password
                const { password, ...otherInfo } = newUser._doc;

                await newUser.save();

                return res.json({
                  accessToken,
                  refreshToken,
                  userInfo: {
                    ...otherInfo,
                    store: {},
                    storeIds: [],
                  },
                });
              }
            }
          );
        }
      }
    );
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const addBankAccount = async (req, res) => {
  let type = req.body.type;
  let ip = req.ip || req.ips;
  let date = new Date();
  let timestamp = Math.floor(date.getTime() / 1000);

  let currency =
    type === 'individual'
      ? countryToCurrency[req.body.country.value]
      : countryToCurrency[req.body.busCountry.value];

  switch (req.body.busType) {
    case 'non_profit':
      busType = 'non_profit';
      break;
    case 'company':
      busType = 'company';
      break;
    default:
      busType = '';
  }

  try {
    //   //get bank account details
    //   //create custom account
    //   //create bank token
    //   //create bank account(external account) with account id and token id
    //   //add account ID and bank ID to user doc
    const user = await User.findById(req.user.id);

    //create initial stripe account
    const account = await stripe.accounts.create({
      type: 'custom',
      country:
        type === 'individual'
          ? req.body.country.value
          : req.body.busCountry.value,
      email: user.email,
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });

    const accountParams = {
      business_type: type === 'individual' ? 'individual' : busType,
      settings: {
        payouts: {
          schedule: { interval: 'weekly', weekly_anchor: 'friday' },
        },
      },
      business_profile: {
        mcc: 5815,
        url: 'https://fruntt.com',
      },
      tos_acceptance: {
        date: timestamp,
        ip: ip,
      },
    };

    const personParams = {
      address: {
        line1: req.body.address,
        city: req.body.city,
        state: req.body.state.value,
        country: req.body.country.value,
        postal_code: req.body.zip,
      },
      email: user.email,
      dob: {
        day: req.body.day,
        month: req.body.month,
        year: req.body.year,
      },
      first_name: req.body.first,
      last_name: req.body.last,
      phone: req.body.phone,
      ssn_last_4: req.body.ssn,
      relationship: {
        representative: true,
        owner: true,
        title: 'Seller',
      },
    };

    if (type === 'business') {
      accountParams.company = {
        address: {
          line1: req.body.busAddress,
          city: req.body.busCity,
          state: req.body.busState.value,
          postal_code: req.body.busZip,
          country: req.body.busCountry.value,
        },
        name: req.body.busName,
        phone: req.body.busPhone,
        tax_id: req.body.busEIN,
        owners_provided: true,
      };

      const person = await stripe.accounts.createPerson(
        account.id,
        personParams
      );
    } else if (type === 'individual') {
      accountParams.individual = {
        address: {
          line1: req.body.address,
          city: req.body.city,
          state: req.body.state.value,
          country: req.body.country.value,
          postal_code: req.body.zip,
        },
        email: user.email,
        dob: {
          day: req.body.day,
          month: req.body.month,
          year: req.body.year,
        },
        first_name: req.body.first,
        last_name: req.body.last,
        phone: req.body.phone,
        ssn_last_4: req.body.ssn,
      };
    }

    // //creates stripe custom account based on account params
    const updateAccount = await stripe.accounts.update(
      account.id,
      accountParams
    );

    //creates token for adding an external account
    const token = await stripe.tokens.create({
      bank_account: {
        country:
          type === 'individual'
            ? req.body.country.value
            : req.body.busCountry.value,
        currency: currency,
        account_holder_name: req.body.accountName,
        account_holder_type: type === 'individual' ? 'individual' : 'company',
        routing_number: req.body.routing,
        account_number: req.body.account,
      },
    });

    const bank = await stripe.accounts.createExternalAccount(account.id, {
      external_account: token.id,
    });

    const afterAcc = await stripe.accounts.retrieve(account.id);

    console.log(afterAcc);

    user.stripeId = account.id;
    user.bankId = bank.id;
    user.bankAdded = true;
    await user.save();
    return res.json('Bank added');
  } catch (err) {
    console.log(err);
  }
};

const createMessage = async (req, res) => {
  const { name, email, body } = req.body;
  try {
    const message = new Message({
      email: email,
      name: name,
      message: body,
    });

    await message.save();

    return res.json('Submitted');
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
  sendPasswordReset,
  checkResetToken,
  resetPassword,
  twitterAuth,
  twitterLogin,
  twitterRegister,
  changePassword,
  addBankAccount,
  createMessage,
};
