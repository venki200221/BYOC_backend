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

const cloneCode = async (host, username, privateKeyPath, gitRepo) => {
    console.log(gitRepo)
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        const folderName = gitRepo.split('/').pop().split('.')[0]
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {
                    console.log('Cloning the code...');
                    ssh.exec(`mkdir proj && cd proj && git clone ${gitRepo} && mv ${folderName} repo`, { timeout: 60000 },(err, stream) => {
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('code installation completed');
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


const downloadCaddy = async (host, username, privateKeyPath) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {
            
            console.log('Initializing caddy...');
            ssh.exec(`cd proj && 
                        git clone https://github.com/Shashankmallibhat/Dockerfiles.git && 
                        cd Dockerfiles && 
                        rm -rf .git &&
                        mv caddy ../`, 
                { timeout: 60000 },
                (err, stream) => {
                    if (err) reject(err);
                    stream.on('close', (code, signal) => {
                        console.log('caddy installation completed');
                        ssh.end();
                        resolve();
                    }).on('data', (data) => {
                        console.log(data);
                    });;
                }
            );
                
        }).connect({
            host,
            port: 22,
            username,
            privateKey: fs.readFileSync(privateKeyPath)
        });
    });
};


const createDockerCompose = async (host, username, privateKeyPath) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {

            console.log('Creating docker-compose...');
            ssh.exec(`cd proj &&  
                        cd Dockerfiles &&
                        mv docker-compose.yml ../`, 
                { timeout: 60000 },
                (err, stream) => {
                    if (err) reject(err);
                    stream.on('close', (code, signal) => {
                        console.log('docker compose creation completed');
                        ssh.end();
                        resolve();
                    }).on('data', (data) => {
                        console.log(data);
                    });;
                }
            );
                
        }).connect({
            host,
            port: 22,
            username,
            privateKey: fs.readFileSync(privateKeyPath)
        });
    });
};


const createDockerfile = async (host, username, privateKeyPath, language) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {

            console.log('Creating docker file...');
            if (language === 'react'){
                ssh.exec(`cd proj &&  
                            cd Dockerfiles &&
                            mv Dockerfile-react Dockerfile &&
                            mv Dockerfile ../ &&
                            cd .. &&
                            mv Dockerfile ./repo`, 
                    { timeout: 60000 },
                    (err, stream) => {
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('Dockerfile creation completed');
                            ssh.end();
                            resolve();
                        }).on('data', (data) => {
                            console.log(data);
                        });;
                    }
                );
            } else if (language === 'nodejs'){
                ssh.exec(`cd proj &&  
                            cd Dockerfiles &&
                            mv Dockerfile-nodejs Dockerfile &&
                            mv Dockerfile ../ &&
                            cd .. &&
                            mv Dockerfile ./repo`, 
                    { timeout: 60000 },
                    (err, stream) => {
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('Dockerfile creation completed');
                            ssh.end();
                            resolve();
                        }).on('data', (data) => {
                            console.log(data);
                        });;
                    }
                );
            } else if (language === 'django'){
                ssh.exec(`cd proj &&  
                            cd Dockerfiles &&
                            mv Dockerfile-django Dockerfile &&
                            mv Dockerfile ../ &&
                            cd .. &&
                            mv Dockerfile ./repo`, 
                    { timeout: 60000 },
                    (err, stream) => {
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('Dockerfile creation completed');
                            ssh.end();
                            resolve();
                        }).on('data', (data) => {
                            console.log(data);
                        });;
                    }
                );
            }
        }).connect({
            host,
            port: 22,
            username,
            privateKey: fs.readFileSync(privateKeyPath)
        });
    });
};


const removeUnnecessaaryFiles = async (host, username, privateKeyPath) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {

            console.log('Cleaning up...');
            ssh.exec(`cd proj &&  
                        rm -rf Dockerfiles`, 
                { timeout: 60000 },
                (err, stream) => {
                    if (err) reject(err);
                    stream.on('close', (code, signal) => {
                        console.log('cleaning up completed');
                        ssh.end();
                        resolve();
                    }).on('data', (data) => {
                        console.log(data);
                    });;
                }
            );
                
        }).connect({
            host,
            port: 22,
            username,
            privateKey: fs.readFileSync(privateKeyPath)
        });
    });
};


const startDockerCompose = async (host, username, privateKeyPath, gitRepo) => {
    return new Promise((resolve, reject) => {
        const ssh = new Client();
        // const folderName = gitRepo.split('/').pop().split('.')[0]
        ssh.on('error', (err) => reject(err));
        ssh.on('ready', () => {
                    console.log('Starting the docker compose...');
                    ssh.exec(`cd proj &&
                                sudo docker volume create caddy_data &&
                                sudo docker-compose up --build -d`, { timeout: 60000 },(err, stream) => {
                        if (err) reject(err);
                        stream.on('close', (code, signal) => {
                            console.log('caddy installation completed');
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


router.post('/instance/:instanceId/git-repo', async (req, res) => {
    const instanceId = req.params.instanceId;
    const gitRepo = req.body.gitRepo;
    try {
        const instanceDetails = await getEC2InstanceDetails(instanceId);

        const { PublicIpAddress: host, KeyName: keyName } = instanceDetails;
        const username = 'ubuntu'; 
        const privateKeyPath = `final_year_project1.pem`;
        console.log('Installing code on instance:', instanceId);
        await cloneCode(host, username, privateKeyPath, gitRepo);
        console.log('Code cloning completed on instance:', instanceId);
        res.status(200).json({ message: 'code cloning completed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during code installation' });
    }
});

router.post('/instance/:instanceId/dockerfiles', async (req, res) => {
    const instanceId = req.params.instanceId;
    const language = req.body.language
    console.log(instanceId)
    try {
        const instanceDetails = await getEC2InstanceDetails(instanceId);

        const { PublicIpAddress: host, KeyName: keyName } = instanceDetails;
        const username = 'ubuntu'; 
        const privateKeyPath = `final_year_project1.pem`;

        await downloadCaddy(host, username, privateKeyPath);
        await createDockerCompose(host, username, privateKeyPath); 
        await createDockerfile(host, username, privateKeyPath, language);
        await removeUnnecessaaryFiles(host, username, privateKeyPath);

        res.status(200).json({ message: 'files generated completed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during files generation' });
    }
});

router.post('/instance/:instanceId/startWebsite', async (req, res) => {
    const instanceId = req.params.instanceId;
    console.log(instanceId)
    try {
        const instanceDetails = await getEC2InstanceDetails(instanceId);

        const { PublicIpAddress: host, KeyName: keyName } = instanceDetails;
        const username = 'ubuntu'; 
        const privateKeyPath = `final_year_project1.pem`;

        await startDockerCompose(host, username, privateKeyPath);

        res.status(200).json({ message: 'started successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during starting up' });
    }
});

module.exports = router;
