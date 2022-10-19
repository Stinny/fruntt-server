const ShipEngine = require('shipengine');

const shipEngine = new ShipEngine(process.env.SHIP_KEY);

//generates a shipping label and other shipping details
const genShippingLabel = async ({
  rateId,
  // address,
  // city,
  // state,
  // zip,
  // weight,
  // weightUnit,
  // firstName,
  // lastName,
  // fromName,
  // fromAddress,
  // fromCity,
  // fromState,
  // fromZip,
  // fromPhone,
}) => {
  const params = {
    rateId: rateId,
    validateAddress: 'no_validation',
    labelLayout: '4x6',
    labelFormat: 'pdf',
    labelDownloadType: 'url',
    displayScheme: 'label',
  };

  try {
    const result = await shipEngine.createLabelFromRate(params);

    return {
      url: result.labelDownload.href,
      trackingNumber: result.trackingNumber,
      labelId: result.labelId,
      amount: result.shipmentCost.amount,
      error: false,
    };
  } catch (err) {
    console.log(err);
    return { url: '', trackingNumber: '', error: true };
  }
};

//validates a residential address
const validateResAddress = async ({ address, city, state, zip }) => {
  const params = [
    {
      addressLine1: address,
      cityLocality: city,
      stateProvince: state,
      postalCode: zip,
      countryCode: 'US',
      addressResidentialIndicator: 'yes',
    },
  ];

  try {
    const result = await shipEngine.validateAddresses(params);

    if (result[0].status === 'verified') {
      return 'Valid address';
    } else {
      return 'Invalid address';
    }
  } catch (e) {
    console.log('Error validating address: ', e.message);
    return 'Error';
  }
};

//validates a business address
const validateBusAddress = async ({ address, city, state, zip }) => {
  const params = [
    {
      addressLine1: address,
      cityLocality: city,
      stateProvince: state,
      postalCode: zip,
      countryCode: 'US',
      addressResidentialIndicator: 'no',
    },
  ];

  try {
    const result = await shipEngine.validateAddresses(params);

    if (result[0].status === 'verified') {
      return 'Valid address';
    } else if (result[0].status === 'error') {
      return 'Invalid address';
    }
  } catch (e) {
    console.log('Error validating address: ', e.message);
    return 'Invalid address';
  }
};

const trackOrderUsingNumber = async ({ carrierCode, trackingNumer }) => {
  try {
    const result = await shipEngine.trackUsingCarrierCodeAndTrackingNumber({
      carrierCode: carrierCode,
      trackingNumber: trackingNumer,
    });

    return result;
  } catch (e) {
    console.log('Error tracking shipment: ', e.message);
    return '';
  }
};

const getShippingRates = async ({
  address,
  country,
  city,
  state,
  zip,
  weight,
  unit,
  fromAddress,
  fromCity,
  fromCountry,
  fromState,
  fromZip,
}) => {
  const params = {
    rateOptions: {
      carrierIds: ['se-2654964'],
    },
    shipment: {
      validateAddress: 'no_validation',
      shipTo: {
        name: 'Amanda Miller',
        phone: '555-555-5555',
        addressLine1: address,
        cityLocality: city,
        stateProvince: state,
        postalCode: zip,
        countryCode: 'US',
        addressResidentialIndicator: 'yes',
      },
      shipFrom: {
        name: 'John Doe',
        phone: '111-111-1111',
        addressLine1: fromAddress,
        cityLocality: fromCity,
        stateProvince: fromState,
        postalCode: fromZip,
        countryCode: 'US',
        addressResidentialIndicator: 'no',
      },
      packages: [
        {
          weight: {
            value: weight,
            unit: unit,
          },
        },
      ],
    },
  };

  try {
    const result = await shipEngine.getRatesWithShipmentDetails(params);

    console.log(result);

    return result.rateResponse;
  } catch (e) {
    console.log('Error creating rates: ', e.message);
  }
};

module.exports = {
  genShippingLabel,
  validateResAddress,
  validateBusAddress,
  getShippingRates,
  trackOrderUsingNumber,
};
