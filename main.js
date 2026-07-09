'use strict';

/* ============================================================
 * WezTerm 配置工具 — Electron 主进程
 *   - 创建无边框窗口（自定义原生标题栏：最小化 / 最大化 / 关闭）
 *   - 通过 IPC 暴露本机文件系统能力（复用 wt-fs.js）
 *   - 通过原生 dialog 提供选文件 / 选目录 / 另存为
 * 不再依赖任何 HTTP 后端；所有逻辑运行在主进程（Node）与渲染进程（Chromium）内。
 * ============================================================ */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const wtfs = require('./wt-fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 920,
    minHeight: 620,
    frame: false,                 // 无边框 -> 使用自定义标题栏
    show: false,                  // 准备好后再显示，避免白屏闪烁
    backgroundColor: '#f5f6f8',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,     // 安全：preload 与页面隔离
      nodeIntegration: false,     // 渲染进程不直接暴露 Node
      sandbox: false,             // preload 需要 Node 能力（require）
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 开发便捷：Ctrl+Shift+I 打开 DevTools
  mainWindow.webContents.on('before-input-event', (e, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      if (mainWindow.webContents.isDevToolsOpened()) mainWindow.webContents.closeDevTools();
      else mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ============================================================
 * IPC 处理器
 * ============================================================ */

// 健康检查
ipcMain.handle('app:ping', () => ({ ok: true, ts: Date.now() }));

// 文件是否存在
ipcMain.handle('fs:stat', async (e, p) => wtfs.statPath(p));

// 自动检测安装与配置（含读取现有内容）
ipcMain.handle('wt:detect', async () => {
  const r = await wtfs.resolvePath('');
  if (r.configPath && r.found) {
    try { r.content = await wtfs.readConfig(r.configPath); } catch (e) { r.content = ''; }
  }
  return r;
});

// 按给定路径定位配置
ipcMain.handle('wt:resolve', async (e, input) => {
  const r = await wtfs.resolvePath(input || '');
  if (r.configPath && r.found) {
    try { r.content = await wtfs.readConfig(r.configPath); } catch (e) { r.content = ''; }
  }
  return r;
});

// 读取文本
ipcMain.handle('fs:readText', async (e, p) => wtfs.readConfig(p));

// 写入配置（自动备份）
ipcMain.handle('fs:write', async (e, { configPath, content }) => wtfs.writeConfig(configPath, content));

/* ---------- 原生对话框 ---------- */
function toElectronFilters(filters) {
  if (!filters || !filters.length) return undefined;
  return filters.map(f => ({ name: f.name, extensions: f.extensions.map(ext => ext.replace(/^\./, '')) }));
}

ipcMain.handle('dialog:pickFile', async (e, opts) => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: opts.title || '选择文件',
    defaultPath: opts.defaultPath || undefined,
    properties: ['openFile'],
    filters: toElectronFilters(opts.filters),
  });
  if (res.canceled || !res.filePaths.length) return null;
  const p = res.filePaths[0];
  return { path: p, name: path.basename(p), fileUrl: pathToFileURL(p).href };
});

ipcMain.handle('dialog:pickDirectory', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: '选择 WezTerm 安装 / 配置目录',
    properties: ['openDirectory'],
  });
  if (res.canceled || !res.filePaths.length) return null;
  return res.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (e, opts) => {
  if (!mainWindow) return null;
  const res = await dialog.showSaveDialog(mainWindow, {
    title: opts.title || '保存 wezterm.lua',
    defaultPath: opts.defaultPath || 'wezterm.lua',
    filters: toElectronFilters(opts.filters),
  });
  if (res.canceled || !res.filePath) return null;
  return res.filePath;
});

/* ---------- 窗口控制 ---------- */
ipcMain.on('win:minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('win:toggleMaximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('win:close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle('win:isMaximized', () => (mainWindow ? mainWindow.isMaximized() : false));

/* ============================================================
 * 生命周期
 * ============================================================ */
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  // 桌面应用：关闭全部窗口即退出（Windows 行为）
  if (process.platform !== 'darwin') app.quit();
});
