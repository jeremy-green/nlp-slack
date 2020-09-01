const { dirname, join } = require('path');

process.env.S3_BUCKET = 'some-bucket';
process.env.S3_PREFIX = 'my-prefix';
process.env.NODE_CONFIG_DIR = join(dirname(__dirname), 'config');
