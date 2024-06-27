const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = require('./router'); // Assuming your router file is named router.js
const request = require('supertest');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(router);

describe('GET /allrepos', () => {
    it('responds with JSON containing repositories', async () => {
        const response = await request(app).get('/allrepos');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: expect.any(String),
                clone_url: expect.any(String)
            })
        ]));
    });
});

describe('GET /getrepos/details', () => {
    it('responds with JSON containing repository details', async () => {
        const response = await request(app).get('/getrepos/details').send({ username: 'venki200221' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: expect.any(String),
                url: expect.any(String),
                branches: expect.any(String),
                visibility: expect.stringMatching(/^(private|public)$/),
            })
        ]));
    });
});

describe('GET /getCloneUrlAndBranches', () => {
    it('responds with JSON containing clone URL and branch details', async () => {
        const response = await request(app).get('/getCloneUrlAndBranches').send({ repoName: 'owner/repo' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            cloneUrl: expect.any(String),
            branchNames: expect.arrayContaining([
                expect.any(String)
            ]),
            branchCloneUrls: expect.arrayContaining([
                expect.objectContaining({
                    branch: expect.any(String),
                    cloneUrl: expect.any(String)
                })
            ])
        }));
    });
});

describe('GET /getCloneUrl', () => {
    it('responds with JSON containing clone URL', async () => {
        const response = await request(app).get('/getCloneUrl').send({ repoName: 'owner/repo' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            cloneUrl: expect.any(String)
        }));
    });
});

describe('GET /getAllBranches', () => {
    it('responds with JSON containing branch names', async () => {
        const response = await request(app).get('/getAllBranches').send({ repoName: 'owner/repo' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            branchNames: expect.arrayContaining([
                expect.any(String)
            ])
        }));
    });
});
