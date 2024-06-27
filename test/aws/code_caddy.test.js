const request = require('supertest');
const app = require('../your-express-app'); 
const mockInstanceDetails = {
  InstanceId: 'i-1234567890abcdef0',
  PublicIpAddress: '1.2.3.4',
  KeyName: 'key.pem'
};

jest.mock('aws-sdk', () => {
  const mockEC2 = {
    describeInstances: jest.fn().mockImplementation((params, callback) => {
      if (params.InstanceIds.includes(mockInstanceDetails.InstanceId)) {
        callback(null, {
          Reservations: [{
            Instances: [mockInstanceDetails]
          }]
        });
      } else {
        callback(new Error('Instance not found'), null);
      }
    })
  };
  return {
    EC2: jest.fn(() => mockEC2)
  };
});

jest.mock('ssh2', () => ({
  Client: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    exec: jest.fn((command, options, callback) => {
      callback(null, { code: 0 });
    }),
    end: jest.fn()
  }))
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'mock-private-key')
}));

describe('Express routes', () => {
  describe('POST /instance/:instanceId/git-repo', () => {
    it('should clone Git repository onto EC2 instance', async () => {
      const gitRepo = 'https://github.com/example/repository.git';
      const res = await request(app)
        .post('/instance/i-1234567890abcdef0/git-repo')
        .send({ gitRepo });
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('code cloning completed successfully');
    });
  });

  describe('POST /instance/:instanceId/dockerfiles', () => {
    it('should generate necessary Docker files on EC2 instance', async () => {
      const language = 'nodejs';
      const res = await request(app)
        .post('/instance/i-1234567890abcdef0/dockerfiles')
        .send({ language });
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('files generated completed successfully');
    });
  });

  describe('POST /instance/:instanceId/startWebsite', () => {
    it('should start the website on EC2 instance', async () => {
      const res = await request(app)
        .post('/instance/i-1234567890abcdef0/startWebsite');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('started successfully');
    });
  });
});
