# WezTerm 配置可视化工具（Electron 桌面版）

一个 **Windows 原生桌面应用**（基于 [Electron](https://www.electronjs.org/)）的可视化 WezTerm 配置编辑器：可视化配置、实时预览，并**直接读写本机真实的 `wezterm.lua`**——自动定位 WezTerm 安装目录与配置文件、一键套用、写入前自动备份。

> 本项目专注于「可视化配置 + 真实套用」，生成的配置严格遵循 [WezTerm 官方配置格式](https://wezfurlong.org/wezterm/)，可直接被终端加载。

---

## ✨ 功能

- **可视化配置**
  - 外观：背景图（绝对路径）、透明度、HSB 滤镜（亮度 / 色相 / 饱和度）
  - 字体 / 字号 / 配色方案 / 窗口行列 / 窗口装饰
  - 光标：样式（Block / Bar / Underline）、粗细、**闪烁**（折叠进 `default_cursor_style` 的 `Blinking*` / `Steady*` 前缀）、闪烁开关
  - 快捷键：粘贴 / 复制 / 停止 / 上一·下一标签页 / 新建·关闭标签页 / 分屏，可自定义增删
- **实时预览**：所见即所得的终端外观模拟，配置即改即看（桌面端可直接用 `file://` 预览本地背景图）
- **程序匹配（核心）**
  - 自动检测本机 WezTerm 安装路径（PATH / Microsoft Store / scoop / Program Files）
  - 按官方解析顺序定位配置文件（`与 exe 同目录` → `$HOME/.wezterm.lua` → `$HOME/.config/wezterm/...`）
  - 一键「应用到程序」：写入真实配置并**时间戳备份**原文件
  - 启动即自动检测并载入本机现有配置
- **导入 / 导出**：通过**原生文件对话框**导入已有 `wezterm.lua` 解析回填，另存为到任意路径
- **原生窗口管理**：应用自带标题栏，支持最小化 / 最大化 / 还原 / 关闭
- **真实端到端校验**：`gen_test.js` 用工具真实的 `generateLua()` 生成配置，经 `luaparse` 做 Lua 语法校验

---

## 🧱 技术栈

| 部分 | 技术 | 说明 |
| --- | --- | --- |
| 主进程 | Electron `main.js` + 纯 Node 模块 `wt-fs.js` | 窗口管理、IPC、本机文件系统 / 检测逻辑（零第三方运行时依赖） |
| 预加载 | Electron `preload.js` | `contextBridge` 安全桥，向渲染进程暴露最小权限 API |
| 渲染进程 | 原生 HTML + CSS + JavaScript（无构建、无框架） | `index.html` / `styles.css` / `app.js` |
| 打包 | `electron-builder`（NSIS） | 生成 Windows 安装包 `.exe` |
| 测试 | Node.js `vm` + DOM 桩运行真实 `generateLua()`，`luaparse` 校验 | `gen_test.js`（devDependency） |

> 与原浏览器版的区别：移除了 HTTP 后端（`server.js`）与浏览器受限的 File System Access API，所有文件操作改由主进程（Node）通过 IPC 完成，并改用原生对话框——完全脱离浏览器载体。

---

## 🚀 快速开始（开发）

```bash
# 安装依赖（electron / electron-builder / luaparse）
npm install

# 以桌面应用方式启动（开发模式）
npm start
```

> 提示：应用内按 `Ctrl + Shift + I` 可打开 DevTools 调试。

### 打包为 Windows 安装包

```bash
# 生成 NSIS 安装包（输出到 dist/，如 WezTerm-Config-Tool-Setup-2.0.0.exe）
npm run dist
```

`npm run pack` 可仅生成未打包的目录（`dist/win-unpacked`），便于直接运行验证。

---

### 目录结构

```
wezterm-config-tool/
├── main.js         # Electron 主进程：窗口 + IPC + 窗口控制
├── preload.js      # 预加载：contextBridge 安全桥（window.api）
├── wt-fs.js        # 纯 Node：本机文件系统 / WezTerm 检测 / 读写（含备份）
├── index.html      # 页面结构（原生标题栏 + 可视化配置 + 导入导出 + 程序匹配）
├── styles.css      # 样式（含自定义标题栏）
├── app.js          # 渲染进程逻辑：状态、生成 Lua、预览、导入解析、程序匹配
├── gen_test.js     # 回归测试：真实生成 + luaparse 校验（开发用）
├── tools/
│   └── make-icon.js  # 生成应用图标 build/icon.ico / icon.png（纯 Node）
├── build/
│   ├── icon.ico      # 窗口与安装包图标
│   └── icon.png
├── package.json    # 含 electron-builder 打包配置
├── .gitignore
└── LICENSE
```

---

## 🔌 渲染进程可用的原生 API（`window.api`）

| 方法 | 说明 |
| --- | --- |
| `ping()` | 健康检查 |
| `stat(path)` | 文件是否存在 / 是否为文件 / 大小 |
| `detect()` | 检测安装路径与配置文件路径（含读取现有内容） |
| `resolve(input)` | 解析某个目录下的目标配置文件路径 |
| `readText(path)` | 读取文本（用于导入） |
| `write(path, content)` | 写入配置（自动时间戳备份原文件） |
| `pickFile({title, filters})` | 原生「打开文件」对话框，返回 `{ path, name, fileUrl }` |
| `pickDirectory()` | 原生「选择文件夹」对话框 |
| `saveFile({title, defaultPath, filters})` | 原生「另存为」对话框，返回路径 |
| `fileUrl(path)` | 绝对路径 → `file://` URL（用于本地图片预览） |
| `win.minimize()` / `win.toggleMaximize()` / `win.close()` / `win.isMaximized()` | 原生窗口控制 |

---

## 🧪 开发 / 回归测试

```bash
npm install        # 安装 devDependency：luaparse / electron / electron-builder
npm test           # 运行 gen_test.js，luaparse 校验生成的 wezterm.lua
```

`gen_test.js` 会在本机 WezTerm 安装目录下写回配置（默认 `E:/WezTerm/wezterm.lua`，可用环境变量 `WT_CONFIG` 覆盖）。
若目标目录不存在则只做校验与预览、不写盘，因此在其它机器上运行也安全。

---

## 📝 配置格式要点

- 光标闪烁**没有** `config.cursor_blink` 字段，由 `default_cursor_style` 的 `Blinking*` / `Steady*` 前缀决定；本工具据此把「闪烁」开关正确折叠进样式。
- 标签页切换使用 `wezterm.action.ActivateTabRelative(1)` / `ActivateTabRelative(-1)`（数字实参必须加括号）。

---

## 📄 License

[MIT](./LICENSE) © 2026 BaiWoww
