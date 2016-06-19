'use strict';

var storage = require('./storage');
var request = require('request');
var jsdom = require('jsdom').jsdom;
var serializeDocument = require('jsdom').serializeDocument;
var url = require('url');
var highlight = require('../common/highlight');

function retrieve (location, text, pointers, cb) {
  // GET location and send everything through the pipeline.
  var body = '';
  console.log("Requesting page: ", location);
  request({ url: location, headers: { 'User-Agent': 'slink' }, gzip: true })
    .on('data', function (data) {
      body += data;
    })
    .on('end', function () {
      console.log("Finished retrieving page: " + body.length + " characters.");
      pipeline(location, text, pointers, body, cb);
    });
}

function pipeline (location, clientText, pointers, reqText, cb) {
  // Build DOMs.
  var clientDOM = jsdom(clientText);
  var reqDOM = jsdom(reqText);

  // Diff DOMs.
  var diff = new diffDOM().diff(clientDOM, reqDOM);
console.log(diff);

  // Set metadata. In particular, verified is 'Yes' if the diff is empty.
  var metadata = { verified: diff.length === 0 ? 'Yes' : 'No',
                   retrieval_time: new Date(),
                   location: location };

  // Highlight client document.
  clientDOM = highlight(clientDOM, pointers, xPathToElement);

  // Build and insert banner.
  
  // Serialize.
  var finalText = serializeDocument(clientDOM);

  // Replace relative links.
  var hrefRegex = /href=["']([^"']+)["']/gi;
  var srcRegex = /src=["']([^"']+)["']/gi;
  finalText = finalText.replace(hrefRegex, function (match, p1) {
    return 'href="' + url.resolve(location, p1) + '"';
  });
  finalText = finalText.replace(srcRegex, function (match, p1) {
    return 'src="' + url.resolve(location, p1) + '"';
  });

  // Send to storage with metadata and callback.
  storage.add(finalText, metadata, cb);
}

function xPathToElement (doc, path) {
  path = path.toLowerCase();
  // FIRST_ORDERED_NODE_TYPE = 9
  var el = doc.evaluate(path, doc, null, 9, null)
                .singleNodeValue;
  return el;
}

exports = module.exports = { retrieve: retrieve };
