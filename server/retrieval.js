'use strict';

var storage = require('./storage');
var http = require('http');
var url = require('url');

function retrieveAndHighlight (location, pointers, cb) {
  var reqOptions = url.parse(location);
  reqOptions.headers = { 'User-Agent': 'slink' };
  http.request(reqOptions, function (res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      var highlighted = highlight(data, pointers);
      storage.add(highlighted, cb);
    });
  });
}

function highlight (data, pointers)
