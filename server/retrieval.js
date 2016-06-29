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
var templateDir = __dirname + '/../website/src/templates/';
var baseTemplateText =
      fs.readFileSync(templateDir + '/base.hbs').toString('utf8');
var footerTemplateText =
      fs.readFileSync(templateDir + '/footer.hbs').toString('utf8');
var bannerTemplateText =
      fs.readFileSync(__dirname + '/templates/banner.hbs').toString('utf8');
var verificationContentTemplateText =
      fs.readFileSync(templateDir + '/verification.hbs').toString('utf8');
var verificationTemplateText =
      fs.readFileSync(templateDir + '/verification-slink.hbs').toString('utf8');
hbs.registerPartial('base', baseTemplateText);
hbs.registerPartial('footer', footerTemplateText);
hbs.registerPartial('banner', bannerTemplateText);
hbs.registerPartial('verification', verificationContentTemplateText);
var bannerTemplate = hbs.compile(bannerTemplateText);
var verificationTemplate = hbs.compile(verificationTemplateText);

// Set jsdom default features.
jsdom.defaultDocumentFeatures = {
  FetchExternalResources: false,
  ProcessExternalResources: false
};

// For cleaning URLs.
var jsURLRegex = /["']javascript:[^"']*["']/gi;
var hrefRegex = /href=["']([^"']+)["']/gi;
var srcRegex = /src=["']([^"']+)["']/gi;

function highlightAndInsert (location, clientText, pointers, serverRoot, cb) {
  // Strip JavaScript URLs.
  clientText = clientText.replace(jsURLRegex, '""');

  // Build DOM.
  console.log("Building DOM...");
  var clientDOM = jsdom.jsdom(clientText);

  // Set verification as In Progress
  var verified = 'In Progress';

  // Get ID from storage.
  storage.nextID(function (err, id) {
    if (err) {
      return cb(err);
    }

    // Build metadata. This is a bit bloated because we also use it for the 
    // template parameters.
    var metadata = { id: id, verified: verified, slink_time: new Date(),
                     location: location, serverRoot: serverRoot };

    // Highlight client document.
    console.log("Highlighting...");
    var highlighted = highlight(clientDOM, pointers, xPathToElement);

    if (highlighted.err) {
      return cb(highlighted.err);
    } else {
      clientDOM = highlighted.dom;
    }

    // Build and insert banner and CSS link.
    console.log("Inserting banner...");
    var bannerDOM = jsdom.jsdom(bannerTemplate(metadata));
    var banner = bannerDOM.getElementsByClassName('slink-banner')[0];
    var bannerSpacer = bannerDOM.getElementsByClassName('slink-banner-spacer')[0];
    var cssLinkText = '<link href="' + serverRoot + '/slink.css" rel="stylesheet">';
    var cssLink = jsdom.jsdom(cssLinkText) .getElementsByTagName('link')[0];

    // If we're slinking a slink, update the banner.
    var existingBanner = clientDOM.getElementsByClassName('slink-banner')[0];
    if (existingBanner) {
      existingBanner.innerHTML = banner.innerHTML;
    } else {
      clientDOM.body.insertBefore(bannerSpacer, clientDOM.body.firstChild);
      clientDOM.body.insertBefore(banner, clientDOM.body.firstChild);
      clientDOM.head.appendChild(cssLink);
    }

    // Serialize.
    var slinkText = jsdom.serializeDocument(clientDOM);

    // Replace relative links.
    console.log("Replacing relative links...");
    slinkText = slinkText.replace(hrefRegex, function (match, p1) {
      return 'href="' + url.resolve(location, p1) + '"';
    });
    slinkText = slinkText.replace(srcRegex, function (match, p1) {
      return 'src="' + url.resolve(location, p1) + '"';
    });

    // Send to storage with metadata and callback.
    console.log("Storing...");
    storage.addSlink(slinkText, metadata, cb);
  });
}

function validate (id, serverRoot) {
  var cb = function (err, data) {
    if (err) {
      return console.error(err);
    }

    // GET location and send everything through the pipeline.
    var body = '';
    console.log("Requesting page: ", data.metadata.location);
    request({ url: data.metadata.location,
              headers: { 'User-Agent': 'slink' }, gzip: true })
      .on('data', function (data) {
        body += data;
      })
      .on('end', function () {
        console.log('Finished retrieving page: ' + body.length + ' characters.');

        validatePipeline(data, body, serverRoot);
      });
  };
  storage.getSlink(id, cb);
}

function validatePipeline (slink, reqText, serverRoot) {
  // Strip JavaScript URLs.
  var clientText = slink.slinkText.replace(jsURLRegex, '""');
  reqText = reqText.replace(jsURLRegex, '""');

  // Build DOMs.
  console.log("Building DOMs...");
  var clientDOM = jsdom.jsdom(clientText);
  var reqDOM = jsdom.jsdom(reqText);

  // Diff DOMs. Ignore form fields.
  console.log("Diffing DOMs...");
  var diff = new diffDOM({ valueDiffing: false }).diff(clientDOM, reqDOM);
  // Skip removal of attributes, script elements, link elements.
  diff = diff.filter(function (change) {
    if (change.action === 'removeAttribute') {
      return false;
    }
    if (change.action === 'removeElement' &&
        (change.element.nodeName === 'SCRIPT' ||
         change.element.nodeName === 'STYLE' ||
         change.element.nodeName === 'LINK')) {
      return false;
    }
    return true;
  });

  // Determine verification status as human-readable string.
  var verified = diff.length === 0 ? 'Yes' : 'No';

  // Build metadata. This is a bit bloated because we also use it for the 
  // template parameters.
  var metadata = { id: slink.metadata.id, verified: verified,
                   diff: JSON.stringify(diff, null, 2),
                   slink_time: slink.metadata.slink_time,
                   validate_time: new Date(),
                   location: slink.metadata.location,
                   title: 'Verification for ' + slink.metadata.id,
                   serverRoot: serverRoot };

  // Update banner.
  console.log("Updating banner...");
  var bannerDOM = jsdom.jsdom(bannerTemplate(metadata));
  var banner = bannerDOM.getElementsByClassName('slink-banner')[0];

  // If we're slinking a slink, update the banner.
  var existingBanner = clientDOM.getElementsByClassName('slink-banner')[0];
  if (existingBanner) {
    existingBanner.innerHTML = banner.innerHTML;
  } else {
    console.error('Tried to update non-existent banner!');
  }

  // Serialize.
  var slinkText = jsdom.serializeDocument(clientDOM);

  // Build verification page.
  var verification = verificationTemplate(metadata);
  
  // Send to storage with metadata and callback.
  console.log("Storing...");
  storage.updateSlinkAndAddVerification(slinkText, metadata, verification,
    function (err, data) {
      if (err) {
        return console.error(err);
      }
    });
}

function xPathToElement (doc, path) {
  // FIRST_ORDERED_NODE_TYPE = 9
  var el = doc.evaluate(path, doc, null, 9, null).singleNodeValue;
  return el;
}

exports = module.exports = { validate: validate,
                             highlightAndInsert: highlightAndInsert };
