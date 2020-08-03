const { EOL } = require('os');

const { S3 } = require('aws-sdk');

const { accessKeyId, secretAccessKey, region, prefix } = require('config');

const s3 = new S3({ region, accessKeyId, secretAccessKey });

exports.handler = event => {
  const { Records: records } = event;
  records.forEach(async ({ s3: s3Property }) => {
    const {
      bucket: { name },
      object: { key },
    } = s3Property;

    const params = {
      Bucket: name,
      Key: key,
    };

    const data = await s3.getObject(params).promise();

    const payload = data.Body.toString('utf-8').split(EOL);

    const allMessages = payload.reduce((acc, curr) => {
      const { messages } = JSON.parse(curr);
      const tmp = messages.map(message => JSON.stringify(message));
      return [...acc, ...tmp];
    }, []);

    const newKey = `${prefix}/${key.split('/')[1]}`;
    const buffer = Buffer.from(allMessages.join(EOL));

    try {
      const params = {
        Bucket: name,
        Key: newKey,
        Body: buffer,
        ContentType: 'text/plain',
      };

      await s3.putObject(params).promise();
    } catch (error) {
      console.log(error);
    }
  });

  return { statusCode: 204 };
};
