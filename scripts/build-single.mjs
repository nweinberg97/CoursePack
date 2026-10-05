/**
 * Builds a single self-contained HTML file (dist-single/index.html) with
 * inlined JS + CSS — used for the hosted live demo. `npm run build` (Vite)
 * remains the standard build.
 */
import { build } from 'esbuild';
import { compile } from 'tailwindcss';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

// 1. JS
const js = await build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true, minify: true, format: 'iife', write: false, target: 'es2020',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'empty' }, legalComments: 'none',
});
const jsText = js.outputFiles[0].text;

// 2. CSS via Tailwind v4 compiler with candidates scanned from source
const cssIn = await readFile(path.join(root, 'src/styles.css'), 'utf8');
const compiler = await compile(cssIn, {
  base: path.join(root, 'src'),
  async loadStylesheet(id, base) {
    const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : require.resolve(id, { paths: [base] });
    return { path: file, base: path.dirname(file), content: await readFile(file, 'utf8') };
  },
});
const candidates = new Set();
for (const f of await walk(path.join(root, 'src'))) {
  for (const m of (await readFile(f, 'utf8')).matchAll(/[^\s"'`{}<>\\]+/g)) candidates.add(m[0]);
}
let css = compiler.build([...candidates]);
css = (await build({ stdin: { contents: css, loader: 'css' }, minify: true, write: false })).outputFiles[0].text;

// 3. HTML
const head = `<title>CoursePack</title>
<meta name="description" content="CoursePack turns the best educational content on YouTube into structured learning paths.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}</style>`;
const body = `<div id="root"></div><script>${jsText.replace(/<\/script/g, '<\\/script')}</script>`;
await mkdir(path.join(root, 'dist-single'), { recursive: true });
await writeFile(path.join(root, 'dist-single/index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${head}</head><body>${body}</body></html>`);
// Fragment form for hosts that supply their own document skeleton.
await writeFile(path.join(root, 'dist-single/fragment.html'), `${head}\n${body}`);
console.log(`JS ${(jsText.length / 1024).toFixed(0)}KB · CSS ${(css.length / 1024).toFixed(0)}KB`);
