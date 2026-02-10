#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { readdir, mkdir, readFile } from 'fs/promises';
import { watch } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname);
const srcDir = join(root, 'src');
const distDir = join(root, 'dist');

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const year = new Date().getFullYear();
const banner = {
  js: [
    `/*! ${pkg.name} v${pkg.version}`,
    ` * ${pkg.description || ''}`,
    pkg.author ? ` * (c) ${year} ${pkg.author}` : ` * (c) ${year}`,
    ` * Released under the ${pkg.license || 'MIT'} License`,
    ' */',
    ''
  ].join('\n')
};

async function getEntries() {
  const files = await readdir(srcDir);
  return files.filter(f => f.endsWith('.js')).map(f => join(srcDir, f));
}

async function runBuild() {
  await mkdir(distDir, { recursive: true });
  const entries = await getEntries();

  for (const entryPath of entries) {
    const name = basename(entryPath, '.js');
    for (const minify of [false, true]) {
      const outfile = join(distDir, minify ? `${name}.min.js` : `${name}.js`);
      await esbuild.build({
        entryPoints: [entryPath],
        outfile,
        minify,
        sourcemap: true,
        banner,
        target: 'es2020',
        format: 'iife'
      });
    }
  }
  console.log('Build done:', entries.length, 'entries → dev + min in dist/');
}

const watchMode = process.argv.includes('--watch');
if (watchMode) {
  await runBuild();
  watch(srcDir, { recursive: false }, (eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
      console.log('Change:', filename);
      runBuild().catch(console.error);
    }
  });
  console.log('Watching src/ for changes...');
} else {
  await runBuild();
}
