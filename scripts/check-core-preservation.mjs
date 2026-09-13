import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const before = JSON.parse(readFileSync('docs/core-chain/preservation-before.json', 'utf8'));
for (const [path, expected] of Object.entries(before)) {
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  assert.equal(actual, expected, 'Protected file changed: ' + path);
}
const folders = readdirSync('dist/cores').sort();
assert.deepEqual(folders, ['Connect_start', 'Discover_back', 'Discover_start', 'Learn_back', 'Learn_start']);
const packaged = {};
for (const folder of folders) {
  const files = readdirSync(join('dist/cores', folder));
  for (const name of files) assert(readFileSync(join('dist/cores', folder, name))
    .equals(readFileSync(join('Cores', folder, name))), 'Packaged bytes changed: ' + folder + '/' + name);
  packaged[folder] = files.length;
}
const result = { protectedFiles: Object.keys(before).length, allUnchanged: true, packaged, allPackagedBytesOriginal: true };
writeFileSync('docs/core-chain/preservation-verification.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
