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

const sendReviewLinkEmail = async ({
  customerId,
  customerName,
  customerEmail,
  storeName,
  storeUrl,
  storeEmail,
}) => {
  await client.sendEmailWithTemplate({
    From: `${storeName}@fruntt.com`,
    To: customerEmail,
    ReplyTo: storeEmail,
    TemplateAlias: 'itemReview',
    TemplateModel: {
      customerName: customerName,
      storeUrl: storeUrl,
      storeName: storeName,
      customerId: customerId,
    },
  });
};

const sendOrderConfirmEmail = async ({
  customerEmail,
  customerName,
  orderId,
  storeEmail,
  storeName,
  orderItem,
  orderItemPrice,
  orderTotal,
  orderQty,
}) => {
  await client.sendEmailWithTemplate({
    From: `${storeName}@fruntt.com`,
    To: customerEmail,
    ReplyTo: storeEmail,
    TemplateAlias: 'orderConfirm',
    TemplateModel: {
      customerName: customerName,
      orderId: orderId,
      storeName: storeName,
      orderItem: orderItem,
      orderItemPrice: orderItemPrice,
      orderTotal: orderTotal,
      orderQty: orderQty,
    },
  });
};

const sendDigitalConfirmEmail = async ({
  customerEmail,
  customerName,
  orderId,
  storeEmail,
  storeName,
  orderItem,
  orderItemPrice,
  orderTotal,
  orderQty,
}) => {
  await client.sendEmailWithTemplate({
    From: `${storeName}@fruntt.com`,
    To: customerEmail,
    ReplyTo: storeEmail,
    TemplateAlias: 'digital-order-success',
    TemplateModel: {
      customerName: customerName,
      orderId: orderId,
      storeName: storeName,
      orderItem: orderItem,
      orderItemPrice: orderItemPrice,
      orderTotal: orderTotal,
      orderQty: orderQty,
    },
  });
};

const sendOrderFulfilledEmail = async ({
  customerEmail,
  customerName,
  storeName,
  storeEmail,
  orderId,
  trackingUrl,
}) => {
  await client.sendEmailWithTemplate({
    From: `${storeName}@fruntt.com`,
    To: customerEmail,
    ReplyTo: storeEmail,
    TemplateAlias: 'orderFulfilled',
    TemplateModel: {
      customerName: customerName,
      storeName: storeName,
      orderId: orderId,
      trackingUrl: trackingUrl,
    },
  });
};

module.exports = {
  sendSignupEmail,
  sendReviewLinkEmail,
  sendOrderConfirmEmail,
  sendOrderFulfilledEmail,
  sendDigitalConfirmEmail,
};
