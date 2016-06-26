var storage = chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;

// Saves options to chrome.storage.sync.
function save_options() {
var endpoint = document.getElementById('endpoint').value;
storage.set({ endpoint: endpoint }, function () {
  // Update status to let user know options were saved.
  var status = document.getElementById('status');
  status.textContent = 'Saved.';
  setTimeout(function() {
    status.textContent = '';
  }, 750);
});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
storage.get(
  { endpoint: 'https://slink.to/new' }, function (items) {
    document.getElementById('endpoint').value = items.endpoint;
});
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
