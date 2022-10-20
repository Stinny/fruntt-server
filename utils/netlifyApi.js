const axios = require('axios');

const baseUrl = 'https://api.netlify.com/api/v1';

const netlifyReq = axios.create({
  baseURL: baseUrl,
  headers: {
    Authorization: `Bearer ${process.env.NET_TOKEN}`,
  },
});

//gets deploy key from netlify API
const getDeployKey = async () => {
  const deployKey = await netlifyReq.post('/deploy_keys');

  return deployKey.data; //returns the whole data obj
};

//creates site using netlify API
const createSite = async (storeName, storeId) => {
  const deployKey = await getDeployKey();

  const body = {
    custom_domain: `${storeName}.fruntt.com`,
    repo: {
      id: '519604948', //github repo ID(need to be dynamic)
      installation_id: '24719337', //insallation ID of netlify on github(found in URL)
      provider: 'github',
      repo_path: 'Stinny/fruntt-storefront',
      repo_url: 'github.com/Stinny/fruntt-storefront',
      private: true,
      branch: 'master',
      cmd: 'CI= npm run build',
      stop_builds: false,
      dir: 'build',
      deploy_key_id: deployKey.id,
      env: {
        REACT_APP_STORE_ID: storeId,
        REACT_APP_API_URL: 'https://fruntt-server.herokuapp.com/api',
        REACT_APP_STORE_NAME: storeName,
      },
    },
  };

  const site = await netlifyReq.post('/sites', body); //request to netlify

  return site.data; //returning the response data
};

//creates site using netlify API
const updateSiteName = async ({ storeName, siteId }) => {
  const body = {
    custom_domain: `${storeName}.fruntt.com`,
  };

  const site = await netlifyReq.patch(`/sites/${siteId}`, body); //request to netlify

  return site.data; //returning the response data
};

module.exports = { createSite, updateSiteName };
