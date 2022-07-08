const jwt = require('jsonwebtoken');

const isTokenValid = (req, res, next) => {
  const authHeader = req.header('Authorization'); //pulls out auth header
  const token = authHeader && authHeader.split(' ')[1]; //parses 'bearer' from header value

  if (!token) return res.status(401).json('Access denied');

  jwt.verify(token, process.env.JWT_SEC, (err, user) => {
    if (err) return res.status(403).send('Access denied');
    next();
  });
};

module.exports = isTokenValid;
