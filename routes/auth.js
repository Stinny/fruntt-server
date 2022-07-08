const router = require('express').Router();
const auth = require('../controllers/auth');
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.post('/login', auth.login);
router.post('/register', auth.register);
router.get('/updateduser', isTokenValid, setUser, auth.updatedUser);
router.get('/refresh/:refreshTkn', auth.getNewAccessToken);
router.get('/onboard', isTokenValid, setUser, auth.getOnboardUrl);
router.post('/disconnectstripe', isTokenValid, setUser, auth.disconnectStripe);

module.exports = router;
