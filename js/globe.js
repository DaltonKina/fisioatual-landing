(function () {
  'use strict';

  const canvas = document.getElementById('earth-globe');
  if (!canvas || canvas.tagName !== 'CANVAS') return;

  const SIZE = 720;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const SPEED_FACTOR = 5;   // multiplica o delay original do GIF (5x = 5x mais lento)
  const BLEND_FRAMES = 10;  // quadros de cross-fade entre frames

  // ── LZW decoder ────────────────────────────────────────────────────────────
  function lzwDecode(minSize, data) {
    const clear = 1 << minSize, eof = clear + 1;
    let codeSize = minSize + 1, mask = (1 << codeSize) - 1;

    const makeTable = () => {
      const t = [];
      for (let i = 0; i < clear; i++) t[i] = [i];
      t[clear] = []; t[eof] = [];
      return t;
    };

    let table = makeTable(), next = eof + 1, prev = null;
    let buf = 0, bits = 0, di = 0;
    const out = [];

    const readCode = () => {
      while (bits < codeSize && di < data.length) {
        buf |= data[di++] << bits;
        bits += 8;
      }
      const c = buf & mask;
      buf >>= codeSize;
      bits -= codeSize;
      return c;
    };

    while (di < data.length) {
      const code = readCode();
      if (code === clear) {
        table = makeTable(); next = eof + 1;
        codeSize = minSize + 1; mask = (1 << codeSize) - 1;
        prev = null; continue;
      }
      if (code === eof) break;

      let entry;
      if (code < next) {
        entry = table[code];
      } else if (prev !== null) {
        entry = [...table[prev], table[prev][0]];
      } else break;

      for (const v of entry) out.push(v);

      if (prev !== null && next < 4096) {
        table[next++] = [...table[prev], entry[0]];
        if (next > mask + 1 && codeSize < 12) {
          codeSize++; mask = (1 << codeSize) - 1;
        }
      }
      prev = code;
    }
    return out;
  }

  // ── GIF parser ─────────────────────────────────────────────────────────────
  async function parseGIF(url) {
    const res = await fetch(url);
    const b = new Uint8Array(await res.arrayBuffer());
    let pos = 6;

    const gw = b[pos] | (b[pos + 1] << 8); pos += 2;
    const gh = b[pos] | (b[pos + 1] << 8); pos += 2;
    const pk0 = b[pos++]; pos += 2;

    let gct = null;
    if (pk0 >> 7) {
      const sz = 3 * (2 << (pk0 & 7));
      gct = b.slice(pos, pos + sz); pos += sz;
    }

    const compCanvas = document.createElement('canvas');
    compCanvas.width = gw; compCanvas.height = gh;
    const cc = compCanvas.getContext('2d');
    cc.fillStyle = '#000'; cc.fillRect(0, 0, gw, gh);

    const frames = [];
    let delay = 100, transpIdx = -1, disposal = 0, prevSnap = null;

    while (pos < b.length) {
      const id = b[pos++];

      if (id === 0x21) {
        const label = b[pos++];
        if (label === 0xF9) {
          pos++;
          const f = b[pos++];
          delay = (b[pos] | (b[pos + 1] << 8)) * 10; pos += 2;
          transpIdx = (f & 1) ? b[pos] : -1;
          disposal = (f >> 3) & 7;
          pos += 2;
        } else {
          while (true) { const sz = b[pos++]; if (!sz) break; pos += sz; }
        }
      } else if (id === 0x2C) {
        const fl = b[pos] | (b[pos + 1] << 8); pos += 2;
        const ft = b[pos] | (b[pos + 1] << 8); pos += 2;
        const fw = b[pos] | (b[pos + 1] << 8); pos += 2;
        const fh = b[pos] | (b[pos + 1] << 8); pos += 2;
        const pk2 = b[pos++];
        const interlaced = (pk2 >> 6) & 1;

        let ct = gct;
        if (pk2 >> 7) {
          const sz = 3 * (2 << (pk2 & 7));
          ct = b.slice(pos, pos + sz); pos += sz;
        }

        const minCode = b[pos++];
        const raw = [];
        while (true) { const sz = b[pos++]; if (!sz) break; for (let i = 0; i < sz; i++) raw.push(b[pos++]); }

        const indices = lzwDecode(minCode, raw);

        if (disposal === 2) cc.clearRect(fl, ft, fw, fh);
        else if (disposal === 3 && prevSnap) cc.putImageData(prevSnap, 0, 0);
        if (disposal === 3) prevSnap = cc.getImageData(0, 0, gw, gh);

        const img = cc.createImageData(fw, fh);

        let rowMap = null;
        if (interlaced) {
          rowMap = new Int32Array(fh);
          let r = 0;
          for (const [s, st] of [[0, 8], [4, 8], [2, 4], [1, 2]])
            for (let y = s; y < fh; y += st) rowMap[y] = r++;
        }

        for (let y = 0; y < fh; y++) {
          const sy = interlaced ? rowMap[y] : y;
          for (let x = 0; x < fw; x++) {
            const idx = indices[sy * fw + x];
            const dst = (y * fw + x) * 4;
            if (idx === transpIdx) {
              img.data[dst + 3] = 0;
            } else {
              img.data[dst] = ct[idx * 3];
              img.data[dst + 1] = ct[idx * 3 + 1];
              img.data[dst + 2] = ct[idx * 3 + 2];
              img.data[dst + 3] = 255;
            }
          }
        }

        cc.putImageData(img, fl, ft);
        const snap = cc.getImageData(0, 0, gw, gh);
        frames.push({ delay: Math.max(delay, 30), snap });
        disposal = 0; transpIdx = -1;

      } else if (id === 0x3B) break;
    }

    return { width: gw, height: gh, frames };
  }

  // ── Playback ───────────────────────────────────────────────────────────────
  parseGIF('_knowledge/videos/terski-earth-2768.gif').then(({ width, height, frames }) => {

    const offA = document.createElement('canvas');
    const offB = document.createElement('canvas');
    offA.width = offB.width = width;
    offA.height = offB.height = height;
    const ctxA = offA.getContext('2d');
    const ctxB = offB.getContext('2d');

    let fi = 0, prevFi = 0;
    let accum = 0, lastTs = null, blendTick = BLEND_FRAMES;

    function draw(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(ts - lastTs, 100);
      lastTs = ts;
      accum += dt;

      const frameDuration = frames[fi].delay * SPEED_FACTOR;

      if (accum >= frameDuration) {
        accum -= frameDuration;
        prevFi = fi;
        fi = (fi + 1) % frames.length;
        blendTick = 0;
      }

      ctx.clearRect(0, 0, SIZE, SIZE);

      if (blendTick < BLEND_FRAMES) {
        const alpha = blendTick / BLEND_FRAMES;
        ctxA.putImageData(frames[prevFi].snap, 0, 0);
        ctx.globalAlpha = 1 - alpha;
        ctx.drawImage(offA, 0, 0, SIZE, SIZE);

        ctxB.putImageData(frames[fi].snap, 0, 0);
        ctx.globalAlpha = alpha;
        ctx.drawImage(offB, 0, 0, SIZE, SIZE);

        ctx.globalAlpha = 1;
        blendTick++;
      } else {
        ctxA.putImageData(frames[fi].snap, 0, 0);
        ctx.drawImage(offA, 0, 0, SIZE, SIZE);
      }

      // Brilho atmosférico na borda
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.clip();
      const atm = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.42, SIZE / 2, SIZE / 2, SIZE / 2);
      atm.addColorStop(0, 'transparent');
      atm.addColorStop(1, 'rgba(80,180,255,0.20)');
      ctx.fillStyle = atm;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.restore();

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

  }).catch(err => {
    console.warn('GIF player error:', err);
    const img = document.createElement('img');
    img.src = '_knowledge/videos/terski-earth-2768.gif';
    img.style.cssText = 'position:absolute;width:100%;height:100%;top:0;left:0;';
    canvas.parentNode.insertBefore(img, canvas);
    canvas.style.display = 'none';
  });

})();
