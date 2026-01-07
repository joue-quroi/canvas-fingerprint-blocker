async function canvasFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Canvas size
  canvas.width = 300;
  canvas.height = 150;

  // Background
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text
  ctx.textBaseline = 'top';
  ctx.font = '16px Arial';
  ctx.fillStyle = '#069';
  ctx.fillText('Canvas Fingerprint 🚀', 10, 10);

  ctx.font = '16px "Times New Roman"';
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('abcdefghijklmnopqrstuvwxyz', 10, 40);

  // Shapes
  ctx.strokeStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(80, 100, 40, 0, Math.PI * 2);
  ctx.stroke();

  // Get pixel data
  const dataURL = canvas.toDataURL();

  // Hash it (SHA-256)
  const encoder = new TextEncoder();
  const data = encoder.encode(dataURL);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

canvasFingerprint().then(fp => {
  console.log('Canvas fingerprint:', fp);
});
