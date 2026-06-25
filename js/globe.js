(function () {
  'use strict';

  const canvas = document.getElementById('earth-globe');
  if (!canvas || canvas.tagName !== 'CANVAS') return;

  const SIZE = 720;
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // GIF source — browser decodes and advances frames automatically
  const src = new Image();
  src.crossOrigin = 'anonymous';
  src.src = '_knowledge/videos/gif-earth-slow.gif';

  // Off-screen buffer: always holds the latest GIF frame
  const buf = document.createElement('canvas');
  buf.width = buf.height = SIZE;
  const bufCtx = buf.getContext('2d', { willReadFrequently: true });

  // "Previous" buffer: snapshot of canvas just before a frame change
  const prev = document.createElement('canvas');
  prev.width = prev.height = SIZE;
  const prevCtx = prev.getContext('2d');

  let lastHash = -1;
  let blendT    = 1;          // 0 = fully previous frame, 1 = fully current
  const BLEND   = 16;         // rAF ticks to blend over (~270ms at 60fps)

  // Cheap frame-change detector: samples the center column of pixels
  function quickHash() {
    try {
      const px = bufCtx.getImageData(SIZE >> 1, 0, 1, SIZE >> 1);
      let h = 0;
      for (let i = 0; i < px.data.length; i += 16)
        h = Math.imul(h, 31) + px.data[i] | 0;
      return h;
    } catch (_) {
      // CORS fallback: always trigger blend (safe default)
      return Math.random() * 1e9 | 0;
    }
  }

  // Ease-in-out for a natural-looking cross-fade
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function draw() {
    if (!src.complete || !src.naturalWidth) {
      requestAnimationFrame(draw);
      return;
    }

    // Capture whatever frame the browser is showing right now
    bufCtx.drawImage(src, 0, 0, SIZE, SIZE);
    const hash = quickHash();

    if (hash !== lastHash) {
      // Frame changed — save current canvas output as the "from" state
      prevCtx.clearRect(0, 0, SIZE, SIZE);
      prevCtx.drawImage(canvas, 0, 0);
      lastHash = hash;
      blendT = 0;
    }

    ctx.clearRect(0, 0, SIZE, SIZE);

    if (blendT < 1) {
      // GPU-accelerated cross-fade: prev → current
      const a = easeInOut(blendT);
      ctx.globalAlpha = 1 - a;
      ctx.drawImage(prev, 0, 0);
      ctx.globalAlpha = a;
      ctx.drawImage(buf, 0, 0);
      ctx.globalAlpha = 1;
      blendT = Math.min(1, blendT + 1 / BLEND);
    } else {
      ctx.drawImage(buf, 0, 0);
    }

    requestAnimationFrame(draw);
  }

  function init() {
    prevCtx.drawImage(src, 0, 0, SIZE, SIZE);
    ctx.drawImage(src, 0, 0, SIZE, SIZE);
    draw();
  }

  if (src.complete && src.naturalWidth) init();
  else src.onload = init;
})();
