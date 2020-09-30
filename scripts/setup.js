const fs = require('fs');

const { join } = require('path');
const { promisify } = require('util');

const { Lambda, StepFunctions, S3, DynamoDB } = require('aws-sdk');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const endpoint = 'http://localhost:4566';
const region = 'us-east-1';
const accessKeyId = 'foobar';
const secretAccessKey = 'foobar';
const awsConfig = { endpoint, region, accessKeyId, secretAccessKey };
const bucket = 'my-bucket';
const tableName = 'my-table';

const lambda = new Lambda(awsConfig);
const stepfunctions = new StepFunctions(awsConfig);
const dynamodb = new DynamoDB(awsConfig);
const s3 = new S3({ ...awsConfig, s3ForcePathStyle: true });

const getEnvValue = (curr, name) => {
  const prefixMap = {
    'list-objects': 'channel-history',
    'get-sentiment': 'sentiment-complete',
  };

  const staticEnvConfigMap = {
    ACCESS_KEY_ID: accessKeyId,
    SECRET_ACCESS_KEY: secretAccessKey,
    AWS_REGION: region,
    S3_BUCKET: bucket,
    S3_PREFIX: prefixMap[name] || name,
    DATA_ACCESS_ROLEARN: 'arn:aws:iam::123456789012:role/data-access-role',
    BOT_TOKEN: 'xxxx-xxxxxxxxx-xxxx',
    SLACK_CHANNEL: 'C1234567890',
    FULL_HISTORY: 'true',
    SLACK_API_URL: 'http://node:3000/api/',
    AWS_ENDPOINT_URL: 'http://localstack:4566',
    DYNAMODB_TABLE_NAME: tableName,
    PROCESS_YEARS: '2020,2019,2018',
    PROCESS_ID: 'uuidv4',
    COMPREHEND_ENDPOINT_URL: 'http://node:3000/api/aws/comprehend',
  };

  return staticEnvConfigMap[curr];
};

async function createLambdaFunction(functionName, name) {
  const fileName = join(process.cwd(), `./tmp/${name}.zip`);

  try {
    const buffer = await readFile(fileName);

    let variables = {};
    try {
      const configuration = JSON.parse(await readFile(`./lambdas/${name}/config/custom-environment-variables.json`));
      variables = Object.values(configuration).reduce((acc, curr) => ({ ...acc, [curr]: getEnvValue(curr, name) }), {});

      console.log(variables);
    } catch {
      if (name === 'extract-sentences') {
        variables['S3_PREFIX'] = getEnvValue('S3_PREFIX', name);
        variables['S3_BUCKET'] = getEnvValue('S3_BUCKET', name);
        variables['AWS_ENDPOINT_URL'] = getEnvValue('AWS_ENDPOINT_URL', name);
      }
    }

    const params = {
      Code: {
        ZipFile: buffer,
      },
      Environment: {
        Variables: variables,
      },
      FunctionName: functionName,
      Handler: name !== 'extract-sentences' ? 'index.handler' : 'lambda_function.lambda_handler',
      Publish: true,
      Role: 'arn:aws:iam::123456789012:role/lambda-role',
      Runtime: name !== 'extract-sentences' ? 'nodejs12.x' : 'python3.7',
      MemorySize: 512,
      Timeout: 300,
    };

    return lambda.createFunction(params).promise();
  } catch (e) {
    console.log(`${fileName} does not exist`);
    return Promise.resolve();
  }
}

async function getLambdaFunction(functionName) {
  const params = { FunctionName: functionName };

  let exists;
  try {
    exists = await lambda.getFunction(params).promise();
  } catch {}
  return exists;
}

(async () => {
  const functions = await readdir('./lambdas');
  const functionNames = await Promise.all(
    functions.map(async (func) => {
      const { name, functionName } = JSON.parse(await readFile(`./lambdas/${func}/package.json`));
      const exists = await getLambdaFunction(functionName);
      if (exists) {
        return Promise.resolve(exists);
      }
      return createLambdaFunction(functionName, name.split('/')[1]);
    }),
  );

  console.log(functionNames);

  try {
    const definition = await readFile('./junk/Untitled-1.asl.json', 'utf-8');
    const params = {
      name: 'NLPStateMachine',
      roleArn: 'arn:aws:iam::123456789012:role/stepfunctions-role',
      definition,
    };
    const result = await stepfunctions.createStateMachine(params).promise();
    console.log(result);
  } catch {}

  const anotherResult = await s3.createBucket({ Bucket: bucket, ACL: 'public-read-write' }).promise();
  console.log(anotherResult);

  const notificationParams = {
    Bucket: bucket,
    NotificationConfiguration: {
      LambdaFunctionConfigurations: [
        {
          Events: ['s3:ObjectCreated:*'],
          LambdaFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:sentimentComplete',
          Filter: {
            Key: {
              FilterRules: [
                {
                  Name: 'prefix',
                  Value: 'sentiment-complete/',
                },
                {
                  Name: 'suffix',
                  Value: '.tar.gz',
                },
              ],
            },
          },
        },
      ],
    },
  };
  const yetAnotherResult = await s3.putBucketNotificationConfiguration(notificationParams).promise();

  console.log(yetAnotherResult);

  const whatever = await dynamodb
    .createTable({
      TableName: tableName,
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      AttributeDefinitions: [
        {
          AttributeName: 'ts',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'ts',
          KeyType: 'HASH',
        },
      ],
    })
    .promise();

  console.log(whatever);
})();
