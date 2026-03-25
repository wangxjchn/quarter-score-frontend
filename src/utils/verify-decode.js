/**
 * Lower32/Upper32 编解码正确性验证
 */

import * as Lower32 from './lower32';
import * as Upper32 from './upper32';

console.log('=== 单字节测试 ===\n');

// 测试所有可能的单字节值
const testBytes = [0, 1, 127, 128, 255];

testBytes.forEach(byte => {
  const original = String.fromCharCode(byte);
  const encoded = Lower32.encode(original);
  const decoded = Lower32.decode(encoded);
  const match = original === decoded;
  
  console.log(`字节：${byte.toString().padStart(3)} | ` +
              `二进制：${byte.toString(2).padStart(8, '0')} | ` +
              `编码：${encoded.padEnd(3)} | ` +
              `解码：${decoded.charCodeAt(0).toString().padStart(3)} | ` +
              `${match ? '✅' : '❌'}`);
});

console.log('\n=== 多字节测试 ===\n');

const testStrings = [
  'A',           // 1 字节
  'AB',          // 2 字节
  'ABC',         // 3 字节
  'ABCD',        // 4 字节
  'Q1 绩效评估',   // 中文
  'Hello',       // 英文
  '你好',         // 纯中文
  '混合 Mixed',   // 混合
];

testStrings.forEach(str => {
  const encoded = Lower32.encode(str);
  const decoded = Lower32.decode(encoded);
  const match = str === decoded;
  
  console.log(`原文：${str.padEnd(12)} | ` +
              `编码：${encoded.padEnd(20)} | ` +
              `解码：${decoded.padEnd(12)} | ` +
              `${match ? '✅' : '❌'} ` +
              `(长度：${str.length} → ${encoded.length})`);
});

console.log('\n=== Upper32 测试 ===\n');

testStrings.forEach(str => {
  const encoded = Upper32.encode(str);
  const decoded = Upper32.decode(encoded);
  const match = str === decoded;
  
  console.log(`原文：${str.padEnd(12)} | ` +
              `编码：${encoded.padEnd(20)} | ` +
              `解码：${decoded.padEnd(12)} | ` +
              `${match ? '✅' : '❌'}`);
});

console.log('\n=== 边界情况测试 ===\n');

// 测试特殊字符
const specialChars = [
  '\x00',  // 空字符
  '\x1F',  // 控制字符
  '\x7F',  // DEL
  '\x80',  // 扩展 ASCII
  '\xFF',  // 最大字节
];

specialChars.forEach(char => {
  try {
    const encoded = Lower32.encode(char);
    const decoded = Lower32.decode(encoded);
    const match = char === decoded;
    
    console.log(`特殊字符：\\x${char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()} | ` +
                `编码：${encoded} | ` +
                `解码成功：${match ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`特殊字符：\\x${char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()} | ` +
                `错误：${error.message}`);
  }
});

console.log('\n=== 完整性验证 ===\n');

// 测试 0-255 所有字节值
let successCount = 0;
let failCount = 0;

for (let i = 0; i < 256; i++) {
  const char = String.fromCharCode(i);
  try {
    const encoded = Lower32.encode(char);
    const decoded = Lower32.decode(encoded);
    
    if (char === decoded) {
      successCount++;
    } else {
      failCount++;
      console.log(`❌ 失败：字节 ${i} (${char})`);
    }
  } catch (error) {
    failCount++;
    console.log(`❌ 异常：字节 ${i} (${char}) - ${error.message}`);
  }
}

console.log(`总计：256 个字节`);
console.log(`✅ 成功：${successCount}`);
console.log(`❌ 失败：${failCount}`);
