(function () {
  'use strict';

  // Only for HTMLDocument. XMLDocument won't have HTMLCanvasElement child.
  if (document instanceof XMLDocument) {
    return;
  }

  var inject = function () {
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;

    HTMLCanvasElement.prototype.htGfd = function() {
      const {width, height} = this;
      const context = this.getContext('2d');
      const shift = {
        'r': Math.floor(Math.random() * 10) - 5,
        'g': Math.floor(Math.random() * 10) - 5,
        'b': Math.floor(Math.random() * 10) - 5
      };
      const matt = context.getImageData(0, 0, width, height);
      for (let i = 0; i < height; i += 3) {
        for (let j = 0; j < width; j += 3) {
          const n = ((i * (width * 4)) + (j * 4));
          matt.data[n + 0] = matt.data[n + 0] + shift.r;
          matt.data[n + 1] = matt.data[n + 1] + shift.g;
          matt.data[n + 2] = matt.data[n + 2] + shift.b;
        }
      }
      context.putImageData(matt, 0, 0);
      this.htGfd = () => {
        window.top.postMessage('htGfd-called', '*');
      };
      window.top.postMessage('htGfd-called', '*');
    };

    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function() {
        if (document.documentElement.dataset.htgfd !== 'false') {
          this.htGfd();
        }
        return toBlob.apply(this, arguments);
      }
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: function() {
        if (document.documentElement.dataset.htgfd !== 'false') {
          this.htGfd();
        }
        return toDataURL.apply(this, arguments);
      }
    });
    document.documentElement.dataset.htGfd = true;
  }

  var script = document.createElement('script');
  script.textContent = '(' + inject + ')();';
  document.documentElement.appendChild(script);
  // make sure the script is injected
  if (document.documentElement.dataset.htGfd !== 'true') {
    document.documentElement.dataset.htGfd = true;
    window.top.document.documentElement.appendChild(Object.assign(document.createElement('script'), {
      textContent: `
      [...document.querySelectorAll('iframe[sandbox]')]
        .filter(i => i.contentDocument.documentElement.dataset.htGfd === 'true')
        .forEach(i => {
          i.contentWindow.HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.toBlob;
          i.contentWindow.HTMLCanvasElement.prototype.toDataURL = HTMLCanvasElement.prototype.toDataURL;
          i.contentWindow.HTMLCanvasElement.prototype.htGfd = HTMLCanvasElement.prototype.htGfd;
        });
    `
    }));
  }
  delete document.documentElement.dataset.htGfd;

  window.addEventListener('message', ({ data }) => {
    if (data && data === 'htGfd-called') {
      chrome.runtime.sendMessage({
        method: 'possible-fingerprint'
      });
    }
  }, false);
})();
