'use strict';

function highlight(document, pointers, xPathToElement) {
  var highlight = document.createElement('span');
  highlight.setAttribute('class', 'slink-highlight');
  var anchor = document.createElement('a');
  anchor.setAttribute('id', 'slink');
  anchor.setAttribute('name', 'slink');

  var startEl = xPathToElement(document, pointers.start.path);
  var endEl = xPathToElement(document, pointers.end.path);

  if (!startEl || !endEl) {
    return { err: "One or both selectors didn't evaluate.\n" +
                  pointers.start.path + "\n" + pointers.end.path };
  }

  // Make sure we're heading in the right direction.
  // DOCUMENT_POSITION_FOLLOWING = 0x04
  if (endEl.compareDocumentPosition(startEl) & 0x04) {
    var tmpEl = startEl;
    var tmpOffset = pointers.start.offset;
    startEl = endEl;
    pointers.start.offset = pointers.end.offset;
    endEl = tmpEl;
    pointers.end.offset = tmpOffset;
  }

  if (!pointers.start.offset || pointers.start.offset < 0 ||
      startEl.length === 0) {
    pointers.start.offset = 0;
  } else if (startEl.length > 0 && startEl.length <= pointers.start.offset) {
    pointers.start.offset = startEl.length - 1;
  }
  if (!pointers.end.offset || pointers.end.offset < 0 ||
      endEl.length === 0) {
    pointers.end.offset = 0;
  } else if (endEl.length > 0 && endEl.length <= pointers.end.offset) {
    pointers.end.offset = endEl.length - 1;
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

  // Insert anchor at beginning of selection.
  startEl.parentNode.insertBefore(anchor, startEl);

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

  return { dom: document };
}

if (exports && module.exports) {
  exports = module.exports = highlight;
}
