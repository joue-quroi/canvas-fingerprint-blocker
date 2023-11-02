/* global port */
self.enabled = false;

try {
  port.dataset.enabled = self.enabled;
}
catch (e) {}

if (window.top === window) {
  chrome.runtime.sendMessage({
    method: 'disabled'
  });
}
