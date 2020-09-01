const { WebClient } = require('@slack/web-api');
const { handler } = require('../index');

describe('channel-history', () => {
  // https://api.slack.com/methods/conversations.history#response
  const clientMockResponse = {
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
    pin_count: 0,
  };

  beforeAll(() => {});
  beforeEach(() => {});
  afterEach(() => {});
  afterAll(() => jest.resetModules());

  it('should resolve with an object', async () => {
    const client = WebClient.mock.instances[0];
    client.conversations.history.mockResolvedValue(clientMockResponse);

    const response = await handler();
    expect(response).toHaveProperty('objects');
    // https://github.com/facebook/jest/issues/3457#issuecomment-299043100
    expect(Array.isArray(response.objects)).toBe(true);
    expect(response.objects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bucket: 'some-bucket' }),
        expect.objectContaining({ format: 'txt' }),
        expect.objectContaining({ range: expect.any(String) }),
        expect.objectContaining({ key: expect.any(String) }),
      ]),
    );
  });

  it('should run twice then resolve with an object', async () => {
    const client = WebClient.mock.instances[0];
    client.conversations.history
      .mockResolvedValueOnce({
        ...clientMockResponse,
        has_more: true,
        response_metadata: { next_cursor: 'dXNlcjpVMDYxTkZUVDI=' },
      })
      .mockResolvedValue(clientMockResponse);

    const response = await handler();
    expect(response).toHaveProperty('objects');
    // https://github.com/facebook/jest/issues/3457#issuecomment-299043100
    expect(Array.isArray(response.objects)).toBe(true);
  });
});
