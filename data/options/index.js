'use strict';

var info = document.getElementById('info');

document.getElementById('save').addEventListener('click', () => {
  localStorage.setItem('notification', document.getElementById('notification').checked);
  const list = document.getElementById('list').value
    .split(',')
    .map(s => s.trim())
    .map(s => s.startsWith('http') || s.startsWith('ftp') ? (new URL(s)).hostname : s)
    .filter((h, i, l) => h && l.indexOf(h) === i);
  localStorage.setItem('list', JSON.stringify(list));
  document.getElementById('list').value = list.join(', ');

  info.textContent = 'Options saved';
  window.setTimeout(() => info.textContent = '', 750);
});

document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: 'https://www.paypal.me/addondonation/10usd'
}));

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    info.textContent = 'Double-click to reset!';
    window.setTimeout(() => info.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});

document.getElementById('notification').checked = localStorage.getItem('notification') === 'true';
document.getElementById('list').value = JSON.parse(localStorage.getItem('list') || '[]').join(', ');
