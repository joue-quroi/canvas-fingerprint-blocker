const port = self.port = document.getElementById('cc-blck-fp');

if (port) {
  port.remove();
  try {
    if (window === parent) {
      throw Error('exception');
    }
    Object.assign(port.dataset, parent.port.dataset);
  }
  catch (e) {
    port.dataset.enabled = 'enabled' in self ? self.enabled : true;
    port.dataset.mode = 'session';
    port.dataset.red = Math.floor(Math.random() * 10) - 5;
    port.dataset.green = Math.floor(Math.random() * 10) - 5;
    port.dataset.blue = Math.floor(Math.random() * 10) - 5;
  }
  if (window.top === window) {
    if (port.dataset.enabled === 'true') {
      chrome.runtime.sendMessage({
        method: 'enabled'
      });
    }
  }

  port.addEventListener('manipulate', e => {
    e.stopPropagation();

    chrome.runtime.sendMessage({
      method: 'possible-fingerprint'
    });
  });

  chrome.storage.local.get({
    mode: 'session',
    red: 4,
    green: 4,
    blue: 4
  }, prefs => {
    port.dataset.mode = prefs.mode;
    if (prefs.mode === 'fixed') {
      port.dataset.red = prefs.red;
      port.dataset.green = prefs.green;
      port.dataset.blue = prefs.blue;
    }
  });

  chrome.storage.onChanged.addListener(ps => {
    if (ps.enabled) {
      self.enabled = ps.enabled.newValue;

      if (!('enabled' in self)) {
        port.dataset.enabled = ps.enabled.newValue;
      }
      if (window.top === window) {
        chrome.runtime.sendMessage({
          method: port.dataset.enabled === 'true' ? 'enabled' : 'disabled'
        });
      }
    }
    if (ps.mode) {
      port.dataset.mode = ps.port.newValue;
    }
  });

  if (window.top === window) {
    let count = 0;
    chrome.runtime.onMessage.addListener(request => {
      if (request.method === 'report') {
        count += 1;
        if (count === 1 && request.prefs.notification) {
          if (request.prefs['notification.list'].includes(location.host) === false) {
            chrome.runtime.sendMessage({
              method: 'notify',
              message: request.message
            });
          }
        }
        chrome.runtime.sendMessage({
          method: 'badge',
          text: count + ''
        });
      }
    });
  }
}
else {
  parent.postMessage('inject-script-into-source', '*');
}
