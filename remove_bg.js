const sharp = require('sharp');

const BASE = 'C:/Users/dalto/OneDrive/Área de Trabalho/fisioatual-landing/_knowledge/fotos/produto/';

async function processImage(filename) {
  const input  = BASE + filename;
  const output = BASE + filename.replace('.png', '_t.png');

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  function lum(i) {
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  function sat(i) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  }
  // Pixel é candidato a fundo: claro E sem cor significativa
  function isBgPixel(i) {
    return lum(i) >= 215 && sat(i) < 0.18;
  }

  // 1) BFS flood-fill a partir das bordas (fundo externo conectado)
  const bgMask = new Uint8Array(width * height);
  const queue  = [];

  function tryEnqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const p = y * width + x;
    if (bgMask[p]) return;
    if (isBgPixel(p * channels)) {
      bgMask[p] = 1;
      queue.push(x, y);
    }
  }

  for (let x = 0; x < width; x++) { tryEnqueue(x, 0); tryEnqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { tryEnqueue(0, y); tryEnqueue(width - 1, y); }

  while (queue.length) {
    const y = queue.pop(), x = queue.pop();
    tryEnqueue(x - 1, y); tryEnqueue(x + 1, y);
    tryEnqueue(x, y - 1); tryEnqueue(x, y + 1);
  }

  // 2) Segunda varredura: brancos/cinzas interiores (não conectados à borda)
  //    Threshold mais agressivo: lum >= 240 E sat < 0.10 → só brancos muito puros
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (!bgMask[p] && lum(i) >= 240 && sat(i) < 0.10) {
      bgMask[p] = 1;
    }
  }

  // 3) Aplica transparência apenas nos pixels de fundo — sem recolorir nada
  for (let p = 0; p < width * height; p++) {
    if (bgMask[p]) {
      data[p * channels + 3] = 0;
    }
  }

  await sharp(Buffer.from(data), { raw: { width, height, channels } })
    .png()
    .toFile(output);

  console.log('Gerado:', output);
}

(async () => {
  await processImage('2patente2.png');
  await processImage('3patente1.png');
  console.log('Concluído.');
})().catch(console.error);
