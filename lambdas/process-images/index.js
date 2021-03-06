const fetch = require('node-fetch');
const pLimit = require('p-limit');

const { DynamoDB, Rekognition, S3 } = require('aws-sdk');
const { accessKeyId, secretAccessKey, region, botToken, endpoint, bucket } = require('config');
const { mapDBProps } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey, endpoint });
const rekognition = new Rekognition({ region, accessKeyId, secretAccessKey, endpoint });
const s3 = new S3({ region, accessKeyId, secretAccessKey, endpoint, s3ForcePathStyle: true });

const limit = pLimit(1);

const SUPPORTED_IMAGES = ['png', 'jpg'];
const AWS_MAX_IMAGE_SIZE = 5242880;

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
  console.log(files);
  const analyzedFiles = await Promise.all(
    files
      .filter(({ filetype }) => SUPPORTED_IMAGES.includes(filetype))
      .filter(({ size }) => size <= AWS_MAX_IMAGE_SIZE)
      .map(processImages),
  );

  const payload = {
    TableName: 'messages',
    Key: { ts: { S: ts } },
    UpdateExpression: 'SET #LABELS = :LABELS',
    ExpressionAttributeNames: { '#LABELS': 'LABELS' },
    ExpressionAttributeValues: {
      ':LABELS': mapDBProps(analyzedFiles),
    },
  };

  return dynamodb.updateItem(payload).promise();
}

exports.handler = async (event) => {
  console.log(event);
  const { key } = event;
  const params = { Key: key, Bucket: bucket };
  const data = await s3.getObject(params).promise();
  const messages = JSON.parse(data.Body.toString('utf-8'));
  await Promise.all(getImages(messages).map((message) => limit(() => handleImage(message))));
};
