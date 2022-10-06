const ShipEngine = require('shipengine');

const shipEngine = new ShipEngine(process.env.SHIP_KEY);

const genShippingLabel = async ({
  address,
  city,
  state,
  zip,
  weight,
  weightUnit,
  height,
  width,
  length,
  firstName,
  lastName,
  fromName,
  fromAddress,
  fromCity,
  fromState,
  fromZip,
}) => {
  console.log(fromZip, zip);
  const params = {
    shipment: {
      serviceCode: 'ups_ground',
      shipTo: {
        name: `${firstName} ${lastName}`,
        addressLine1: address,
        cityLocality: city,
        stateProvince: state,
        postalCode: zip,
        countryCode: 'US',
        addressResidentialIndicator: 'yes',
      },
      shipFrom: {
        name: fromName,
        companyName: fromName,
        phone: '555-555-5555',
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
            unit: weightUnit,
          },
          // dimensions: {
          //   height: height,
          //   width: width,
          //   length: length,
          //   unit: 'inch',
          // },
        },
      ],
    },
  };

  try {
    const result = await shipEngine.createLabelFromShipmentDetails(params);

    console.log(result);

    return {
      url: result.labelDownload.href,
      trackingNumber: result.trackingNumber,
      error: false,
    };
  } catch (err) {
    console.log(err);
    return { url: '', trackingNumber: '', error: true };
  }
};

module.exports = { genShippingLabel };
