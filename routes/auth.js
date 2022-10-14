const router = require('express').Router();
const auth = require('../controllers/auth');
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.post('/login', auth.login);
router.post('/register', auth.register);
router.get('/updateduser', isTokenValid, setUser, auth.updatedUser);
router.get('/refresh/:refreshTkn', auth.getNewAccessToken);
router.get('/onboard', isTokenValid, setUser, auth.getOnboardUrl);
router.get('/getsetupintent', isTokenValid, setUser, auth.getSetupIntent);
router.post('/disconnectstripe', isTokenValid, setUser, auth.disconnectStripe);
router.post(
  '/updateaccountinfo',
  isTokenValid,
  setUser,
  auth.updateAccountInfo
);
router.post(
  '/updatebusinessinfo',
  isTokenValid,
  setUser,
  auth.updateBusinessInfo
);
router.post(
  '/updatenotifications',
  isTokenValid,
  setUser,
  auth.updateNotifications
);
router.post('/confirmemail', isTokenValid, setUser, auth.confirmEmail);

router.post('/addpayment', isTokenValid, setUser, auth.addPaymentMethod);
router.post('/deletepayment', isTokenValid, setUser, auth.deletePaymentMethod);

module.exports = router;
