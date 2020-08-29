const path = require('path');

const { EOL } = require('os');

const tar = require('tar');

const { DynamoDB, S3, StepFunctions } = require('aws-sdk');
const { accessKeyId, secretAccessKey, region } = require('config');
const { generateDBObj } = require('@nlp-slack/helpers');

const dynamodb = new DynamoDB({ region, accessKeyId, secretAccessKey });
const s3 = new S3({ region, accessKeyId, secretAccessKey });
const stepFunctions = new StepFunctions({ region, accessKeyId, secretAccessKey });

async function getObjectAndParse(params) {
  return new Promise((resolve) => {
    s3.getObject(params)
      .createReadStream()
      .pipe(tar.t())
      .on('entry', (entry) => {
        let contents = '';
        entry
          .on('data', (data) => {
            contents += data;
          })
          .on('end', () =>
            resolve(
              contents
                .trim()
                .split(EOL)
                .map((item) => JSON.parse(item)),
            ),
          );
      });
  });
}

exports.handler = (event) => {
  const { Records: records } = event;
  records.forEach(async ({ s3: s3Property }) => {
    const {
      bucket: { name },
      object: { key },
    } = s3Property;

    const items = await getObjectAndParse({ Bucket: name, Key: key });

    const dynamoDBMap = items.reduce((acc, curr) => {
      const { File: file } = curr;
      const item = acc[file] ? acc[file] : [];
      item.push(curr);
      return { ...acc, [file]: item };
    }, {});

    await Promise.all(
      Object.entries(dynamoDBMap).map(([prop, val]) => {
        const extension = path.extname(prop);
        const ts = path.basename(prop, extension);

        const updateParams = {
          TableName: 'messages',
          Key: { ts: { S: ts } },
          UpdateExpression: 'SET #SENTIMENT = :SENTIMENT',
          ExpressionAttributeNames: { '#SENTIMENT': 'SENTIMENT' },
          ExpressionAttributeValues: {
            ':SENTIMENT': { L: generateDBObj(val) },
          },
        };

        return dynamodb.updateItem(updateParams).promise();
      }),
    );

    const { dir } = path.parse(key);
    const [prefix, range] = dir.split('/');
    const eventDetailsObject = await s3
      .getObject({
        Bucket: name,
        Key: `${prefix}/${range}/event-details.json`,
      })
      .promise();

    const eventDetails = JSON.parse(eventDetailsObject.Body.toString('utf-8'));
    const { taskToken } = eventDetails;
    return stepFunctions
      .sendTaskSuccess({
        output: JSON.stringify({ ok: 'usa' }),
        taskToken,
      })
      .promise();
  });
};
