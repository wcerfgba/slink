// ==UserScript==
// @name        slink
// @namespace   github.com/wcerfgba
// @include     *
// @version     1
// @grant       none
// ==/UserScript==

var lastSelection = null;
function pollSelection() {
  console.log('----- BEGIN slink pollSelection() -----');
  var selection = selectionCopy(window.getSelection());
  if (!lastSelection) {
    lastSelection = selection;
    return;
  }
  if (selectionEqual(selection, lastSelection)) {
    return;
  }
  lastSelection = selection;
  console.log(selectionToPointers(selection).start.path);
  console.log('----- END slink pollSelection() -----');
}
window.setInterval(pollSelection, 1000);

function selectionCopy(selection) {
  return { anchorNode: selection.anchorNode,
           anchorOffset: selection.anchorOffset,
           focusNode: selection.focusNode,
           focusOffset: selection.focusOffset };
}

function selectionEqual(a, b) {
  return a.anchorNode.isEqualNode(b.anchorNode) &&
         a.anchorOffset === b.anchorOffset &&
         a.focusNode.isEqualNode(b.focusNode) &&
         a.focusOffset === b.focusOffset;
}

function selectionToPointers(selection) {
  var start = { path: getXPathForElement(selection.anchorNode), 
                offset: selection.anchorOffset };
  var end = { path: getXPathForElement(selection.focusNode),
              offset: selection.focusOffset };
  return { start: start, end: end };
}

// From https://developer.mozilla.org/en-US/docs/Web/XPath/Snippets#getXPathForElement
function getXPathForElement(el) {
  xml = window.document;
  var xpath = '';
  var pos, tempitem2;
  while(el !== xml) {   
    pos = 0;
    tempitem2 = el;
    while(tempitem2) {
      if (tempitem2.nodeType === 1 && tempitem2.nodeName === el.nodeName) {
        pos += 1;
      }
      tempitem2 = tempitem2.previousSibling;
    }
    
    xpath = "*[name()='"+el.nodeName+
            "' and id()='"+(el.id===null?'':el.id)+"']["+pos+']'+'/'+xpath;

    el = el.parentNode;
  }
  xpath = '/*'+"[name()='"+xml.nodeName+
          "' and id()='"+(el.id===null?'':el.id)+"']"+'/'+xpath;
  xpath = xpath.replace(/\/$/, '');
  return xpath;
}

function requestSlink(location, pointers) {
}

