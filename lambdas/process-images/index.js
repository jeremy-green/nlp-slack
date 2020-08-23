const pLimit = require('p-limit');
const fetch = require('node-fetch');

const { DynamoDB, Rekognition } = require('aws-sdk');

const { accessKeyId, secretAccessKey, region, botToken } = require('config');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });
const rekognition = new Rekognition({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function getImages(history) {
  return history.reduce((acc, curr) => {
    const { ts, files = [] } = JSON.parse(curr);

    return [...acc, { ts, files }];
  }, []);
}

exports.handler = (event) => {
  const { history } = event;
  const images = getImages(history);
  console.log(images);
  images.map((imageObj) =>
    limit(() => {
      const { ts, files } = imageObj;
      const analyzedFiles = files.map(async () => {
        const { url_private: urlPrivate } = files;
        const buffer = await fetch(urlPrivate, {
          headers: { Authorization: `Bearer ${botToken}` },
        }).then((res) => res.buffer());

        const params = {
          Image: {
            Bytes: buffer,
          },
        };

        return rekognition.detectLabels(params).promise();
      });

      console.log('HERE', analyzedFiles, ts);
      // const payload = {
      //   TableName: 'messages',
      //   Key: { ts: { S: ts } },
      //   UpdateExpression: 'SET #SENTIMENT = :SENTIMENT',
      //   ExpressionAttributeNames: { '#SENTIMENT': 'SENTIMENT' },
      //   ExpressionAttributeValues: {
      //     ':SENTIMENT': { S: JSON.stringify(resultList) },
      //   },
      // };

      console.log(dynamodb);
      // return dynamodb.updateItem(payload).promise();
    }),
  );
};
