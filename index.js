'use strict';

const HTTP_PORT = 9999;

const fs = require('fs');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
var cookieParser = require('cookie-parser');

const morgan = require('morgan');
const winston = require('./config/winstonConfig');
const cors = require('cors');

const app = express();
const apiKeys = JSON.parse(fs.readFileSync('apikeys.json'));
const http = require('http').Server(app);

// database stuff
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ requests: {} }).write();

winston.info("KindoApi Key: " + apiKeys["kindoai"]);

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

app.post('/api/location', function(req, res) {
    winston.info("City name " + JSON.stringify(req.body.city));
});

app.get('/getMapbox', function(req, res) {
    res.json({ apiKey: apiKeys["mapbox"] });
});

app.get('/api/mapbox', async (req, res) => {
    const mapboxUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12'; // Adjust URL as needed
    const accessToken = apiKeys["mapbox"];

    try {
        const response = await axios.get(mapboxUrl, {
            params: {
                sdk: 'js-3.7.0',
                access_token: accessToken
            }
        });

        res.json(response.data); // Forward the data to the client
    } catch (error) {
        winston.error('Error fetching from Mapbox:' + error);
        res.status(500).send('Error fetching data');
    }
});

http.listen(HTTP_PORT, function() {
    winston.info("Listening on port " + HTTP_PORT);
});
