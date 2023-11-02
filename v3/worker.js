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
    chrome.action.setIcon({
      tabId: sender.tab.id,
      path: {
        '16': '/data/icons/detected/16.png',
        '32': '/data/icons/detected/32.png',
        '48': '/data/icons/detected/48.png'
      }
    });
    chrome.action.setTitle({
      tabId: sender.tab.id,
      title: 'Possible fingerprinting detected'
    });
    chrome.storage.local.get({
      'notification': false,
      'notification.list': []
    }, prefs => {
      chrome.tabs.sendMessage(sender.tab.id, {
        tabId: sender.tab.id,
        method: 'report',
        message: `Possible attempt to fingerprint from "${sender.tab.title}" is blocked.`,
        prefs
      });
    });
  }
  else if (request.method === 'badge') {
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: request.text
    });
  }
  else if (request.method === 'notify') {
    notify(request.message);
  }
  else if (request.method === 'disabled') {
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: '×'
    });
    chrome.action.setTitle({
      tabId: sender.tab.id,
      title: 'Disabled on this page'
    });
  }
  else if (request.method === 'enabled') {
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: ''
    });
    chrome.action.setTitle({
      tabId: sender.tab.id,
      title: 'Enabled on this page (no fingerprinting is detected)'
    });
  }
});

const observe = () => observe.busy !== true && chrome.storage.local.get({
  enabled: true,
  list: []
}, async prefs => {
  observe.busy = true;
  try {
    await chrome.scripting.unregisterContentScripts();

    if (prefs.enabled) {
      const excludeMatches = [];
      if (prefs.list) {
        for (const s of prefs.list) {
          try {
            new self.URLPattern(`*://${s}/*`);
            excludeMatches.push(`*://${s}/*`);
          }
          catch (e) {
            console.info('ignored rule', e);
            // notify(s + ' rule is ignored.');
          }
          try {
            new self.URLPattern(`*://*.${s}/*`);
            excludeMatches.push(`*://*.${s}/*`);
          }
          catch (e) {
            console.info('ignored rule', e);
          }
        }
      }
      if (excludeMatches.length) {
        await chrome.scripting.registerContentScripts([{
          allFrames: true,
          matchOriginAsFallback: true,
          id: 'disabled',
          js: ['/data/inject/disabled.js'],
          matches: excludeMatches,
          runAt: 'document_start'
        }]);
      }

      // await chrome.scripting.registerContentScripts([{
      //   allFrames: true,
      //   matchOriginAsFallback: true,
      //   id: 'main',
      //   js: ['/data/inject/main.js'],
      //   matches: ['<all_urls>'],
      //   runAt: 'document_start',
      //   world: 'MAIN',
      //   excludeMatches
      // }]);
      // await chrome.scripting.registerContentScripts([{
      //   allFrames: true,
      //   matchOriginAsFallback: true,
      //   id: 'isolated',
      //   js: ['/data/inject/isolated.js'],
      //   matches: ['<all_urls>'],
      //   runAt: 'document_start',
      //   world: 'ISOLATED',
      //   excludeMatches
      // }]);

      chrome.action.setTitle({
        title: 'Globally Enabled'
      });
      chrome.action.setIcon({
        path: {
          '16': '/data/icons/enabled/16.png',
          '32': '/data/icons/enabled/32.png',
          '48': '/data/icons/enabled/48.png'
        }
      });
    }
    else {
      await chrome.scripting.registerContentScripts([{
        allFrames: true,
        matchOriginAsFallback: true,
        id: 'disabled',
        js: ['/data/inject/disabled.js'],
        matches: ['<all_urls>'],
        runAt: 'document_start'
      }]);
      chrome.action.setTitle({
        title: 'Globally Disabled'
      });
      chrome.action.setIcon({
        path: {
          '16': '/data/icons/16.png',
          '32': '/data/icons/32.png',
          '48': '/data/icons/48.png'
        }
      });
    }
  }
  catch (e) {
    console.error(e);
    notify('Unexpected Error: ' + e.message);
    // chrome.storage.local.set({
    //   enabled: false
    // });
  }
  observe.busy = false;
});
chrome.runtime.onInstalled.addListener(observe);
chrome.runtime.onStartup.addListener(observe);
chrome.storage.onChanged.addListener(ps => {
  if (ps.enabled || ps.list) {
    observe();
  }
});

// action
chrome.action.onClicked.addListener(() => chrome.storage.local.get({
  enabled: true
}, prefs => chrome.storage.local.set({
  enabled: !prefs.enabled
})));

// context
{
  const startup = () => {
    chrome.contextMenus.create({
      id: 'add-to-exception-list',
      title: 'Allow Fingerprint on This Hostname',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'disable-notification',
      title: 'Disable Notifications on This Hostname',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'test-fingerprint',
      title: 'Test Fingerprint Protection',
      contexts: ['action']
    });
  };
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'test-fingerprint') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/canvas-fingerprint/'
    });
  }
  else if (info.menuItemId === 'add-to-exception-list') {
    const url = tab.url || info.pageUrl;
    if (url && url.startsWith('http')) {
      const {hostname} = new URL(url);
      chrome.storage.local.get({
        list: []
      }, prefs => {
        if (prefs.list.includes(hostname) === false) {
          prefs.list.push(hostname);
          notify(`"${hostname}" is added to the exception list`);
          chrome.storage.local.set(prefs);
        }
        else {
          notify('This hostname is already in your exception list');
        }
      });
    }
    else {
      notify('Cannot append this hostname to the exception list');
    }
  }
  else if (info.menuItemId === 'disable-notification') {
    const url = tab.url || info.pageUrl;
    if (url && url.startsWith('http')) {
      const {hostname} = new URL(url);
      chrome.storage.local.get({
        'notification.list': []
      }, prefs => {
        if (prefs['notification.list'].includes(hostname) === false) {
          prefs['notification.list'].push(hostname);
          notify(`"${hostname}" is added to the list`);
          chrome.storage.local.set(prefs);
        }
        else {
          notify('This hostname is already in your list');
        }
      });
    }
    else {
      notify('Cannot append this hostname to the list');
    }
  }
});

// random generator
{
  const once = () => chrome.storage.local.set({
    red: Math.floor(Math.random() * 10) - 5,
    green: Math.floor(Math.random() * 10) - 5,
    blue: Math.floor(Math.random() * 10) - 5
  });
  chrome.runtime.onInstalled.addListener(once);
}

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
