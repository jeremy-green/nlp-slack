const { Comprehend } = require('aws-sdk');
const {
  accessKeyId,
  secretAccessKey,
  region,
  dataAccessRoleArn,
  prefix: outputPrefix,
  bucket: outputBucket,
} = require('config');

const comprehend = new Comprehend({ region, accessKeyId, secretAccessKey });
exports.handler = async ({ results }) => {
  const {
    Payload: { bucket: inputBucket, range, prefix: inputPrefix },
  } = results.find((result) => result.Payload.objects !== undefined);
  const params = {
    DataAccessRoleArn: dataAccessRoleArn,
    InputDataConfig: {
      S3Uri: `s3://${inputBucket}/${inputPrefix}/${range}`,
      InputFormat: 'ONE_DOC_PER_LINE',
    },
    LanguageCode: 'en',
    OutputDataConfig: {
      S3Uri: `s3://${outputBucket}/${outputPrefix}/${range}`,
    },
  };
  const result = await comprehend.startSentimentDetectionJob(params).promise();
  console.log(result);
  return result;
};
