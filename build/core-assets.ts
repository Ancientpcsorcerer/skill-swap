import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import type { Plugin } from 'vite';
import { compareFrameNames } from '../src/components/core/connect/sequence.ts';

const names: Record<string, string> = { create: 'Create', learn: 'Learn', discover: 'Discover' };
export function coreAssets(): Plugin {
  let root = '', base = '/', build = false;
  return {
    name: 'independent-core-assets',
    configResolved(config) { root = config.root; base = config.base; build = config.command === 'build'; },
    resolveId(id) { if (id.startsWith('virtual:core-frames/') && names[id.split('/').at(-1)!]) return '\0' + id; },
    load(id) {
      if (!id.startsWith('\0virtual:core-frames/')) return;
      const core = names[id.split('/').at(-1)!];
      const sources = ['start', 'back'].map(suffix => {
        const folder = core + '_' + suffix;
        const directory = resolve(root, 'Cores', folder);
        const files = existsSync(directory) ? readdirSync(directory).filter(name => /\.(jpe?g|png|webp|avif)$/i.test(name)).sort(compareFrameNames) : [];
        for (const name of files) this.addWatchFile(resolve(directory, name));
        return { folder, directory, files };
      });
      let issue: string | null = sources.some(source => !source.files.length) ? core + ' sequence is missing.' : null;
      if (core === 'Create' && !issue) {
        const duplicated = sources.every(source => source.files.every(name => {
          const connect = resolve(root, 'Cores', source.folder.replace('Create', 'Connect'), name);
          return existsSync(connect) && readFileSync(resolve(source.directory, name)).equals(readFileSync(connect));
        }));
        if (duplicated) issue = 'Create_start and Create_back duplicate Connect. Correct Create artwork is required.';
      }
      if (issue) return 'export default ' + JSON.stringify({ valid: false, issue, forward: [], reverse: [] });
      const lists = sources.map(source => source.files.map(name => {
        const path = resolve(source.directory, name);
        if (!build) return JSON.stringify(base + 'Cores/' + source.folder + '/' + encodeURIComponent(name));
        const reference = this.emitFile({ type: 'asset', fileName: 'cores/' + source.folder + '/' + name,
          originalFileName: relative(root, path), source: readFileSync(path) });
        return 'import.meta.ROLLUP_FILE_URL_' + reference;
      }));
      return 'export default {valid:true,issue:null,forward:[' + lists[0].join(',') + '],reverse:[' + lists[1].join(',') + ']};';
    },
  };
}
