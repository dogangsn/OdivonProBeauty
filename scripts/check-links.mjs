// Static broken-link check: every internal link in templates, sitemap.xml and
// llms.txt must point to a route defined in src/app/app.routes.ts or to a
// file in public/. Run with `npm run check:links`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const routesSource = readFileSync(join(root, 'src/app/app.routes.ts'), 'utf8');

const routePaths = new Set(
  [
    ...routesSource.matchAll(/path:\s*'([^']*)'/g),
    ...routesSource.matchAll(/\[\s*'([a-z-]+)',\s*'[a-zA-Z]+'\s*\]/g),
  ].map((m) => m[1]),
);
routePaths.delete('**');
const patterns = [...routePaths].map(
  (p) =>
    new RegExp(
      `^/${p
        .split('/')
        .map((s) => (s.startsWith(':') ? '[^/]+' : s))
        .join('/')}$`,
    ),
);

function isKnown(url) {
  const path = url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (path === '/') return true;
  if (existsSync(join(root, 'public', path))) return true;
  return patterns.some((re) => re.test(path));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(html|ts)$/.test(name) && !name.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

const problems = [];
let checked = 0;
for (const file of walk(join(root, 'src/app'))) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/(?:routerLink|href)="([^"]*)"/g)) {
    const target = m[1];
    if (target.startsWith('javascript:')) {
      problems.push(`${relative(root, file)}: placeholder link "${target}"`);
      continue;
    }
    if (!target.startsWith('/')) continue;
    checked++;
    if (!isKnown(target)) problems.push(`${relative(root, file)}: unknown route "${target}"`);
  }
}
for (const file of ['public/sitemap.xml', 'public/llms.txt', 'public/robots.txt']) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const m of text.matchAll(/https:\/\/odivonpro-beauty\.pages\.dev(\/[^\s<)"]*)/g)) {
    checked++;
    if (!isKnown(m[1])) problems.push(`${file}: unknown route "${m[1]}"`);
  }
}

if (problems.length) {
  console.error(`Broken links (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Link check passed: ${checked} internal links OK.`);
