const { EOL } = require('os');
const pLimit = require('p-limit');

const { DynamoDB, S3 } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region, prefix, bucket, endpoint, tableName } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey, endpoint });
const s3 = new S3({ region, accessKeyId, secretAccessKey, endpoint, s3ForcePathStyle: true });

const limit = pLimit(1);

async function processHistory(item) {
  await new Promise((resolve) => setTimeout(() => resolve(), 500));
  return dynamodb
    .putItem({
      TableName: tableName,
      Item: { ...generateDBObj(item), __appid: { S: uuid() } },
    })
    .promise();
}

exports.handler = async (event) => {
  console.log(event);

  const { key, id } = event;
  const getObjectParams = {
    Key: key,
    Bucket: bucket,
  };

  const data = await s3.getObject(getObjectParams).promise();
  const payload = data.Body.toString('utf-8').split(EOL);
  const { messages } = JSON.parse(payload);

  await Promise.all(messages.map((message) => limit(() => processHistory(message))));
  const buffer = Buffer.from(JSON.stringify(messages));
  const newKey = `${prefix}/${id}/${uuid()}`;
  const putObjectParams = { Body: buffer, Bucket: bucket, Key: newKey };
  await s3.putObject(putObjectParams).promise();

  return { id, key: newKey };
};
