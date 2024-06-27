const request = require('supertest');
const express = require('express');
const router = require('./router'); 
const AWS = require('aws-sdk-mock');

jest.mock('aws-sdk');

describe('EC2 Instance Management Endpoints', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api', router);
    });

    afterEach(() => {
        AWS.restore();
    });

    describe('POST /api/create-instance', () => {
        it('should create an EC2 instance and return its ID', async () => {
            const instanceName = 'TestInstance';
            const instanceId = 'i-1234567890abcdefg';

            AWS.mock('EC2', 'describeKeyPairs', (params, callback) => {
                callback(null, { KeyPairs: [{ KeyName: 'final_year_project1' }] });
            });

            AWS.mock('EC2', 'runInstances', (params, callback) => {
                callback(null, { Instances: [{ InstanceId: instanceId }] });
            });

            const response = await request(app)
                .post('/api/create-instance')
                .send({ instance_name: instanceName });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ instanceId: instanceId });
        });

        it('should handle errors during instance creation', async () => {
            const instanceName = 'TestInstance';

            AWS.mock('EC2', 'describeKeyPairs', (params, callback) => {
                callback(null, { KeyPairs: [] }); // Key pair does not exist
            });

            const response = await request(app)
                .post('/api/create-instance')
                .send({ instance_name: instanceName });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });
    });

    describe('GET /api/instance/:instanceId', () => {
        it('should retrieve information about an EC2 instance', async () => {
            const instanceId = 'i-1234567890abcdefg';

            AWS.mock('EC2', 'describeInstances', (params, callback) => {
                callback(null, {
                    Reservations: [{
                        Instances: [{
                            InstanceId: instanceId,
                            InstanceType: 't2.micro',
                            PublicIpAddress: '1.2.3.4',
                            PrivateIpAddress: '10.0.0.1',
                            State: { Name: 'running' },
                            PublicDnsName: 'ec2-1-2-3-4.compute-1.amazonaws.com'
                        }]
                    }]
                });
            });

            const response = await request(app).get(`/api/instance/${instanceId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                instanceId: instanceId,
                instanceType: 't2.micro',
                publicIp: '1.2.3.4',
                privateIp: '10.0.0.1',
                state: 'running',
                publicDns: 'ec2-1-2-3-4.compute-1.amazonaws.com'
            });
        });

        it('should handle errors when instance is not found', async () => {
            const instanceId = 'i-nonexistent';

            AWS.mock('EC2', 'describeInstances', (params, callback) => {
                callback(null, { Reservations: [] }); // Empty reservations array indicates instance not found
            });

            const response = await request(app).get(`/api/instance/${instanceId}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Instance not found' });
        });

        it('should handle errors during instance retrieval', async () => {
            const instanceId = 'i-1234567890abcdefg';

            AWS.mock('EC2', 'describeInstances', (params, callback) => {
                callback(new Error('Failed to describe instances'), null);
            });

            const response = await request(app).get(`/api/instance/${instanceId}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Internal server error' });
        });
    });
});
