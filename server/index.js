'use strict';

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var storage = require('./storage');
var retrieval = require('./retrieval');

var app = express();
app.use(bodyParser.json());

// Resolve path because express considers .. to be malicious.
var pubDir = path.resolve(__dirname + '/../website/build/');

// slink IDs are just numbers.
app.get('/:id(\\d+)', function (req, res) {
  storage.get(req.params.id, function (err, data) {
    if (err) {
      return console.error(err);
    }

    if (!data || !data.slinkText) {
      res.status(404).sendFile(pubDir + '/404.html');
    } else {
      res.send(data.slinkText);
    }
  });
});

app.get('/verification/:id(\\d+)', function (req, res) {
  storage.get(req.params.id, function (err, data) {
    if (err) {
      return console.error(err);
    }

    if (!data || !data.verifyText) {
      res.status(404).sendFile(pubDir + '/404.html');
    } else {
      res.send(data.verifyText);
    }
  });
});

// Make a slink.
app.post('/new', function (req, res) {
  if (!req.body.location || !req.body.text || !req.body.pointers) {
    res.status(400).sendFile(pubDir + '/400.html');
    return;
  }
  console.log("New request...");
  var cb = function (err, id) {
    if (err) {
      res.status(500).sendFile(pubDir + '/500.html');
      return console.error(err);
    }

    console.log("Redirecting to slink: ", id);
    res.redirect('/' + id);
  };
  var serverRoot = req.protocol + '://' + req.get('host');
  retrieval.retrieve(req.body.location, req.body.text, req.body.pointers,
                     serverRoot, cb);
});

// Serve static content underneath the API.
app.use(express.static(pubDir),
        function (req, res, next) {
          // Nothing found, 404.
          res.status(404).sendFile(pubDir + '/404.html');
        });

// Go
var port = process.env.PORT || 3000;
app.listen(port);
