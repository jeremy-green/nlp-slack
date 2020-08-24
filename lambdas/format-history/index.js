const pLimit = require('p-limit');

const { DynamoDB } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region } = require('config');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });

const limit = pLimit(10);

function mapDynamoDBProps(input) {
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
      tmp.push(mapDynamoDBProps(input[i]));
    }
    return { L: tmp };
  }

  if (input instanceof Object) {
    return Object.entries(input).reduce((acc, curr) => {
      const [key, val] = curr;
      acc[key] = mapDynamoDBProps(val);
      return { M: { ...acc } };
    }, {});
  }

  return input;
}

function processHistory(item) {
  const parsed = JSON.parse(item);
  const dynamicObj = Object.keys(parsed).reduce((acc, curr) => {
    acc[curr] = {
      S: typeof parsed[curr] === 'string' ? parsed[curr] : JSON.stringify(parsed[curr]),
    };

    return acc;
  }, {});

  console.log(JSON.stringify(mapDynamoDBProps(dynamicObj), null, 2));

  return dynamodb
    .putItem({
      TableName: 'messages',
      Item: { ...mapDynamoDBProps(dynamicObj), __appid: { S: uuid() } },
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
