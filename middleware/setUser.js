const jwt = require('jsonwebtoken');

//sets req.user with valid jwt token data
const setUser = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (user) {
        req.user = user;
        next();
      }
    });
  }
};

module.exports = setUser;
