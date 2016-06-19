'use strict';

var storage = require('./storage');
var request = require('request');
var level3 = require('path').resolve(require.resolve('jsdom'), '..', 'jsdom/level3');
var xpath = require(level3 + '/xpath.js');
//var xpath = require('xpath');
//var dom = require('xmldom').DOMParser;
var jsdom = require('jsdom').jsdom;
var serializeDocument = require('jsdom').serializeDocument;
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
//  var html = new dom().parseFromString(data);
  var html = jsdom(data);
  // Attach compareDocumentPosition.
  html = serializeDocument(highlight(html, pointers, xPathToElement));
  return html;
}

function xPathToElement (doc, path) {
  path = path.toLowerCase();
  // FIRST_ORDERED_NODE_TYPE = 9
  var el = doc.evaluate(path, doc, null, 9, null)
                .singleNodeValue;
  return el;
}

exports = module.exports = { retrieveAndHighlight: retrieveAndHighlight };
