const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv")
const fs = require('fs');
const AWS=require("aws-sdk");
const app = express();

const router = express.Router();

dotenv.config()
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
  });

  const ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });


  function keyPairExists(keyName, callback) {
    const params = {
      KeyNames: [keyName],
    };
    ec2.describeKeyPairs(params, (err, data) => {
      if (err) {
        callback(err, null);
        return;
      }
      const keyPairs = data.KeyPairs;
      if (keyPairs.length > 0) {
        callback(null, true); 
      } else {
        callback(null, false); 
      }
    });
  }

  function createKeyPair(keyName, callback) {
    const keyParams = {
      KeyName: keyName,
    };
  
    ec2.createKeyPair(keyParams, (err, data) => {
      if (err) {
        callback(err, null);
        return;
      }
      const privateKey = data.KeyMaterial;
      fs.writeFile(`${keyName}.pem`, privateKey, (err) => {
        if (err) {
          callback(err, null);
          return;
        }
        fs.chmodSync(`${keyName}.pem`, 0o400);
        callback(null, `${keyName}.pem`);
      });
    });
  }


  function createInstance(keyName,instanceName ,callback) {
    const instanceParams = {
      ImageId: process.env.EC2_AMI_ID,
      InstanceType: process.env.EC2_INSTANCE_TYPE,
      KeyName: keyName,
      MinCount: 1,
      MaxCount: 1,
      SecurityGroupIds: [process.env.EC2_SECURITY_GROUP_ID],
      TagSpecifications: [{
        ResourceType: "instance",
        Tags: [{
          Key: "Name",
          Value: instanceName
        }]
      }]
    };
  
    ec2.runInstances(instanceParams, (err, data) => {
      if (err) {
        callback(err, null);
        return;
      }
      const instanceId = data.Instances[0].InstanceId;
      callback(null, instanceId);
    });
  }

router.post('/create-instance', (req, res) => {
  const keyName ="final_year_project1";
  const instanceName=req.body.instance_name;
  keyPairExists(keyName, (err, exists) => {
    if (err) {
      console.error('Error checking key pair existence:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (exists) {
      createInstance(keyName,instanceName ,(err, instanceId) => {
        if (err) {
          console.error('Error creating instance:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        res.status(200).json({ instanceId });
      });
    } else {
      createKeyPair(keyName, (err, privateKeyFile) => {
        if (err) {
          console.error('Error creating key pair:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        createInstance(keyName, (err, instanceId) => {
          if (err) {
            console.error('Error creating instance:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          res.status(200).json({ privateKeyFile, instanceId });
        });
      });
    }
  });
});


router.get('/instance/:instanceId', (req, res) => {
  const instanceId = req.params.instanceId;

  const params = {
    InstanceIds: [instanceId]
  };

  ec2.describeInstances(params, (err, data) => {
    if (err) {
      console.error('Error describing instance:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (!data.Reservations || data.Reservations.length === 0) {
      res.status(404).json({ error: 'Instance not found' });
      return;
    }

    const instance = data.Reservations[0].Instances[0];
    const instanceInfo = {
      instanceId: instance.InstanceId,
      instanceType: instance.InstanceType,
      publicIp: instance.PublicIpAddress,
      privateIp: instance.PrivateIpAddress,
      state: instance.State.Name,
      publicDns: instance.PublicDnsName
    };

    res.status(200).json(instanceInfo);
  });
});


module.exports=router;
