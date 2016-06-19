'use strict';

var storage = require('./storage');
var request = require('request');
var jsdom = require('jsdom').jsdom;
var serializeDocument = require('jsdom').serializeDocument;
var url = require('url');
var highlight = require('../common/highlight');

function retrieveAndHighlight (location, pointers, cb) {
  var body = '';
console.log("Requesting page: ", location);
  request({ url: location, headers: { 'User-Agent': 'slink' }, gzip: true })
    .on('data', function (data) {
      body += data;
    })
    .on('end', function () {
console.log("Finished retrieving page: " + body.length + " characters.");
      var highlighted = highlightWrapper(location, body, pointers);
      storage.add(highlighted, cb);
    });
}

function highlightWrapper (location, data, pointers) {
console.log("Highlighting...");
  var html = jsdom(data);
  html = serializeDocument(highlight(html, pointers, xPathToElement));

  // Replace relative links.
  var hrefRegex = /href=["']([^"']+)["']/gi;
  var srcRegex = /src=["']([^"']+)["']/gi;
  html = html.replace(hrefRegex, function (match, p1) {
    return 'href="' + url.resolve(location, p1) + '"';
  });
  html = html.replace(srcRegex, function (match, p1) {
    return 'src="' + url.resolve(location, p1) + '"';
  });

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
