import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OLIVE = '#2F4A2E';
const DEEP_GREEN = '#0D5132';
const SHADOW_GREEN = '#21482C';
const GOLD = '#D4AF37';
const WARM_WHITE = '#FAF9F6';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(scriptDir, '../assets/branding');
mkdirSync(outputDir, { recursive: true });

function rgba(hex, alpha = 255) {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    alpha,
  ];
}

function createCanvas(width, height, background = null) {
  const pixels = Buffer.alloc(width * height * 4);
  if (background) {
    const color = rgba(background);
    for (let i = 0; i < width * height; i += 1) {
      const offset = i * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }
  return { width, height, pixels };
}

function setPixel(canvas, x, y, color) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= canvas.width || iy >= canvas.height) return;
  const offset = (iy * canvas.width + ix) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  const existingAlpha = canvas.pixels[offset + 3] / 255;
  canvas.pixels[offset] = Math.round(color[0] * alpha + canvas.pixels[offset] * inverse);
  canvas.pixels[offset + 1] = Math.round(color[1] * alpha + canvas.pixels[offset + 1] * inverse);
  canvas.pixels[offset + 2] = Math.round(color[2] * alpha + canvas.pixels[offset + 2] * inverse);
  canvas.pixels[offset + 3] = Math.round(255 * (alpha + existingAlpha * inverse));
}

function fillCircle(canvas, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) setPixel(canvas, x, y, color);
    }
  }
}

function fillPolygon(canvas, points, color) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point[1]))));
  const maxY = Math.min(canvas.height - 1, Math.ceil(Math.max(...points.map((point) => point[1]))));

  for (let y = minY; y <= maxY; y += 1) {
    const scanY = y + 0.5;
    const intersections = [];
    for (let i = 0; i < points.length; i += 1) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
        intersections.push(x1 + ((scanY - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x += 1) {
        setPixel(canvas, x, y, color);
      }
    }
  }
}

function strokeLine(canvas, x1, y1, x2, y2, width, color) {
  const distance = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  const steps = Math.max(1, Math.ceil(distance));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    fillCircle(canvas, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
  }
}

function strokePolyline(canvas, points, width, color) {
  for (let i = 0; i + 1 < points.length; i += 1) {
    strokeLine(canvas, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], width, color);
  }
}

function transformPoint(point, scale, offsetX, offsetY) {
  return [point[0] * scale + offsetX, point[1] * scale + offsetY];
}

function drawOfficialMark(canvas, { scale = 1, offsetX = 0, offsetY = 0 } = {}) {
  const p = (point) => transformPoint(point, scale, offsetX, offsetY);
  const green = rgba(OLIVE);
  const deepGreen = rgba(DEEP_GREEN, 130);
  const shadowGreen = rgba(SHADOW_GREEN, 90);
  const gold = rgba(GOLD);
  const white = rgba(WARM_WHITE);

  const [sunX, sunY] = p([708, 285]);
  fillCircle(canvas, sunX, sunY, 116 * scale, gold);

  fillPolygon(
    canvas,
    [
      [70, 770], [208, 638], [286, 548], [360, 508], [431, 414], [548, 270],
      [643, 371], [715, 337], [786, 404], [846, 374], [957, 520], [1010, 770],
    ].map(p),
    green,
  );

  fillPolygon(
    canvas,
    [[70, 770], [360, 508], [431, 414], [548, 270], [512, 480], [355, 675], [70, 770]].map(p),
    deepGreen,
  );

  fillPolygon(
    canvas,
    [[70, 770], [355, 742], [540, 758], [748, 744], [1010, 770], [1010, 786], [70, 786]].map(p),
    shadowGreen,
  );

  const mainPath = [
    [548, 299], [539, 346], [526, 383], [541, 426], [585, 470], [634, 499],
    [662, 518], [638, 541], [596, 553], [544, 551], [491, 556], [437, 571],
    [392, 593], [365, 621], [371, 648], [405, 671], [451, 690], [490, 713],
    [517, 744], [530, 770],
  ].map(p);
  strokePolyline(canvas, mainPath, 54 * scale, white);

  strokePolyline(
    canvas,
    [[714, 365], [752, 406], [779, 389], [824, 436], [855, 474]].map(p),
    28 * scale,
    white,
  );

  strokePolyline(
    canvas,
    [[278, 560], [316, 526], [349, 563], [375, 556], [402, 583]].map(p),
    24 * scale,
    white,
  );
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), data.length + 8);
  return output;
}

function encodePng(canvas) {
  const { width, height, pixels } = canvas;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function savePng(name, canvas) {
  const path = resolve(outputDir, name);
  writeFileSync(path, encodePng(canvas));
  console.log(`generated ${path}`);
}

const icon = createCanvas(1024, 1024, WARM_WHITE);
drawOfficialMark(icon, { scale: 0.86, offsetX: 42, offsetY: 92 });
savePng('icon.png', icon);

const adaptive = createCanvas(1024, 1024);
drawOfficialMark(adaptive, { scale: 0.69, offsetX: 158, offsetY: 174 });
savePng('adaptive-icon.png', adaptive);

const splash = createCanvas(512, 512);
drawOfficialMark(splash, { scale: 0.43, offsetX: 38, offsetY: 76 });
savePng('splash-logo.png', splash);
