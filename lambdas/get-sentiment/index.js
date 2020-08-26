const pLimit = require('p-limit');

const { Comprehend, DynamoDB } = require('aws-sdk');
const { accessKeyId, secretAccessKey, region = 'us-east-1' } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const comprehend = new Comprehend({ region, accessKeyId, secretAccessKey });
const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });

const limit = pLimit(1);

async function processHistory(item) {
  console.log('HERE');
  const { ts, sentences } = item;
  const params = {
    LanguageCode: 'en',
    TextList: [...sentences, ...(sentences.length > 1 ? [sentences.join(' ')] : [])],
  };

  const { ResultList: resultList } = await comprehend.batchDetectSentiment(params).promise();

  const payload = {
    TableName: 'messages',
    Key: { ts: { S: ts } },
    UpdateExpression: 'SET #SENTIMENT = :SENTIMENT',
    ExpressionAttributeNames: { '#SENTIMENT': 'SENTIMENT' },
    ExpressionAttributeValues: {
      ':SENTIMENT': { M: generateDBObj(resultList) },
    },
  };

  return dynamodb.updateItem(payload).promise();
}

exports.handler = ({ history }) => Promise.all(history.map((item) => limit(() => processHistory(item))));
