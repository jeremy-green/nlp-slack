const { S3 } = require('aws-sdk');
const { WebClient } = require('@slack/web-api');

const {
  botToken,
  region,
  accessKeyId,
  secretAccessKey,
  channel,
  bucket,
  prefix,
  endpoint,
  fullHistory,
} = require('config');

const botOptions = {};
const web = new WebClient(botToken, botOptions);
const s3 = new S3({ region, accessKeyId, secretAccessKey, endpoint });

const d = new Date();

// if (fullHistory === 'true') {
d.setFullYear(2020);
d.setMonth(6);
d.setDate(1);
// }

d.setHours(0);
d.setMinutes(0);
d.setSeconds(0);
d.setMilliseconds(0);

const oldest = d.getTime() / 1000;
const latest = Date.now() / 1000;

function saveMessages(content) {
  const key = `${prefix}/${Date.now()}.txt`;
  const buffer = Buffer.from(JSON.stringify(content));

  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'text/plain',
  };

  return s3.putObject(params).promise();
}

async function getMessages(cursor) {
  const opts = {
    limit: 100,
    inclusive: true,
    channel,
    latest,
    oldest,
    ...(cursor ? { cursor } : {}),
  };

  const history = await web.conversations.history(opts);

  await saveMessages(history);

  if (history.has_more) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await getMessages(history.response_metadata.next_cursor);
  }
}

exports.handler = () => getMessages();
