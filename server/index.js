'use strict';

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var RateLimiter = require('limiter').RateLimiter;
var storage = require('./storage');
var retrieval = require('./retrieval');

// Initialize the database (if needed).
storage.initialize();

// Rate limit each IP.
var limits = { };

var app = express();
app.set('trust proxy', 'uniquelocal');
app.use(bodyParser.json({ limit: '1024kb' }));

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

  // Limit requests to 10 per minute per IP.
  if (!limits[req.ip]) {
    limits[req.ip] = new RateLimiter(10, 'minute');
  }
  limits[req.ip].removeTokens(1, function (err, remainingRequests) {
    if (remainingRequests < 0) {
      res.status(429).sendFile(pubDir + '/429.html');
      return console.log("Requests exceeded for " + req.ip);
    }

    console.log("New request from " + req.ip + " (" + remainingRequests + " remaining)");
    var cb = function (err, id) {
      if (err) {
        res.status(500).sendFile(pubDir + '/500.html');
        return console.error(err);
      }

      console.log("Redirecting to slink: ", id);
      res.redirect('/' + id + '#slink');
    };
    var serverRoot = 'https://' + req.get('host');
    retrieval.retrieve(req.body.location, req.body.text, req.body.pointers,
                       serverRoot, cb);
  });
});

// Serve static content underneath the API.
app.use(express.static(pubDir),
        function (req, res, next) {
          // Nothing found, 404.
          res.status(404).sendFile(pubDir + '/404.html');
        });

// Flush limits every hour.
var limitFlush = setInterval(function () {
  limits = { };
}, 1000 * 60 * 60);

// Go
var port = process.env.PORT || 3000;
app.listen(port);
