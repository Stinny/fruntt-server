const Feedback = require('../models/Feedback');
const EmailSignup = require('../models/EmailSignup');

const createFeedback = async (req, res) => {
  const { content, type, allowContact } = req.body;

  console.log(req.body);

  try {
    const newFeedback = new Feedback({
      userId: req.user.id,
      content: content,
      type: type,
      allowContact: allowContact,
    });

    await newFeedback.save();
    return res.json('Feedback submitted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

const emailSignup = async (req, res) => {
  const { email } = req.body;

  try {
    const newSignup = new EmailSignup({
      email: email,
      signedUpOn: new Date(),
    });

    await newSignup.save();

    return res.json('Signed up');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = { createFeedback, emailSignup };
