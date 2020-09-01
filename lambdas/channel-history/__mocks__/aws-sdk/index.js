const AWS = require('aws-sdk');

const putObject = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
    ServerSideEncryption: 'AES256',
    VersionId: 'Ri.vC6qVlA4dEnjgRV4ZHsHoFIjqEMNt',
  }),
});

AWS.S3 = jest.fn().mockImplementation(() => ({ putObject }));
module.exports = AWS;
