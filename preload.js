'use strict';

/* ============================================================
 * 预加载脚本（Preload）
 * 在隔离的渲染进程与主进程之间建立「最小权限」桥梁：
 *   - 文件系统 / 检测 / 写入：经 ipcRenderer 调用主进程（具备 Node 能力）
 *   - 原生对话框（选文件 / 选目录 / 另存为）：经 ipcRenderer 调用主进程 dialog
 *   - 本地图片预览：直接把绝对路径转成 file:// URL（preload 运行在 Node 上下文，可安全使用 url 模块）
 *   - 窗口控制：最小化 / 最大化切换 / 关闭 / 查询最大化状态
 * 渲染进程无法直接访问 Node / Electron，所有能力都通过 contextBridge 显式暴露。
 * ============================================================ */

const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('api', {
  // ---- 健康检查 ----
  ping: () => ipcRenderer.invoke('app:ping'),

  // ---- 文件系统 / 检测 ----
  stat: (p) => ipcRenderer.invoke('fs:stat', p),
  detect: () => ipcRenderer.invoke('wt:detect'),
  resolve: (input) => ipcRenderer.invoke('wt:resolve', input || ''),
  readText: (p) => ipcRenderer.invoke('fs:readText', p),
  write: (configPath, content) => ipcRenderer.invoke('fs:write', { configPath, content }),

  // ---- 原生对话框 ----
  // 返回 { path, name, fileUrl } 或 null（用户取消）
  pickFile: (opts) => ipcRenderer.invoke('dialog:pickFile', opts || {}),
  // 返回目录绝对路径或 null
  pickDirectory: () => ipcRenderer.invoke('dialog:pickDirectory'),
  // 返回用户选择的保存路径（字符串）或 null
  saveFile: (opts) => ipcRenderer.invoke('dialog:saveFile', opts || {}),

  // ---- 本地图片预览（同步）：绝对路径 -> file:// URL ----
  fileUrl: (p) => (p ? pathToFileURL(p).href : ''),

  // ---- 窗口控制 ----
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:toggleMaximize'),
    close: () => ipcRenderer.send('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
  },
});
