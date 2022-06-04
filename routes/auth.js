const router = require('express').Router();
const auth = require('../controllers/auth');

router.post('/login', auth.login);
router.post('/register', auth.register);
router.get('/updateduser', auth.updatedUser);

module.exports = router;
