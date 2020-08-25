const { EOL } = require('os');

const { S3, StepFunctions } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region, stateMachineArn } = require('config');

const s3 = new S3({ region, accessKeyId, secretAccessKey });
const stepfunctions = new StepFunctions({ region, accessKeyId, secretAccessKey });

exports.handler = async (event) => {
  const { Records: records } = event;
  const history = records.reduce(async (acc, curr) => {
    const { s3: s3Property } = curr;
    const {
      bucket: { name },
      object: { key },
    } = s3Property;

    const params = {
      Bucket: name,
      Key: key,
    };

    const data = await s3.getObject(params).promise();
    return [...acc, ...data.Body.toString('utf-8').split(EOL)];
  }, []);

  const params = {
    stateMachineArn,
    input: JSON.stringify({ history }),
    name: uuid(),
  };

  const r = await stepfunctions.startExecution(params).promise();
  console.log(r);
};
