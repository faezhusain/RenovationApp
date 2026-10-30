import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

// Static publish directories are public even when the GitHub repository is private.
// Keep user-provided spreadsheets, backups, environment files and receipt uploads out.
async function scan(directory) {
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    const path=join(directory,entry.name);
    if(entry.isDirectory()) { await scan(path); continue; }
    if(entry.isSymbolicLink() || /(?:^\.env|\.(?:xlsx?|csv|json|pdf|jpe?g|png|webp)$)/i.test(entry.name)) {
      throw new Error(`Private data or unsupported file in public directory: ${relative('public',path)}`);
    }
  }
}
await scan('public');
console.log('Public files checked.');
