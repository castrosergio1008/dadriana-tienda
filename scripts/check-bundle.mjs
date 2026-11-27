// Gzip bundle budget gate (DD-MVP 9.4 / QA-03).
// CI uploads `.next/static` AND `.next/app-build-manifest.json`, so both the
// global chunk budget and the Home First Load JS budget are enforced. A missing
// manifest is a failure: it must never silently skip the Home gate.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const buildIdPath = join(projectRoot, '.next', 'BUILD_ID');
const chunksDir = join(projectRoot, '.next', 'static', 'chunks');
const manifestPath = join(projectRoot, '.next', 'app-build-manifest.json');

const GLOBAL_CHUNKS_BUDGET_BYTES = 300_000;
const HOME_FIRST_LOAD_BUDGET_BYTES = 150_000;

let failed = false;

function fail(message) {
  failed = true;
  console.error(`[check:bundle] FAIL: ${message}`);
}

// Only a production build writes BUILD_ID. Check it before measuring gzip so
// dev artifacts (roughly 2 MB unbudgeted chunks) fail with an actionable error
// instead of a misleading budget overrun.
if (!existsSync(buildIdPath) || readFileSync(buildIdPath, 'utf8').trim() === '') {
  fail(
    '.next/BUILD_ID is missing or empty; run npm run build first; dev artifacts are not valid for the budget gate.',
  );
  process.exit(1);
}

function collectJsFiles(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectJsFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      found.push(path);
    }
  }
  return found;
}

function gzipBytes(file) {
  return gzipSync(readFileSync(file)).length;
}

const chunks = collectJsFiles(chunksDir).sort();
if (chunks.length === 0) {
  fail(`no .js chunks found in ${relative(projectRoot, chunksDir)}`);
} else {
  const total = chunks.reduce((sum, file) => sum + gzipBytes(file), 0);
  console.log(
    `[check:bundle] ${chunks.length} chunks, total gzip: ${total} bytes (budget ${GLOBAL_CHUNKS_BUDGET_BYTES} bytes)`,
  );
  if (total > GLOBAL_CHUNKS_BUDGET_BYTES) {
    fail(
      `total gzip ${total} bytes exceeds ${GLOBAL_CHUNKS_BUDGET_BYTES} bytes by ${total - GLOBAL_CHUNKS_BUDGET_BYTES} bytes`,
    );
  }
}

if (!existsSync(manifestPath)) {
  fail(
    '.next/app-build-manifest.json is missing; the Home 150 KB First Load JS gate cannot be enforced.',
  );
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const routeFiles = (manifest.pages?.['/page'] ?? [])
    .filter((file) => typeof file === 'string' && file.endsWith('.js'))
    .map((file) => join(projectRoot, '.next', file));

  if (routeFiles.length === 0) {
    fail('app-build-manifest.json has no JavaScript chunks for route "/"');
  } else {
    let firstLoad = 0;
    for (const file of new Set(routeFiles)) {
      if (!existsSync(file)) {
        fail(`Home route chunk from manifest is missing: ${relative(projectRoot, file)}`);
        continue;
      }
      firstLoad += gzipBytes(file);
    }
    console.log(
      `[check:bundle] Home (/) First Load JS: ${firstLoad} bytes gzip across ${new Set(routeFiles).size} chunks (budget ${HOME_FIRST_LOAD_BUDGET_BYTES} bytes)`,
    );
    if (firstLoad > HOME_FIRST_LOAD_BUDGET_BYTES) {
      fail(
        `Home First Load JS ${firstLoad} bytes exceeds ${HOME_FIRST_LOAD_BUDGET_BYTES} bytes by ${firstLoad - HOME_FIRST_LOAD_BUDGET_BYTES} bytes`,
      );
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log('[check:bundle] PASS');
