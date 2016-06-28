'use strict';

//var endpoint = 'http://localhost:3000/new';
var endpoint = 'https://slink.to/new';

if (chrome && chrome.storage) {
  var storage;

  if (chrome.storage.sync) {
    storage = chrome.storage.sync;
  } else {
    storage = chrome.storage.local;
  }

  storage.get({ endpoint: endpoint },
    function (items) {
      endpoint = items.endpoint;
      slink();
  });
} else {
  slink();
}

function slink () {
  var selection = window.getSelection();
  if (!selection.anchorNode || !selection.focusNode ||
      selection.anchorNode.nodeName === 'BODY' ||
      selection.anchorNode.nodeName === 'HTML' ||
      selection.focusNode.nodeName === 'BODY' ||
      selection.focusNode.nodeName === 'HTML') {
        return;
  }
  var pointers = selectionToPointers(selection);
  requestSlink(document.URL, new XMLSerializer().serializeToString(document), pointers);
}

function selectionToPointers(selection) {
  var start = { path: getXPathForElement(selection.anchorNode), 
                offset: selection.anchorOffset };
  var end = { path: getXPathForElement(selection.focusNode),
              offset: selection.focusOffset };
  return { start: start, end: end };
}

// Based on code from: 
// https://developer.mozilla.org/en-US/docs/Web/XPath/Snippets#getXPathForElement
function getXPathForElement (el) {
  var xpath = '';
  var pos, tempitem2;
  while(el !== document) {   
    pos = 0;
    tempitem2 = el;
    while(tempitem2) {
      if (tempitem2.nodeName === el.nodeName) {
        pos += 1;
      }
      tempitem2 = tempitem2.previousSibling;
    }
   
    if (el.nodeType !== 3) { 
      xpath = el.nodeName + '[position()=' + pos + 
                             (el.id ? ' or @id="' + el.id + '"': '') + ']' +
                            '/' + xpath;
    } else {
      xpath = 'text()[position()=' + pos + ']/' + xpath;
    }

    el = el.parentNode;
  }
  xpath = '/' + xpath;
  xpath = xpath.replace(/\/$/, '');
  return xpath;
}

function xPathToElement (doc, path) {
  return doc.evaluate(path, doc, null,
                      XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        .singleNodeValue;
}

function requestSlink (location, text, pointers) {
  var data = JSON.stringify({ location: location, text: text, pointers: pointers });
  var req = new XMLHttpRequest();
  req.timeout = 60000;
  req.addEventListener('load', function (event) {
    if (req.status !== 200) {
      removeStatus();
      window.alert('slink encountered a server error: ' + req.status);
      return;
    }
    removeStatus();
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage(req.responseURL + '#slink');
    } else {
      window.location = req.responseURL + '#slink', '_blank';
    }
  });
  req.addEventListener('timeout', function (event) {
    removeStatus();
    window.alert('slink did not get a response from the server in time. You can try again.');
  });
  req.addEventListener('error', function (event) {
    window.alert('slink encountered an error. ' + req.statusText);
  });
    
  insertStatus('slink - Waiting for server for 60 seconds...');
  req.open('POST', endpoint);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(data);
}

function insertStatus (str) {
  var status = document.createElement('div');
  status.setAttribute('id', 'slink-status');
  status.setAttribute('style', 'position: fixed; top: 0; left: 0; right: 0; z-index: 99999999; background: #5d5; text-align: center;');
  status.innerHTML = str;
  document.body.appendChild(status);
}

function removeStatus () {
  var status = document.getElementById('slink-status');
  status.parentNode.removeChild(status);
}
