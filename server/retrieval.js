'use strict';

var storage = require('./storage');
var http = require('http');
var url = require('url');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var highlight = require('../common/highlight');

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

function highlight (data, pointers) {
  var html = new dom().parseFromString(data);
  html = highlight(html, pointers, xPathToElement);
  return html;
}

function xPathToElement (doc, path) {
  return xpath.select(path, doc)[0];
}

exports = module.exports = { retrieveAndHighlight: retrieveAndHighlight };
