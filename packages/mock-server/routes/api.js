const express = require('express');
const tar = require('tar');
const fs = require('fs');

const { S3 } = require('aws-sdk');

const router = express.Router();

const s3 = new S3({
  endpoint: 'http://localstack:4566',
  accessKeyId: 'foobar',
  secretAccessKey: 'foobar',
  region: 'us-east-1',
  s3ForcePathStyle: true,
});

function uploadS3() {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream('/tmp/output.tar.gz');
    writeStream.on('finish', async () => {
      const params = {
        Bucket: 'my-bucket',
        Key: 'sentiment-complete/uuidv4/output/output.tar.gz',
        Body: fs.readFileSync('/tmp/output.tar.gz'),
      };

      const result = await s3.upload(params).promise();
      resolve(result);
    });

    tar
      .create(
        {
          gzip: true,
        },
        ['./samples/output'],
      )
      .pipe(writeStream);
  });
}

router.post('/aws/comprehend', async (req, res, next) => {
  const { body, headers } = req;
  console.log(body, headers);

  res.json({ JobId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', JobStatus: 'SUBMITTED' });

  await new Promise((resolve) => setTimeout(() => resolve(), 3000));

  console.log('three seconds up...');

  await uploadS3();
});

let timesCalled = 0;
router.post('/conversations.history', async (req, res, next) => {
  const { body, headers } = req;
  console.log(body, headers);

  timesCalled += 1;
  console.log('TIMES CALLED:', timesCalled);
  const response = {
    ok: true,
    messages: [
      {
        type: 'message',
        user: 'U012AB3CDE',
        text: 'I find you punny and would like to smell your nose letter',
        ts: '1512085950.000216',
      },
      {
        type: 'message',
        user: 'U061F7AUR',
        text: 'What, you want to smell my shoes better?',
        ts: '1512104434.000490',
      },
    ],
    has_more: false,
    pin_count: 0,
    response_metadata: {},
  };

  if (timesCalled < 10) {
    response.has_more = true;
    response.response_metadata = {
      next_cursor: 'bmV4dF90czoxNTEyMDg1ODYxMDAwNTQz',
    };
  }

  res.json(response);
});

module.exports = router;
