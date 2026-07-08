/* E2E 重生成脚本：用真实的 generateLua() 生成配置，luaparse 校验，写回真实终端配置。
 * 用法: node gen_test.js
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const APP = path.join(__dirname, 'app.js');
// 输出路径可经环境变量覆盖；默认指向本机 WezTerm 安装目录下的真实配置（作者机器）
const OUT = process.env.WT_CONFIG || 'E:/WezTerm/wezterm.lua';

// luaparse 为开发依赖：优先本地 node_modules，其次 NODE_PATH
let luaparse = null;
for (const tryLoad of [
  () => require('luaparse'),
  () => require(path.join(__dirname, 'node_modules', 'luaparse')),
]) {
  try { luaparse = tryLoad(); break; } catch (e) { /* 尝试下一个 */ }
}
if (!luaparse) console.warn('[WARN] luaparse 未安装，跳过语法校验。运行 `npm install` 安装（devDependency）。');

/* ---- 最小 DOM 桩，避免加载 app.js 时顶层代码抛错 ---- */
function makeEl() {
  const base = {
    style: {}, dataset: {}, textContent: '', value: '', checked: false,
    href: '', download: '',
    appendChild() {}, removeChild() {}, remove() {}, click() {},
    addEventListener() {}, querySelectorAll() { return []; },
    querySelector() { return null; }, setAttribute() {}, getAttribute() { return null; },
    classList: { add() {}, remove() {}, contains() { return false; } },
  };
  return new Proxy(base, { get(t, p) { return (p in t) ? t[p] : () => {}; }, set(t, p, v) { t[p] = v; return true; } });
}
const documentStub = {
  getElementById() { return makeEl(); },
  createElement() { return makeEl(); },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {},
  head: makeEl(), body: makeEl(),
};
const windowStub = { showSaveFilePicker: undefined, showDirectoryPicker: undefined, addEventListener() {} };

/* ---- 加载 app.js 到 VM，并暴露内部 API ---- */
const src = fs.readFileSync(APP, 'utf8');
const harness = `
;var __api = {
  setState(s){ state = s; },
  gen(){ return generateLua(); },
  classify(act){ return classifyAction(act); },
};
`;
const ctx = {
  document: documentStub, window: windowStub, console, Date, Math, Number, String,
  Object, Array, Set, JSON, isFinite, isNaN, parseInt, parseFloat, setTimeout,
  RegExp, Error,
};
vm.createContext(ctx);
vm.runInContext(src + harness, ctx, { filename: 'app.js' });

/* ---- 重建真实配置对应的 state ---- */
const state = {
  appearance: {
    bgImage: 'C:/Windows/Web/Wallpaper/Windows/img0.jpg', bgImageName: '',
    opacity: 0.9, brightness: 0.65, saturation: 1.1, hue: 1,
  },
  other: {
    fontFamily: 'JetBrains Mono', fontSize: 13, colorScheme: 'Tokyo Night',
    initialRows: 36, initialCols: 110, windowDecorations: 'RESIZE',
    cursorStyle: 'BlinkingBar', cursorThickness: 2, cursorThicknessUnit: 'px', cursorBlink: true,
  },
  keys: [
    { id: 'k1', actionType: 'paste',   key: 'V',        mods: 'CTRL' },
    { id: 'k2', actionType: 'copy',    key: 'C',        mods: 'CTRL|SHIFT' },
    { id: 'k3', actionType: 'stop',    key: 'C',        mods: 'CTRL' },
    { id: 'k4', actionType: 'nextTab', key: 'PageDown', mods: 'CTRL' },
    { id: 'k5', actionType: 'prevTab', key: 'PageUp',   mods: 'CTRL' },
  ],
  preserved: [],
};
ctx.__api.setState(state);
const lua = ctx.__api.gen();

/* ---- 校验 ---- */
let ok = true;
if (luaparse) {
  try { luaparse.parse(lua, { comments: true, scope: true }); console.log('[OK] luaparse 语法校验通过'); }
  catch (e) { ok = false; console.error('[FAIL] luaparse 语法错误:', e.message); }
}
// 动作名必须是 ActivateTabRelative，绝不能出现裸的 ActivateTabRel(
const bad = /ActivateTabRel(?!\w)/.test(lua); // 匹配 ActivTabRel 后不跟字母（即不是 ActivateTabRelative）
if (bad) { ok = false; console.error('[FAIL] 仍存在错误的动作名 ActivateTabRel'); }
if (!lua.includes('wezterm.action.ActivateTabRelative(1)'))  { ok = false; console.error('[FAIL] 缺少 nextTab 正确语句'); }
if (!lua.includes('wezterm.action.ActivateTabRelative(-1)')) { ok = false; console.error('[FAIL] 缺少 prevTab 正确语句'); }
if (ok) console.log('[OK] 动作名 ActivateTabRelative 正确');

// 反向校验 classifyAction 能识别
const c1 = ctx.__api.classify('wezterm.action.ActivateTabRelative(1)');
const c2 = ctx.__api.classify('wezterm.action.ActivateTabRelative(-1)');
console.log('[INFO] classify(...) =>', c1, '/', c2);

console.log('\n===== 生成的 wezterm.lua =====\n' + lua + '\n==============================\n');

if (!ok) { console.error('校验未通过，拒绝写回真实配置。'); process.exit(1); }

/* ---- 备份 + 写回 ---- */
if (fs.existsSync(OUT)) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(OUT, OUT + '.' + ts + '.bak');
  console.log('[OK] 已备份原配置 -> ' + OUT + '.' + ts + '.bak');
}
fs.writeFileSync(OUT, lua, 'utf8');
console.log('[OK] 已写回真实配置: ' + OUT);
