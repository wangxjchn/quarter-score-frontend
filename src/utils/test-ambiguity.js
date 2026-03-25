/**
 * 测试 Lower32 编码的二义性问题
 */

import * as Lower32 from './lower32';

console.log('=== 测试二义性场景 ===\n');

// 场景 1: 原始数据剩余 2 位 [0b10]
// 补齐后变成 5 位 [0b10000] = 16 → 'g'

// 场景 2: 完整的 5 位数据 [0b10000] = 16 → 'g'

// 问题：解码时如何区分这两种情况？

console.log('分析：\n');

// 让我们手动模拟编码过程
console.log('案例 1: 单字节 0b10110100 (180)');
console.log('=====================================');

const byte1 = 0b10110100;
console.log(`原始字节：${byte1} (0b${byte1.toString(2).padStart(8, '0')})`);

let buffer = byte1;
let bitsLeft = 8;

console.log(`步骤 1: 读取 8 位 → buffer=${buffer}, bitsLeft=${bitsLeft}`);

// 提取第一个 5 位
const index1 = (buffer >> 3) & 0x1F;
bitsLeft = 3;
console.log(`步骤 2: 提取 5 位 → index=${index1} (0b${index1.toString(2).padStart(5, '0')}) → '${Lower32.CHARS[index1]}'`);
console.log(`         剩余 → buffer 的低${bitsLeft}位 = 0b${(buffer & ((1 << bitsLeft) - 1)).toString(2).padStart(bitsLeft, '0')}`);

// 剩余 3 位补齐
const remaining = buffer & ((1 << bitsLeft) - 1); // 取低 3 位
const paddedIndex = (remaining << (5 - bitsLeft)) & 0x1F;
console.log(`步骤 3: 剩余${bitsLeft}位补齐`);
console.log(`         剩余位：0b${remaining.toString(2).padStart(bitsLeft, '0')} (${remaining})`);
console.log(`         左移${5 - bitsLeft}位：0b${paddedIndex.toString(2).padStart(5, '0')} (${paddedIndex})`);
console.log(`         字符：'${Lower32.CHARS[paddedIndex]}'`);

const encoded1 = Lower32.encode(String.fromCharCode(byte1));
console.log(`\n最终编码："${encoded1}"`);
console.log(`长度：2 个字符\n`);

console.log('\n案例 2: 双字节 0b10110100 0b01101001 (180, 105)');
console.log('=====================================');

const bytes = [0b10110100, 0b01101001];
console.log(`原始字节：[${bytes.join(', ')}]`);

buffer = 0;
bitsLeft = 0;
let result = '';

for (let i = 0; i < bytes.length; i++) {
  console.log(`\n--- 处理第${i + 1}个字节 ---`);
  buffer = (buffer << 8) | bytes[i];
  bitsLeft += 8;
  console.log(`读取字节 ${bytes[i]} → buffer=${buffer} (0b${buffer.toString(2).padStart(16, '0')}), bitsLeft=${bitsLeft}`);
  
  while (bitsLeft >= 5) {
    const oldBitsLeft = bitsLeft;
    bitsLeft -= 5;
    const index = (buffer >> bitsLeft) & 0x1F;
    result += Lower32.CHARS[index];
    console.log(`提取 5 位：从${oldBitsLeft}位中取高 5 位`);
    console.log(`  右移${bitsLeft}位 → 0b${((buffer >> bitsLeft) & 0x1F).toString(2).padStart(5, '0')} (${index}) → '${Lower32.CHARS[index]}'`);
    console.log(`  剩余 bitsLeft=${bitsLeft}`);
  }
}

// 处理剩余位
if (bitsLeft > 0) {
  const remaining = buffer & ((1 << bitsLeft) - 1);
  const paddedIndex = (remaining << (5 - bitsLeft)) & 0x1F;
  console.log(`\n处理剩余位:`);
  console.log(`  剩余${bitsLeft}位：0b${remaining.toString(2).padStart(bitsLeft, '0')} (${remaining})`);
  console.log(`  左移${5 - bitsLeft}位：0b${paddedIndex.toString(2).padStart(5, '0')} (${paddedIndex})`);
  console.log(`  字符：'${Lower32.CHARS[paddedIndex]}'`);
  result += Lower32.CHARS[paddedIndex];
}

console.log(`\n最终编码："${result}"`);
console.log(`长度：${result.length}个字符`);

console.log('\n\n=== 关键发现 ===\n');
console.log('问题的核心在于：');
console.log('1. 编码时，如果剩余位数不足 5 位，会左移补齐到 5 位');
console.log('2. 解码时，无法区分这个 5 位组是"完整数据"还是"补齐后的数据"\n');

console.log('但是！实际上这并不影响正确性，因为：\n');
console.log('✅ 解码时只提取完整的 8 位字节');
console.log('✅ 不足 8 位的剩余位会被丢弃');
console.log('✅ 补齐的位在解码时会落入"丢弃区域"\n');

console.log('数学证明：');
console.log('设原始字节数为 N');
console.log('编码后字符数 M = ⌈8N/5⌉');
console.log('解码时总位数 = 5M');
console.log('可提取字节数 = ⌊5M/8⌋ = N ✅\n');

console.log('示例验证：');
const testCases = [
  [0b10110100],                           // 1 字节 → 2 字符 → 1 字节
  [0b10110100, 0b01101001],              // 2 字节 → 4 字符 → 2 字节
  [0b10110100, 0b01101001, 0b11001100],  // 3 字节 → 5 字符 → 3 字节
];

testCases.forEach((bytes, idx) => {
  const originalStr = String.fromCharCode(...bytes);
  const encoded = Lower32.encode(originalStr);
  const decoded = Lower32.decode(encoded);
  const match = originalStr === decoded;
  
  console.log(`\n案例${idx + 1}: ${bytes.length}字节`);
  console.log(`  原始：[${bytes.map(b => b.toString(2).padStart(8, '0')).join(', ')}]`);
  console.log(`  编码："${encoded}" (${encoded.length}字符)`);
  console.log(`  解码：[${[...decoded].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(', ')}]`);
  console.log(`  匹配：${match ? '✅' : '❌'}`);
});
