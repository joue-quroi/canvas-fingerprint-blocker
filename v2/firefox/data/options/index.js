'use strict';

const toast = document.getElementById('toast');

document.getElementById('save').addEventListener('click', () => {
  localStorage.setItem('notification', document.getElementById('notification').checked);
  {
    const list = document.getElementById('list').value
      .split(',')
      .map(s => s.trim())
      .map(s => s.startsWith('http') || s.startsWith('ftp') ? (new URL(s)).hostname : s)
      .filter((h, i, l) => h && l.indexOf(h) === i);
    localStorage.setItem('list', JSON.stringify(list));

    document.getElementById('list').value = list.join(', ');

    localStorage.setItem('mode', document.getElementById('mode').value);

    // update preference
    chrome.runtime.getBackgroundPage(bg => {
      bg.prefs.list = list;
      bg.prefs.mode = document.getElementById('mode').value;
    });
  }
  {
    const list = document.getElementById('notification.list').value
      .split(',')
      .map(s => s.trim())
      .map(s => s.startsWith('http') || s.startsWith('ftp') ? (new URL(s)).hostname : s)
      .filter((h, i, l) => h && l.indexOf(h) === i);
    localStorage.setItem('notification.list', JSON.stringify(list));
    document.getElementById('notification.list').value = list.join(', ');
  }
  toast.textContent = 'Options saved';
  window.setTimeout(() => toast.textContent = '', 750);
});

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    window.setTimeout(() => toast.textContent = '', 750);
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

document.getElementById('notification').checked = localStorage.getItem('notification') === 'true';
document.getElementById('list').value = JSON.parse(localStorage.getItem('list') || '[]').join(', ');
document.getElementById('notification.list').value = JSON.parse(localStorage.getItem('notification.list') || '[]').join(', ');
document.getElementById('mode').value = localStorage.getItem('mode') || 'random';
