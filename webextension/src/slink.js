'use strict';
console.log("loaded");
var endpoint = 'http://localhost:3000/new';

slink();

function slink () {
console.log("slinkin...");
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
                             (el.id ? ' and @id="' + el.id + '"': '') + ']' +
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
  req.timeout = 10000;
  req.onload = function () {
    console.log(this.responseURL);
    window.open(this.responseURL + '#slink', '_blank');
  };
  req.open('POST', endpoint);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(data);
}
