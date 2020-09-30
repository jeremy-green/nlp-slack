const { S3 } = require('aws-sdk');
const { WebClient } = require('@slack/web-api');
const { v4: uuid } = require('uuid');

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
  slackApiUrl,
} = require('config');

const botOptions = {
  ...(slackApiUrl ? { slackApiUrl } : {}),
};

const web = new WebClient(botToken, botOptions);
const s3 = new S3({ region, accessKeyId, secretAccessKey, endpoint, s3ForcePathStyle: true });

function saveHistory(path, content) {
  const key = `${prefix}/${path}/${uuid()}`;
  const buffer = Buffer.from(JSON.stringify(content));

  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'text/plain',
  };

  return s3.putObject(params).promise();
}

async function getHistory({ id, year, cursor }) {
  const d = new Date();

  if (fullHistory === 'true') {
    d.setFullYear(year);
    d.setMonth(0);
    d.setDate(1);
  }

  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);

  const oldest = d.getTime() / 1000;
  const latest = Date.now() / 1000;

  const opts = {
    limit: 100,
    inclusive: true,
    channel,
    latest,
    oldest,
    ...(cursor ? { cursor } : {}),
  };

  const history = await web.conversations.history(opts);
  await saveHistory(id, history);

  const { has_more: hasMore, response_metadata: responseMetadata } = history;
  const { next_cursor: nextCursor = null } = responseMetadata;

  return { year, id, hasMore, cursor: nextCursor };
}

exports.handler = (event) => getHistory(event);
