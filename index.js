'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
// const pino = require('pino');
// const expressPino = require('express-pino-logger');

// const logger = pino();
// const expressLogger = expressPino({ logger });
const apiKey = JSON.parse(fs.readFileSync('api.json'));

console.log(apiKey["kindo"]);

// app.use(expressLogger);

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('static'));

app.post('/api', function(req, res) {
    let input = req.body;
    console.log(input);
    res.status(200);
    res.end();
});

http.listen(9999, function() {
    console.log("Listening on port 9999");
});

