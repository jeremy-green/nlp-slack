const { Comprehend, S3 } = require('aws-sdk');
const {
  accessKeyId,
  secretAccessKey,
  region,
  dataAccessRoleArn,
  endpoint,
  comprehendEndpoint,
  prefix: outputPrefix,
  bucket: outputBucket,
} = require('config');

const comprehend = new Comprehend({
  region,
  accessKeyId,
  secretAccessKey,
  endpoint: comprehendEndpoint,
});
const s3 = new S3({ region, accessKeyId, secretAccessKey, endpoint, s3ForcePathStyle: true });
exports.handler = async (event) => {
  console.log(event);
  const { TaskToken: taskToken, bucket: inputBucket, prefix: inputPrefix, id } = event;
  const params = {
    DataAccessRoleArn: dataAccessRoleArn,
    InputDataConfig: {
      S3Uri: `s3://${inputBucket}/${inputPrefix}/${id}`,
      InputFormat: 'ONE_DOC_PER_LINE',
    },
    LanguageCode: 'en',
    JobName: id,
    OutputDataConfig: {
      S3Uri: `s3://${outputBucket}/${outputPrefix}/${id}`,
    },
  };
  const result = await comprehend.startSentimentDetectionJob(params).promise();
  console.log(result);
  const s = await s3
    .putObject({
      Body: Buffer.from(JSON.stringify({ ...result, taskToken })),
      Bucket: outputBucket,
      Key: `${outputPrefix}/${id}/event-details.json`,
    })
    .promise();

  console.log(s);

  return result;
};
