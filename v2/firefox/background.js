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
    const {hostname} = new URL(sender.tab.url);
    if (list.indexOf(hostname) === -1) {
      notify(`Possible attempt to fingerprint from "${sender.tab.title}" is blocked.`);
    }
  }
});

// whitelist
const prefs = window.prefs = {
  list: JSON.parse(localStorage.getItem('list') || '[]'),
  mode: localStorage.getItem('mode') || 'random', // 'random', 'session', 'fixed'
  red: Number(localStorage.getItem('red') || 2),
  green: Number(localStorage.getItem('green') || 1),
  blue: Number(localStorage.getItem('blue') || -2)
};

const cache = {};
chrome.webNavigation.onCommitted.addListener(({tabId, frameId, url}) => {
  if (url.startsWith('http')) {
    if (frameId === 0) {
      const {hostname} = new URL(url);
      cache[tabId] = prefs.list.indexOf(hostname) !== -1;
    }
    chrome.tabs.executeScript(tabId, {
      code: `
try {
  script.dataset.active = ${cache[tabId] !== true};
  script.dataset.mode = '${prefs.mode}';
  if (${prefs.mode === 'fixed'}) {
    script.dataset.red = '${prefs.red}';
    script.dataset.green = '${prefs.green}';
    script.dataset.blue = '${prefs.blue}';
  }
} catch(e) {
  window.active = ${cache[tabId] !== true};
  window.mode = '${prefs.mode}';
  if (${prefs.mode === 'fixed'}) {
    window.rnd = {
      r: ${prefs.red},
      g: ${prefs.green},
      b: ${prefs.blue},
    };
  }
}
      `,
      frameId,
      runAt: 'document_start'
    });
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
      if (prefs.list.indexOf(hostname) === -1) {
        prefs.list.push(hostname);
        localStorage.setItem('list', JSON.stringify(prefs.list));
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
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
