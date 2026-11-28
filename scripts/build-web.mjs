#!/usr/bin/env node
/* eslint-disable no-console -- command-line build script */
/**
 * Builds the public website into dist/ for `eas deploy`:
 *
 *   dist/            landing page (copied from landing/)
 *   dist/app/        the Expo web app, exported with base URL /app
 *
 * The web app is a single-page app, so every screen is served by dist/app/index.html. Copies of it
 * are placed at each static route so a refresh or shared link (e.g. /app/air) still loads.
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = '/app';
const exportDir = join(root, 'web-build');
const distDir = join(root, 'dist');
const appDir = join(distDir, BASE_URL.slice(1));

rmSync(exportDir, { recursive: true, force: true });
rmSync(distDir, { recursive: true, force: true });

console.log(`Exporting the web app with base URL ${BASE_URL}…`);
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', exportDir], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, WEB_BASE_URL: BASE_URL },
});

console.log('Assembling dist/ (landing page at /, app at /app)…');
cpSync(join(root, 'landing'), distDir, { recursive: true });
cpSync(exportDir, appDir, { recursive: true });
// eas deploy reads the export metadata from the folder it uploads.
copyFileSync(join(exportDir, 'metadata.json'), join(distDir, 'metadata.json'));

/** Static screens from app/, as URL paths. Groups like (tabs) and dynamic [id] segments are skipped. */
function staticRoutes(dir, prefix = '') {
  const routes = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      const segment = /^\(.*\)$/.test(name) ? '' : name;
      if (segment.startsWith('[')) continue;
      routes.push(...staticRoutes(full, segment ? `${prefix}/${segment}` : prefix));
      continue;
    }
    const match = /^([^.+_[][^.]*)\.tsx$/.exec(name);
    if (!match) continue;
    routes.push(match[1] === 'index' ? prefix : `${prefix}/${match[1]}`);
  }
  return routes;
}

const shell = join(appDir, 'index.html');
const routes = [...new Set(staticRoutes(join(root, 'app')))].filter(Boolean);
for (const route of routes) {
  const target = join(appDir, ...route.split('/').filter(Boolean), 'index.html');
  if (existsSync(target)) continue;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(shell, target);
}

rmSync(exportDir, { recursive: true, force: true });
console.log(
  `Done. Routes with their own entry: ${routes.map((r) => `${BASE_URL}${r}`).join(', ')}`,
);
console.log(`Output: ${relative(process.cwd(), distDir) || '.'}${sep}`);
