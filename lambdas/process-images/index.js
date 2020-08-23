const pLimit = require('p-limit');
const fetch = require('node-fetch');

const { Rekognition } = require('aws-sdk');

const { accessKeyId, secretAccessKey, region, botToken } = require('config');

const rekognition = new Rekognition({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function getImages(history) {
  return history.reduce((acc, curr) => {
    const { files = [] } = JSON.parse(curr);
    if (files.length) {
      return [...acc, ...files];
    }
    return [...acc];
  }, []);
}

exports.handler = (event) => {
  const { history } = event;
  const images = getImages(history);
  images.map((image) =>
    limit(async () => {
      const { url_private: urlPrivate } = image;
      const buffer = await fetch(urlPrivate, {
        headers: { Authorization: `Bearer ${botToken}` },
      }).then((res) => res.buffer());

      const params = {
        Image: {
          Bytes: buffer,
        },
      };

      const response = rekognition.detectLabels(params).promise();
      console.log(response);
    }),
  );
};
