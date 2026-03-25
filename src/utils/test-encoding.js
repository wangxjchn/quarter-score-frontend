/**
 * Upper32 / Lower32 编码测试
 */

import * as Upper32 from './upper32';
import * as Lower32 from './lower32';

console.log('=== Upper32 编码测试 ===\n');

const testCases = [
  'Q1 绩效评估',
  '2024 Annual Review',
  '测试任务 & 投票',
  'Hello World!',
  '中文 English 混合 123'
];

testCases.forEach(text => {
  const encoded = Upper32.encode(text);
  const decoded = Upper32.decode(encoded);
  const isValid = Upper32.isValid(encoded);
  
  console.log(`原文：${text}`);
  console.log(`编码：${encoded}`);
  console.log(`解码：${decoded}`);
  console.log(`验证：${isValid ? '✅' : '❌'}`);
  console.log(`匹配：${text === decoded ? '✅' : '❌'}`);
  console.log('---');
});

console.log('\n=== Lower32 编码测试 ===\n');

testCases.forEach(text => {
  const encoded = Lower32.encode(text);
  const decoded = Lower32.decode(encoded);
  const isValid = Lower32.isValid(encoded);
  
  console.log(`原文：${text}`);
  console.log(`编码：${encoded}`);
  console.log(`解码：${decoded}`);
  console.log(`验证：${isValid ? '✅' : '❌'}`);
  console.log(`匹配：${text === decoded ? '✅' : '❌'}`);
  console.log('---');
});

console.log('\n=== 长度对比 ===\n');

testCases.forEach(text => {
  const upper32Len = Upper32.encode(text).length;
  const lower32Len = Lower32.encode(text).length;
  const base64Len = btoa(unescape(encodeURIComponent(text))).length;
  const urlEncodedLen = encodeURIComponent(text).length;
  
  console.log(`原文：${text} (${text.length} 字符)`);
  console.log(`Upper32: ${upper32Len}`);
  console.log(`Lower32: ${lower32Len}`);
  console.log(`Base64:  ${base64Len}`);
  console.log(`URL 编码：${urlEncodedLen}`);
  console.log('---');
});
