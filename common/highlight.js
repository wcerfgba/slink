'use strict';

function highlight(document, pointers, xPathToElement) {
  var highlight = document.createElement('span');
  highlight.className = 'slink-highlight';

  var startEl = xPathToElement(document, pointers.start.path);
  var endEl = xPathToElement(document, pointers.end.path);

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

  return document;
}

if (exports && module.exports) {
  exports = module.exports = highlight;
}
