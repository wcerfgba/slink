// ==UserScript==
// @name        slink
// @namespace   github.com/wcerfgba
// @include     *
// @version     1
// @grant       none
// ==/UserScript==

function slink() {
  var selection = window.getSelection();
  pointers = selectionToPointers(selection);
  highlight(pointers);
}
unsafeWindow.slink = slink;

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
   
    if (el.nodeType !== 3) { 
      xpath = el.nodeName + '[position()=' + pos + 
                             (el.id ? ' and @id="' + el.id + '"': '') + ']' +
                            '/' + xpath;
    } else {
      xpath = 'text()/' + xpath;
    }

    el = el.parentNode;
  }
  xpath = '/' + xpath;
  xpath = xpath.replace(/\/$/, '');
  return xpath;
}

function requestSlink(location, pointers) {
}

function highlight(pointers) {
  var highlight = document.createElement('span');
  highlight.style.background = 'yellow';
  highlight.style.padding = '2';

  var startEl = document.evaluate(pointers.start.path, document, null,
                                  XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        .singleNodeValue;
  var endEl = document.evaluate(pointers.end.path, document, null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                      .singleNodeValue;

  if (startEl.isEqualNode(endEl) && startEl.nodeType === 3) {
    startEl = startEl.splitText(pointers.start.offset);
    endEl = startEl.splitText(pointers.end.offset - pointers.start.offset);
  } else {
    if (startEl.nodeType === 3) {
      startEl = startEl.splitText(pointers.start.offset);
    }
    if (endEl.nodeType === 3) {
      endEl.splitText(pointers.end.offset);
    }
  }

  var next = startEl;
  while (next && !next.isEqualNode(endEl)) {
    var old = next;
    highlight.appendChild(next.cloneNode());
    while (!next.nextSibling && next.parentNode) {
      next = next.parentNode;
    }
    if (next.nextSibling) {
      next = next.nextSibling;
    }
    old.parentNode.removeChild(old);
  }

  endEl.parentNode.insertBefore(highlight, endEl);
}
