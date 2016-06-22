'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var storage = require('./storage');
var retrieval = require('./retrieval');

var app = express();
app.use(bodyParser.json());

var pubDir = __dirname + '../website/build/';

// slink IDs are just numbers.
app.get('/:id(\\d+)', function (req, res) {
  storage.get(req.params.id, function (err, data) {
    if (err) {
      return console.error(err);
    }

    if (!data || !data.length) {
      res.status(404).sendFile(pubDir + '/404.html');
    } else {
      res.send(data);
    }
  });
});

// Get a slink.
app.post('/new', function (req, res) {
  if (!req.body.location || !req.body.text || !req.body.pointers) {
    res.status(400).sendFile(pubDir + '400.html');
    return;
  }
  console.log("New request...");
  var cb = function (err, id) {
    if (err) {
      res.status(500).sendFile(pubDir + '500.html');
      return console.error(err);
    }

    console.log("Redirecting to slink: ", id);
    res.redirect('/' + id);
  };
  retrieval.retrieve(req.body.location, req.body.text, req.body.pointers, cb);
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
