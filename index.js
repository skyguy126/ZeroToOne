'use strict';

const HTTP_PORT = 9999;

const fs = require('fs');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
var cookieParser = require('cookie-parser');

const morgan = require('morgan');
const winston = require('./config/winstonConfig');

const app = express();
const apiKeys = JSON.parse(fs.readFileSync('apikeys.json'));
const http = require('http').Server(app);

winston.info("KindoApi Key: " + apiKeys["kindoai"]);

// logging middleware
app.use(morgan('short', {stream: winston.stream}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    res.status(200);
    res.end();
});

app.post('/data', function(req, res) {
    let input = req.body;
    console.log(input);
    res.status(200);
    res.end();
});

http.listen(HTTP_PORT, function() {
    winston.info("Listening on port " + HTTP_PORT);
});
