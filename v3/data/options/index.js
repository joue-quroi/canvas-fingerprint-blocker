'use strict';

const toast = document.getElementById('toast');

document.getElementById('save').addEventListener('click', () => {
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
  document.getElementById('notification.list').value = list.join(', ');

  chrome.storage.local.set({
    'notification': document.getElementById('notification').checked,
    'mode': document.getElementById('mode').value,
    'notification.list': nlist,
    list
  }, () => {
    toast.textContent = 'Options saved';
    setTimeout(() => toast.textContent = '', 750);
  });
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
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

chrome.storage.local.get({
  'notification': false,
  'notification.list': [],
  'list': [],
  'mode': 'session'
}, prefs => {
  document.getElementById('notification').checked = prefs.notification;
  document.getElementById('list').value = prefs.list.join(', ');
  document.getElementById('notification.list').value = prefs['notification.list'].join(', ');
  document.getElementById('mode').value = prefs.mode;
});

