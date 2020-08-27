const { EOL } = require('os');
const pLimit = require('p-limit');

const { DynamoDB, S3 } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region, bucket } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });
const s3 = new S3({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function processHistory(item) {
  return dynamodb
    .putItem({
      TableName: 'messages',
      Item: { ...generateDBObj(item), __appid: { S: uuid() } },
    })
    .promise();
}

exports.handler = async ({ bucket: Bucket, key, format }) => {
  const getObjectParams = {
    Key: `${key}.${format}`,
    Bucket,
  };

  const data = await s3.getObject(getObjectParams).promise();
  const payload = data.Body.toString('utf-8').split(EOL);
  const { messages } = JSON.parse(payload);

  await Promise.all(messages.map((message) => limit(() => processHistory(message))));
  const arns = await Promise.all(
    messages.map((message) =>
      limit(async () => {
        const buffer = Buffer.from(JSON.stringify(message));
        const Key = `${key}/${Date.now()}.${format}`;
        const putObjectParams = {
          Body: buffer,
          Bucket: bucket,
          Key,
        };
        console.log(putObjectParams);
        await s3.putObject(putObjectParams).promise();
        return { bucket, key: Key, arn: `arn:aws:s3:::${bucket}/${key}.${format}` };
      }),
    ),
  );

  return arns;
};
