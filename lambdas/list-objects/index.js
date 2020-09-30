const { S3 } = require('aws-sdk');

const { accessKeyId, secretAccessKey, region, prefix, bucket, endpoint } = require('config');

const s3 = new S3({ region, accessKeyId, secretAccessKey, endpoint, s3ForcePathStyle: true });

exports.handler = async (event) => {
  console.log(event);
  const { id } = event;
  const params = {
    Bucket: bucket,
    Prefix: `${prefix}/${id}`,
  };

  const { Contents: bucketContents } = await s3.listObjectsV2(params).promise();
  const contents = bucketContents.map(({ Key }) => Key);
  console.log('HERE', contents);
  return { contents, id };
};
