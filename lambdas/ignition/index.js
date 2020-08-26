const { S3, StepFunctions } = require('aws-sdk');
const { v4: uuid } = require('uuid');
const { accessKeyId, secretAccessKey, region, stateMachineArn } = require('config');

const s3 = new S3({ region, accessKeyId, secretAccessKey });
const stepfunctions = new StepFunctions({ region, accessKeyId, secretAccessKey });

exports.handler = async (event) => {
  const { Records: records } = event;
  const history = await Promise.all(
    records.map(async (record) => {
      const { s3: s3Property } = record;
      const {
        bucket: { name },
        object: { key },
      } = s3Property;

      const params = {
        Bucket: name,
        Key: key,
      };

      const data = await s3.getObject(params).promise();
      return data.Body.toString('utf-8');
    }),
  );

  const params = {
    stateMachineArn,
    input: JSON.stringify({ Payload: { history } }),
    name: uuid(),
  };

  return stepfunctions.startExecution(params).promise();
};
