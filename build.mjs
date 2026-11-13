// Build: bundles src/ with esbuild and copies public/ into docs/ (GitHub Pages folder).
// npm run build   -> docs/
// npm run dev     -> builds and serves docs/ at http://localhost:8000
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const out = 'docs';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('public', out, { recursive: true });

const opts = {
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  outdir: out,
  logLevel: 'info',
};

if (process.argv.includes('--serve')) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: out, port: 8000 });
  console.log(`http://localhost:${port}`);
} else {
  await esbuild.build(opts);
}
