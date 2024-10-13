'use strict';

const HTTP_PORT = 9999;

const fs = require('fs');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
var cookieParser = require('cookie-parser');

const morgan = require('morgan');
const winston = require('./config/winstonConfig');
const cors = require('cors');
const axios = require('axios');

const app = express();
const apiKeys = JSON.parse(fs.readFileSync('apikeys.json'));
const http = require('http').Server(app);

const utils = require('./utils/utils');

// database stuff
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ requests: {} }).write();

// logging middleware
app.use(morgan('short', {stream: winston.stream}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//
// Generate a guid everytime we visit the root page to
// keep track of the current request. This is what
// we'll use as the main key in our DB.
//

app.use(function(req, res, next) {
    if (req.path === '/' || req.path === '/index.html') {
        let guid = uuidv4(); // Generate a new GUID
        res.cookie('guid', guid, { maxAge: 900000, httpOnly: false }); // Set the cookie
        winston.info('New GUID generated and set as cookie:' + guid);
    }

    next();
});

app.use(express.static('static')); // static file serve.

app.post('/api/idea', function(req, res) {
    //
    // Fetch the idea inputted from screen one and
    // store this in the db using the guid as the key
    //

    let guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/idea GUID: " + guid);
    winston.info(JSON.stringify(req.body));

    //
    // Create a new db entry and associate the provided message.
    //

    let dbEntry = {
        input: {
            idea: req.body.message
        },
        output: {
            logos: []
        }
    };

    winston.info("Storing " + guid + " " + JSON.stringify(dbEntry));
    db.set(`requests.${guid}`, dbEntry).write();

    res.status(200);
    res.end();
});

app.post('/api/extraInfo', function(req, res) {
    let guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/extrainfo GUID: " + guid);
    winston.info(JSON.stringify(req.body));

    //
    // Store the extra info in the db.
    //

    db.set(`requests.${guid}.input.businessType`, req.body.businesstype).write();
    db.set(`requests.${guid}.input.funding`, req.body.funding).write();
    
    // target revenue
    // location (from map)
    // Type of business (dropdown)
    // estimated startup budget
    // how will you fund your startup? loans, self-funding, crowdfunding, etc

    const idea = String(db.get(`requests.${guid}.input.idea`));
    utils.generateLogos(idea, guid, db, winston); // async call don't care about completion

    res.status(200);
    res.end();
});

app.post('/api/location', function(req, res) {
    let guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    //
    // Store the extra location data in the db.
    //

    winston.info("/api/location GUID: " + guid);
    winston.info(JSON.stringify(req.body));

    db.set(`requests.${guid}.input.location`, req.body.location).write();

    res.status(200);
    res.end();
});

app.get('/api/getLogos', function(req, res) {
    const guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/getLogos GUID: " + guid);

    //
    // check db to see if image paths exist, if so then return
    // otherwise return http try again.
    //

    db.read();
    let logos = JSON.stringify(db.get(`requests.${guid}.output.logos`));
    if (logos === undefined) {
        res.status(400);
        res.end();
        return;
    }

    logos = JSON.parse(logos);
    console.log(logos);

    if (logos[0] !== undefined) {
        res.json(logos);
    } else {
        res.status(500);
        res.end();
    }
});

app.get('/api/getVcs', function(req, res) {
    const guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/getVcs GUID: " + guid);

    let idea = JSON.stringify(db.get(`requests.${guid}.input.idea`));
    let location = JSON.stringify(db.get(`requests.${guid}.input.location`));

    let result = utils.fetchVcs(idea, location, winston);
    
    result.then(function(data) {
        winston.info("/api/getVcs async completed: " + JSON.stringify(data));
        res.json(data);
    });
});

app.get('/api/getOffices', function(req, res) {
    const guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/getOffices GUID: " + guid);

    let location = JSON.stringify(db.get(`requests.${guid}.input.location`));

    let result = utils.fetchOffices(location, winston);
    
    result.then(function(data) {
        winston.info("/api/getOffices async completed: " + JSON.stringify(data));
        res.json(data);
    });
});

app.get('/api/getSummary', function(req, res) {
    const guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/getSummary GUID: " + guid);

    let idea = JSON.stringify(db.get(`requests.${guid}.input.idea`));
    let location = JSON.stringify(db.get(`requests.${guid}.input.location`));
    let prompt = "Given a new business idea: " + String(idea).replaceAll("\"", '') + " based in " + String(location).replaceAll("\"", '') + ", generate a short blurb about current competition in the space. Also generate a short blurb about approximate funding similar startups were able to receive from VCs. Source data from Crunchbase. Keep the entire response under 4 short sentences.";
    
    winston.info(prompt);

    axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'llama-3.1-sonar-small-128k-chat',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.1, // Adjust temperature for creativity
    }, {
        headers: {
            'Authorization': `Bearer ${apiKeys['perplexity']}`,
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        const message = response.data.choices[0].message.content;
        winston.info(message);

        res.json({message: message});
    })
    .catch(error => {
        winston.error(error.message);
        res.status(500);
        res.end()
    });
});

app.get('/getMapbox', function(req, res) {
    res.json({ apiKey: apiKeys["mapbox"] });
});

http.listen(HTTP_PORT, function() {
    winston.info("Listening on port " + HTTP_PORT);
});
