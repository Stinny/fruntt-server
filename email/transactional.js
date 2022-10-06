var postmark = require('postmark');

var client = new postmark.ServerClient(process.env.POSTMARK_SERVER_KEY);

const sendSignupEmail = async (receiver, userId) => {
  await client.sendEmailWithTemplate({
    From: 'Fruntt info@fruntt.com',
    To: receiver,
    ReplyTo: 'justin@fruntt.com',
    TemplateAlias: 'confirmemail',
    TemplateModel: {
      userId: userId,
    },
  });
};

const sendReviewLinkEmail = async (
  customerName,
  customerEmail,
  storeName,
  storeUrl,
  storeEmail
) => {
  await client.sendEmailWithTemplate({
    From: storeUrl,
    To: customerEmail,
    ReplyTo: storeEmail,
    TemplateAlias: 'itemReview',
    TemplateModel: {
      customerName: customerName,
      storeUrl: storeUrl,
      storeName: storeName,
    },
  });
};

module.exports = { sendSignupEmail, sendReviewLinkEmail };
