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
  createEnv,
  updateEnv,
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
        name: storeOwner.name,
        bio: storeOwner.sellerProfile.bio,
        instagram: storeOwner.sellerProfile.instagram,
        facebook: storeOwner.sellerProfile.facebook,
        youtube: storeOwner.sellerProfile.youtube,
        twitter: storeOwner.sellerProfile.twitter,
        linkedin: storeOwner.sellerProfile.linkedin,
        tikok: storeOwner.sellerProfile.tiktok,
        link: storeOwner.sellerProfile.link,
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

const changeName = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const storefrontToEdit = await Storefront.findById(storeId);
    const storesWithSameName = await Storefront.find({ name: req.body.name });

    if (storesWithSameName.length) return res.json({ msg: 'Name in use' });

    storefrontToEdit.name = req.body.name;
    storefrontToEdit.url = `https://${req.body.name}.fruntt.com`;

    await updateSiteName({
      siteId: storefrontToEdit?.siteId,
      storeName: req.body.name,
    });

    await updateEnv({
      siteId: storefrontToEdit?.siteId,
      storeName: req.body.name,
    });

    await storefrontToEdit.save();
    return res.json({ msg: 'Name changed' });
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

const hideSections = async (req, res) => {
  const { hideDescription, hideQuestions, hideReviews, storeId } = req.body;

  try {
    const storefront = await Storefront.findById(storeId);

    storefront.hideDescription = hideDescription;
    storefront.hideReviews = hideReviews;
    storefront.hideQuestions = hideQuestions;

    await storefront.save();

    return res.json('Sections updated');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const getStoreStatsss = async (req, res) => {
  let revenue = 0;
  let numOfOrders = 0;
  let numOfUnfulfilledOrders = 0;

  try {
    const orders = await Order.find({
      storeId: req.params.storeId,
      paid: true,
    });
    const storefront = await Storefront.findById(req.params.storeId);
    const product = await Product.find({ storeId: req.params.storeId });
    const visits = await Visit.find({ storeId: req.params.storeId });

    for (var x = 0; x < orders.length; x++) {
      numOfOrders += 1;
    }

    // Get an array of dates for the past 7 days in reverse order
    const currentDate = new Date();
    const pastWeekDates = [];
    for (let i = 6; i >= 0; i--) {
      const pastDate = new Date();
      pastDate.setDate(currentDate.getDate() - i);
      pastWeekDates.push(pastDate);
    }

    const dates = [];
    const totals = [];

    // Loop through the dates and gather the totals
    pastWeekDates.forEach((date) => {
      const dateString = date.toDateString();
      dates.push(dateString);
      totals.push(0);
    });

    const pastOrders = await Order.find({
      placedOn: { $gte: pastWeekDates[0] },
    });

    for (var z = 0; z < pastOrders.length; z++) {
      const dateString = pastOrders[z].placedOn.toISOString().split('T')[0];
      const index = dates.indexOf(dateString);
      if (index !== -1) {
        totals[index] += pastOrders[z].total;
      }
    }

    console.log(dates, totals);

    // //place orders in groups by dates
    // var ordersByDate = {};
    // orders.forEach(function (order) {
    //   var date = order.placedOn.toDateString();
    //   if (!ordersByDate[date]) {
    //     ordersByDate[date] = [];
    //   }
    //   ordersByDate[date].push(order);
    // });

    // var dates = [];
    // var totals = [];
    // for (var date in ordersByDate) {
    //   dates.push(date);
    //   var total = ordersByDate[date].reduce(function (sum, order) {
    //     return sum + order.total;
    //   }, 0);
    //   totals.push(total);
    // }

    return res.json({
      revenue: revenue,
      numOfOrders: numOfOrders,
      numOfUnfulfilledOrders: numOfUnfulfilledOrders,
      visits: visits.length,
      conversion: (numOfOrders / visits.length) * 100,
      itemStock: product.length ? product[0].stock : 0,
      dataSet: {
        dates: dates,
        totals: totals,
      },
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

    const storefront = new Storefront({
      userId: req.user.id,
      name: pageName,
    });

    const deployStore = await createSite(pageName, storefront._id);
    console.log(deployStore);
    const createEnvs = await createEnv({
      storeName: pageName,
      storeId: storefront._id,
      siteId: deployStore.id,
    });

    storefront.url = deployStore.url;
    storefront.siteId = deployStore.id;

    await storefront.save();

    const stores = await Storefront.find({ userId: req.user.id });
    let storeIds = [];
    for (var i = 0; i < stores.length; i++) {
      storeIds.push({ id: stores[i]._id, url: stores[i].url });
    }

    return res.json({
      msg: 'Page added',
      storefront: storefront,
      storeIds: storeIds,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

//deletes storefront doc and product docs and returns updated array of stores
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

//gets the stats for past seven days
const getStoreStats = async (req, res) => {
  const view = req.params.view;
  let revenue = 0;
  let numOfOrders = 0;

  const dates = [];
  const totals = [];

  try {
    switch (view) {
      case 'today':
        // Get the current date
        const todaysDate = new Date();
        // Set the start and end of the day
        const startOfDay = new Date(
          todaysDate.getFullYear(),
          todaysDate.getMonth(),
          todaysDate.getDate()
        );
        const endOfDay = new Date(
          todaysDate.getFullYear(),
          todaysDate.getMonth(),
          todaysDate.getDate() + 1
        );

        //get visits for today
        const todaysVisits = await Visit.find({
          storeId: req.params.storeId,
          visitedOn: { $gte: startOfDay, $lt: endOfDay },
        });

        // Query orders for the current day
        const todaysOrders = await Order.find({
          placedOn: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
          paid: true,
          storeId: req.params.storeId,
        });

        for (var j = 0; j < todaysOrders.length; j++) {
          revenue += todaysOrders[j].total;
          numOfOrders++;
        }

        dates.push(todaysDate.toDateString());
        totals.push(revenue);

        return res.json({
          revenue: revenue,
          numOfOrders: numOfOrders,

          visits: todaysVisits.length,
          conversion: (numOfOrders / todaysVisits.length) * 100,

          dataSet: {
            dates: dates,
            totals: totals,
          },
        });

      case 'seven':
        //get orders for the past 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        //get visits for past 7 days
        const visits = await Visit.find({
          storeId: req.params.storeId,
          visitedOn: { $gte: sevenDaysAgo },
        });

        //calculate revenue and num of orders
        const pastOrders = await Order.find({
          storeId: req.params.storeId,
          placedOn: { $gte: sevenDaysAgo },
          paid: true,
        });
        for (var x = 0; x < pastOrders.length; x++) {
          revenue += pastOrders[x].total;
          numOfOrders++;
        }

        // Get an array of dates for the past 7 days in reverse order
        const currentDate = new Date();
        const pastWeekDates = [];
        for (let i = 6; i >= 0; i--) {
          const pastDate = new Date();
          pastDate.setDate(currentDate.getDate() - i);
          pastWeekDates.push(pastDate);
        }

        // Loop through the dates and gather the totals
        pastWeekDates.forEach((date) => {
          const dateString = date.toDateString();
          dates.push(dateString);
          totals.push(0);
        });

        const ordersForTotals = await Order.find({
          storeId: req.params.storeId,
          placedOn: { $gte: pastWeekDates[0] },
          paid: true,
        });

        for (var z = 0; z < ordersForTotals.length; z++) {
          const dateString = ordersForTotals[z].placedOn
            .toISOString()
            .split('T')[0];
          const index = dates.indexOf(dateString);
          if (index !== -1) {
            totals[index] += ordersForTotals[z].total;
          }
        }
        return res.json({
          revenue: revenue,
          numOfOrders: numOfOrders,

          visits: visits.length,
          conversion: (numOfOrders / visits.length) * 100,

          dataSet: {
            dates: dates,
            totals: totals,
          },
        });
      case 'thirty':
        //get orders for the past 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        //get visits for past 30 days
        const visitsPast30 = await Visit.find({
          storeId: req.params.storeId,
          visitedOn: { $gte: thirtyDaysAgo },
        });

        //calculate revenue and num of orders
        const past30Orders = await Order.find({
          placedOn: { $gte: thirtyDaysAgo },
          storeId: req.params.storeId,
        });
        for (var x = 0; x < past30Orders.length; x++) {
          revenue += past30Orders[x].total;
          numOfOrders++;
        }

        // Get an array of dates for the past 30 days in reverse order
        const dateNow = new Date();
        const past30Dates = [];
        for (let i = 29; i >= 0; i--) {
          const pastDate = new Date();
          pastDate.setDate(dateNow.getDate() - i);
          past30Dates.push(pastDate);
        }

        // Loop through the dates and gather the totals
        past30Dates.forEach((date) => {
          const dateString = date.toDateString();
          dates.push(dateString);
          totals.push(0);
        });

        const ordersFor30Totals = await Order.find({
          storeId: req.params.storeId,
          placedOn: { $gte: past30Dates[0] },
          paid: true,
        });

        for (var z = 0; z < ordersFor30Totals.length; z++) {
          const dateString = ordersFor30Totals[z].placedOn
            .toISOString()
            .split('T')[0];
          const index = dates.indexOf(dateString);
          if (index !== -1) {
            totals[index] += ordersFor30Totals[z].total;
          }
        }
        return res.json({
          revenue: revenue,
          numOfOrders: numOfOrders,

          visits: visitsPast30.length,
          conversion: (numOfOrders / visitsPast30.length) * 100,

          dataSet: {
            dates: dates,
            totals: totals,
          },
        });
      case 'all':
        //get visits for today
        const allVisits = await Visit.find({
          storeId: req.params.storeId,
        });

        const allOrders = await Order.find({
          storeId: req.params.storeId,
          paid: true,
        });

        for (var w = 0; w < allOrders.length; w++) {
          revenue += allOrders[w].total;
          numOfOrders++;
        }

        // 6. Group the orders by the date they were placed.
        var ordersByDate = {};
        allOrders.forEach(function (order) {
          console.log(order.total);
          var date = order.placedOn.toDateString();
          if (!ordersByDate[date]) {
            ordersByDate[date] = [];
          }
          ordersByDate[date].push(order);
        });

        // 7. For each date group, calculate the total order amount.

        for (var date in ordersByDate) {
          dates.push(date);
          var total = ordersByDate[date].reduce(function (sum, order) {
            return sum + order.total;
          }, 0);
          totals.push(total);
        }

        return res.json({
          revenue: revenue,
          numOfOrders: numOfOrders,
          visits: allVisits.length,
          conversion: (numOfOrders / allVisits.length) * 100,
          dataSet: {
            dates: dates,
            totals: totals,
          },
        });
      default:
        return;
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json('Server error');
  }
};

module.exports = {
  getStorefront,
  getStorefrontById,
  editStyles,
  changeName,
  deleteLogo,
  addSocialLinks,
  addVisit,
  getStoreStats,
  addStorefront,
  deleteStore,
  hideSections,
};
