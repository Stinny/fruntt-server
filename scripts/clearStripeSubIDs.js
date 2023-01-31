const User = require('../models/User');

const clearAllStripeSubIDs = async () => {
  console.log('started');
  try {
    const users = await User.find();

    // for (var x = 0; x < users.length; x++) {
    //   console.log(users[x]);
    // }
    console.log(users);
  } catch (err) {
    console.log(err);
  }
};

clearAllStripeSubIDs();
