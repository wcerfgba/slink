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
  console.log(selection);
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
}

function requestSlink(location, pointers) {
}

function getPathTo(element) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName;

    var ix= 0;
    var siblings= element.parentNode.childNodes;
    for (var i= 0; i<siblings.length; i++) {
        var sibling= siblings[i];
        if (sibling===element)
            return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}
