const { EOL } = require('os');

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

if (fullHistory === 'true') {
  d.setFullYear(2020);
  d.setMonth(0);
  d.setDate(1);
}

d.setHours(0);
d.setMinutes(0);
d.setSeconds(0);
d.setMilliseconds(0);

const oldest = d.getTime() / 1000;
const latest = Date.now() / 1000;

const histories = [];
function saveMessages(content) {
  histories.push(JSON.stringify(content));
  return Promise.resolve();
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

exports.handler = async () => {
  await getMessages();

  const key = `${prefix}/${oldest}-${latest}`;

  const buffer = Buffer.from(histories.join(EOL));

  const params = {
    Bucket: bucket,
    Key: `${key}.txt`,
    Body: buffer,
    ContentType: 'text/plain',
  };

  await s3.putObject(params).promise();

  return { history: histories, key };
};
