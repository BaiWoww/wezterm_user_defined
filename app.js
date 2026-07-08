'use strict';

/* ============================================================
 * WezTerm 配置工具 — 核心逻辑
 * 配置项名称均对照 WezTerm 源码 config/src/config.rs 验证
 * ============================================================ */

/* ---------- 内置配色方案（含调色板用于实时预览） ---------- */
const SCHEME_PALETTES = {
  'Nord':        { bg:'#2E3440', fg:'#D8DEE9', a:['#3B4252','#BF616A','#A3BE8C','#EBCB8B','#81A1C1','#B48EAD','#88C0D0','#E5E9F0'] },
  'Dracula':     { bg:'#282A36', fg:'#F8F8F2', a:['#21222C','#FF5555','#50FA7B','#F1FA8C','#BD93F9','#FF79C6','#8BE9FD','#F8F8F2'] },
  'Gruvbox Dark':{ bg:'#282828', fg:'#EBDBB2', a:['#282828','#CC241D','#98971A','#D79921','#458588','#B16286','#689D6A','#A89984'] },
  'Gruvbox Light':{ bg:'#FBF1C7', fg:'#3C3836', a:['#F9F5D7','#CC241D','#98971A','#D79921','#458588','#B16286','#689D6A','#7C6F64'] },
  'Solarized Dark': { bg:'#002B36', fg:'#839496', a:['#073642','#DC322F','#859900','#B58900','#268BD2','#D33682','#2AA198','#EEE8D5'] },
  'Solarized Light':{ bg:'#FDF6E3', fg:'#657B83', a:['#073642','#DC322F','#859900','#B58900','#268BD2','#D33682','#2AA198','#EEE8D5'] },
  'GitHub Dark': { bg:'#0D1117', fg:'#C9D1D9', a:['#484F58','#FF7B72','#3FB950','#D29922','#58A6FF','#DB61A2','#39C5CF','#B1BAC4'] },
  'GitHub Light':{ bg:'#FFFFFF', fg:'#24292F', a:['#D0D7DE','#CF222E','#1A7F37','#9A6700','#0969DA','#8250DF','#0598BC','#6E7781'] },
  'One Dark':    { bg:'#282C34', fg:'#ABB2BF', a:['#282C34','#E06C75','#98C379','#E5C07B','#61AFEF','#C678DD','#56B6C2','#ABB2BF'] },
  'Tokyo Night': { bg:'#1A1B26', fg:'#C0CAF5', a:['#15161E','#F7768E','#9ECE6A','#E0AF68','#7AA2F7','#BB9AF7','#7DCFA8','#A9B1D6'] },
  'Catppuccin Mocha': { bg:'#1E1E2E', fg:'#CDD6F4', a:['#45475A','#F38BA8','#A6E3A1','#F9E2AF','#89B4FA','#CBA6F7','#94E2D5','#BAC2DE'] },
  'Catppuccin Latte': { bg:'#EFF1F5', fg:'#4C4F69', a:['#ACB0BE','#D20F39','#40A02B','#DF8E1D','#1E66F5','#8839EF','#179299','#9CA0B0'] },
  'Ayu Dark':    { bg:'#0A0E14', fg:'#B3B1AD', a:['#0D1015','#FF3333','#9FCC7A','#FFCC66','#6CA1FF','#D7A4FF','#68F4E1','#B3B1AD'] },
  'Ayu Light':   { bg:'#FAFAFA', fg:'#5C6773', a:['#F1F1F1','#EA106E','#61C23B','#F2A12A','#5CBCF7','#8F77F0','#29BCC2','#5C6773'] },
  'Builtin Dark':{ bg:'#0c0c0c', fg:'#cccccc', a:['#0c0c0c','#ff3030','#4dc04f','#dbd64a','#4f8cff','#ff66ff','#4fe0ff','#cccccc'] },
  'Builtin Light':{ bg:'#ffffff', fg:'#101010', a:['#dddddd','#c91b00','#19a629','#e6c300','#0a73d6','#c225c4','#00ada7','#888888'] },
};

const SCHEME_NAMES = [
  'Builtin Dark','Builtin Light','Builtin Pastel Dark','Builtin Solarized Dark','Builtin Solarized Light',
  'GitHub Dark','GitHub Light','GitHub Dark Dimmed','GitHub Dark Colorimetric','GitHub Light Colorimetric',
  'Dracula','Nord','Gruvbox Dark','Gruvbox Light','Solarized Dark','Solarized Light','Solarized Dark Higher Contrast',
  'One Dark','One Light','Tokyo Night','Tokyo Night Storm','Tokyo Night Light',
  'Catppuccin Mocha','Catppuccin Macchiato','Catppuccin Frappé','Catppuccin Latte',
  'Ayu Dark','Ayu Light','Ayu Mirage','Atom One Dark','Atom One Light',
  'Everforest Dark','Everforest Light','Kanagawa Dragon','Kanagawa Wave','Kanagawa Lotus',
  'Night Owl','Light Owl','Material Palenight','Material Design','Monokai','Monokai Pro','Molokai',
  'Tomorrow Night','Tomorrow Night Bright','Tomorrow Night Eighties','Tomorrow','Cyberpunk','Synthwave',
  'Spacemacs Dark','Zenburn','Tango Dark','Tango Light','Adwaita Dark','Adwaita Light','Cave','Cloud',
  'Dark Pastel','Darker','Deep','Desert','Earthsong','Fairy Floss','Frontend Delight','Galaxy','Ghibli',
  'Hacktober','Hardcore','Iceberg Dark','Iceberg Light','Idle Toes','Ir Black','Kimbie Dark','Linux Console','Linux',
  'Microsoft Light','Miramare','Mariana','Nightfly','Nova','Oceanic Next','Ollie','Papercolor Dark','Papercolor Light',
  'Popping','Pro','Red Sands','Redshift','Rippedcast','Scurf','Selenium','Seti','Shaman','Slate','Smyck','Soft Server',
  'Sorcerer','Spring','Square','Spacedust','Standard Eraser','Stellarized Dark','Stellarized Light','Sublette','Sundried',
  'Sweetened','Terminal Basic','Thayer Bright','Topical','Ubuntu','Urple','Vaughn','Wombat','Wryan','Xcode Dusk','Zenburn Light',
];

const COMMON_FONTS = [
  'JetBrains Mono','Fira Code','Cascadia Code','Cascadia Mono','SF Mono','Menlo','Monaco',
  'Consolas','Source Code Pro','Hack','Ubuntu Mono','DejaVu Sans Mono','Noto Sans Mono','Roboto Mono',
  'Iosevka','Meslo LG M','IBM Plex Mono','Inconsolata','Courier New',
];

/* ---------- 快捷键动作定义 ---------- */
const ACTIONS = {
  paste:   { label:'粘贴',     desc:'PasteFrom("Clipboard")',        gen:()=>'wezterm.action.PasteFrom "Clipboard"' },
  copy:    { label:'复制',     desc:'CopyTo("Clipboard")',           gen:()=>'wezterm.action.CopyTo "Clipboard"' },
  stop:    { label:'停止进程', desc:'发送 Ctrl-C',                   gen:()=>'wezterm.action.SendKey { key = "c", mods = "CTRL" }' },
  nextTab: { label:'下一标签页', desc:'ActivateTabRelative(1)',            gen:()=>'wezterm.action.ActivateTabRelative(1)' },
  prevTab: { label:'上一标签页', desc:'ActivateTabRelative(-1)',           gen:()=>'wezterm.action.ActivateTabRelative(-1)' },
  newTab:  { label:'新建标签页', desc:'SpawnTab',                     gen:()=>'wezterm.action.SpawnTab "CurrentPaneDomain"' },
  closeTab:{ label:'关闭标签页', desc:'CloseCurrentTab',             gen:()=>'wezterm.action.CloseCurrentTab { confirm = true }' },
  splitV:  { label:'垂直分屏', desc:'SplitVertical',                 gen:()=>'wezterm.action.SplitVertical { domain = "CurrentPaneDomain" }' },
  splitH:  { label:'水平分屏', desc:'SplitHorizontal',               gen:()=>'wezterm.action.SplitHorizontal { domain = "CurrentPaneDomain" }' },
};
const ACTION_ORDER = ['paste','copy','stop','nextTab','prevTab','newTab','closeTab','splitV','splitH'];

/* ---------- 默认状态 ---------- */
function defaultState() {
  return {
    appearance: { bgImage:'', bgImageName:'', opacity:1, brightness:1, saturation:1, hue:1 },
    other: {
      fontFamily:'', fontSize:12, colorScheme:'',
      initialRows:40, initialCols:120, windowDecorations:'RESIZE',
      cursorStyle:'BlinkingBlock', cursorThickness:2, cursorThicknessUnit:'raw', cursorBlink:false,
    },
    keys: [
      { id:uid(), actionType:'paste',   key:'V',       mods:'CTRL' },
      { id:uid(), actionType:'copy',    key:'C',       mods:'CTRL|SHIFT' },
      { id:uid(), actionType:'stop',    key:'C',       mods:'CTRL' },
      { id:uid(), actionType:'nextTab', key:'PageDown',mods:'CTRL' },
      { id:uid(), actionType:'prevTab', key:'PageUp',  mods:'CTRL' },
    ],
    preserved: [],   // 原始配置中保留的未知/自定义行
  };
}

let state = defaultState();
let bgObjectUrl = null;

/* ---------- 工具函数 ---------- */
function uid() { return 'k' + Math.random().toString(36).slice(2, 9); }
function num(v) { const n = Number(v); return !isFinite(n) ? 0 : (Math.round(n * 1000) / 1000).toString(); }
function int(v) { const n = Math.round(Number(v)); return isFinite(n) ? n : 0; }
function q(s) {
  // 路径统一转为正斜杠（WezTerm 在 Windows 下同样支持），避免反斜杠转义问题
  const t = String(s).replace(/\\/g, '/');
  return "'" + t.replace(/'/g, "\\'") + "'";
}
function escHtml(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
// WezTerm 用 default_cursor_style 的前缀（Blinking*/Steady*）控制是否闪烁，
// 没有独立的 cursor_blink 字段。这里把「闪烁勾选框」折叠进样式前缀。
function effectiveCursorStyle(style, blink) {
  const shape = String(style || '').replace(/^(Blinking|Steady)/i, '');
  return (blink ? 'Blinking' : 'Steady') + shape;
}

/* ============================================================
 * 解析 wezterm.lua
 * ============================================================ */
const SUPPORTED = new Set([
  'window_background_image','window_background_opacity','window_background_image_hsb',
  'font','font_size','color_scheme','initial_rows','initial_cols','default_cursor_style',
  'cursor_thickness','cursor_blink','window_decorations',
]);

function splitStatements(text) {
  const stmts = []; let i = 0; const n = text.length; let cur = '';
  let depth = 0; let inStr = null; let inLine = false; let inBlock = false;
  while (i < n) {
    const c = text[i], c2 = text[i + 1];
    if (inBlock) { cur += c; if (c === ']' && c2 === ']') { cur += c2; i += 2; inBlock = false; } else i++; continue; }
    if (inLine) { cur += c; if (c === '\n') { inLine = false; cur += ''; if (depth === 0) { stmts.push(cur); cur = ''; } } i++; continue; }
    if (inStr) { cur += c; if (c === '\\' && i + 1 < n) { cur += text[i + 1]; i += 2; continue; } if (c === inStr) inStr = null; i++; continue; }
    if (c === '-' && c2 === '-') {
      if (text[i + 2] === '[' && text[i + 3] === '[') { inBlock = true; cur += '--[['; i += 4; continue; }
      inLine = true; cur += '--'; i += 2; continue;
    }
    if (c === "'" || c === '"') { inStr = c; cur += c; i++; continue; }
    if (c === '{' || c === '(' || c === '[') { depth++; cur += c; i++; continue; }
    if (c === '}' || c === ')' || c === ']') { depth = Math.max(0, depth - 1); cur += c; i++; continue; }
    if (c === '\n') { cur += c; if (depth === 0) { stmts.push(cur); cur = ''; } i++; continue; }
    if (c === ';') { cur += c; if (depth === 0) { stmts.push(cur); cur = ''; } i++; continue; }
    cur += c; i++;
  }
  if (cur.trim()) stmts.push(cur);
  return stmts;
}

function stripTrailingComment(s) {
  // 移除顶层行尾注释（不在字符串内）
  let inStr = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], c2 = s[i + 1];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"') { inStr = c; continue; }
    if (c === '-' && c2 === '-') return s.slice(0, i);
  }
  return s;
}

function unescapeLua(str) {
  // 还原 Lua 字符串转义：\\ -> \，\n -> 换行，\t -> 制表符，\" -> "，\' -> '
  return str.replace(/\\(.)/g, (m, c) => ({ '\\':'\\', n:'\n', t:'\t', '"':'"', "'":"'" }[c] || c));
}
function parseString(s) {
  const m = s.match(/^\s*['"]([^'"]*)['"]\s*$/);
  return m ? unescapeLua(m[1]) : null;
}
function firstString(s) {
  const m = s.match(/['"]([^'"]+)['"]/);
  return m ? m[1] : '';
}

function isToolComment(s) {
  // 跳过本工具自身生成的注释，避免重复导入时注释不断翻倍
  const t = s.trim();
  if (/^--\s*=+$/.test(t)) return true;
  if (/WezTerm 配置工具生成|^-- 生成时间:|兼容官方配置格式|原始配置中保留|^-- 终端外观$|^-- 字体 \/ 配色 \/ 窗口 \/ 光标$|^-- 快捷键绑定$/.test(t)) return true;
  return false;
}

function parseLua(text) {
  const st = defaultState();
  st.keys = []; st.preserved = [];
  const stmts = splitStatements(text);
  for (const raw of stmts) {
    const s = raw.trim();
    if (!s) continue;
    if (isToolComment(s)) continue;
    if (/^local\s+wezterm\b/.test(s) || /^local\s+config\s*=\s*\{\}/.test(s)) continue; // 头部重发
    if (/^return\b/.test(s)) continue; // 末尾重发
    if (/^config\.keys\s*=/.test(s)) { parseKeysBlock(s, st); continue; }
    const m = s.match(/^config\.(\w+)\s*=/);
    if (m && SUPPORTED.has(m[1])) { applySupported(m[1], stripTrailingComment(s.slice(m.index + m[0].length)), st); continue; }
    st.preserved.push(raw);
  }
  return st;
}

function applySupported(key, value, st) {
  const v = value.trim();
  const a = st.appearance, o = st.other;
  switch (key) {
    case 'window_background_image': { const p = parseString(v); if (p) { a.bgImage = p; a.bgImageName = p.split('/').pop(); } break; }
    case 'window_background_opacity': { const n = parseFloat(v); if (isFinite(n)) a.opacity = n; break; }
    case 'window_background_image_hsb': {
      const gb = v.match(/brightness\s*=\s*([-\d.]+)/); if (gb) a.brightness = parseFloat(gb[1]);
      const gh = v.match(/hue\s*=\s*([-\d.]+)/); if (gh) a.hue = parseFloat(gh[1]);
      const gs = v.match(/saturation\s*=\s*([-\d.]+)/); if (gs) a.saturation = parseFloat(gs[1]);
      break;
    }
    case 'font': { const f = firstString(v); if (f) o.fontFamily = f; break; }
    case 'font_size': { const n = parseFloat(v); if (isFinite(n)) o.fontSize = n; break; }
    case 'color_scheme': { const c = parseString(v); if (c) o.colorScheme = c; break; }
    case 'initial_rows': { o.initialRows = int(v); break; }
    case 'initial_cols': { o.initialCols = int(v); break; }
    case 'default_cursor_style': {
      const c = parseString(v);
      if (c) { o.cursorStyle = c; o.cursorBlink = /^Blinking/i.test(c); }
      break;
    }
    case 'cursor_thickness': {
      const str = parseString(v);
      if (str) { const mm = str.match(/^([\d.]+)(px|pt|%|cell)?$/); if (mm) { o.cursorThickness = parseFloat(mm[1]); o.cursorThicknessUnit = mm[2] || 'raw'; } }
      else { const n = parseFloat(v); if (isFinite(n)) { o.cursorThickness = n; o.cursorThicknessUnit = 'raw'; } }
      break;
    }
    case 'cursor_blink': { o.cursorBlink = /true/i.test(v); break; }
    case 'window_decorations': { const c = parseString(v); if (c) o.windowDecorations = c; break; }
  }
}

function parseKeysBlock(block, st) {
  // 提取第一个 { 到匹配 } 之间的内容
  const start = block.indexOf('{');
  if (start < 0) return;
  let depth = 0, i = start;
  for (; i < block.length; i++) {
    if (block[i] === '{') depth++;
    else if (block[i] === '}') { depth--; if (depth === 0) break; }
  }
  const inner = block.slice(start + 1, i);
  // 按顶层 {} 切分每个条目
  let d = 0, entry = '', entries = [];
  for (const ch of inner) {
    if (ch === '{') { d++; entry += ch; }
    else if (ch === '}') { d--; entry += ch; if (d === 0) { entries.push(entry); entry = ''; } }
    else entry += ch;
  }
  for (const e of entries) {
    if (!e.trim()) continue;
    const keyM = e.match(/key\s*=\s*['"]([^'"]*)['"]/);
    const modsM = e.match(/mods\s*=\s*['"]([^'"]*)['"]/);
    const actM = e.match(/action\s*=\s*([\s\S]+)$/);
    const action = actM ? stripTrailingComment(actM[1]).trim().replace(/,$/, '') : '';
    const type = classifyAction(action);
    const row = { id: uid(), key: keyM ? keyM[1] : '', mods: modsM ? modsM[1] : '' };
    if (type.startsWith('custom:')) { row.actionType = 'custom'; row.rawAction = type.slice(7); }
    else row.actionType = type;
    st.keys.push(row);
  }
}

function classifyAction(act) {
  if (/PasteFrom/i.test(act)) return 'paste';
  if (/CopyTo/i.test(act)) return 'copy';
  if (/SendKey/i.test(act)) {
    if (/key\s*=\s*['"]c['"]/i.test(act) && /CTRL/i.test(act)) return 'stop';
    return 'custom:' + act;
  }
  if (/ActivateTabRelative\s*\(\s*-1|ActivateTabRelative\s+-1\b/i.test(act)) return 'prevTab';
  if (/ActivateTabRelative\s*\(\s*1|ActivateTabRelative\s+1\b/i.test(act)) return 'nextTab';
  if (/SpawnTab/i.test(act)) return 'newTab';
  if (/CloseCurrentTab/i.test(act)) return 'closeTab';
  if (/SplitVertical/i.test(act)) return 'splitV';
  if (/SplitHorizontal/i.test(act)) return 'splitH';
  return 'custom:' + act;
}

/* ============================================================
 * 生成 wezterm.lua
 * ============================================================ */
function generateLua() {
  const L = [];
  L.push('-- ===========================================================');
  L.push('-- WezTerm 配置文件 · 由 WezTerm 配置工具生成');
  L.push('-- 生成时间: ' + new Date().toLocaleString());
  L.push('-- 兼容官方配置格式 (https://wezfurlong.org/wezterm/)');
  L.push('-- ===========================================================');
  L.push("local wezterm = require 'wezterm'");
  L.push('local config = {}');
  L.push('');

  const a = state.appearance, o = state.other;

  if (state.preserved.length) {
    L.push('-- 以下为原始配置中保留的自定义内容（本工具未编辑）');
    state.preserved.forEach(p => L.push(p.replace(/\n+$/, '')));
    L.push('');
  }

  // 外观
  const ap = [];
  if (a.bgImage) ap.push('config.window_background_image = ' + q(a.bgImage));
  if (a.opacity < 1) ap.push('config.window_background_opacity = ' + num(a.opacity));
  if (a.brightness !== 1 || a.saturation !== 1 || a.hue !== 1) {
    ap.push('config.window_background_image_hsb = {');
    ap.push('  brightness = ' + num(a.brightness) + ',');
    ap.push('  hue = ' + num(a.hue) + ',');
    ap.push('  saturation = ' + num(a.saturation) + ',');
    ap.push('}');
  }

  // 其他
  const ot = [];
  if (o.fontFamily) ot.push('config.font = wezterm.font(' + q(o.fontFamily) + ')');
  if (o.fontSize) ot.push('config.font_size = ' + num(o.fontSize));
  if (o.colorScheme) ot.push('config.color_scheme = ' + q(o.colorScheme));
  if (o.initialRows) ot.push('config.initial_rows = ' + int(o.initialRows));
  if (o.initialCols) ot.push('config.initial_cols = ' + int(o.initialCols));
  if (o.cursorStyle) ot.push('config.default_cursor_style = ' + q(effectiveCursorStyle(o.cursorStyle, o.cursorBlink)));
  if (o.cursorThickness) {
    if (o.cursorThicknessUnit === 'raw') ot.push('config.cursor_thickness = ' + num(o.cursorThickness));
    else ot.push('config.cursor_thickness = ' + q(num(o.cursorThickness) + o.cursorThicknessUnit));
  }
  // 注：WezTerm 没有 cursor_blink 字段，光标闪烁已折叠进 default_cursor_style 的前缀（Blinking*/Steady*）
  if (o.windowDecorations) ot.push('config.window_decorations = ' + q(o.windowDecorations));

  if (ap.length) { L.push('-- 终端外观'); L.push(...ap); L.push(''); }
  if (ot.length) { L.push('-- 字体 / 配色 / 窗口 / 光标'); L.push(...ot); L.push(''); }

  // 快捷键
  if (state.keys.length) {
    L.push('-- 快捷键绑定');
    L.push('config.keys = {');
    for (const k of state.keys) {
      const action = k.actionType === 'custom' ? k.rawAction : ACTIONS[k.actionType].gen(k.key, k.mods);
      L.push('  { key = ' + q(k.key) + ', mods = ' + q(k.mods) + ', action = ' + action + ' },');
    }
    L.push('}');
    L.push('');
  }

  L.push('return config');
  return L.join('\n');
}

/* ============================================================
 * 实时预览
 * ============================================================ */
function getPalette(name) {
  if (name && SCHEME_PALETTES[name]) return SCHEME_PALETTES[name];
  return SCHEME_PALETTES['Builtin Dark'];
}

function updatePreview() {
  const a = state.appearance, o = state.other;
  const termBg = document.getElementById('termBg');
  const termContent = document.getElementById('termContent');
  const termWindow = document.getElementById('termWindow');
  const titlebar = document.getElementById('termTitlebar');
  const cursor = document.getElementById('termCursor');

  // 背景图 / 透明度 / HSB 滤镜
  if (a.bgImage && bgObjectUrl) {
    termBg.style.backgroundImage = 'url("' + bgObjectUrl + '")';
    termBg.style.backgroundColor = 'transparent';
  } else if (a.bgImage) {
    termBg.style.backgroundImage = 'none';
    termBg.style.backgroundColor = '#1e1e1e';
  } else {
    termBg.style.backgroundImage = 'none';
    const pal = getPalette(o.colorScheme);
    termBg.style.backgroundColor = pal.bg;
  }
  termBg.style.opacity = String(a.opacity);
  termBg.style.filter = 'brightness(' + a.brightness + ') saturate(' + a.saturation + ') hue-rotate(' + (a.hue * 360) + 'deg)';

  // 配色
  const pal = getPalette(o.colorScheme);
  termContent.style.setProperty('--fg', pal.fg);
  termContent.style.setProperty('--c-black', pal.a[0]);
  termContent.style.setProperty('--c-red', pal.a[1]);
  termContent.style.setProperty('--c-green', pal.a[2]);
  termContent.style.setProperty('--c-yellow', pal.a[3]);
  termContent.style.setProperty('--c-blue', pal.a[4]);
  termContent.style.setProperty('--c-magenta', pal.a[5]);
  termContent.style.setProperty('--c-cyan', pal.a[6]);
  termContent.style.setProperty('--c-white', pal.a[7]);
  termContent.style.color = pal.fg;

  // 字体
  if (o.fontFamily) termContent.style.fontFamily = '"' + o.fontFamily + '", Consolas, monospace';
  termContent.style.fontSize = (o.fontSize || 12) + 'px';

  // 窗口尺寸（按比例）
  const charW = (o.fontSize || 12) * 0.6;
  const lineH = (o.fontSize || 12) * 1.5;
  termWindow.style.width = 'calc(8% + ' + Math.max(40, o.initialCols * charW) + 'px)';
  termContent.style.minHeight = Math.max(60, o.initialRows * lineH) + 'px';

  // 窗口装饰
  titlebar.style.display = (o.windowDecorations === 'NONE') ? 'none' : 'flex';
  termWindow.style.border = (o.windowDecorations === 'RESIZE') ? '1px solid rgba(255,255,255,.15)' : 'none';

  // 光标样式 / 粗细 / 闪烁
  const t = o.cursorThickness || 2;
  const unitPx = (o.cursorThicknessUnit === 'px' || o.cursorThicknessUnit === 'raw') ? t : (o.cursorThicknessUnit === '%' ? t + '%' : t + 'px');
  cursor.className = 'cursor';
  cursor.style.cssText = '';
  if (o.cursorStyle.includes('Underline')) {
    cursor.textContent = '▁'; cursor.style.fontSize = (o.fontSize * 1.4) + 'px';
  } else if (o.cursorStyle.includes('Bar')) {
    cursor.textContent = '▌'; cursor.style.fontSize = (o.fontSize * 1.4) + 'px';
  } else {
    cursor.textContent = '█'; cursor.style.fontSize = (o.fontSize * 1.2) + 'px';
  }
  cursor.style.color = pal.fg;
  if (o.cursorBlink) {
    cursor.style.animation = 'curblink 1s steps(1) infinite';
  }
  if (!document.getElementById('curblink-style')) {
    const st = document.createElement('style'); st.id = 'curblink-style';
    st.textContent = '@keyframes curblink{50%{opacity:0}}'; document.head.appendChild(st);
  }

  // 元信息
  const meta = [];
  if (o.colorScheme) meta.push(o.colorScheme);
  meta.push(o.fontFamily ? o.fontFamily : '默认字体');
  meta.push(o.fontSize + 'px');
  document.getElementById('previewMeta').textContent = meta.join(' · ');
}

/* ============================================================
 * UI 绑定
 * ============================================================ */
function $(id) { return document.getElementById(id); }

function syncInputsFromState() {
  const a = state.appearance, o = state.other;
  $('bgImagePath').value = a.bgImage;
  $('opacity').value = a.opacity; $('opacityVal').textContent = Number(a.opacity).toFixed(2);
  $('brightness').value = a.brightness; $('brightnessVal').textContent = Number(a.brightness).toFixed(2);
  $('saturation').value = a.saturation; $('saturationVal').textContent = Number(a.saturation).toFixed(2);
  $('hue').value = a.hue; $('hueVal').textContent = Number(a.hue).toFixed(2);
  $('fontFamily').value = o.fontFamily;
  $('fontSize').value = o.fontSize;
  $('colorScheme').value = o.colorScheme;
  $('initialRows').value = o.initialRows;
  $('initialCols').value = o.initialCols;
  $('windowDecorations').value = o.windowDecorations;
  $('cursorStyle').value = o.cursorStyle;
  $('cursorThickness').value = o.cursorThickness;
  $('cursorThicknessUnit').value = o.cursorThicknessUnit;
  $('cursorBlink').checked = o.cursorBlink;
  renderKeys();
}

function renderKeys() {
  const list = $('keysList'); list.innerHTML = '';
  for (const k of state.keys) {
    const row = document.createElement('div'); row.className = 'key-row';
    let labelHtml, selHtml = '';
    if (k.actionType === 'custom') {
      labelHtml = '<div class="label">自定义动作<small>' + escHtml(k.rawAction) + '</small></div>';
    } else {
      const act = ACTIONS[k.actionType];
      labelHtml = '<div class="label">' + act.label + '<small>' + escHtml(act.desc) + '</small></div>';
      selHtml = '<select data-id="' + k.id + '" class="key-action">';
      for (const t of ACTION_ORDER) selHtml += '<option value="' + t + '"' + (t === k.actionType ? ' selected' : '') + '>' + ACTIONS[t].label + '</option>';
      selHtml += '</select>';
    }
    const kbd = k.key ? (k.mods ? k.mods.replace(/\|/g, '+') + '+' : '') + k.key : '未绑定';
    row.innerHTML = labelHtml + selHtml +
      '<div class="kbd' + (k.key ? '' : ' empty') + '" data-id="' + k.id + '">' + escHtml(kbd) + '</div>' +
      '<button class="del" data-id="' + k.id + '" title="删除">×</button>';
    list.appendChild(row);
  }
  list.querySelectorAll('.kbd').forEach(el => el.addEventListener('click', () => startCapture(el.dataset.id)));
  list.querySelectorAll('.key-action').forEach(el => el.addEventListener('change', e => {
    const id = e.target.dataset.id; const k = state.keys.find(x => x.id === id);
    if (k) { k.actionType = e.target.value; renderKeys(); updateExportPreview(); }
  }));
  list.querySelectorAll('.del').forEach(el => el.addEventListener('click', e => {
    const id = e.target.dataset.id; state.keys = state.keys.filter(x => x.id !== id); renderKeys(); updateExportPreview();
  }));
}

function updateExportPreview() {
  $('exportText').value = generateLua();
}

/* ---------- 按键录制 ---------- */
let capturingId = null;
function startCapture(id) {
  capturingId = id;
  $('captureOverlay').classList.remove('hidden');
  $('captureText').textContent = '按下组合键，例如 Ctrl + V …';
}
function endCapture() { capturingId = null; $('captureOverlay').classList.add('hidden'); }

function normalizeKey(e) {
  const map = { ArrowUp:'UpArrow', ArrowDown:'DownArrow', ArrowLeft:'LeftArrow', ArrowRight:'RightArrow',
    Escape:'Escape', Enter:'Enter', Tab:'Tab', Backspace:'Backspace', Delete:'Delete', ' ':'Space',
    Insert:'Insert', Home:'Home', End:'End', PageUp:'PageUp', PageDown:'PageDown' };
  if (map[e.key]) return map[e.key];
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(e.key)) return e.key;
  if (e.key && e.key.length === 1) return e.key.toUpperCase();
  return e.key;
}
function getMods(e) {
  const m = [];
  if (e.ctrlKey) m.push('CTRL');
  if (e.altKey) m.push('ALT');
  if (e.shiftKey) m.push('SHIFT');
  if (e.metaKey) m.push('SUPER');
  return m.join('|');
}
document.addEventListener('keydown', e => {
  if (!capturingId) return;
  e.preventDefault(); e.stopPropagation();
  if (e.key === 'Escape') { endCapture(); return; }
  const key = normalizeKey(e);
  const mods = getMods(e);
  const k = state.keys.find(x => x.id === capturingId);
  if (k) { k.key = key; k.mods = mods; }
  endCapture();
  renderKeys(); updateExportPreview();
});

/* ============================================================
 * 导入 / 导出
 * ============================================================ */
function handleImport(text, fileName) {
  try {
    state = parseLua(text);
    bgObjectUrl = null; // 导入的路径无法在浏览器内直接预览，需重新选择图片
    syncInputsFromState();
    updatePreview();
    updateExportPreview();
    const importedImg = state.appearance.bgImage;
    $('bgImageHelp').textContent = importedImg ? ('已读取背景图路径：' + importedImg + '（浏览器内无法预览本地图片；已用后端校验该路径）') : '';
    if (importedImg) verifyBgPath(importedImg);   // 校验导入的背景图真实路径是否有效
    showStatus('已成功导入 ' + (fileName || '配置') + '，共解析 ' + state.keys.length + ' 条快捷键。', true);
  } catch (err) {
    showStatus('导入失败：' + err.message, false);
  }
}

function showStatus(msg, ok) {
  const el = $('status'); el.textContent = msg; el.className = 'status ' + (ok ? 'ok' : 'err');
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function saveToFile(content) {
  const filename = ($('targetPath').value || '').split(/[\\/]/).pop() || 'wezterm.lua';
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description:'Lua', accept:{'text/plain':['.lua'] } }] });
      const w = await handle.createWritable(); await w.write(content); await w.close();
      showStatus('已保存到：' + handle.name, true); return;
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  download('wezterm.lua', content);
  showStatus('当前浏览器不支持直接写文件，已触发下载。可将文件放到：' + ($('targetPath').value || '~/.wezterm.lua'), true);
}

/* ============================================================
 * 程序匹配：链接 WT（后端优先，浏览器回退）
 *   后端模式：通过 /api/detect、/api/resolve、/api/write 直接操作本机文件
 *   浏览器回退：File System Access API（window.showDirectoryPicker）
 * ============================================================ */
const matchState = {
  mode: 'backend',      // 'backend' | 'browser'
  configPath: null,     // 后端模式下的目标文件绝对路径
  installPath: '',      // 检测到的安装目录
  // —— 以下为浏览器回退模式使用 ——
  dirHandle: null,
  parentHandle: null,
  targetName: null,
  targetHandle: null,
  found: false,
};

/* ---------- 路径辅助（前端无 node path） ---------- */
function dirOf(p) { const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\')); return i < 0 ? p : p.slice(0, i); }
function baseOf(p) { const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\')); return i < 0 ? p : p.slice(i + 1); }

/* ---------- 后端 API 客户端 ---------- */
// 关键：当页面以 file:// 直接打开时，相对路径 /api/... 会解析为 file:///api/... 而失败。
// 因此后端模式统一使用绝对地址（默认 127.0.0.1:8765）；若页面本身由后端以 http(s) 提供，
// 则同源相对路径也可工作。
function apiBase() {
  if (location.protocol === 'file:') return 'http://127.0.0.1:8765';
  if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') return '';
  return 'http://127.0.0.1:8765'; // 经由其它代理/域名打开时，回退到本机后端默认地址
}
async function apiGet(url) {
  const r = await fetch(apiBase() + url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function apiPost(url, body) {
  const r = await fetch(apiBase() + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

// 测试后端连接，更新卡片内的连接状态提示
async function pingBackend() {
  const el = $('pingStatus');
  el.textContent = '连接中…';
  el.style.color = '';
  try {
    await apiGet('/api/ping');
    el.textContent = '✅ 后端已连接（' + apiBase() + '）';
    el.style.color = 'var(--accent)';
    return true;
  } catch (e) {
    el.textContent = '❌ 无法连接后端：' + e.message;
    el.style.color = 'var(--danger)';
    return false;
  }
}

// 校验背景图真实路径是否存在（需后端，file:// 下回退为静默）
async function verifyBgPath(p) {
  const help = $('bgImageHelp');
  if (!p) { help.textContent = ''; help.style.color = ''; return; }
  try {
    const r = await apiGet('/api/stat?path=' + encodeURIComponent(p));
    if (r.exists && r.isFile) {
      help.textContent = '✅ 背景图路径有效，真实终端可正确加载';
      help.style.color = 'var(--accent)';
    } else {
      help.textContent = '⚠️ 该路径不存在或不是文件，真实终端将无法加载背景';
      help.style.color = 'var(--danger)';
    }
  } catch (e) { /* 后端不可达：不做校验提示 */ }
}

function applyMatchUIFound(r, found) {
  const fileInput = $('matchTargetFile'), dirInput = $('matchDirName');
  dirInput.value = r.installPath || (r.configPath ? dirOf(r.configPath) : '未检测到');
  fileInput.value = r.configPath + (found ? '' : '（新建）');
  fileInput.classList.toggle('matched', found);
  fileInput.classList.toggle('missing', !found);
  if (r.content && r.content.trim()) handleImport(r.content, baseOf(r.configPath));
  $('applyMatchBtn').disabled = false;
}

// 自动检测 WT 安装与配置（后端）
async function detectMatch() {
  try {
    const r = await apiGet('/api/detect');
    if (r.error) throw new Error(r.error);
    matchState.mode = 'backend';
    matchState.configPath = r.configPath || null;
    matchState.installPath = r.installPath || '';
    if (r.configPath) {
      applyMatchUIFound(r, r.found);
      if (r.found) {
        showStatus('已自动检测并定位 ' + r.configPath + '，已载入现有配置。', true);
      } else if (r.recommended) {
        showStatus('未找到现有配置，将按 WezTerm 官方推荐在 ' + r.configPath + ' 新建；也可放在与 wezterm.exe 同目录的 ' + (r.installPath || '安装目录') + '\\wezterm.lua。点击「应用到程序」即可创建。', false);
      } else {
        showStatus('未找到配置文件，将新建 ' + r.configPath + '。', false);
      }
    } else {
      $('matchTargetFile').value = '未检测到配置文件';
      $('matchTargetFile').classList.add('missing');
      showStatus('未检测到 WT 配置文件，请在上方手动填写安装 / 配置路径后点击「定位」。', false);
    }
  } catch (e) {
    // 后端不可达 → 回退到浏览器目录选择器
    matchState.mode = 'browser';
    if (window.showDirectoryPicker) {
      showStatus('未连接本地后端，已切换为浏览器目录选择器（需 Chromium 内核浏览器）。', false);
      pickInstallDir();
    } else {
      showStatus('无法连接本地后端（' + e.message + '）。请确认：① 已运行 node server.js；② 本页通过 http://127.0.0.1:8765 打开（而非双击本地文件）；③ 后端与浏览器在同一台机器上。', false);
    }
  }
}

// 按给定路径定位配置（后端）
async function resolveMatch(input) {
  try {
    const r = await apiPost('/api/resolve', { path: input || '' });
    if (r.error) { showStatus('定位失败：' + r.error, false); return; }
    matchState.mode = 'backend';
    matchState.configPath = r.configPath;
    matchState.installPath = r.installPath || '';
    applyMatchUIFound(r, r.found);
    showStatus(r.found ? ('已定位 ' + r.configPath + '，已载入现有配置。') : ('未找到配置文件，将新建 ' + r.configPath), r.found);
  } catch (e) {
    matchState.mode = 'browser';
    showStatus('无法连接本地后端（' + e.message + '）。请运行 node server.js 后重试。', false);
  }
}

// 通过后端写入配置（写入前由后端自动备份）
async function applyViaBackend() {
  if (!matchState.configPath) { showStatus('请先自动检测或定位配置文件。', false); return; }
  const btn = $('applyMatchBtn'); btn.disabled = true;
  try {
    const lua = generateLua();
    const r = await apiPost('/api/write', { configPath: matchState.configPath, content: lua });
    if (r.error) throw new Error(r.error);
    const fileInput = $('matchTargetFile');
    fileInput.classList.remove('missing');
    fileInput.classList.add('matched');
    showStatus('✅ 已通过后端写入 ' + r.configPath + '（' + (r.lines || lua.split('\n').length) + ' 行）'
      + (r.backup ? '，原文件已备份为 ' + baseOf(r.backup) : '（新建文件，无备份）') + '。', true);
  } catch (e) {
    showStatus('❌ 写入失败：' + e.message + '。原文件未被修改。', false);
  } finally { btn.disabled = false; }
}

// 统一入口：按当前模式分发
async function applyMatch() {
  if (matchState.mode === 'backend') return applyViaBackend();
  return applyToProgram();
}

/* ---------- 浏览器回退：File System Access API ---------- */
function isTargetName(name) {
  if (name === 'wezterm.lua') return true;
  if (name === '.wezterm.lua') return true;
  if (/\.wezterm\.lua$/.test(name)) return true;
  return false;
}

// 在目录中递归查找目标配置文件（限制深度，跳过无关目录）
async function findTargetFiles(dir, depth, base) {
  if (depth > 3) return [];
  const out = [];
  try {
    for await (const [name, handle] of dir.entries()) {
      if (name === 'node_modules' || name === '.git' || name === '.cache') continue;
      if (handle.kind === 'file') {
        if (isTargetName(name)) out.push({ name, handle, parentHandle: dir, relPath: base + name });
      } else if (handle.kind === 'directory' && depth < 3) {
        const sub = await findTargetFiles(handle, depth + 1, base + name + '/');
        out.push(...sub);
      }
    }
  } catch (e) { /* 权限不足等异常：跳过该目录继续 */ }
  return out;
}

// 选择 WT 安装 / 配置目录，并自动定位目标文件
async function pickInstallDir() {
  if (!window.showDirectoryPicker) {
    showStatus('当前浏览器不支持目录访问（需基于 Chromium 内核的浏览器，如 Edge / Chrome，且通过 https 或 localhost 打开）。请改用上方「保存到文件」手动写入。', false);
    return;
  }
  const dirInput = $('matchDirName'), fileInput = $('matchTargetFile'), applyBtn = $('applyMatchBtn');
  try {
    const dirHandle = await window.showDirectoryPicker();
    matchState.dirHandle = dirHandle;
    dirInput.value = '📁 ' + dirHandle.name;
    fileInput.value = '自动定位中…';
    fileInput.classList.remove('matched', 'missing');
    applyBtn.disabled = true;

    const matches = await findTargetFiles(dirHandle, 0, '');
    if (matches.length) {
      matches.sort((a, b) => a.relPath.length - b.relPath.length); // 优先选择层级最浅的
      const m = matches[0];
      matchState.parentHandle = m.parentHandle;
      matchState.targetName = m.name;
      matchState.targetHandle = m.handle;
      matchState.found = true;
      dirInput.value = '📁 ' + dirHandle.name;
      fileInput.value = dirHandle.name + '/' + m.relPath;
      fileInput.classList.add('matched');

      // 载入现有配置：捕获保留行（preserved），保证写入非破坏式
      const text = await m.handle.getFile().then(f => f.text());
      handleImport(text, m.name);
      applyBtn.disabled = false;

      const extra = matches.length > 1
        ? ('（共发现 ' + matches.length + ' 个候选，已选择层级最浅的 ' + m.relPath + '）')
        : '';
      showStatus('已定位配置文件 ' + m.name + '，并已载入现有配置，可修改后点击「应用到程序」。' + extra, true);
    } else {
      // 未找到：提议在该目录新建 wezterm.lua
      matchState.parentHandle = dirHandle;
      matchState.targetName = 'wezterm.lua';
      matchState.targetHandle = null;
      matchState.found = false;
      dirInput.value = '📁 ' + dirHandle.name;
      fileInput.value = dirHandle.name + '/wezterm.lua（新建）';
      fileInput.classList.add('missing');
      showStatus('未在所选目录中找到 wezterm 配置文件，点击「应用到程序」将在该目录新建 wezterm.lua。', false);
      applyBtn.disabled = false;
    }
  } catch (e) {
    if (e.name === 'AbortError') return; // 用户取消选择
    showStatus('选择目录失败：' + e.message, false);
  }
}

// 浏览器回退：将当前配置直接写入目标文件（写入前自动备份原文件）
async function applyToProgram() {
  if (!matchState.parentHandle || !matchState.targetName) {
    showStatus('请先点击「选择 WT 安装路径」定位配置文件。', false);
    return;
  }
  const fileInput = $('matchTargetFile'), applyBtn = $('applyMatchBtn');
  applyBtn.disabled = true;
  try {
    // 新建场景：确保目标文件句柄存在
    if (!matchState.targetHandle) {
      try {
        matchState.targetHandle = await matchState.parentHandle.getFileHandle(matchState.targetName, { create: true });
      } catch (e) { throw new Error('无法创建文件：' + e.message); }
    }
    // 必要时请求读写权限
    if (matchState.targetHandle.requestPermission) {
      try { await matchState.targetHandle.requestPermission({ mode: 'readwrite' }); } catch (e) { /* 忽略，交由后续写操作抛出明确错误 */ }
    }

    // 读取当前内容，用于备份
    let current = '';
    try { const f = await matchState.targetHandle.getFile(); current = await f.text(); } catch (e) { current = ''; }

    const lua = generateLua();

    // 修改前备份原文件（带时间戳，避免覆盖历史备份）
    const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    const bakName = matchState.targetName + '.bak-' + ts;
    const bakHandle = await matchState.parentHandle.getFileHandle(bakName, { create: true });
    const bw = await bakHandle.createWritable();
    await bw.write(current || '-- (原文件为空或新建)');
    await bw.close();

    // 写入新配置
    const w = await matchState.targetHandle.createWritable();
    await w.write(lua);
    await w.close();

    fileInput.classList.remove('missing');
    fileInput.classList.add('matched');
    showStatus('✅ 已成功写入 ' + matchState.targetName + '（' + lua.split('\n').length + ' 行）。原文件已备份为 ' + bakName + '。', true);
  } catch (e) {
    showStatus('❌ 写入失败：' + e.message + '。原文件未被修改。', false);
  } finally {
    applyBtn.disabled = false;
  }
}

/* ============================================================
 * 示例配置
 * ============================================================ */
function loadSample() {
  const sample = [
    "local wezterm = require 'wezterm'",
    "local config = {}",
    "",
    "config.color_scheme = 'Tokyo Night'",
    "config.font = wezterm.font('JetBrains Mono')",
    "config.font_size = 13.0",
    "config.window_background_image = '/Users/me/Pictures/wallpaper.png'",
    "config.window_background_opacity = 0.85",
    "config.window_background_image_hsb = {",
    "  brightness = 0.9,",
    "  hue = 1.0,",
    "  saturation = 1.1,",
    "}",
    "config.initial_rows = 36",
    "config.initial_cols = 110",
    "config.default_cursor_style = 'BlinkingBar'",
    "config.cursor_thickness = '2px'",
    "config.window_decorations = 'RESIZE'",
    "config.keys = {",
    "  { key = 'v', mods = 'CTRL', action = wezterm.action.PasteFrom 'Clipboard' },",
    "  { key = 'c', mods = 'CTRL|SHIFT', action = wezterm.action.CopyTo 'Clipboard' },",
    "  { key = 'd', mods = 'CTRL', action = wezterm.action.SendKey { key = 'c', mods = 'CTRL' } },",
    "  { key = 't', mods = 'CTRL', action = wezterm.action.SpawnTab 'CurrentPaneDomain' },",
    "}",
    "return config",
  ].join('\n');
  handleImport(sample, '示例配置');
}

/* ============================================================
 * 初始化
 * ============================================================ */
function init() {
  // 下拉数据
  const fl = $('fontList'); COMMON_FONTS.forEach(f => { const o = document.createElement('option'); o.value = f; fl.appendChild(o); });
  const sl = $('schemeList'); SCHEME_NAMES.forEach(s => { const o = document.createElement('option'); o.value = s; sl.appendChild(o); });

  // 导航切换
  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('tab-' + b.dataset.tab).classList.add('active');
  }));

  // 外观滑块
  const bindRange = (id, key, group) => {
    $(id).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      state[group][key] = v;
      $(id + 'Val').textContent = v.toFixed(2);
      updatePreview(); updateExportPreview();
    });
  };
  bindRange('opacity', 'opacity', 'appearance');
  bindRange('brightness', 'brightness', 'appearance');
  bindRange('saturation', 'saturation', 'appearance');
  bindRange('hue', 'hue', 'appearance');

  // 背景图片选择
  $('bgImageBtn').addEventListener('click', () => $('bgImageFile').click());
  $('bgImageFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    bgObjectUrl = URL.createObjectURL(f);          // 仅用于浏览器内预览
    state.appearance.bgImageName = f.name;
    if (f.path) {                                  // Electron 等桌面环境可拿到本机真实路径
      state.appearance.bgImage = f.path;
      $('bgImagePath').value = f.path;
      verifyBgPath(f.path);
    } else {
      // 纯浏览器无法获取真实路径：预览可用，但真实终端需在输入框填写绝对路径
      $('bgImageHelp').textContent = '预览已更新（' + f.name + '）。浏览器无法读取本机真实路径，请在上方输入框填写该图片的绝对路径（如 C:\\Users\\...\\' + f.name + '），真实终端才能正确加载背景。';
    }
    updatePreview(); updateExportPreview();
  });
  // 真实绝对路径以文本框为准（生成配置时使用），并实时校验路径是否存在
  $('bgImagePath').addEventListener('change', e => {
    const v = e.target.value.trim();
    state.appearance.bgImage = v;
    updatePreview(); updateExportPreview();
    verifyBgPath(v);
  });

  // 其他配置
  $('fontFamily').addEventListener('input', e => { state.other.fontFamily = e.target.value; updatePreview(); updateExportPreview(); });
  $('fontSize').addEventListener('input', e => { state.other.fontSize = parseFloat(e.target.value) || 12; updatePreview(); updateExportPreview(); });
  $('colorScheme').addEventListener('input', e => { state.other.colorScheme = e.target.value; updatePreview(); updateExportPreview(); });
  $('initialRows').addEventListener('input', e => { state.other.initialRows = int(e.target.value); updatePreview(); updateExportPreview(); });
  $('initialCols').addEventListener('input', e => { state.other.initialCols = int(e.target.value); updatePreview(); updateExportPreview(); });
  $('windowDecorations').addEventListener('change', e => { state.other.windowDecorations = e.target.value; updatePreview(); updateExportPreview(); });
  $('cursorStyle').addEventListener('change', e => { state.other.cursorStyle = e.target.value; updatePreview(); updateExportPreview(); });
  $('cursorThickness').addEventListener('input', e => { state.other.cursorThickness = parseFloat(e.target.value) || 2; updatePreview(); updateExportPreview(); });
  $('cursorThicknessUnit').addEventListener('change', e => { state.other.cursorThicknessUnit = e.target.value; updatePreview(); updateExportPreview(); });
  $('cursorBlink').addEventListener('change', e => { state.other.cursorBlink = e.target.checked; updatePreview(); updateExportPreview(); });

  // 添加快捷键
  $('addKeyBtn').addEventListener('click', () => {
    state.keys.push({ id: uid(), actionType: 'paste', key: '', mods: '' });
    renderKeys(); updateExportPreview();
  });

  // 导入
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('ioImportBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => handleImport(r.result, f.name);
    r.readAsText(f);
    e.target.value = '';
  });
  $('sampleBtn').addEventListener('click', loadSample);

  // 程序匹配（后端直连 WT，浏览器回退）
  $('detectBtn').addEventListener('click', detectMatch);
  $('resolveBtn').addEventListener('click', () => resolveMatch($('matchPathInput').value));
  $('applyMatchBtn').addEventListener('click', applyMatch);
  $('pingBtn').addEventListener('click', pingBackend);
  pingBackend(); // 进入页面即探测后端连通性

  // 导出
  const doExport = () => { const lua = generateLua(); updateExportPreview(); return lua; };
  $('downloadBtn').addEventListener('click', () => { download('wezterm.lua', doExport()); showStatus('已生成并下载 wezterm.lua', true); });
  $('dlBtn2').addEventListener('click', () => { download('wezterm.lua', doExport()); showStatus('已下载 wezterm.lua', true); });
  $('saveBtn').addEventListener('click', () => { saveToFile(doExport()); });
  $('copyBtn').addEventListener('click', () => {
    const lua = doExport();
    navigator.clipboard.writeText(lua).then(() => showStatus('配置已复制到剪贴板', true)).catch(() => showStatus('复制失败，请手动选择文本复制', false));
  });

  // 恢复默认
  $('resetAllBtn').addEventListener('click', () => {
    state = defaultState(); bgObjectUrl = null;
    syncInputsFromState(); updatePreview(); updateExportPreview();
    showStatus('已恢复默认设置', true);
  });

  // 默认目标路径
  const user = (typeof process !== 'undefined' && process.env && process.env.USERPROFILE) || '';
  $('targetPath').value = user ? (user + '\\.wezterm.lua') : 'C:\\Users\\你的用户名\\.wezterm.lua';

  syncInputsFromState();
  updatePreview();
  updateExportPreview();
}

document.addEventListener('DOMContentLoaded', init);
