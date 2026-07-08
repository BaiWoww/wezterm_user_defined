'use strict';

/* ============================================================
 * WezTerm 配置工具 — 本地后端
 * 作用：作为工具与 WT 终端之间的「链接层」，直接访问本机文件系统，
 *       自动定位 WezTerm 安装目录与配置文件，读取/写入并备份配置。
 * 零依赖：仅使用 Node.js 内置 http / fs / path / os 模块。
 * 运行：node server.js  →  http://127.0.0.1:8765
 * ============================================================ */

const http = require('http');
const fs = require('fs/promises');
const fss = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = process.env.PORT || 8765;

/* ---------- 静态服务 MIME ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.lua':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(new Error('请求体不是合法 JSON')); } });
    req.on('error', reject);
  });
}

/* ============================================================
 * WezTerm 定位逻辑
 * ============================================================ */
function getEnv(name) { return process.env[name] || ''; }
function isTargetName(name) {
  return name === 'wezterm.lua' || name === '.wezterm.lua' || /\.wezterm\.lua$/.test(name);
}

// 自动检测 WezTerm 安装目录（Windows 为主，兼顾 PATH）
async function detectInstallPath() {
  const candidates = [];

  // 1) PATH 中的 wezterm 可执行文件
  const pathEnv = getEnv('PATH') || '';
  for (const p of pathEnv.split(path.delimiter)) {
    if (!p) continue;
    const exe = process.platform === 'win32' ? path.join(p, 'wezterm.exe') : path.join(p, 'wezterm');
    try { await fs.access(exe); candidates.push(p); } catch (e) { /* 不存在 */ }
  }

  // 2) 常见安装位置
  const home = os.homedir();
  const localApp = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const progFiles = process.platform === 'win32'
    ? ['C:\\Program Files', 'C:\\Program Files (x86)']
    : ['/usr/local', '/opt', '/Applications'];
  const extras = [
    path.join(localApp, 'Microsoft', 'WindowsApps'),     // Microsoft Store 版
    path.join(home, 'scoop', 'apps', 'wezterm', 'current'),
    path.join(home, 'scoop', 'shims'),
    ...progFiles.map(p => path.join(p, 'WezTerm')),
    ...progFiles.map(p => path.join(p, 'wezterm')),
  ];
  for (const d of extras) {
    try { const st = await fs.stat(d); if (st.isDirectory()) candidates.push(d); } catch (e) { /* 不存在 */ }
  }

  return candidates[0] || null;
}

// 遵循 WezTerm 官方配置文件解析顺序
// 1) WEZTERM_CONFIG_FILE  2) 与 wezterm.exe 同目录（Windows 拇指盘模式）
// 3) XDG_CONFIG_HOME/wezterm/wezterm.lua  4) HOME/.wezterm.lua
// 5) HOME/.config/wezterm/wezterm.lua  6) HOME/.config/wezterm.lua
async function detectConfigPath() {
  const home = os.homedir();
  const xdg = getEnv('XDG_CONFIG_HOME') || path.join(home, '.config');
  const envFile = getEnv('WEZTERM_CONFIG_FILE');
  const inst = await detectInstallPath();
  const candidates = [];
  if (envFile) candidates.push(envFile);
  if (inst) {
    candidates.push(path.join(inst, '.wezterm.lua'));
    candidates.push(path.join(inst, 'wezterm.lua'));
  }
  candidates.push(path.join(xdg, 'wezterm', 'wezterm.lua'));
  candidates.push(path.join(home, '.wezterm.lua'));
  candidates.push(path.join(home, '.config', 'wezterm', 'wezterm.lua'));
  candidates.push(path.join(home, '.config', 'wezterm.lua'));
  for (const c of candidates) {
    try { const st = await fs.stat(c); if (st.isFile()) return c; } catch (e) { /* 不存在 */ }
  }
  return null;
}

// 在目录中递归查找目标配置文件（限制深度，跳过无关目录）
async function scanForConfig(dir, depth) {
  if (depth > 3) return null;
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch (e) { return null; }
  for (const e of entries) {                 // 优先文件（层级最浅）
    if (e.isFile() && isTargetName(e.name)) return path.join(dir, e.name);
  }
  if (depth < 3) {
    for (const e of entries) {
      if (e.isDirectory() && !['node_modules', '.git', '.cache', 'AppData', 'node_modules'].includes(e.name)) {
        const r = await scanForConfig(path.join(dir, e.name), depth + 1);
        if (r) return r;
      }
    }
  }
  return null;
}

// 解析用户给定的路径（空=自动检测；文件/目录分别处理）
async function resolvePath(input) {
  if (!input || !String(input).trim()) {
    const cfg = await detectConfigPath();
    const inst = await detectInstallPath();
    if (cfg) return { configPath: cfg, installPath: inst, found: true, auto: true };
    // 未找到现有配置：返回官方推荐的默认创建位置（HOME/.wezterm.lua），便于一键新建
    const home = os.homedir();
    return { configPath: path.join(home, '.wezterm.lua'), installPath: inst, found: false, auto: true, recommended: true };
  }
  let p = path.resolve(String(input).trim());
  try {
    const st = await fs.stat(p);
    if (st.isFile()) {
      if (isTargetName(path.basename(p))) return { configPath: p, installPath: null, found: true, auto: false };
      return { error: '指定文件不是 WezTerm 配置文件（应为 wezterm.lua）' };
    }
    if (st.isDirectory()) {
      const cfg = await scanForConfig(p, 0);
      if (cfg) return { configPath: cfg, installPath: p, found: true, auto: false };
      return { configPath: path.join(p, 'wezterm.lua'), installPath: p, found: false, auto: false };
    }
  } catch (e) {
    // 路径不存在：当作目录，在其中新建 wezterm.lua（仅接受绝对路径，避免歧义）
    if (path.isAbsolute(p)) return { configPath: path.join(p, 'wezterm.lua'), installPath: p, found: false, auto: false };
    return { error: '路径不存在且非绝对路径：' + input };
  }
  return { error: '无法解析路径：' + input };
}

// 写目标安全校验：仅允许写入 wezterm.lua，且位于用户主目录 / 项目目录 /
// ~/.config / 已检测到的 WezTerm 安装目录（拇指盘模式，如 E:\WezTerm）下。
async function isSafeWriteTarget(p) {
  if (!path.isAbsolute(p)) return false;
  const base = path.basename(p);
  if (!(base === 'wezterm.lua' || base === '.wezterm.lua' || /\.wezterm\.lua$/.test(base))) return false;
  const home = os.homedir();
  const allowed = [home, ROOT, path.join(home, '.config')];
  const inst = await detectInstallPath();
  if (inst) allowed.push(inst);            // 允许写入与 wezterm.exe 同目录（官方支持）
  return allowed.some(d => p === d || p.startsWith(d + path.sep));
}

/* ============================================================
 * 静态文件服务
 * ============================================================ */
async function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end('Not Found');
  }
}

/* ============================================================
 * 路由
 * ============================================================ */
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  try {
    // 健康检查 / 连接测试
    if (url === '/api/ping' && req.method === 'GET') {
      return sendJSON(res, 200, { ok: true, ts: Date.now() });
    }
    // 校验文件是否存在（用于背景图等真实路径确认）
    if (url === '/api/stat' && req.method === 'GET') {
      const qIdx = req.url.indexOf('?');
      const qs = qIdx >= 0 ? req.url.slice(qIdx + 1) : '';
      const p = new URLSearchParams(qs).get('path') || '';
      if (!p) return sendJSON(res, 400, { error: '缺少 path 参数' });
      try {
        const st = await fs.stat(p);
        return sendJSON(res, 200, { exists: true, isFile: st.isFile(), isDirectory: st.isDirectory(), size: st.size });
      } catch (e) {
        return sendJSON(res, 200, { exists: false });
      }
    }
    // 自动检测 WT 安装与配置
    if (url === '/api/detect' && req.method === 'GET') {
      const r = await resolvePath('');
      if (r.configPath) {
        try { r.content = await fs.readFile(r.configPath, 'utf8'); } catch (e) { r.content = ''; }
      }
      sendJSON(res, 200, r);
      return;
    }
    // 按给定路径定位配置
    if (url === '/api/resolve' && req.method === 'POST') {
      const body = await readBody(req);
      const r = await resolvePath(body.path || '');
      if (r.configPath && r.found) {
        try { r.content = await fs.readFile(r.configPath, 'utf8'); } catch (e) { r.content = ''; }
      }
      sendJSON(res, 200, r);
      return;
    }
    // 写入配置（写入前自动备份原文件）
    if (url === '/api/write' && req.method === 'POST') {
      const body = await readBody(req);
      const cfgPath = String(body.configPath || '');
      const content = String(body.content || '');
      if (!(await isSafeWriteTarget(cfgPath))) {
        return sendJSON(res, 400, { error: '不允许写入该路径，仅支持用户主目录 / 项目目录 / ~/.config / WezTerm 安装目录下的 wezterm.lua' });
      }
      let backup = '';
      try {
        const st = await fs.stat(cfgPath);
        if (st.isFile()) {
          const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
          const bak = cfgPath + '.bak-' + ts;
          await fs.copyFile(cfgPath, bak);
          backup = bak;
        }
      } catch (e) { /* 文件不存在 → 新建场景，无需备份 */ }
      await fs.mkdir(path.dirname(cfgPath), { recursive: true });
      await fs.writeFile(cfgPath, content, 'utf8');
      return sendJSON(res, 200, { ok: true, configPath: cfgPath, backup, lines: content.split('\n').length });
    }
    if (url.startsWith('/api/')) { sendJSON(res, 404, { error: '未知接口' }); return; }
    await serveStatic(req, res);
  } catch (e) {
    sendJSON(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('[WezTerm 配置工具] 后端已启动 → http://127.0.0.1:' + PORT);
  console.log('[WezTerm 配置工具] 用户主目录: ' + os.homedir());
});
