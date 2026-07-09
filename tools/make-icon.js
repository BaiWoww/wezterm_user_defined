'use strict';

/* ============================================================
 * 图标生成器（纯 Node，无第三方依赖）
 * 生成 256x256 的 PNG 与 ICO：圆角渐变底（品牌蓝 -> 青）+ 终端提示符 ">" + 光标块。
 * 输出：build/icon.png  build/icon.ico
 * ============================================================ */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;

/* ---------- PNG 编码基础 ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const comp = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', comp), chunk('IEND', Buffer.alloc(0))]);
}
function encodeICO(png) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4); // reserved, type=1, count=1
  const entry = Buffer.alloc(16);
  entry[0] = 0; entry[1] = 0;       // 256x256 在 ICO 中以 0 表示
  entry[2] = 0; entry[3] = 0;       // colors / reserved
  entry.writeUInt16LE(1, 4);        // color planes
  entry.writeUInt16LE(32, 6);       // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);      // image data offset (6 + 16)
  return Buffer.concat([dir, entry, png]);
}

/* ---------- 绘制 ---------- */
function lerp(a, b, t) { return a + (b - a) * t; }
function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

// 点到线段距离（用于绘制粗线）
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function buildImage() {
  const buf = Buffer.alloc(SIZE * SIZE * 4);
  const top = hexToRgb('#2f6fed');   // 品牌蓝
  const bot = hexToRgb('#0ea5a4');   // 品牌青
  const radius = 52;
  const cx = SIZE / 2, cy = SIZE / 2;
  const white = [255, 255, 255];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      // 圆角矩形遮罩
      let inside = true;
      const hx = Math.max(Math.abs(x - cx) - (cx - radius), 0);
      const hy = Math.max(Math.abs(y - cy) - (cy - radius), 0);
      if (hx * hx + hy * hy > radius * radius) inside = false;

      if (!inside) { buf[i + 3] = 0; continue; }

      const t = y / SIZE;
      let r = Math.round(lerp(top[0], bot[0], t));
      let g = Math.round(lerp(top[1], bot[1], t));
      let b = Math.round(lerp(top[2], bot[2], t));

      // 终端提示符 ">"（两段粗线）+ 光标块
      let isMark = false;
      const thick = 13;
      if (segDist(x, y, 96, 92, 150, 150) < thick / 2) isMark = true;        // 左上 -> 中心
      if (segDist(x, y, 150, 150, 96, 212) < thick / 2) isMark = true;       // 中心 -> 左下
      if (x >= 168 && x <= 188 && y >= 138 && y <= 176) isMark = true;       // 光标块

      if (isMark) { r = white[0]; g = white[1]; b = white[2]; }

      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
  return buf;
}

/* ---------- 输出 ---------- */
const outDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outDir, { recursive: true });
const rgba = buildImage();
const png = encodePNG(SIZE, SIZE, rgba);
fs.writeFileSync(path.join(outDir, 'icon.png'), png);
fs.writeFileSync(path.join(outDir, 'icon.ico'), encodeICO(png));
console.log('[icon] 已生成 build/icon.png 与 build/icon.ico');
