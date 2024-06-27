const router=require("express").Router();
const https = require('https');
const dotenv=require("dotenv");
const AWS=require("aws-sdk");
const { Client } = require('ssh2');
const { exec } = require('child_process');

const fs=require("fs");
dotenv.config()

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});


const ec2 = new AWS.EC2();

const ssm = new AWS.SSM();

const executeCommandSSH = async (host, username, pemFilePath, command) => {
    return new Promise((resolve, reject) => {
        const sshCommand = `ssh -i ${pemFilePath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${username}@${host} '${command}'`;
        exec(sshCommand, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
};

// Function to download script from S3 and execute on EC2 instance
const installDockerAndCompose = async (pemFilePath, instanceId) => {
    try {
        // Create EC2 object
        const ec2 = new AWS.EC2();

        // Describe instances to get public IP address of the instance
        const data = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
        const publicIpAddress = data.Reservations[0].Instances[0].PublicIpAddress;

        // S3 URL to download the shell script
        const s3Url = 'https://byocv1.s3.ap-south-1.amazonaws.com/docker.sh';

        // Download the script from S3
        https.get(s3Url, function(response) {
            let scriptData = '';
            response.on('data', (chunk) => {
                scriptData += chunk;
            });
            response.on('end', async () => {
                // Write the script to a temporary file
                const tempScriptPath = 'docker.sh';
                fs.writeFileSync(tempScriptPath, scriptData);

                // Execute the script on the specified EC2 instance using SSH
                const stdout = await executeCommandSSH(publicIpAddress, 'ubuntu', pemFilePath, `sudo bash ${tempScriptPath}`);
                console.log('Script output:', stdout);
            });
        }).on('error', function(err) {
            console.error(`Error downloading script: ${err}`);
        });
    } catch (err) {
        console.error(`Error retrieving instance information: ${err}`);
    }
};

// POST route to trigger installation
router.post('/install_docker', (req, res) => {
    const instanceId = req.body.instanceId;
    const pemFilePath="final_year_project.pem"
    // Validate input parameters
    if (!pemFilePath || !instanceId) {
        return res.status(400).send('Missing required parameters.');
    }

    // Install Docker and Docker Compose
    installDockerAndCompose(pemFilePath, instanceId);

    res.status(200).send('Installation process initiated.');
});


module.exports=router;