chrome.runtime.onMessage.addListener(function (address) {
  chrome.tabs.create({ url: address });
});

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript({ file: 'slink.js' });
});
