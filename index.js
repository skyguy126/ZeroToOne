'use strict';

const HTTP_PORT = 9999;

const fs = require('fs');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
var cookieParser = require('cookie-parser');

const app = express();
const apiKeys = JSON.parse(fs.readFileSync('apikeys.json'));
const http = require('http').Server(app);

console.log("KindoApi Key:" + apiKeys["kindoai"]);

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
        res.cookie('guid', guid, { maxAge: 900000, httpOnly: true }); // Set the cookie
        console.log('New GUID generated and set as cookie:', guid);
    }

    next();
});

app.use(express.static('static')); // static file serve.

app.post('/api', function(req, res) {
    let input = req.body;
    console.log(input);
    res.status(200);
    res.end();
});

http.listen(HTTP_PORT, function() {
    console.log("Listening on port " + HTTP_PORT);
});
