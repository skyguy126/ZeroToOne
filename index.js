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
        }
    }

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

app.get('/getMapbox', function(req, res) {
    res.json({ apiKey: apiKeys["mapbox"] });
});

app.get('/getPerplexity', function(req, res) {
    res.json({ apiKey: apiKeys["perplexity"] });
});

app.post('/api/perplexity', async (req, res) => {    
    let guid = req.cookies.guid;
    if (!guid) {
        winston.error("Missing guid cookie!");
        res.status(400);
        res.end();
        return;
    }

    winston.info("/api/idea GUID: " + guid);

    const idea = db.get(`requests.${guid}.input.idea`);
    const businessType = db.get(`requests.${guid}.input.businessType`);
    const funding = db.get(`requests.${guid}.input.businessType`);
    const location = db.get(`requests.${guid}.input.location`);

    const prompt = req.body.prompt;

    const userQuery = prompt.replace("businessType", businessType).replace("businessIdea", idea).replace("businessFunding", funding).replace("businessLocation", location);

    winston.info("userQuery: " + userQuery);

    const options = {
        method: 'POST',
        url: 'https://api.perplexity.ai/chat/completions',
        headers: {
            'Authorization': `Bearer ${apiKeys["perplexity"]}`, // Replace <token> with your actual token
            'Content-Type': 'application/json',
        },
        data: {
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
                { role: 'user', content: userQuery }
            ],
            temperature: 0.2,
            top_p: 0.9,
            return_citations: true,
            search_domain_filter: ['perplexity.ai'],
            return_images: false,
            return_related_questions: false,
            search_recency_filter: 'month',
            top_k: 0,
            stream: false,
            presence_penalty: 0,
            frequency_penalty: 1
        }
    };

    axios(options)
        .then(response => {
            const choices = response.data.choices;
            let content = "No content received";
            if (choices.length > 0) {
                content = choices[0].message.content;
            }
            winston.info("Content: " + content);
            res.json({content: content});
        })
        .catch(error => {
            console.error('Error calling Perplexity AI:', error.response ? error.response.data : error.message);
        });
});

http.listen(HTTP_PORT, function() {
    winston.info("Listening on port " + HTTP_PORT);
});
