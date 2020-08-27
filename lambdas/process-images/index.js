const fetch = require('node-fetch');

const { DynamoDB, Rekognition, S3 } = require('aws-sdk');
const { accessKeyId, secretAccessKey, region, botToken } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });
const rekognition = new Rekognition({ region, accessKeyId, secretAccessKey });
const s3 = new S3({ region, accessKeyId, secretAccessKey });

const SUPPORTED_IMAGES = ['png', 'jpg', 'gif'];

function getImages(messages) {
  return messages.reduce((acc, curr) => {
    const { ts, files = [] } = curr;
    if (files.length) {
      return [...acc, { ts, files }];
    }
    return [...acc];
  }, []);
}

async function processImages({ url_private: urlPrivate }) {
  const buffer = await fetch(urlPrivate, {
    headers: { Authorization: `Bearer ${botToken}` },
  }).then((res) => res.buffer());

  const params = {
    Image: {
      Bytes: buffer,
    },
  };

  await new Promise((resolve) => setTimeout(() => resolve(), 1000));
  return rekognition.detectLabels(params).promise();
}

async function handleImage({ ts, files }) {
  const analyzedFiles = await Promise.all(
    files.filter(({ filetype }) => SUPPORTED_IMAGES.includes(filetype)).map(processImages),
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
}

exports.handler = async ({ key, bucket }) => {
  const params = { Key: key, Bucket: bucket };
  const data = await s3.getObject(params).promise();
  const messages = JSON.parse(data.Body.toString('utf-8'));
  console.log(typeof messages);

  return Promise.all(getImages(messages).map(handleImage));
};
