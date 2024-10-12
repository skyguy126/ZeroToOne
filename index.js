'use strict';

const fs = require('fs');
const express = require('express');

const app = express();
const apiKey = JSON.parse(fs.readFileSync('apikeys.json'));
const http = require('http').Server(app);

console.log("KindoApi Key:" + apiKey["kindoai"]);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
