if (window.top === window) {
  chrome.runtime.sendMessage({
    method: 'disabled'
  });
}
