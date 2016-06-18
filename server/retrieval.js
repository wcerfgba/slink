'use strict';

var storage = require('./storage');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var highlight = require('../common/highlight');

function retrieveAndHighlight (location, pointers, cb) {
  var body = '';
console.log("Requesting page: ", location);
  request({ url: location, headers: { 'User-Agent': 'slink' }, gzip: true })
    .on('data', function (data) {
      body += data;
    })
    .on('end', function () {
console.log("Finished retrieving page.");
      var highlighted = highlightWrapper(body, pointers);
      storage.add(highlighted, cb);
    });
}

function highlightWrapper (data, pointers) {
console.log("Highlighting...");
  var html = new dom().parseFromString(data);
  html = highlight(html, pointers, xPathToElement);
  return html;
}

function xPathToElement (doc, path) {
  path = path.toLowerCase();
  var el = xpath.evaluate(path, doc, null,
                          xpath.XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                .singleNodeValue;
  return el;
}

exports = module.exports = { retrieveAndHighlight: retrieveAndHighlight };
