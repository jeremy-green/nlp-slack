const pLimit = require('p-limit');

const { DynamoDB } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region } = require('config');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function mapDBProps(input) {
  if (typeof input === 'boolean') {
    return { BOOL: input };
  }

  if (typeof input === 'string') {
    return { S: input };
  }

  if (typeof input === 'number') {
    return { N: input.toString() };
  }

  if (input instanceof Array) {
    const tmp = [];
    for (let i = 0; i < input.length; i += 1) {
      tmp.push(mapDBProps(input[i]));
    }
    return { L: tmp };
  }

  if (input instanceof Object) {
    const obj = {};
    Object.keys(input).forEach((key) => {
      obj[key] = mapDBProps(input[key]);
    });
    console.log(obj);

    return { M: obj };
  }

  return input;
}

function generateDBObj(input) {
  return Object.entries(input).reduce((acc, [key, val]) => ({ ...acc, [key]: mapDBProps(val) }), {});
}

function processHistory(item) {
  const parsed = JSON.parse(item);
  return dynamodb
    .putItem({
      TableName: 'messages',
      Item: { ...generateDBObj(parsed), __appid: { S: uuid() } },
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
