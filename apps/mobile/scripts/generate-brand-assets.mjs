import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OLIVE = '#2F4A2E';
const GOLD = '#D4AF37';
const LIMESTONE = '#E7E1D6';
const WARM_WHITE = '#FAF9F6';
const INK = '#172019';

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
  canvas.pixels[offset] = Math.round(color[0] * alpha + canvas.pixels[offset] * inverse);
  canvas.pixels[offset + 1] = Math.round(color[1] * alpha + canvas.pixels[offset + 1] * inverse);
  canvas.pixels[offset + 2] = Math.round(color[2] * alpha + canvas.pixels[offset + 2] * inverse);
  canvas.pixels[offset + 3] = Math.round(255 * (alpha + (canvas.pixels[offset + 3] / 255) * inverse));
}

function fillCircle(canvas, cx, cy, radius, color) {
  const r2 = radius * radius;
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
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
      const start = Math.ceil(intersections[i]);
      const end = Math.floor(intersections[i + 1]);
      for (let x = start; x <= end; x += 1) setPixel(canvas, x, y, color);
    }
  }
}

function fillEllipse(canvas, cx, cy, rx, ry, angleDegrees, color) {
  const angle = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const bound = Math.ceil(Math.max(rx, ry));
  for (let y = Math.floor(cy - bound); y <= Math.ceil(cy + bound); y += 1) {
    for (let x = Math.floor(cx - bound); x <= Math.ceil(cx + bound); x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      if ((localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1) {
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

function drawMark(canvas, { scale = 1, offsetX = 0, offsetY = 0, onDark = true } = {}) {
  const p = (point) => transformPoint(point, scale, offsetX, offsetY);
  const white = rgba(WARM_WHITE);
  const limestone = rgba(LIMESTONE);
  const olive = rgba(OLIVE);
  const gold = rgba(GOLD);
  const ink = rgba(INK);

  const [sunX, sunY] = p([352, 150]);
  fillCircle(canvas, sunX, sunY, 74 * scale, gold);

  fillPolygon(
    canvas,
    [[62, 324], [188, 142], [258, 235], [311, 169], [421, 324]].map(p),
    onDark ? white : olive,
  );

  fillPolygon(
    canvas,
    [[188, 142], [216, 180], [234, 158], [261, 193], [279, 169], [311, 214], [284, 198], [258, 219], [228, 202], [201, 214], [166, 191], [62, 324]].map(p),
    onDark ? olive : WARM_WHITE === '#FAF9F6' ? white : white,
  );

  const pathPoints = [
    [205, 214], [232, 229], [260, 245], [281, 264], [290, 282], [282, 301],
    [263, 316], [238, 330], [219, 347], [219, 367], [244, 391], [282, 411],
  ].map(p);
  strokePolyline(canvas, pathPoints, 28 * scale, onDark ? limestone : white);

  const branchStart = p([318, 365]);
  const branchEnd = p([431, 271]);
  strokeLine(canvas, branchStart[0], branchStart[1], branchEnd[0], branchEnd[1], 10 * scale, onDark ? limestone : olive);

  const leaves = [
    [354, 344, 33, 13, -28],
    [384, 319, 35, 13, 22],
    [411, 288, 34, 13, -37],
    [332, 372, 28, 12, 28],
  ];
  for (const [cx, cy, rx, ry, angle] of leaves) {
    const [tx, ty] = p([cx, cy]);
    fillEllipse(canvas, tx, ty, rx * scale, ry * scale, angle, onDark ? limestone : olive);
  }

  for (const [cx, cy, radius] of [[377, 366, 18], [411, 346, 17], [429, 321, 14]]) {
    const [tx, ty] = p([cx, cy]);
    fillCircle(canvas, tx, ty, radius * scale, onDark ? gold : ink);
  }
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
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

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

const icon = createCanvas(1024, 1024, OLIVE);
drawMark(icon, { scale: 1.72, offsetX: 72, offsetY: 72, onDark: true });
savePng('icon.png', icon);

const adaptive = createCanvas(1024, 1024);
drawMark(adaptive, { scale: 1.42, offsetX: 149, offsetY: 149, onDark: true });
savePng('adaptive-icon.png', adaptive);

const splash = createCanvas(512, 512);
drawMark(splash, { scale: 0.82, offsetX: 46, offsetY: 46, onDark: true });
savePng('splash-logo.png', splash);
