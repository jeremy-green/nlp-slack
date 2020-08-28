const { Comprehend, S3 } = require('aws-sdk');
const {
  accessKeyId,
  secretAccessKey,
  region,
  dataAccessRoleArn,
  prefix: outputPrefix,
  bucket: outputBucket,
} = require('config');

const comprehend = new Comprehend({ region, accessKeyId, secretAccessKey });
const s3 = new S3({ region, accessKeyId, secretAccessKey });
exports.handler = async (event) => {
  console.log(event);
  const { results, TaskToken: taskToken } = event;
  const {
    Payload: { bucket: inputBucket, range, prefix: inputPrefix },
  } = results.find((result) => result.Payload !== undefined);
  const params = {
    DataAccessRoleArn: dataAccessRoleArn,
    InputDataConfig: {
      S3Uri: `s3://${inputBucket}/${inputPrefix}/${range}`,
      InputFormat: 'ONE_DOC_PER_LINE',
    },
    LanguageCode: 'en',
    JobName: range,
    OutputDataConfig: {
      S3Uri: `s3://${outputBucket}/${outputPrefix}/${range}`,
    },
  };
  const result = await comprehend.startSentimentDetectionJob(params).promise();
  console.log(result);
  const s = await s3
    .putObject({
      Body: Buffer.from(JSON.stringify({ ...result, taskToken })),
      Bucket: outputBucket,
      Key: `${outputPrefix}/${range}/event-details.json`,
    })
    .promise();

  console.log(s);

  return result;
};
