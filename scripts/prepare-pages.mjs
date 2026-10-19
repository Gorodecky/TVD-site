import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const base = '/TVD-site/';

async function processDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(file);
      continue;
    }

    if (!entry.isFile() || !/\.(?:html|css)$/i.test(entry.name)) continue;
    const original = await readFile(file, 'utf8');
    const updated = entry.name.endsWith('.css')
      ? original.replace(/(url\(\s*["']?)\/(?!\/|TVD-site\/)/g, `$1${base}`)
      : original.replace(/(\b(?:src|href|poster)=['"])\/(?!\/|TVD-site\/)/g, `$1${base}`);
    if (updated !== original) await writeFile(file, updated);
  }
}

await processDirectory(dist);
