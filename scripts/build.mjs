#!/usr/bin/env node
/* =============================================
   VNGroup Tourist - site build
   ---------------------------------------------
   npm run build            -> dist/  (what the web server serves)

   1. Reads the inbound tours from the API.
   2. Downloads each tour's photos once (.cache/) and writes resized
      WebP copies, plus a JPEG for link previews (og:image).
   3. Writes one static page per tour at /tours/<slug>/ from the
      tour-details.html template, so search engines get real HTML.
   4. Writes assets/data/tours.json: the trimmed tour list the pages
      read instead of calling the API.
   5. Pre-renders the tour cards on the homepage and tours page.
   6. Builds Tailwind CSS, trims the icon font to the icons in use,
      and writes sitemap.xml and robots.txt.

   The output is assembled in dist.tmp and swapped in at the end, so a
   failed build (API down, network error) leaves the live site as it was.
   Run it again whenever tours change; deploy/README.md has the cron line.

   Settings (environment variables):
     SITE_URL   public address, no trailing slash (default https://vngrouptourist.com)
     API_BASE   tour API (default https://lekhacduy.io.vn)
     GA_ID      Google Analytics 4 measurement ID; no analytics when empty
   ============================================= */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const TMP = path.join(ROOT, 'dist.tmp');
const CACHE = path.join(ROOT, '.cache');
const SOURCE_SITE = 'https://vngrouptourist.com';   // address written in the source pages
const SITE_URL = (process.env.SITE_URL || SOURCE_SITE).replace(/\/+$/, '');
const API_BASE = (process.env.API_BASE || 'https://lekhacduy.io.vn').replace(/\/+$/, '');
const GA_ID = (process.env.GA_ID || '').trim();

// Pages copied to dist and listed in the sitemap (tour-details.html and 404.html are copied, not listed).
const PAGES = ['index.html', 'tours.html', 'destinations.html', 'about.html', 'faqs.html',
    'contact.html', 'booking.html', 'privacy.html', 'terms.html'];
const OTHER_PAGES = ['tour-details.html', '404.html'];

const log = (...a) => console.log('[build]', ...a);
const read = f => fs.readFile(path.join(ROOT, f), 'utf8');
const hash = (s, n = 10) => crypto.createHash('sha1').update(s).digest('hex').slice(0, n);

/* ---------- Browser helpers, reused here so pages and build match ---------- */

globalThis.window = {};
vm.runInThisContext(await read('assets/js/tour-utils.js'), { filename: 'tour-utils.js' });
vm.runInThisContext(await read('assets/js/tour-page.js'), { filename: 'tour-page.js' });
const VNGT = window.VNGT;

/* ---------- API ---------- */

async function getJSON(url, tries = 3) {
    for (let i = 1; ; i++) {
        try {
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            if (i >= tries) throw new Error(`${url}: ${e.message}`);
            await new Promise(r => setTimeout(r, 1000 * i));
        }
    }
}

// Run fn over items, n at a time.
async function pool(items, n, fn) {
    const out = new Array(items.length);
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
        while (next < items.length) {
            const i = next++;
            out[i] = await fn(items[i], i);
        }
    }));
    return out;
}

/* ---------- Images ---------- */

const VARIANTS = {
    thumb: img => img.resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }),
    hero: img => img.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 70 }),
    gallery: img => img.resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 70 }),
    small: img => img.resize({ width: 700, withoutEnlargement: true }).webp({ quality: 70 }),
    og: img => img.resize({ width: 1200, height: 630, fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }),
};
const EXT = { og: 'jpg' };
const imageStats = { ok: 0, failed: [] };

async function original(uploadPath) {
    const url = API_BASE + encodeURI(uploadPath);
    const file = path.join(CACHE, 'src', hash(url, 16));
    if (existsSync(file)) return file;
    try {
        const res = await fetch(url);
        const type = res.headers.get('content-type') || '';
        if (!res.ok || !type.startsWith('image/')) throw new Error(`HTTP ${res.status} ${type}`);
        await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
        return file;
    } catch (e) {
        imageStats.failed.push(`${uploadPath} (${e.message})`);
        return null;
    }
}

// Returns the public path ("/img/tours/...") or null when the photo is missing or broken.
async function image(uploadPath, variant) {
    if (!uploadPath) return null;
    const src = await original(uploadPath);
    if (!src) return null;
    const name = `${hash(uploadPath, 12)}-${variant}.${EXT[variant] || 'webp'}`;
    const cached = path.join(CACHE, 'out', name);
    if (!existsSync(cached)) {
        try {
            await VARIANTS[variant](sharp(src, { failOn: 'none' }).rotate()).toFile(cached);
        } catch (e) {
            imageStats.failed.push(`${uploadPath} (${e.message})`);
            return null;
        }
    }
    await fs.copyFile(cached, path.join(TMP, 'img', 'tours', name));
    imageStats.ok++;
    return `/img/tours/${name}`;
}

/* ---------- HTML helpers ---------- */

function between(html, start, end, replacement) {
    const a = html.indexOf(start);
    const b = html.indexOf(end, a);
    if (a < 0 || b < 0) throw new Error(`markers not found: ${start} ... ${end}`);
    return html.slice(0, a) + replacement + html.slice(b + end.length);
}

function setMeta(html, attr, key, value) {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
    if (!re.test(html)) throw new Error(`meta ${key} not found`);
    return html.replace(re, `$1${VNGT.esc(value)}$2`);
}

function iconFontLink(names) {
    const list = [...names].sort().join(',');
    return `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;icon_names=${list}&amp;display=block" rel="stylesheet"/>`;
}

function analytics() {
    if (!GA_ID) return '';
    return `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
`;
}

/* ---------- Build ---------- */

async function main() {
    const started = Date.now();
    await fs.rm(TMP, { recursive: true, force: true });
    for (const d of ['img/tours', 'assets/css', 'assets/data', 'tours']) await fs.mkdir(path.join(TMP, d), { recursive: true });
    for (const d of ['src', 'out']) await fs.mkdir(path.join(CACHE, d), { recursive: true });

    // 1. Tours
    log(`API ${API_BASE}`);
    const list = (await getJSON(`${API_BASE}/api/tours?category_code=inbound`)).data || [];
    const visible = list.filter(t => !t.is_hidden);
    const tours = await pool(visible, 6, async t => (await getJSON(`${API_BASE}/api/tours/${t.id}`)).data);
    if (!tours.length) throw new Error('the API returned no inbound tours; keeping the current site');
    log(`${tours.length} tours`);

    // 2. Photos
    await pool(tours, 4, async t => {
        t.slug = VNGT.slug(t);
        t.url = `/tours/${t.slug}/`;
        t.img = {
            thumb: await image(t.thumbnail, 'thumb'),
            hero: await image(t.thumbnail, 'hero'),
            og: await image(t.thumbnail, 'og'),
            gallery: (await Promise.all((t.gallery_images || []).slice(0, 3)
                .map((g, i) => image(g, i === 0 ? 'gallery' : 'small')))).filter(Boolean),
        };
    });
    log(`${imageStats.ok} images, ${imageStats.failed.length} missing`);

    // 3. Tour list for the pages
    const snapshot = tours.map(t => ({
        id: t.id,
        name: t.name,
        url: t.url,
        duration: t.duration,
        destination: t.destination ? { code: t.destination.code, name: t.destination.name } : null,
        subcategories: (t.subcategories || []).map(s => ({ code: s.code })),
        web_price: t.web_price,
        transport: t.transport,
        thumbnail: t.img.thumb,
        tour_code: t.tour_code,
        summary: VNGT.sentences(t.highlights)[0] || '',
    }));
    await fs.writeFile(path.join(TMP, 'assets/data/tours.json'),
        JSON.stringify({ built: new Date().toISOString(), tours: snapshot }));

    // 4. CSS
    execFileSync(path.join(ROOT, 'node_modules/.bin/tailwindcss'),
        ['-i', 'assets/css/input.css', '-o', path.join(TMP, 'assets/css/site.css'), '--minify'],
        { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });

    // 5. Static files
    await fs.cp(path.join(ROOT, 'assets/img'), path.join(TMP, 'assets/img'), { recursive: true });
    await fs.cp(path.join(ROOT, 'assets/js'), path.join(TMP, 'assets/js'), { recursive: true });
    await fs.copyFile(path.join(ROOT, 'assets/img/favicon-48.png'), path.join(TMP, 'favicon.ico'));
    // public/ is copied to the site root as is: search engine verification files and the like.
    if (existsSync(path.join(ROOT, 'public'))) await fs.cp(path.join(ROOT, 'public'), TMP, { recursive: true, filter: src => path.basename(src) !== 'README.txt' });

    // Cache-busting versions for CSS and JS
    const version = {};
    for (const f of ['assets/css/site.css', ...(await fs.readdir(path.join(TMP, 'assets/js'))).map(f => 'assets/js/' + f)]) {
        version['/' + f] = hash(await fs.readFile(path.join(TMP, f)), 8);
    }

    // Icons in use, from the pages and the scripts that write HTML
    const sources = [...PAGES, ...OTHER_PAGES, 'assets/js/tour-utils.js', 'assets/js/tour-page.js'];
    const icons = new Set();
    for (const f of sources) {
        for (const m of (await read(f)).matchAll(/material-symbols-outlined[^>]*>\s*([a-z0-9_]+)\s*</g)) icons.add(m[1]);
    }

    function finish(html) {
        html = html.split(SOURCE_SITE).join(SITE_URL);
        html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols[^>]*>/, iconFontLink(icons));
        html = html.replace(/(href|src)="(\/assets\/(?:css|js)\/[^"?]+)"/g,
            (m, attr, p) => version[p] ? `${attr}="${p}?v=${version[p]}"` : m);
        html = html.replace('</head>', analytics() + '</head>');
        // Text that only applies when analytics is on (privacy page)
        html = html.replace(/<!-- build:if-analytics -->([\s\S]*?)<!-- \/build:if-analytics -->\n?/g, GA_ID ? '$1' : '');
        return html;
    }

    // 6. Pages. Each one is written as <name>/index.html so its address is /<name>/ on any
    // web server; old /<name>.html links are redirected by nginx (deploy/nginx.conf.example).
    const outFile = f => (f === 'index.html' || f === '404.html' ? f : f.replace(/\.html$/, '/index.html'));
    for (const f of [...PAGES, ...OTHER_PAGES]) {
        let html = await read(f);
        if (f === 'index.html') {
            html = between(html, '<!-- build:cards -->', '<!-- /build:cards -->',
                VNGT.featured(snapshot, 3).map(VNGT.featuredCard).join(''));
        }
        if (f === 'tours.html') {
            html = between(html, '<!-- build:cards -->', '<!-- /build:cards -->', snapshot.map(VNGT.card).join(''));
            html = between(html, '<!-- build:count -->', '<!-- /build:count -->', String(snapshot.length));
        }
        await fs.mkdir(path.dirname(path.join(TMP, outFile(f))), { recursive: true });
        await fs.writeFile(path.join(TMP, outFile(f)), finish(html));
    }

    // 7. One page per tour
    const template = await read('tour-details.html');
    for (const t of tours) {
        const pageUrl = SITE_URL + t.url;
        // Local copies of the photos; gallery photos that failed to download are left out.
        const page = VNGT.renderTour({ ...t, gallery_images: t.img.gallery }, {
            siteUrl: SITE_URL,
            pageUrl,
            image: (kind, p) => {
                if (kind === 'gallery') return p;
                if (kind === 'og') return t.img.og ? SITE_URL + t.img.og : SITE_URL + '/assets/img/og-default.jpg';
                return t.img.hero || VNGT.image(null, 1200, 600);
            },
        });

        let html = template;
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${VNGT.esc(page.title)}</title>`);
        html = html.replace(/<!-- This file is the template[\s\S]*?-->\n/, '');
        html = setMeta(html, 'name', 'robots', 'index, follow');
        html = setMeta(html, 'name', 'description', page.description);
        html = setMeta(html, 'property', 'og:type', 'product');
        html = setMeta(html, 'property', 'og:title', page.title);
        html = setMeta(html, 'property', 'og:description', page.description);
        html = setMeta(html, 'property', 'og:image', page.ogImage);
        html = setMeta(html, 'property', 'og:url', pageUrl);
        html = setMeta(html, 'name', 'twitter:title', page.title);
        html = setMeta(html, 'name', 'twitter:description', page.description);
        html = setMeta(html, 'name', 'twitter:image', page.ogImage);
        html = html.replace(/<link rel="canonical" href="[^"]*"\/>/, `<link rel="canonical" href="${pageUrl}"/>`);
        const jsonLd = s => JSON.stringify(s).replace(/</g, '\\u003c');
        html = html.replace(/<script type="application\/ld\+json" id="tour-schema">[\s\S]*?<\/script>/,
            `<script type="application/ld+json">${jsonLd(page.schema)}</script>\n<script type="application/ld+json">${jsonLd(page.breadcrumb)}</script>`);
        html = between(html, '<!-- build:loading -->', '<!-- /build:loading -->', '');
        html = html.replace('<div id="detail-content" class="hidden"><!-- build:content --></div>',
            `<div id="detail-content">${page.html}</div>`);
        html = between(html, '<!-- build:client -->', '<!-- /build:client -->', '');

        const dir = path.join(TMP, 'tours', t.slug);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'index.html'), finish(html.split(SOURCE_SITE).join(SITE_URL)));
    }

    // 8. Sitemap and robots
    const today = new Date().toISOString().slice(0, 10);
    const urls = [
        ...PAGES.map(p => (p === 'index.html' ? '/' : '/' + p.replace(/\.html$/, '/'))),
        ...tours.map(t => t.url),
    ];
    await fs.writeFile(path.join(TMP, 'sitemap.xml'),
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls.map(u => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')
        + '\n</urlset>\n');
    await fs.writeFile(path.join(TMP, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

    // 9. Swap in
    await fs.rm(OUT, { recursive: true, force: true });
    await fs.rename(TMP, OUT);

    log(`${PAGES.length + OTHER_PAGES.length} pages + ${tours.length} tour pages for ${SITE_URL} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    if (imageStats.failed.length) log('photos that could not be used:\n  ' + [...new Set(imageStats.failed)].join('\n  '));
}

main().catch(async e => {
    console.error('[build] FAILED:', e.message);
    await fs.rm(TMP, { recursive: true, force: true });
    process.exit(1);
});
