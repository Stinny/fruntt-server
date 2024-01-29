const Product = require('../models/Product');

const updateCoverImages = async () => {
  const userIdToUpdate = '65b2d5073e30c22e3d1ba429';
  try {
    const updatedProduct = await Product.updateMany(
      { userId: userIdToUpdate }, // Specify the query condition
      {
        $set: {
          coverImages: [
            {
              key: '$coverImage.key', // Assuming coverImage has a key field
              url: '$coverImage.url', // Assuming coverImage has a url field
            },
          ],
        },
        $unset: { coverImage: '' }, // Remove the old coverImage field
      }
    );

    console.log('Updated!');
  } catch (err) {
    console.log(err);
  }
};

db.products.updateMany({ userId: '655dcbeab4c8ce17c2a148b3' }, [
  {
    $set: {
      coverImages: [
        {
          key: '$coverImage.key', // Assuming coverImage has a key field
          url: '$coverImage.url', // Assuming coverImage has a url field
        },
      ],
    },
  },
]);

updateCoverImages();
