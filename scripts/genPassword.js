const bcrypt = require('bcryptjs');

const genPass = async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Notion24*&$', salt);

  console.log(hash);
};

genPass();
