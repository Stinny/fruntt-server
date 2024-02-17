const axios = require('axios');

const clientId =
  'AYfOOQkEruKyvyKHExLyryvMQRDcyHWqEfZAcaqI14Y9N9Y92jcsBVUY4-EZQwstTyP7zsOIq7JMHAae';
const clientSecret =
  'EEFM5qVDYbtcXrWEtDUlU1ICpsWpVf7Tm-Wzjz75bsU4_FCeEXbDwNY6CdU0ETnB7YUwDfpSaCrpwrhz';

const paypalOAuthUrl = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

const auth = {
  username: clientId,
  password: clientSecret,
};

const data = 'grant_type=client_credentials';

const createToken = () => {
  axios
    .post(paypalOAuthUrl, data, {
      auth: auth,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((response) => {
      const accessToken = response.data.access_token;
      console.log(accessToken);
      // Use the access token for making requests to PayPal API
    })
    .catch((error) => {
      console.error('Error:', error.response.data);
    });
};

const createUrl = async () => {
  const paypalApiUrl =
    'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals';

  const requestBody = {
    operations: [
      {
        operation: 'API_INTEGRATION',
        api_integration_preference: {
          rest_api_integration: {
            integration_method: 'PAYPAL',
            integration_type: 'THIRD_PARTY',
            third_party_details: {
              features: ['PAYMENT', 'REFUND'],
            },
          },
        },
      },
    ],
    legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }],
    products: ['EXPRESS_CHECKOUT'],
    web_experience_preference: {
      return_url: 'https://fruntt.com/settings',
    },
  };

  axios
    .post(paypalApiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer {VAlID TOKEN GOES HERE}`,
      },
    })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log({ error: error.message });
    });
};

createUrl();
