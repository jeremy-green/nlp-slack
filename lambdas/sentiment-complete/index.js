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

    console.log(s3Property);

    const items = await getObjectAndParse({ Bucket: name, Key: key });

    console.log(items);

    const dynamoDBMap = items.reduce((acc, curr) => {
      const { File: file } = curr;
      const item = acc[file] ? acc[file] : [];
      item.push(curr);
      return { ...acc, [file]: item };
    }, {});

    console.log(dynamoDBMap);

    const dynamoDBResult = await Promise.all(
      Object.entries(dynamoDBMap).map(([prop, val]) => {
        console.log(prop);
        const extension = path.extname(prop);
        console.log(extension);
        const ts = path.basename(prop, extension);

        const updateParams = {
          TableName: 'messages',
          Key: { ts: { S: ts } },
          UpdateExpression: 'SET #SENTIMENT = :SENTIMENT',
          ExpressionAttributeNames: { '#SENTIMENT': 'SENTIMENT' },
          ExpressionAttributeValues: {
            ':SENTIMENT': { M: generateDBObj(val) },
          },
        };

        console.log(updateParams);
        return dynamodb.updateItem(updateParams).promise();
      }),
    );

    console.log(dynamoDBResult);

    const { dir } = path.parse(key);
    console.log(dir);
    const range = dir.split('/')[1];
    console.log(range);
    const eventDetailsObject = s3
      .getObject({
        Bucket: name,
        Key: `${range}/event-details.json`,
      })
      .promise();

    console.log(eventDetailsObject);
    const eventDetails = JSON.parse(eventDetailsObject.Body.toString('utf-8'));
    console.log(eventDetails);
    const { taskToken } = eventDetails;
    return stepFunctions
      .sendTaskSuccess({
        output: JSON.stringify({ ok: 'usa' }),
        taskToken,
      })
      .promise();
  });
};
