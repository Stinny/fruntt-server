const router = require('express').Router();
const feedback = require('../controllers/feedback');
const isTokenValid = require('../middleware/verifyToken');
const setUser = require('../middleware/setUser');

router.post('/add', isTokenValid, setUser, feedback.createFeedback);

router.post('/emailsignup', feedback.emailSignup);

module.exports = router;
