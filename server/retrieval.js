'use strict';

var storage = require('./storage');
var request = require('request');
var jsdom = require('jsdom');
var diffDOM = require('diff-dom');
var url = require('url');
var highlight = require('../common/highlight');

// Set jsdom default features.
jsdom.defaultDocumentFeatures = {
  FetchExternalResources: false,
  ProcessExternalResources: false
};

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
      // Remove DOCTYPE, if any.
      //body = body.replace(/<!DOCTYPE[^>]*>/, '');

      pipeline(location, text, pointers, body, cb);
    });
}

function pipeline (location, clientText, pointers, reqText, cb) {
  // Build DOMs.
  var clientDOM = jsdom.jsdom(clientText);
  var reqDOM = jsdom.jsdom(reqText);

  // Diff DOMs. Ignore form fields.
  var diff = new diffDOM({ valueDiffing: false }).diff(clientDOM, reqDOM);
  // Skip removal of attributes, script elements, link elements.
  diff = diff.filter(function (diff) {
    if (diff.action === 'removeAttribute') {
      return false;
    }
    if (diff.action === 'removeElement' &&
        (diff.element.nodeName === 'SCRIPT' ||
         diff.element.nodeName === 'LINK')) {
      return false;
    }
    return true;
  });

  // Determine verification status as human-readable string.
  var verified = diff.length === 0 ? 'Yes' : 'No';

  // Build metadata.
  var metadata = { verified: verified, diff: diff,
                   retrieval_time: new Date(), location: location };

  // Highlight client document.
  clientDOM = highlight(clientDOM, pointers, xPathToElement);

  // Build and insert banner.
  
  // Serialize.
  var finalText = jsdom.serializeDocument(clientDOM);

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
