const AWS = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');

//function to create UUID to add to image key/name for uniqeness
const genUUID = () => {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
  return uuid;
};

const s3ForImages = new S3({
  accessKeyId: process.env.AWS_A_KEY,
  secretAccessKey: process.env.AWS_S_KEY,
  Bucket: process.env.AWS_IMAGES_BUCK_NAME,
});

const s3ForFiles = new S3({
  accessKeyId: process.env.AWS_A_KEY,
  secretAccessKey: process.env.AWS_S_KEY,
  Bucket: process.env.AWS_FILES_BUCK_NAME,
});

const uploadToS3 = (file) => {
  const key = genUUID() + file.originalname;

  const params = {
    Bucket: process.env.AWS_IMAGES_BUCK_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  };

  return s3ForImages.upload(params).promise();
};

const uploadFilesToS3 = (file) => {
  const key = genUUID() + file.originalname;

  const params = {
    Bucket: process.env.AWS_FILES_BUCK_NAME,
    Key: key,
    Body: file.buffer,
    ACL: 'public-read',
  };

  return s3ForFiles.upload(params).promise();
};

const deleteObjFromS3 = (key) => {
  const params = {
    Bucket: process.env.AWS_IMAGES_BUCK_NAME,
    Key: key,
  };

  return s3ForImages.deleteObject(params).promise();
};

const deleteFileleFromS3 = (key) => {
  const params = {
    Bucket: process.env.AWS_FILES_BUCK_NAME,
    Key: key,
  };

  return s3ForFiles.deleteObject(params).promise();
};

module.exports = {
  uploadToS3,
  uploadFilesToS3,
  deleteObjFromS3,
  deleteFileleFromS3,
};
