'use strict';

/* ============================================================
 * WezTerm 配置工具 — 本机文件系统 / 检测逻辑（纯 Node，无 Electron 依赖）
 * 该模块被主进程（main.js）通过 IPC 调用，也可被测试脚本直接 require。
 * ============================================================ */

const fs = require('fs/promises');
const fss = require('fs');
const path = require('path');
const os = require('os');

// 允许写入的「安全根目录」之一：应用自身目录（用于开发/测试回环）
const ROOT = __dirname;

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
      if (e.isDirectory() && !['node_modules', '.git', '.cache', 'AppData'].includes(e.name)) {
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

async function statPath(p) {
  try {
    const st = await fs.stat(p);
    return { exists: true, isFile: st.isFile(), isDirectory: st.isDirectory(), size: st.size };
  } catch (e) {
    return { exists: false };
  }
}

async function readConfig(p) {
  const text = await fs.readFile(p, 'utf8');
  return text;
}

// 写入配置（写入前自动备份原文件）；返回 { ok, configPath, backup, lines }
async function writeConfig(configPath, content) {
  if (!(await isSafeWriteTarget(configPath))) {
    return { error: '不允许写入该路径，仅支持用户主目录 / 项目目录 / ~/.config / WezTerm 安装目录下的 wezterm.lua' };
  }
  let backup = '';
  try {
    const st = await fs.stat(configPath);
    if (st.isFile()) {
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      const bak = configPath + '.bak-' + ts;
      await fs.copyFile(configPath, bak);
      backup = bak;
    }
  } catch (e) { /* 文件不存在 → 新建场景，无需备份 */ }
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, content, 'utf8');
  return { ok: true, configPath, backup, lines: content.split('\n').length };
}

module.exports = {
  isTargetName,
  detectInstallPath,
  detectConfigPath,
  scanForConfig,
  resolvePath,
  isSafeWriteTarget,
  statPath,
  readConfig,
  writeConfig,
};
