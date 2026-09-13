import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import type { Plugin } from 'vite';
import { compareFrameNames } from '../src/components/core/connect/sequence.ts';

const moduleId = 'virtual:connect-frames';
const resolvedId = '\0' + moduleId;

export function connectAssets(): Plugin {
  let root = '';
  let build = false;
  let base = '/';
  return {
    name: 'connect-sequence-assets',
    configResolved(config) { root = config.root; build = config.command === 'build'; base = config.base; },
    resolveId(id) { if (id === moduleId) return resolvedId; },
    load(id) {
      if (id !== resolvedId) return;
      // Approved synchronization correction: one source sequence for both directions.
      // Connect_back remains preserved in Cores, outside the runtime manifest.
      const folder = 'Connect_start';
      const directory = resolve(root, 'Cores', folder);
      const files = readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isFile() && /\.(?:jpe?g|png|webp|avif)$/i.test(entry.name))
        .map(entry => entry.name).sort(compareFrameNames);
      if (!files.length) this.error('No Connect images in ' + directory);
      const sequence = files.map(name => {
        const path = resolve(directory, name);
        this.addWatchFile(path);
        if (!build) return JSON.stringify(base + 'Cores/' + folder + '/' + encodeURIComponent(name));
        // Only the standalone deployment artifact receives copies; sources stay in place.
        const reference = this.emitFile({
          type: 'asset', fileName: 'cores/' + folder + '/' + name,
          originalFileName: relative(root, path), source: readFileSync(path),
        });
        return 'import.meta.ROLLUP_FILE_URL_' + reference;
      });
      return 'export default { forward: [' + sequence.join(',') + '] };';
    },
  };
}
