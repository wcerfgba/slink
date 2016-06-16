// ==UserScript==
// @name        slink
// @namespace   github.com/wcerfgba
// @include     *
// @version     1
// @grant       none
// ==/UserScript==

function poll() {
  console.log('----- BEGIN slink -----');
  console.log(getSelection());
  console.log('----- END slink -----');
}
window.setInterval(poll, 1000);

function getSelection () {
  var selection = window.getSelection();
  var start = getPathTo(selection.anchorNode.parentNode);
  var end = getPathTo(selection.focusNode.parentNode);
  return { start: start, end: end };
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