const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv")
const fs = require('fs');
const AWS = require("aws-sdk");
const { Client } = require('ssh2');

const app = express();

const router = express.Router();

dotenv.config()
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});


const ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

const getEC2InstanceDetails = async (instanceId) => {
    const params = {
        InstanceIds: [instanceId]
    };

    const data = await ec2.describeInstances(params).promise();
    return data.Reservations[0].Instances[0];
};

const installDocker = async (host, username, privateKeyPath) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {
                    console.log('Docker is not installed. Installing...');
                    ssh.exec('sudo snap install docker', { timeout: 60000 },(err, stream) =>{
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('Docker installation completed');
                            ssh.end();
                            resolve();
                        });
                    }).on('data', (data) => {
                        console.log(data);
                    
                    });
                
        }).connect({
            host,
            port: 22,
            username,
            privateKey: fs.readFileSync(privateKeyPath)
        });
    });
};


const installDockerCompose = async (host, username, privateKeyPath) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {
            
                    console.log('Docker Compose is not installed. Installing...');
                    ssh.exec('sudo snap install docker', { timeout: 60000 },(err, stream) => {
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('Docker Compose installation completed');
                            ssh.end();
                            resolve();
                        }).on('data', (data) => {
                            console.log(data);
                        });;
                    });
                
        }).connect({
            host,
            port: 22,
            username,
            privateKey: fs.readFileSync(privateKeyPath)
        });
    });
};


router.post('/instance/:instanceId/docker', async (req, res) => {
    const instanceId = req.params.instanceId;

    try {
        const instanceDetails = await getEC2InstanceDetails(instanceId);

        const { PublicIpAddress: host, KeyName: keyName } = instanceDetails;
        const username = 'ubuntu'; 
        const privateKeyPath = `final_year_project.pem`;
        console.log('Installing Docker on instance:', instanceId);
        await installDocker(host, username, privateKeyPath);
        console.log('Docker installation completed on instance:', instanceId);
        res.status(200).json({ message: 'Docker installation completed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during Docker installation' });
    }
});





router.post('/instance/:instanceId/docker-compose', async (req, res) => {
    const instanceId = req.params.instanceId;
    console.log(instanceId)
    try {
        const instanceDetails = await getEC2InstanceDetails(instanceId);

        const { PublicIpAddress: host, KeyName: keyName } = instanceDetails;
        const username = 'ubuntu'; 
        const privateKeyPath = `final_year_project1.pem`;
        await installDockerCompose(host, username, privateKeyPath);
        res.status(200).json({ message: 'Docker Compose installation completed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during Docker Compose installation' });
    }
});

module.exports = router;
