const CryptoJS = require('crypto-js');
const User = require('../models/User');

const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json('Invalid login');

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    );

    const origPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    if (origPassword !== req.body.password)
      return res.status(401).json('Invalid login');

    const accessToken = user.genAccessToken();
    const { password, ...otherInfo } = user._doc;

    return res.status(200).json({ accessToken, ...otherInfo });
  } catch (err) {
    res.status(500).json('Server error');
  }
  // const { email, password } = req.body;

  // const user = await User.find({ email: email }).limit(1);

  // if (user.length) {
  //   const hashedPassword = CryptoJS.AES.decrypt(
  //     user[0].password,
  //     process.env.PASS_SEC
  //   );

  //   const origPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

  //   if (origPassword !== password) return res.status(401).json('Invalid login');

  //   const accessToken = user[0].genAccessToken();

  //   return res.status(200).json(accessToken, ..);
  // } else {
  //   return res.status(500).json('Invalid login');
  // }
};

const register = async (req, res) => {
  const hash = CryptoJS.AES.encrypt(
    req.body.password,
    process.env.PASS_SEC
  ).toString();

  const newUser = new User({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.firstName,
    password: hash,
  });

  try {
    await newUser.save();
    res.status(200).json('New user created');
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = { login, register };
