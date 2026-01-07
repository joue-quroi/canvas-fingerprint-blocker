'use strict';

const toast = document.getElementById('toast');

const save = () => {
  const list = document.getElementById('list').value
    .split(',')
    .map(s => s.trim())
    .map(s => s.startsWith('http') || s.startsWith('ftp') ? (new URL(s)).hostname : s)
    .filter((h, i, l) => h && l.indexOf(h) === i);
  document.getElementById('list').value = list.join(', ');

  const nlist = document.getElementById('notification.list').value
    .split(',')
    .map(s => s.trim())
    .map(s => s.startsWith('http') || s.startsWith('ftp') ? (new URL(s)).hostname : s)
    .filter((h, i, l) => h && l.indexOf(h) === i);
  document.getElementById('notification.list').value = nlist.join(', ');

  chrome.storage.local.set({
    'notification': document.getElementById('notification').checked,
    'faqs': document.getElementById('faqs').checked,
    'mode': document.getElementById('mode').value,
    'notification.list': nlist,
    list
  }, () => {
    toast.textContent = 'Options saved';
    setTimeout(() => toast.textContent = '', 750);
  });
};

document.getElementById('save').addEventListener('click', save);

window.addEventListener('keydown', e => {
  if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    save();
  }
});

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url + '?rd=donate',
      index: tabs[0].index + 1,
      openerTabId: tabs[0].id
    });
  });
});
// test
document.getElementById('test').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/canvas-fingerprint/',
      index: tabs[0].index + 1,
      openerTabId: tabs[0].id
    });
  });
});

chrome.storage.local.get({
  'notification': false,
  'faqs': true,
  'notification.list': [],
  'list': [],
  'mode': 'session'
}, prefs => {
  document.getElementById('notification').checked = prefs.notification;
  document.getElementById('faqs').checked = prefs.faqs;
  document.getElementById('list').value = prefs.list.join(', ');
  document.getElementById('notification.list').value = prefs['notification.list'].join(', ');
  document.getElementById('mode').value = prefs.mode;
});

