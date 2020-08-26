const pLimit = require('p-limit');

const { DynamoDB } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function processHistory(item) {
  return dynamodb
    .putItem({
      TableName: 'messages',
      Item: { ...generateDBObj(item), __appid: { S: uuid() } },
    })
    .promise();
}

exports.handler = async ({ history }) => {
  const { messages } = JSON.parse(history);
  const input = messages.map((item) => limit(() => processHistory(item)));
  await Promise.all(input);

  return { history: messages };
};
