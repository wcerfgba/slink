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
  if (storage.exists(req.params.id)) {
    res.send(storage.get(req.params.id));
  } else {
    res.status(404).sendFile(pubDir + '/404.html');
  }
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
      return;
    }

    res.redirect('/' + id);
  };
  retrieval.retrieveAndHighlight(req.body.location, req.body.pointers, cb);
});
