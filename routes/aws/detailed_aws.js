const router=require("express").Router();
const AWS=require("aws-sdk");
const dotenv = require("dotenv")


dotenv.config()
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

const ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

function getInstanceName(tags) {
  const nameTag = tags.find(tag => tag.Key === 'Name');
  return nameTag ? nameTag.Value : 'Unnamed Instance';
}

function getInstanceHourlyCost(instanceType) {
  
  const hourlyCosts = {
    't2.micro': 0.0116,
    't2.small': 0.023,
  };
  return hourlyCosts[instanceType] || 0;
}


router.get('/instances', (req, res) => {
  // Call EC2 to retrieve instance descriptions
  ec2.describeInstances({}, function(err, data) {
    if (err) {
      console.error("Error", err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      try {
        // Extract instance details
        const instances = data.Reservations.reduce((acc, reservation) => {
          return acc.concat(reservation.Instances);
        }, []);
        
        // Prepare response
        const instanceDetails = instances.map(instance => {
          const launchTime = new Date(instance.LaunchTime);
          const terminationTime = instance.State.Name === 'terminated' ? new Date(instance.StateTransitionReason) : new Date();
          const hoursActive = Math.ceil((terminationTime - launchTime) / (1000 * 60 * 60));
          const estimatedCost = hoursActive * getInstanceHourlyCost(instance.InstanceType);

          return {
            instanceId: instance.InstanceId,
            name: getInstanceName(instance.Tags),
            region: instance.Placement.AvailabilityZone.slice(0, -1), // Extract region from AvailabilityZone
            status: instance.State.Name,
            instanceType: instance.InstanceType,
            publicIpAddress: instance.PublicIpAddress || "N/A",
            creationDate: instance.LaunchTime,
            hoursActive: hoursActive,
            estimatedCost: estimatedCost
          };
        });
  
        // Send response
        res.json(instanceDetails);
      } catch (error) {
        console.error("Error processing response", error);
        res.status(500).json({ error: 'Error processing response' });
      }
    }
  });
});



router.post('/instances/:instanceId/start', (req, res) => {
  const instanceId = req.params.instanceId;

  // Check if the instance is already running
  ec2.describeInstances({ InstanceIds: [instanceId] }, (err, data) => {
    if (err) {
      console.error("Error describing instance", err);
      res.status(500).json({ error: 'Error describing instance' });
    } else {
      if (data.Reservations.length > 0) {
        const instance = data.Reservations[0].Instances[0];
        if (instance.State.Name === 'running') {
          res.json({ message: 'Instance is already running' });
          return;
        }
      }

      // Start the instance
      const params = {
        InstanceIds: [instanceId]
      };

      ec2.startInstances(params, (startErr, startData) => {
        if (startErr) {
          console.error("Error starting instance", startErr);
          res.status(500).json({ error: 'Error starting instance' });
        } else {
          console.log("Instance started successfully", startData);
          res.json({ message: 'Instance started successfully' });
        }
      });
    }
  });
});

router.post('/instances/:instanceId/stop', (req, res) => {
  const instanceId = req.params.instanceId;

  ec2.describeInstances({ InstanceIds: [instanceId] }, (err, data) => {
    if (err) {
      console.error("Error describing instance", err);
      res.status(500).json({ error: 'Error describing instance' });
    } else {
      if (data.Reservations.length > 0) {
        const instance = data.Reservations[0].Instances[0];
        if (instance.State.Name === 'stopped') {
          res.json({ message: 'Instance is already stopped' });
          return;
        }
      }

      const params = {
        InstanceIds: [instanceId]
      };

      ec2.stopInstances(params, (stopErr, stopData) => {
        if (stopErr) {
          console.error("Error stopping instance", stopErr);
          res.status(500).json({ error: 'Error stopping instance' });
        } else {
          console.log("Instance stopped successfully", stopData);
          res.json({ message: 'Instance stopped successfully' });
        }
      });
    }
  });
});


router.get('/instanceCounts', (req, res) => {
  // Call EC2 to retrieve instance descriptions
  ec2.describeInstances({}, function(err, data) {
    if (err) {
      console.error("Error", err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      try {
        // Extract instance details
        const instances = data.Reservations.reduce((acc, reservation) => {
          return acc.concat(reservation.Instances);
        }, []);
        
        // Count instances by state
        let activeCount = 0;
        let stoppedCount = 0;
        let terminatedCount = 0;
        instances.forEach(instance => {
          switch (instance.State.Name) {
            case 'running':
              activeCount++;
              break;
            case 'stopped':
              stoppedCount++;
              break;
            case 'terminated':
              terminatedCount++;
              break;
            default:
              break;
          }
        });

        // Prepare response
        const instanceCounts = {
          active: activeCount,
          stopped: stoppedCount,
          terminated: terminatedCount
        };

        // Send response
        res.json(instanceCounts);
      } catch (error) {
        console.error("Error processing response", error);
        res.status(500).json({ error: 'Error processing response' });
      }
    }
  });
});

module.exports=router;