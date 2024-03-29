const router = require('express').Router();
const auth = require('../controllers/auth');
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.post('/login', auth.login);
router.post('/register', auth.register);
router.get('/updateduser', isTokenValid, setUser, auth.updatedUser);
router.post('/submit/message', auth.createMessage);
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
  '/updatenotifications',
  isTokenValid,
  setUser,
  auth.updateNotifications
);
router.post(
  '/updatesellerprofile',
  isTokenValid,
  setUser,
  auth.updateSellerProfile
);
router.post('/confirmemail', isTokenValid, setUser, auth.confirmEmail);

router.post('/addpayment', isTokenValid, setUser, auth.addPaymentMethod);
router.post('/deletepayment', isTokenValid, setUser, auth.deletePaymentMethod);
router.post('/deleteaccount', isTokenValid, setUser, auth.deleteAccount);

router.post('/sendresetemail', auth.sendPasswordReset);
router.post('/checkresettoken', auth.checkResetToken);
router.post('/resetpassword', auth.resetPassword);
router.post('/password/change', isTokenValid, setUser, auth.changePassword);
router.get('/twitter/:type', auth.twitterAuth);
router.post('/twitter/login', auth.twitterLogin);
router.post('/twitter/register', auth.twitterRegister);
router.post('/add/bank', isTokenValid, setUser, auth.addBankAccount);

module.exports = router;
