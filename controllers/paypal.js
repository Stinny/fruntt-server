//webhook for listening to account connections
//webhook for listening to succesful payments

//route for generating an auth url

//route for creating an order/payment

fetch('https://api-m.sandbox.paypal.com/v2/customer/partner-referrals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization:
      'Bearer access_token6V7rbVwmlM1gFZKW_8QtzWXqpcwQ6T5vhEGYNJDAAdn3paCgRpdeMdVYmWzgbKSsECednupJ3Zx5Xd-g',
  },
  body: JSON.stringify({
    operations: [{ operation: 'API_INTEGRATION' }],
    legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }],
    products: ['EXPRESS_CHECKOUT'],
  }),
});

const createReferal = async (req, res) => {
  const paypalApiUrl =
    'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals';

  const requestBody = {
    operations: [{ operation: 'API_INTEGRATION' }],
    legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }],
    products: ['EXPRESS_CHECKOUT'],
  };

  axios
    .post(paypalApiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
};
