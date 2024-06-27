const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv")
const app = express();

const router = express.Router();

const { Octokit } = require('@octokit/rest');

dotenv.config()
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

router.get("/allrepos", async (req, res) => {
    try {
        const username = "venki200221"; // Assuming you want to keep it fixed for now

        if (!username) {
            return res.status(400).send('Username parameter is missing.');
        }

        const userResponse = await octokit.users.getAuthenticated();
        const authenticatedUser = userResponse.data.login;

        if (authenticatedUser !== username) {
            return res.status(403).send('Unauthorized access.'); // Ensure the requested username matches the authenticated user
        }

        let repositories = [];
        let page = 1;
        let response;

        do {
            response = await octokit.repos.listForUser({
                username,
                type: "all",
                per_page: 100, // Number of repositories per page, maximum is 100
                page
            });

            if (response.status === 200) {
                repositories = repositories.concat(response.data.map(repo => ({
                    name: repo.full_name,
                    clone_url: repo.clone_url
                })));

                // Check if there are more pages by inspecting the Link header
                const linkHeader = response.headers.link;
                if (linkHeader) {
                    const nextPageUrl = linkHeader.split(',').find(s => s.includes('rel="next"'));
                    if (nextPageUrl) {
                        const match = nextPageUrl.match(/<([^>]+)>/);
                        if (match) {
                            const nextUrl = match[1];
                            const urlParams = new URLSearchParams(nextUrl);
                            page = parseInt(urlParams.get('page'));
                        }
                    }
                } else {
                    break; // No more pages
                }
            } else {
                return res.status(response.status).send(response.statusText); // Return the error message from the GitHub API
            }
        } while (true);

        return res.send(repositories);
    } catch (err) {
        if (err.status === 404) {
            return res.status(404).send('User not found.');
        } else {
            console.error(err);
            return res.status(500).send("Internal server error");
        }
    }
});






router.get("/getrepos/details", async (req, res) => {
    try {
        const userResponse = await octokit.users.getAuthenticated();
        const authenticatedUser = userResponse.data.login;
        console.log(authenticatedUser);
        if (authenticatedUser) {
            const username = req.body.username;
            const response = await octokit.repos.listForUser({
                username,
                type: "all"
            });
            if (response.status == 200) {
                const repositories = response.data.map(repo => ({
                    name: repo.full_name,
                    url: repo.clone_url,
                    branches: repo.branches_url,
                    visibility: repo.private ? 'private' : 'public',
                }));
                res.send(repositories);
            }
        }
    }
    catch (err) {
        if (err.status === 404) {
            res.send('User not found.').status(404);
        }
        else {
            res.send("internal server error").status(500);
        }
    }
});


router.get("/getCloneUrlAndBranches",async (req,res)=>{
    try{ 
         
        const repoName=req.body.repoName;
        const reposResponse= await octokit.repos.get({
            owner:repoName.split('/')[0],
            repo:repoName.split('/')[1]
         });
         const branchesResponse = await octokit.repos.listBranches({
            owner: repoName.split('/')[0],
            repo: repoName.split('/')[1],
          });
              
        const branchNames = branchesResponse.data.map(branch => branch.name);
        const cloneUrl=reposResponse.data.clone_url;
        const branchCloneUrls = branchNames.map(branchName => ({
            branch: branchName,
            cloneUrl: `${cloneUrl.replace('.git', '')}/tree/${branchName}.git`,
          }));
         res.json({
            cloneUrl:cloneUrl,
            branchNames:branchNames,
            branchCloneUrls:branchCloneUrls
         });
    }
    catch(err){
        if(err.status===404){
            res.send("not found").status(404);
        } 
        else{
            res.send(err).status(500);
        } 
    }
});


router.get("/getCloneUrl",async (req,res)=>{
    try{ 
         
        const repoName=req.body.repoName;
        const reposResponse= await octokit.repos.get({
            owner:repoName.split('/')[0],
            repo:repoName.split('/')[1]
         });
      
        const cloneUrl=reposResponse.data.clone_url;
         res.json({
            cloneUrl:cloneUrl
         });
    }
    catch(err){
        if(err.status===404){
            res.send("not found").status(404);
        } 
        else{
            res.send(err).status(500);
        } 
    }
});


router.get("/getAllBranches",async(req,res)=>{
    try{
        const repoName=req.body.repoName;
     
     const branchesResponse = await octokit.repos.listBranches({
        owner: repoName.split('/')[0],
        repo: repoName.split('/')[1],
      });
          
     const branchNames = branchesResponse.data.map(branch => branch.name);
     res.json({
        branchNames:branchNames
     })
    }
    catch(err){
        if(err.status===404){
            res.send("repo not found").status(404);
        }
        else{
            console.log(err)
            res.send("internal server error").status(500);
        }
    }


})





module.exports = router