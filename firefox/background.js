'use strict';

const notify = message => {
  chrome.notifications.create({
    type: 'basic',
    title: chrome.runtime.getManifest().name,
    message,
    iconUrl: '/data/icons/48.png'
  });
};

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'possible-fingerprint') {
    chrome.pageAction.setIcon({
      tabId: sender.tab.id,
      path: {
        '16': 'data/icons/enabled/16.png',
        '19': 'data/icons/enabled/19.png',
        '32': 'data/icons/enabled/32.png',
        '38': 'data/icons/enabled/38.png',
        '48': 'data/icons/enabled/48.png',
        '64': 'data/icons/enabled/64.png'
      }
    });
    chrome.pageAction.show(sender.tab.id);
  }
  if (request.method === 'possible-fingerprint' && localStorage.getItem('notification') !== 'true') {
    const list = JSON.parse(localStorage.getItem('notification.list') || '[]');
    console.log(sender.tab);
    const {hostname} = new URL(sender.tab.url);
    if (list.indexOf(hostname) === -1) {
      notify(`Possible attempt to fingerprint from "${sender.tab.title}" is blocked.`);
    }
  }
});

// whitelist
window.list = JSON.parse(localStorage.getItem('list') || '[]');

const cache = {};
chrome.webNavigation.onCommitted.addListener(({tabId, frameId, url}) => {
  if (url.startsWith('http')) {
    if (frameId === 0) {
      const {hostname} = new URL(url);
      cache[tabId] = window.list.indexOf(hostname) !== -1;
    }
    if (cache[tabId]) {
      chrome.tabs.executeScript(tabId, {
        code: `try {
          script.dataset.active = false;
        } catch(e) {}`,
        frameId,
        runAt: 'document_start'
      });
    }
  }
});
chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

// context
{
  const startup = () => {
    chrome.contextMenus.create({
      id: 'add-to-whitelist',
      title: 'Allow Fingerprint for This Hostname',
      contexts: ['page_action']
    });
    chrome.contextMenus.create({
      id: 'disable-notification',
      title: 'Disable Notification for This Hostname',
      contexts: ['page_action']
    });
    chrome.contextMenus.create({
      id: 'test-fingerprint',
      title: 'Test Fingerprint Protection',
      contexts: ['page_action']
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'test-fingerprint') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/canvas-fingerprint/'
    });
  }
  else if (info.menuItemId === 'add-to-whitelist') {
    const url = tab.url || info.pageUrl;
    if (url && url.startsWith('http')) {
      const {hostname} = new URL(url);
      if (window.list.indexOf(hostname) === -1) {
        window.list.push(hostname);
        localStorage.setItem('list', JSON.stringify(window.list));
        notify(`"${hostname}" is added to the whitelist`);
      }
      else {
        notify('This hostname is already in your whitelist');
      }
    }
    else {
      notify('Cannot append this hostname to the whitelist');
    }
  }
  else if (info.menuItemId === 'disable-notification') {
    const url = tab.url || info.pageUrl;
    if (url && url.startsWith('http')) {
      const {hostname} = new URL(url);
      const list = JSON.parse(localStorage.getItem('notification.list') || '[]');
      if (list.indexOf(hostname) === -1) {
        list.push(hostname);
        localStorage.setItem('notification.list', JSON.stringify(list));
        notify(`"${hostname}" is added to the list`);
      }
      else {
        notify('This hostname is already in your list');
      }
    }
    else {
      notify('Cannot append this hostname to the list');
    }
  }
});
/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
