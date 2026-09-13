import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const expected = {
  'Ideas/Connect_1_1.png': '8dba2661e5ddab968e9c78804a08e9b5f9b06c4be19649e5aabd0ba2fe4b5be9',
  'Ideas/physical depth.png': 'cf264785e14ac47790f6487064f5673365ebe8f04aee27f00e0cfb78ec519e28',
  'prompt.txt': 'a61e183f1a3628e2b2ae07b4d343c10fe1f6cc71678284e97c452297f4c29c09',
  'reference_0.webp': '630319780a15c0bad228a3ffbbd3e4d1da35148d6ebcafbdd9e2044b6be34a54',
};
for (const [file, hash] of Object.entries(expected)) {
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), hash, `${file} was modified`);
  console.log(`${file}: original SHA-256 verified`);
}
const manifest = JSON.parse(readFileSync('package.json', 'utf8').replace(/^\uFEFF/, ''));
const dependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
assert(!dependencies.some(name => /three|babylon|pixi|playcanvas|webgl|react-three/i.test(name)), 'Forbidden renderer dependency');
console.log('No WebGL / 3D-renderer dependencies.');


