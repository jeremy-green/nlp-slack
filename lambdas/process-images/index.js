// const pLimit = require('p-limit');
const fetch = require('node-fetch');

const { DynamoDB, Rekognition } = require('aws-sdk');

const { accessKeyId, secretAccessKey, region, botToken } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });
const rekognition = new Rekognition({ region, accessKeyId, secretAccessKey });

// const limit = pLimit(1);

function getImages(history) {
  return history.reduce((acc, curr) => {
    const { ts, files = [] } = curr;
    if (files.length) {
      return [...acc, { ts, files }];
    }
    return [...acc];
  }, []);
}

exports.handler = async (event) => {
  const { history } = event;
  const r = await Promise.all(
    getImages(history).map(async ({ ts, files }) => {
      const analyzedFiles = await Promise.all(
        files
          .filter(({ filetype }) => {
            console.log(filetype, ['png', 'jpg', 'gif'].includes(filetype));
            return ['png', 'jpg', 'gif'].includes(filetype);
          })
          .map(async ({ url_private: urlPrivate }) => {
            console.log(urlPrivate);
            const buffer = await fetch(urlPrivate, {
              headers: { Authorization: `Bearer ${botToken}` },
            }).then((res) => res.buffer());

            const params = {
              Image: {
                Bytes: buffer,
              },
            };

            console.log(params);
            return rekognition.detectLabels(params).promise();
          }),
      );

      const payload = {
        TableName: 'messages',
        Key: { ts: { S: ts } },
        UpdateExpression: 'SET #LABELS = :LABELS',
        ExpressionAttributeNames: { '#LABELS': 'LABELS' },
        ExpressionAttributeValues: {
          ':LABELS': { M: generateDBObj(analyzedFiles) },
        },
      };

      return dynamodb.updateItem(payload).promise();
    }),
  );

  console.log('DONE', r);
  return { history };
};
