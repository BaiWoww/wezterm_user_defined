# WezTerm 配置可视化工具

浏览器内可视化配置、实时预览 **WezTerm** 终端，并通过一个**零依赖的本地后端**直接管理你机器上真实的 `wezterm.lua`：自动定位 WezTerm 安装目录与配置文件、一键套用、自动备份。

> 本项目专注于「可视化配置 + 真实套用」，生成的配置严格遵循 [WezTerm 官方配置格式](https://wezfurlong.org/wezterm/)，可直接被终端加载。

---

## ✨ 功能

- **可视化配置**
  - 外观：背景图（绝对路径）、透明度、HSB 滤镜（亮度 / 色相 / 饱和度）
  - 字体 / 字号 / 配色方案 / 窗口行列 / 窗口装饰
  - 光标：样式（Block / Bar / Underline）、粗细、**闪烁**（折叠进 `default_cursor_style` 的 `Blinking*` / `Steady*` 前缀）、闪烁开关
  - 快捷键：粘贴 / 复制 / 停止 / 上一·下一标签页 / 新建·关闭标签页 / 分屏，可自定义增删
- **实时预览**：所见即所得的终端外观模拟，配置即改即看
- **程序匹配（核心）**
  - 自动检测本机 WezTerm 安装路径（PATH / Microsoft Store / scoop / Program Files）
  - 按官方解析顺序定位配置文件（`与 exe 同目录` → `$HOME/.wezterm.lua` → `$HOME/.config/wezterm/...`）
  - 一键「应用到程序」：写入真实配置并**时间戳备份**原文件
  - 后端连通性自检（ping），离线时自动回退浏览器 File System Access API
- **导入 / 导出**：导入已有 `wezterm.lua` 解析回填，导出下载 `.lua` 文件
- **真实端到端校验**：`gen_test.js` 用工具真实的 `generateLua()` 生成配置，经 `luaparse` 做 Lua 语法校验，确认动作名合法后才写回

---

## 🧱 技术栈

| 部分 | 技术 | 说明 |
| --- | --- | --- |
| 前端 | 原生 HTML + CSS + JavaScript（无构建、无框架） | `index.html` / `styles.css` / `app.js` |
| 后端 | Node.js 内置模块（`http` / `fs` / `path` / `os`），**零第三方依赖** | `server.js` |
| 测试 | Node.js `vm` + DOM 桩运行真实 `generateLua()`，`luaparse` 校验 | `gen_test.js`（devDependency） |

---

## 🚀 快速开始

```bash
# 1. 启动本地后端（静态服务 + 配置管理 API）
node server.js
# 或
npm start

# 2. 浏览器打开（必须经此地址，不能用 file:// 直接打开 index.html）
http://127.0.0.1:8765
```

> ⚠️ 必须通过 `http://127.0.0.1:8765` 访问。以 `file://` 打开时前端无法调用本地后端（仅能用浏览器回退方案）。

### 目录结构

```
wezterm-config-tool/
├── index.html      # 页面结构（可视化配置 + 导入导出 + 程序匹配）
├── styles.css      # 样式
├── app.js          # 前端逻辑：状态、生成 Lua、预览、导入解析、程序匹配
├── server.js       # 零依赖后端：静态服务 + 配置检测 / 解析 / 写入 API
├── gen_test.js     # 回归测试：真实生成 + luaparse 校验（开发用）
├── package.json
├── .gitignore
└── LICENSE
```

---

## 🔌 后端 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/ping` | 健康检查 |
| GET | `/api/stat?path=...` | 文件是否存在 / 大小 / 修改时间（用于背景图校验） |
| GET | `/api/detect` | 检测安装路径与配置文件路径 |
| POST | `/api/resolve` | 解析某个目录下的目标配置文件路径 |
| POST | `/api/write` | 写入配置（自动时间戳备份原文件） |

---

## 🧪 开发 / 回归测试

```bash
npm install        # 安装 devDependency：luaparse
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
