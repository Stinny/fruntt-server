const Feedback = require('../models/Feedback');

const createFeedback = async (req, res) => {
  const { content, type } = req.body;

  try {
    const newFeedback = new Feedback({
      userId: req.user.id,
      content: content,
      type: type,
    });

    await newFeedback.save();
    return res.json('Feedback submitted');
  } catch (err) {
    return res.status(500).json('Server error');
  }
};

module.exports = { createFeedback };
