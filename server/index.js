'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var storage = require('./storage');
var retrieval = require('./retrieval');

var app = express();
app.use(bodyParser.json());

var homepage = 'https://wcerfgba.github.io/slink';
var pubDir = __dirname + '/public/';

// This is an AMP server. Redirect root requests to off-server homepage.
app.get('/', function (req, res) {
  res.redirect(homepage);
});

// slink IDs are just numbers.
app.get('/:id(\\d+)', function (req, res) {
  storage.get(req.params.id, function (err, data) {
    if (err) {
      return console.error(err);
    }

    if (data.length === 0) {
      res.status(404).sendFile(pubDir + '/404.html');
    } else {
      res.send(data);
    }
  });
});

// Get a slink.
app.post('/new', function (req, res) {
  if (!req.body.location || !req.body.pointers) {
    res.status(400).sendFile(pubDir + '400.html');
    return;
  }

  var cb = function (err, id) {
    if (err) {
      res.status(500).sendFile(pubDir + '500.html');
      return console.error(err);
    }

    res.redirect('/' + id);
  };
  retrieval.retrieveAndHighlight(req.body.location, req.body.pointers, cb);
});
