const pLimit = require('p-limit');

const { DynamoDB } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region } = require('config');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function processHistory(item) {
  const parsed = JSON.parse(item);
  const dynamicObj = Object.keys(parsed).reduce((acc, curr) => {
    acc[curr] = {
      S:
        typeof parsed[curr] === 'string'
          ? parsed[curr]
          : JSON.stringify(parsed[curr]),
    };

    return acc;
  }, {});

  return dynamodb
    .putItem({
      TableName: 'messages',
      Item: { ...dynamicObj, __appid: { S: uuid() } },
    })
    .promise();
}

exports.handler = async (event) => {
  const { history } = event;

  const allMessages = history
    .reduce((acc, curr) => {
      const { messages } = JSON.parse(curr);
      const tmp = messages.map((message) => JSON.stringify(message));
      return [...acc, ...tmp];
    }, [])
    .reverse();

  const input = allMessages.map((item) => limit(() => processHistory(item)));

  await Promise.all(input);

  return { history: allMessages };
};
