import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('api', { recursive: true });

await build({
  entryPoints: ['src/api/vercel-entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'api/index.js',
  external: ['@vercel/node'],
  logLevel: 'info',
});

console.log('Bundled Vercel API handler to api/index.js');
