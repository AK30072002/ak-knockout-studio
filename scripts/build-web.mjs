// Prepares www/ for the Android app (Capacitor serves www/).
// Copies the web app, adds the Capacitor runtime and plugins (plain script builds,
// no bundler needed) and the Android additions in js/native-android.js.
// Usage: npm run build:web
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const include = ['index.html', 'css', 'js', 'assets'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const item of include) {
  const src = join(root, item);
  if (!existsSync(src)) throw new Error(`Missing ${item}`);
  await cp(src, join(out, item), { recursive: true });
}

// Capacitor runtime + plugins
const cap = [
  ['@capacitor/core/dist/capacitor.js', 'capacitor.js'],
  ['@capacitor/synapse/dist/synapse.js', 'synapse.js'],
  ['@capacitor/filesystem/dist/plugin.js', 'filesystem.js'],
  ['@capacitor/share/dist/plugin.js', 'share.js'],
  ['@capacitor/app/dist/plugin.js', 'app.js'],
];
await mkdir(join(out, 'js', 'cap'), { recursive: true });
for (const [from, to] of cap) {
  const src = join(root, 'node_modules', from);
  if (!existsSync(src)) throw new Error(`Missing ${from}. Run "npm install" first.`);
  await cp(src, join(out, 'js', 'cap', to));
}

const tags = [
  ...cap.map(([, to]) => `  <script src="js/cap/${to}"></script>` +
    (to === 'synapse.js' ? '\n  <script>window.synapse = window.outsystemsSynapse;</script>' : '')),
  '  <script src="js/native-android.js"></script>',
].join('\n');
const indexPath = join(out, 'index.html');
let html = await readFile(indexPath, 'utf8');
if (!html.includes('</body>')) throw new Error('index.html has no </body>');
html = html.replace('</body>', `${tags}\n</body>`);
await writeFile(indexPath, html);
console.log(`Android web app prepared in ${out}`);
