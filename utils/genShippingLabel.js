const ShipEngine = require('shipengine');

const shipEngine = new ShipEngine(process.env.SHIP_KEY);

const genShippingLabel = async ({
  address,
  city,
  state,
  zip,
  country,
  weightUnit,
  sizeUnit,
  weight,
  height,
  width,
  length,
  firstName,
  lastName,
}) => {
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
        name: 'John Doe',
        companyName: 'Example Corp',
        phone: '555-555-5555',
        addressLine1: '4009 Marathon Blvd',
        cityLocality: 'Austin',
        stateProvince: 'TX',
        postalCode: '78756',
        countryCode: 'US',
        addressResidentialIndicator: 'no',
      },
      packages: [
        {
          weight: {
            value: weight,
            unit: 'ounce',
          },
          dimensions: {
            height: height,
            width: width,
            length: length,
            unit: 'inch',
          },
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
    };
  } catch (err) {
    return '';
  }
};

module.exports = { genShippingLabel };
