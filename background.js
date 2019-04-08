'use strict';

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'possible-fingerprint') {
    if (localStorage.getItem('notification') !== 'true' && request.notification) {
      chrome.notifications.create({
        type: 'basic',
        title: chrome.runtime.getManifest().name,
        message: `Possible attempt to fingerprint from "${sender.tab.title}" is blocked.`,
        iconUrl: '/data/icons/48.png'
      });
    }
    chrome.browserAction.setBadgeText({ text: request.count.toString(), tabId: sender.tab.id });
  }
});

// whitelist
const cache = {};
chrome.webNavigation.onCommitted.addListener(({tabId, frameId, url}) => {
  if (url.startsWith('http')) {
    if (frameId === 0) {
      chrome.tabs.executeScript(tabId, {
        code: `(() => {
          const list = JSON.parse('${localStorage.getItem('list') || '[]'}');
          if (list.indexOf(location.hostname) !== -1) {
            document.documentElement.dataset.htgfd = false;
            return true;
          }
          return false;
        })()`,
        frameId,
        runAt: 'document_start'
      }, a => cache[tabId] = a[0]);
    }
    else if (cache[tabId]) {
      chrome.tabs.executeScript(tabId, {
        code: 'document.documentElement.dataset.htgfd = false;',
        frameId,
        runAt: 'document_start'
      });
    }
  }
});
chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1,
  'last-update': 0,
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 30 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        });
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
  );
}
