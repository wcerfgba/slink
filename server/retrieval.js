'use strict';

var fs = require('fs');
var storage = require('./storage');
var request = require('request');
var jsdom = require('jsdom');
var diffDOM = require('diff-dom');
var url = require('url');
var highlight = require('../common/highlight');
var hbs = require('handlebars');

// Compile templates.
// From http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
hbs.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if( lvalue!=rvalue ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});
var templateDir = __dirname + '/templates/';
var bannerTemplateText = fs.readFileSync(templateDir + '/banner.hbs')
                           .toString('utf8');
var verificationTemplateText = fs.readFileSync(templateDir + '/verification.hbs')
                                 .toString('utf8');
hbs.registerPartial('banner', bannerTemplateText);
var bannerTemplate = hbs.compile(bannerTemplateText);
var verificationTemplate = hbs.compile(verificationTemplateText);

// Set jsdom default features.
jsdom.defaultDocumentFeatures = {
  FetchExternalResources: false,
  ProcessExternalResources: false
};

function retrieve (location, text, pointers, serverRoot, cb) {
  // GET location and send everything through the pipeline.
  var body = '';
  console.log("Requesting page: ", location);
  request({ url: location, headers: { 'User-Agent': 'slink' }, gzip: true })
    .on('data', function (data) {
      body += data;
    })
    .on('end', function () {
      console.log("Finished retrieving page: " + body.length + " characters.");

      pipeline(location, text, pointers, body, serverRoot, cb);
    });
}

function pipeline (location, clientText, pointers, reqText, serverRoot, cb) {
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

  // Get ID from storage.
  storage.nextID(function (err, id) {
    if (err) {
      return cb(err);
    }

    // Build metadata.
    var metadata = { id: id, verified: verified, diff: diff,
                     retrieval_time: new Date(), location: location,
                     serverRoot: serverRoot };

    // Highlight client document.
    clientDOM = highlight(clientDOM, pointers, xPathToElement);

    // Build and insert banner and CSS link.
    var bannerDOM = jsdom.jsdom(bannerTemplate(metadata));
    var banner = bannerDOM.getElementsByClassName('slink-banner')[0];
    var bannerSpacer = bannerDOM.getElementsByClassName('slink-banner-spacer')[0];
    var cssLinkText = '<link href="' + serverRoot + 
                      '/slink-banner.css" rel="stylesheet">';
    var cssLink = jsdom.jsdom(cssLinkText) .getElementsByTagName('link')[0];
    clientDOM.body.insertBefore(bannerSpacer, clientDOM.body.firstChild);
    clientDOM.body.insertBefore(banner, clientDOM.body.firstChild);
    clientDOM.head.appendChild(cssLink);

    // Build verification page.
    var verification = verificationTemplate(metadata);
    
    // Serialize.
    var slinkText = jsdom.serializeDocument(clientDOM);

    // Replace relative links.
    var hrefRegex = /href=["']([^"']+)["']/gi;
    var srcRegex = /src=["']([^"']+)["']/gi;
    slinkText = slinkText.replace(hrefRegex, function (match, p1) {
      return 'href="' + url.resolve(location, p1) + '"';
    });
    slinkText = slinkText.replace(srcRegex, function (match, p1) {
      return 'src="' + url.resolve(location, p1) + '"';
    });

    // Send to storage with metadata and callback.
    storage.add(slinkText, verification, metadata, cb);
  });
}

function xPathToElement (doc, path) {
  path = path.toLowerCase();
  // FIRST_ORDERED_NODE_TYPE = 9
  var el = doc.evaluate(path, doc, null, 9, null)
                .singleNodeValue;
  return el;
}

exports = module.exports = { retrieve: retrieve };
