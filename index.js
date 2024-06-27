const express=require("express");
const bodyParser=require("body-parser");
const cors = require("cors");
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const session = require('express-session');
const axios = require('axios');
const dotenv=require("dotenv")
const app=express();

dotenv.config();

var corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    optionsSuccessStatus: 200, // For legacy browser support
  };

app.use(session({ secret:process.env.GITHUB_TOKEN, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


const github=require("./routes/github/github");
const aws=require("./routes/aws/create_aws_console");
const installDocker=require("./routes/aws/docker_aws");
const scripts=require("./routes/aws/download_script");
const code=require("./routes/aws/code_caddy.js");
const detial_aws=require("./routes/aws/detailed_aws");

passport.use(
  new GitHubStrategy(
    {
      clientID:process.env.GITHUB_CLIENT_ID,
      clientSecret:process.env.CLIENT_SECRET ,
      callbackURL:process.env.CALLBACK_URL,
      scope: ['user:email'], // Request 'user:email' scope to include access token
    },
    (accessToken, refreshToken, profile, done) => {
      // Save user information, including accessToken, in session
      profile.accessToken = accessToken;
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.get('/auth', (req, res) => {
  res.send('Hello, please <a href="/auth/github">log in with GitHub</a>.');
});

// Initiate GitHub OAuth login
app.get('/auth/github', passport.authenticate('github'));

// GitHub OAuth callback
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/repos');
  }
);

app.get('/repos', ensureAuthenticated, async (req, res) => {
  try {
    const accessToken = req.user.accessToken; // Access token obtained during authentication
   console.log(accessToken);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized: Access token is missing.' });
    }

    const apiUrl = 'https://api.github.com/user/repos?type=all';

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const repos = response.data;
    console.log(repos)
    res.header('Content-Type', 'application/json'); // Set Content-Type header to application/json
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error:error });
  }
});

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/repos');
}


app.get("/",(req,res)=>{
    res.send("final year project apis")
})

app.use("/api/github",github);
app.use("/api/aws",aws);
app.use("/api/install",installDocker);
app.use("/api/script",scripts);
app.use("/api/code",code);
app.use("/api/details",detial_aws);

app.listen(3000,()=>{
    console.log("server running on port 3000");
})