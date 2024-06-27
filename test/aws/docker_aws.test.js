const request = require('supertest');
const express = require('express');
const router = require('./router'); // Assuming your router file is named router.js

// Mock AWS SDK
const AWS = require('aws-sdk-mock');

// Mock SSH2 Client
const { Client } = require('ssh2-promise');

jest.mock('ssh2-promise');

describe('EC2 Docker Installation Endpoints', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api', router);
    });

    afterEach(() => {
        AWS.restore();
        jest.clearAllMocks();
    });

    describe('POST /api/instance/:instanceId/docker', () => {
        it('should install Docker on the EC2 instance', async () => {
            const instanceId = 'instance-123';

            AWS.mock('EC2', 'describeInstances', Promise.resolve({
                Reservations: [{
                    Instances: [{
                        PublicIpAddress: '1.2.3.4',
                        KeyName: 'keyname'
                    }]
                }]
            }));

            Client.mockImplementation(() => ({
                on: jest.fn(),
                connect: jest.fn().mockResolvedValue(),
                exec: jest.fn().mockResolvedValueOnce(),
                end: jest.fn().mockResolvedValue()
            }));

            const response = await request(app).post(`/api/instance/${instanceId}/docker`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Docker installation completed successfully' });
        });

        it('should handle errors during Docker installation', async () => {
            const instanceId = 'instance-123';

            AWS.mock('EC2', 'describeInstances', Promise.reject('AWS error'));

            const response = await request(app).post(`/api/instance/${instanceId}/docker`);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error occurred during Docker installation' });
        });
    });

    describe('POST /api/instance/:instanceId/docker-compose', () => {
        it('should install Docker Compose on the EC2 instance', async () => {
            const instanceId = 'instance-123';

            AWS.mock('EC2', 'describeInstances', Promise.resolve({
                Reservations: [{
                    Instances: [{
                        PublicIpAddress: '1.2.3.4',
                        KeyName: 'keyname'
                    }]
                }]
            }));

            Client.mockImplementation(() => ({
                on: jest.fn(),
                connect: jest.fn().mockResolvedValue(),
                exec: jest.fn().mockResolvedValueOnce(),
                end: jest.fn().mockResolvedValue()
            }));

            const response = await request(app).post(`/api/instance/${instanceId}/docker-compose`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Docker Compose installation completed successfully' });
        });

        it('should handle errors during Docker Compose installation', async () => {
            const instanceId = 'instance-123';

            AWS.mock('EC2', 'describeInstances', Promise.reject('AWS error'));

            const response = await request(app).post(`/api/instance/${instanceId}/docker-compose`);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'An error occurred during Docker Compose installation' });
        });
    });
});
