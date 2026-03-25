/**
 * Lower32 编码工具
 * 将字符串编码为仅包含小写字母 + 数字的 URL 安全字符串
 * 字符集：0-9, a-z (排除易混淆字符：i, l, o)
 */

// 字符集映射表（32 个字符）- 基础版本（小写）
const CHARS_LOWER = '0123456789abcdefghjkmnpqrstuvwxyz'; // 排除 i, l, o
const BASE = 32;

/**
 * 将字符串编码为 Lower32
 * @param {string} input - 输入字符串
 * @returns {string} - 编码后的字符串
 */
export function encode(input) {
  if (!input) return '';
  
  // 将字符串转换为 UTF-8 字节数组
  const bytes = new TextEncoder().encode(input);
  
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bitsLeft += 8;
    
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      const index = (buffer >> bitsLeft) & 0x1F; // 取最高 5 位
      result += CHARS_LOWER[index];
    }
  }
  
  // 处理剩余的位
  if (bitsLeft > 0) {
    const index = (buffer << (5 - bitsLeft)) & 0x1F;
    result += CHARS_LOWER[index];
  }
  
  return result;
}

/**
 * 将 Lower32 字符串解码为原始字符串
 * 支持大小写混合输入（自动转小写）
 * @param {string} encoded - 编码后的字符串
 * @returns {string} - 解码后的原始字符串
 */
export function decode(encoded) {
  if (!encoded) return '';
  
  let buffer = 0;
  let bitsLeft = 0;
  const bytes = [];
  
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i].toLowerCase(); // 转小写以支持大小写混合
    const index = CHARS_LOWER.indexOf(char);
    
    if (index === -1) {
      throw new Error(`Invalid character: ${char}`);
    }
    
    buffer = (buffer << 5) | index;
    bitsLeft += 5;
    
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xFF);
    }
  }
  
  // 将字节数组转换回字符串
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * 验证字符串是否为有效的 Lower32 编码
 * @param {string} str - 待验证的字符串
 * @returns {boolean} - 是否有效
 */
export function isValid(str) {
  if (!str) return false;
  return /^[0-9abcdefghjkmnpqrstuvwxyz]+$/.test(str);
}
