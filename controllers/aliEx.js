const axios = require('axios');

const getProductFromAli = async (req, res) => {
  const productId = req.params.productId;
  const reviews = [];

  try {
    const itemOptions = {
      method: 'GET',
      url: 'https://aliexpress-datahub.p.rapidapi.com/item_detail',
      params: { itemId: productId },
      headers: {
        'X-RapidAPI-Key': 'f9cd164e29msh653a75d6bffa064p1cc9b4jsnb183546814e3',
        'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com',
      },
    };

    const reviewOptions = {
      method: 'GET',
      url: 'https://aliexpress-datahub.p.rapidapi.com/item_review',
      params: { itemId: productId, page: '1' },
      headers: {
        'X-RapidAPI-Key': 'f9cd164e29msh653a75d6bffa064p1cc9b4jsnb183546814e3',
        'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com',
      },
    };

    const productReq = await axios(itemOptions);
    const reviewsReq = await axios(reviewOptions);

    if (productReq?.data?.result?.status?.data === 'success')
      return res.json({
        success: true,
        product: productReq?.data?.result,
        reviews:
          reviewsReq?.data?.result?.status?.data === 'error'
            ? []
            : reviewsReq?.data?.result?.resultList,
        aliRating:
          reviewsReq?.data?.result?.status?.data === 'error'
            ? 0
            : reviewsReq?.data?.result?.base?.reviewStats?.evarageStar,
      });

    return res.json({ success: false, msg: 'Invalid Aliexpress product ID' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

module.exports = { getProductFromAli };
