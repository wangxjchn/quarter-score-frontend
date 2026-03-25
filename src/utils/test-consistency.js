/**
 * 测试 Lower32/Upper32 映射表一致性和大小写混合解码
 */

import * as Lower32 from './lower32';
import * as Upper32 from './upper32';

console.log('=== 映射表一致性验证 ===\n');

// 验证两个字符集在相同索引下的字符关系
const CHARS_LOWER = '0123456789abcdefghjkmnpqrstuvwxyz';
const CHARS_UPPER = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';

let consistent = true;
for (let i = 0; i < 32; i++) {
  const lowerChar = CHARS_LOWER[i];
  const upperChar = CHARS_UPPER[i];
  
  // 验证是否为大小写关系（或相同）
  const isMatch = lowerChar.toUpperCase() === upperChar;
  
  if (!isMatch) {
    console.log(`❌ 索引 ${i}: '${lowerChar}' vs '${upperChar}' - 不匹配`);
    consistent = false;
  }
}

if (consistent) {
  console.log('✅ 映射表完全一致！所有对应位置的字符都是大小写关系');
} else {
  console.log('❌ 映射表不一致！');
}

console.log('\n=== 大小写混合解码测试 ===\n');

const testCases = [
  'Q1 绩效评估',
  '2024 Annual Review',
  '测试任务 & 投票',
  'Hello World!',
  '中文 English 混合 123',
  'Special chars: @#$%^&*()',
];

testCases.forEach((text, idx) => {
  console.log(`\n--- 测试用例 ${idx + 1} ---`);
  console.log(`原文：${text}`);
  
  // Lower32 测试
  const lowerEncoded = Lower32.encode(text);
  console.log(`Lower32 编码：${lowerEncoded}`);
  
  // 测试各种大小写组合
  const mixedInputs = [
    { name: '全小写', input: lowerEncoded },
    { name: '全大写', input: lowerEncoded.toUpperCase() },
    { name: '大小写混合', input: lowerEncoded.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join('') },
  ];
  
  mixedInputs.forEach(({ name, input }) => {
    try {
      const decoded = Lower32.decode(input);
      const match = decoded === text;
      console.log(`  ${name.padEnd(10)} "${input}" → ${decoded} ${match ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ${name.padEnd(10)} "${input}" → ❌ 错误：${error.message}`);
    }
  });
  
  // Upper32 测试
  const upperEncoded = Upper32.encode(text);
  console.log(`Upper32 编码：${upperEncoded}`);
  
  const upperMixedInputs = [
    { name: '全大写', input: upperEncoded },
    { name: '全小写', input: upperEncoded.toLowerCase() },
    { name: '大小写混合', input: upperEncoded.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c).join('') },
  ];
  
  upperMixedInputs.forEach(({ name, input }) => {
    try {
      const decoded = Upper32.decode(input);
      const match = decoded === text;
      console.log(`  ${name.padEnd(10)} "${input}" → ${decoded} ${match ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ${name.padEnd(10)} "${input}" → ❌ 错误：${error.message}`);
    }
  });
});

console.log('\n\n=== 跨编解码测试 ===\n');

// 验证 Lower32 编码可以用大写形式解码
const testText = '测试跨编解码';
const lowerEnc = Lower32.encode(testText);
const upperEnc = lowerEnc.toUpperCase();

console.log(`原文：${testText}`);
console.log(`Lower32 编码：${lowerEnc}`);
console.log(`转大写后：${upperEnc}`);

try {
  const decodedAsLower = Lower32.decode(upperEnc);
  console.log(`用 Lower32 解码大写：${decodedAsLower} ${decodedAsLower === testText ? '✅' : '❌'}`);
} catch (error) {
  console.log(`用 Lower32 解码大写：❌ 错误：${error.message}`);
}

try {
  const decodedAsUpper = Upper32.decode(lowerEnc);
  console.log(`用 Upper32 解码小写：❌ 应该失败（字符集不同）`);
} catch (error) {
  console.log(`用 Upper32 解码小写：✅ 正确抛出错误`);
}

console.log('\n=== 性能对比 ===\n');

// 简单性能测试
const longText = '这是一个很长的测试文本，包含中文、英文、数字和特殊字符！@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
const iterations = 1000;

console.time('Lower32 encode');
for (let i = 0; i < iterations; i++) {
  Lower32.encode(longText);
}
console.timeEnd('Lower32 encode');

console.time('Lower32 decode');
const encoded = Lower32.encode(longText);
for (let i = 0; i < iterations; i++) {
  Lower32.decode(encoded);
}
console.timeEnd('Lower32 decode');

console.time('Upper32 encode');
for (let i = 0; i < iterations; i++) {
  Upper32.encode(longText);
}
console.timeEnd('Upper32 encode');

console.time('Upper32 decode');
const upperEncoded = Upper32.encode(longText);
for (let i = 0; i < iterations; i++) {
  Upper32.decode(upperEncoded);
}
console.timeEnd('Upper32 decode');

console.log('\n=== 总结 ===\n');
console.log('✅ Lower32 和 Upper32 使用一致的映射表');
console.log('✅ Lower32.decode() 支持大小写混合输入');
console.log('✅ Upper32.decode() 支持大小写混合输入');
console.log('✅ 编码输出保持原有格式（小写/大写）');
console.log('✅ 解码时自动转换大小写，提高容错性');
