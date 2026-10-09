#!/usr/bin/env node
/* Checks every local link and image in dist/ points at a file that exists.
   npm run check   (after npm run build) */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

async function htmlFiles(dir) {
    const out = [];
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...await htmlFiles(p));
        else if (e.name.endsWith('.html')) out.push(p);
    }
    return out;
}

function target(url) {
    let p = url.split(/[?#]/)[0];
    if (!p || !p.startsWith('/') || p.startsWith('//')) return null;
    if (p.endsWith('/')) p += 'index.html';
    return path.join(DIST, decodeURI(p));
}

const files = await htmlFiles(DIST);
const broken = [];
let count = 0;
for (const f of files) {
    const html = await fs.readFile(f, 'utf8');
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
        const t = target(m[1]);
        if (!t) continue;
        count++;
        if (!existsSync(t)) broken.push(`${path.relative(DIST, f)} -> ${m[1]}`);
    }
}
console.log(`${files.length} pages, ${count} local links checked`);
if (broken.length) {
    console.log(`${broken.length} broken:\n  ` + [...new Set(broken)].join('\n  '));
    process.exit(1);
}
console.log('no broken links');
