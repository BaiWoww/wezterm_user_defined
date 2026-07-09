'use strict';

/* ============================================================
 * 自定义 Windows 签名钩子（no-op）
 * 本工具不配置代码签名证书，electron-builder 默认仍会下载 winCodeSign
 * 并在本沙箱因无法创建其中的 macOS 符号链接而失败。
 * 通过提供该 no-op 签名函数，electron-builder 将跳过 winCodeSign 下载，
 * 直接产出未签名的安装包（安装时 Windows SmartScreen 会提示，但仍可正常安装）。
 * 若日后需要正式签名，把本文件替换为调用 signtool 的真实实现即可。
 * ============================================================ */

module.exports = async function customSign(configuration) {
  // configuration.path 为待签名文件路径；不签名，原样返回
  return configuration.path;
};
