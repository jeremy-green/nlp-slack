const pLimit = require('p-limit');
const fetch = require('node-fetch');

const { DynamoDB, Rekognition } = require('aws-sdk');

const { accessKeyId, secretAccessKey, region, botToken } = require('config');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });
const rekognition = new Rekognition({ region, accessKeyId, secretAccessKey });

const limit = pLimit(1);

function getImages(history) {
  return history.reduce((acc, curr) => {
    const { ts, files = [] } = JSON.parse(curr);
    if (files.length) {
      return [...acc, { ts, files }];
    }
    return [...acc];
  }, []);
}

exports.handler = ({ history }) => {
  console.log(history);
  getImages(history)
    .filter(({ filetype }) => ['png'].includes(filetype))
    .forEach(({ ts, files }) =>
      limit(async () => {
        const analyzedFiles = await Promise.all(
          files.map(async ({ url_private: urlPrivate }) => {
            const buffer = await fetch(urlPrivate, {
              headers: { Authorization: `Bearer ${botToken}` },
            }).then((res) => res.buffer());

            const params = {
              Image: {
                Bytes: buffer,
              },
            };

            return rekognition.detectLabels(params).promise();
          }),
        );

        const payload = {
          TableName: 'messages',
          Key: { ts: { S: ts } },
          UpdateExpression: 'SET #LABELS = :LABELS',
          ExpressionAttributeNames: { '#LABELS': 'LABELS' },
          ExpressionAttributeValues: {
            ':LABELS': { S: JSON.stringify(analyzedFiles) },
          },
        };

        return dynamodb.updateItem(payload).promise();
      }),
    );
};
