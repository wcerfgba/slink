'use strict';

slink();

function slink() {
  var selection = window.getSelection();
  if (!selection.anchorNode || !selection.focusNode ||
      selection.anchorNode.nodeName === 'BODY' ||
      selection.anchorNode.nodeName === 'HTML' ||
      selection.focusNode.nodeName === 'BODY' ||
      selection.focusNode.nodeName === 'HTML') {
        return;
  }
  var pointers = selectionToPointers(selection);
console.log(pointers);
  highlight(pointers);
}

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

// Based on code from
// https://developer.mozilla.org/en-US/docs/Web/XPath/Snippets#getXPathForElement
function getXPathForElement(el) {
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

function requestSlink(location, pointers) {
}

function highlight(pointers) {
  var highlight = document.createElement('span');
  highlight.className = 'slink-highlight';

  var startEl = document.evaluate(pointers.start.path, document, null,
                                  XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        .singleNodeValue;
  var endEl = document.evaluate(pointers.end.path, document, null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                      .singleNodeValue;

  // Make sure we're heading in the right direction.
  if (endEl.compareDocumentPosition(startEl) & 
        Node.DOCUMENT_POSITION_FOLLOWING) {
    var tmpEl = startEl;
    var tmpOffset = pointers.start.offset;
    startEl = endEl;
    pointers.start.offset = pointers.end.offset;
    endEl = tmpEl;
    pointers.end.offset = tmpOffset;
  }

  if (startEl === endEl && startEl.nodeType === 3) {
    startEl = startEl.splitText(pointers.start.offset);
    startEl.splitText(pointers.end.offset - pointers.start.offset);
    endEl = startEl;
  } else {
    if (startEl.nodeType === 3) {
      startEl = startEl.splitText(pointers.start.offset);
    }
    if (endEl.nodeType === 3) {
      endEl.splitText(pointers.end.offset);
    }
  }

  var next = startEl;
  outer:
  while (next) {
    // If we have subnodes, descend, unless we are at the end.
    if (next.hasChildNodes()) {
      next = next.firstChild;
      continue;
    }

    // Replace node with highlight.
    var replacement = highlight.cloneNode(true);
    replacement.appendChild(next.cloneNode(true));
    var replaced = next.parentNode.replaceChild(replacement, next);
    next = replacement;

    // Break if we've hit the end.
    if (replaced === endEl) {
      break;
    }

    // Go to next sibling, moving up hierarchy until we can move forward.
    while (!next.nextSibling) {
      next = next.parentNode;

      // Break outer if we're coming out of the end element.
      if (next === endEl) {
        break outer;
      }
    }
    next = next.nextSibling;
  }
}
