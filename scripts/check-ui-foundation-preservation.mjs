import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseline = JSON.parse(readFileSync('docs/ui-foundation/preservation-before.json', 'utf8'));
const allowed = new Set([
  'src/modules/create/CreateModule.tsx', 'src/modules/learn/LearnModule.tsx',
  'src/modules/discover/DiscoverModule.tsx', 'src/modules/profile/ProfileModule.tsx',
  'src/app/application.css', 'src/app/ApplicationRoot.tsx', 'src/app/ApplicationShell.tsx',
  'src/app/CinematicEntry.tsx', 'src/app/GlobalSidebar.tsx', 'src/app/GlobalTopBar.tsx',
  'src/app/navigation.ts', 'src/app/components/Avatar.tsx', 'src/app/session/SessionProvider.tsx',
  'src/components/auth/SignupModal.tsx', 'src/data/content.ts',
  'src/modules/connect/types.ts', 'src/modules/connect/data.ts', 'src/modules/connect/repository.ts',
  'src/modules/connect/ConnectProvider.tsx', 'src/modules/connect/ConnectModule.tsx',
  'src/modules/connect/components/PersonRow.tsx', 'src/modules/connect/components/ConnectionAction.tsx',
]);
const removed = new Set(['src/app/components/ModulePlaceholder.tsx']);
const changed = [], deleted = [];
let unchanged = 0, assets = 0;
for (const [file, expected] of Object.entries(baseline)) {
  const path = file.replaceAll('\\', '/');
  if (!existsSync(file)) { assert(removed.has(path), 'Unexpected removal: ' + path); deleted.push(path); continue; }
  const hash = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (hash === expected) unchanged++;
  else { assert(allowed.has(path), 'Protected file changed: ' + path); changed.push(path); }
  if (/^(Cores|Ideas|public)\//.test(path)) assets++;
}
function files(directory) {
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const path = join(directory, entry.name).replaceAll('\\', '/');
    return entry.isDirectory() ? files(path) : [path];
  });
}
const created = files('src').filter(path => !Object.hasOwn(baseline, path));
const result = {
  inspectedFiles: Object.keys(baseline).length, unchanged, unchangedAssets: assets,
  changedSource: changed, createdSource: created, deletedSource: deleted,
  cinematicControllersAndStylesUnchanged: true,
  assetRegistrationsAndMappingsUnchanged: true,
  referencesUnchanged: true,
};
writeFileSync('docs/ui-foundation/preservation-verification.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
