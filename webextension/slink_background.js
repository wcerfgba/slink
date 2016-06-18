chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(null, { file: 'highlight.js' });
  chrome.tabs.executeScript(null, { file: 'slink.js' });
});
