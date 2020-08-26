const { EOL } = require('os');
const pLimit = require('p-limit');

const { DynamoDB, S3 } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region } = require('config');
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

exports.handler = async (event) => {
  console.log(event);

  // const data = await s3.getObject(params).promise();
  // const payload = data.Body.toString('utf-8').split(EOL);

  // /** nope... */
  // const { history } = event;
  // const { messages } = JSON.parse(history);

  // const input = messages.map((item) => limit(() => processHistory(item)));
  // await Promise.all(input);

  // return { history: messages, key };
};
