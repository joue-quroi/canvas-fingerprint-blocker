'use strict';

const script = document.createElement('script');
script.dataset.active = true; // overwrites enabled or not
script.dataset.once = true; // only manipulate once
if (window.top === window) {
  window.script = script;
}
else {
  // try to get preferences from the top frame when possible
  try {
    Object.assign(script.dataset, window.top.script.dataset);
  }
  catch (e) {}
}

script.addEventListener('called', e => {
  e.preventDefault();
  e.stopPropagation();
  chrome.runtime.sendMessage({
    method: 'possible-fingerprint'
  });
}, false);

script.textContent = `
{
  const script = document.currentScript;
  script.dataset.injected = true;

  const toBlob = HTMLCanvasElement.prototype.toBlob;
  const toDataURL = HTMLCanvasElement.prototype.toDataURL;

  HTMLCanvasElement.prototype.manipulate = function() {
    const {width, height} = this;
    const context = this.getContext('2d');
    const shift = {
      'r': Math.floor(Math.random() * 10) - 5,
      'g': Math.floor(Math.random() * 10) - 5,
      'b': Math.floor(Math.random() * 10) - 5
    };
    const matt = context.getImageData(0, 0, width, height);
    for (let i = 0; i < height; i += Math.max(1, parseInt(height / 10))) {
      for (let j = 0; j < width; j += Math.max(1, parseInt(width / 10))) {
        const n = ((i * (width * 4)) + (j * 4));
        matt.data[n + 0] = matt.data[n + 0] + shift.r;
        matt.data[n + 1] = matt.data[n + 1] + shift.g;
        matt.data[n + 2] = matt.data[n + 2] + shift.b;
      }
    }
    context.putImageData(matt, 0, 0);
    if (script.dataset.once === 'true') {
      this.manipulate = () => {
        script.dispatchEvent(new Event('called'));
      };
    }
    script.dispatchEvent(new Event('called'));
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function() {
      if (script.dataset.active === 'true') {
        try {
          this.manipulate();
        }
        catch(e) {
          console.warn('manipulation failed', e);
        }
      }
      return toBlob.apply(this, arguments);
    }
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: function() {
      if (script.dataset.active === 'true') {
        try {
          this.manipulate();
        }
        catch(e) {
          console.warn('manipulation failed', e);
        }
      }
      return toDataURL.apply(this, arguments);
    }
  });
}`;
document.documentElement.appendChild(script);
// make sure the script is injected
if (script.dataset.injected !== 'true') {
  window.frameElement.classList.add('workaround');
  const polyscript = document.createElement('script');
  Object.assign(polyscript.dataset, script.dataset);
  polyscript.textContent = `
    for (const iframe of [...document.querySelectorAll('iframe.workaround')]) {
      try {
        Object.assign(iframe.contentWindow.HTMLCanvasElement.prototype, {
          toBlob: HTMLCanvasElement.prototype.toBlob,
          toDataURL: HTMLCanvasElement.prototype.toDataURL,
          manipulate: HTMLCanvasElement.prototype.manipulate
        });
      }
      catch (e) {}
      iframe.classList.remove('workaround');
    }
  `;
  window.top.document.documentElement.appendChild(polyscript);
  polyscript.remove();
}
script.remove();
