import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const baseline = JSON.parse(readFileSync('docs/application/preservation-before.json', 'utf8'));
const allowed = new Set(['src/app/App.tsx', 'src/main.tsx']);
const changed = [];
let unchanged = 0;
for (const [path, expected] of Object.entries(baseline)) {
  const normalized = path.replaceAll('\\', '/');
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (actual === expected) unchanged++;
  else {
    assert(allowed.has(normalized), 'Unexpected protected-file change: ' + normalized);
    changed.push(normalized);
  }
}
const result = { inspectedFiles: Object.keys(baseline).length, unchanged, changedExistingSource: changed,
  protectedCinematicFilesUnchanged: true, sourceAssetsUnchanged: true };
writeFileSync('docs/application/preservation-verification.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
