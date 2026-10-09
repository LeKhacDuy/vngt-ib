/* =============================================
   VNGroup Tourist - shared tour helpers
   ---------------------------------------------
   Used by index.html, tours.html and tour-details.html.

   The tour API is shared with the Vietnamese site (vngrouptourist.vn),
   so some fields arrive in Vietnamese or in a shape that reads badly
   to an overseas customer:
     - destination names   "Miền Nam", "TP. Hồ Chí Minh"
     - hotel rating        "3 sao"
     - tour tags           "Tour Doanh Nghiệp", each with its own bright colour
     - tour names          mostly typed in capitals
     - highlights / notes  plain text using - ● ○ ❖ ✔ 🗶 ... as bullets
   Everything here only changes how the data is shown; nothing is
   written back to the API.
   ============================================= */

window.VNGT = (function () {
    const API_BASE = 'https://lekhacduy.io.vn';
    // Prices are stored in VND. Change the rate here; the build and the pages both read it.
    const VND_PER_USD = 25000;

    /* ---------- Loading ---------- */

    const getJSON = url => fetch(url).then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
        return res.json();
    });

    // The build writes a trimmed copy of the tour list with optimised images
    // (/assets/data/tours.json), so pages do not wait on the API or depend on
    // its CORS settings. Straight from the API only when that file is missing,
    // e.g. when opening the source pages without building.
    // One request per page even when several scripts need the list.
    let toursPromise = null;
    function loadTours() {
        if (!toursPromise) {
            toursPromise = getJSON('/assets/data/tours.json')
                .then(json => json.tours)
                .catch(() => getJSON(API_BASE + '/api/tours?category_code=inbound').then(json => json.data || []));
        }
        return toursPromise;
    }

    /* ---------- Destinations ---------- */

    // Listed north to south so filters read in travel order.
    const DESTINATIONS = [
        ['inbound_mienbac', 'Northern Vietnam'],
        ['inbound_hanoi', 'Hanoi'],
        ['inbound_mientrung', 'Central Vietnam'],
        ['inbound_danang', 'Da Nang'],
        ['inbound_nhatrang', 'Nha Trang'],
        ['inbound_miennam', 'Southern Vietnam'],
        ['inbound_hcm', 'Ho Chi Minh City'],
        ['inbound_phuquoc', 'Phu Quoc'],
    ];
    const DEST_NAME = Object.fromEntries(DESTINATIONS);
    const DEST_ORDER = DESTINATIONS.map(d => d[0]);
    // A few tours point at the Vietnamese site's "hcm" destination instead of "inbound_hcm".
    const DEST_ALIAS = { hcm: 'inbound_hcm' };
    // Cities sit inside a region, so "Southern Vietnam" also lists Ho Chi Minh City and Phu Quoc tours.
    const REGION_OF = {
        inbound_hanoi: 'inbound_mienbac',
        inbound_danang: 'inbound_mientrung',
        inbound_nhatrang: 'inbound_mientrung',
        inbound_hcm: 'inbound_miennam',
        inbound_phuquoc: 'inbound_miennam',
    };

    function stripAccents(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    function destinationCode(d) {
        if (!d || !d.code) return '';
        return DEST_ALIAS[d.code] || d.code;
    }

    function destinationName(d) {
        if (!d) return '';
        return DEST_NAME[destinationCode(d)] || stripAccents(d.name);
    }

    // Unknown codes sort last.
    function compareDestinations(a, b) {
        const ia = DEST_ORDER.indexOf(a), ib = DEST_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    }

    function inDestination(tour, code) {
        const own = destinationCode(tour.destination);
        return own === code || REGION_OF[own] === code;
    }

    // [{ code, name, count, parent }] for the destinations that have tours.
    // A region's count includes its cities; parent is set on cities.
    function destinationsOf(tours) {
        const counts = {};
        const names = {};
        tours.forEach(t => {
            const code = destinationCode(t.destination);
            if (!code) return;
            counts[code] = (counts[code] || 0) + 1;
            names[code] = destinationName(t.destination);
            const region = REGION_OF[code];
            if (region) {
                counts[region] = (counts[region] || 0) + 1;
                names[region] = DEST_NAME[region];
            }
        });
        return Object.keys(counts)
            .sort(compareDestinations)
            .map(code => ({ code, name: names[code], count: counts[code], parent: REGION_OF[code] || '' }));
    }

    /* ---------- Tour tags ---------- */

    // English labels for the API's subcategory codes, in display priority.
    const TAGS = [
        ['promotion', 'Special Offer'],
        ['hot', 'Popular'],
        ['private', 'Private Tour'],
        ['mini', 'Short Trip'],
        ['gia_dinh', 'Family'],
        ['moi_la', 'Unique'],
        ['hanh_huong', 'Pilgrimage'],
        ['doanh_nghiep', 'Corporate'],
        ['hoc_sinh', 'Student'],
    ];
    const TAG_LABEL = Object.fromEntries(TAGS);
    const TAG_ORDER = TAGS.map(t => t[0]);
    // Sales tags get the brand red, descriptive tags stay neutral. The API's own
    // per-tag colours (pink, purple, sky blue ...) are not used: they fight the logo.
    const TAG_STRONG = new Set(['promotion', 'hot']);

    function hasTag(tour, code) {
        return (tour.subcategories || []).some(s => s.code === code);
    }

    function tagBadges(tour, max) {
        return (tour.subcategories || [])
            .filter(s => TAG_LABEL[s.code])
            .sort((a, b) => TAG_ORDER.indexOf(a.code) - TAG_ORDER.indexOf(b.code))
            .slice(0, max || 2)
            .map(s => {
                const cls = TAG_STRONG.has(s.code) ? 'bg-primary text-on-primary' : 'bg-white/90 text-ink';
                return `<span class="${cls} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">${TAG_LABEL[s.code]}</span>`;
            })
            .join('');
    }

    /* ---------- Labels ---------- */

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    function days(n) {
        n = Number(n) || 1;
        return n === 1 ? '1 Day' : n + ' Days';
    }

    // Prices are stored in VND; the site shows rounded USD.
    function usd(vnd) {
        return Math.round(vnd / VND_PER_USD);
    }
    function price(vnd) {
        return vnd ? '$' + usd(vnd).toLocaleString('en-US') : 'On request';
    }
    function priceLabel(vnd) {
        return vnd ? 'From' : 'Price';
    }

    // "3 sao" -> "3-star hotels". Callers skip it for day trips, which have no hotel.
    function hotels(rating) {
        const m = String(rating || '').match(/\d/);
        return m ? m[0] + '-star hotels' : '';
    }

    // No "an": in these names it is nearly always a place ("Hoi An", "Trang An").
    const SMALL_WORDS = new Set(['a', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
        'of', 'on', 'or', 'the', 'to', 'via', 'with']);
    const ACRONYMS = new Set(['VIP', 'HCM', 'HCMC', 'DMZ', 'UNESCO', 'A/C', 'PQ']);

    const isCaps = w => /\p{Lu}/u.test(w) && !/\p{Ll}/u.test(w) && !/\d/.test(w);

    // Most tour names are typed fully or partly in capitals
    // ("CU CHI TUNNELS AND  BLACK VIRGIN MOUNTAIN ", "VIP LIMOUSINE MEKONG DELTA DAY CRUISE (Full Day)").
    // When capitals make up much of the text, the all-caps words become title case and
    // mixed-case words are left as typed. Words with digits ("2D1N") keep their capitals,
    // and known acronyms are always upper case ("Vip" -> "VIP").
    function tidy(s) {
        s = String(s || '').replace(/\s+/g, ' ').trim();
        if (!s) return s;
        const words = s.split(' ');
        const withLetters = words.filter(w => /\p{L}/u.test(w)).length;
        const caps = words.filter(isCaps).length;
        const shouting = caps / withLetters >= 0.4 && (caps >= 2 || withLetters === 1);

        const out = words.map((w, i) => {
            // Brackets and trailing punctuation do not hide an acronym: "(Vip" -> "(VIP".
            const core = w.replace(/^[(\[]+|[)\],.:;]+$/g, '');
            if (core && ACRONYMS.has(core.toUpperCase())) return w.replace(core, core.toUpperCase());
            if (!shouting || !isCaps(w)) return w;
            const lower = w.toLowerCase();
            // Small words stay lower case, except at the start of the name or of a part ("... - A Journey").
            const startsPart = i === 0 || /^[-–—:(]$/.test(words[i - 1]) || /[:(]$/.test(words[i - 1]);
            if (!startsPart && SMALL_WORDS.has(lower)) return lower;
            return lower.replace(/(^|[\/(\-–&+.])(\p{L})/gu, (m, p, c) => p + c.toUpperCase());
        }).join(' ');
        return out.charAt(0).toUpperCase() + out.slice(1);
    }

    /* ---------- Images ---------- */

    function placeholder(w, h) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
            + `<rect width="100%" height="100%" fill="#F5EFE8"/>`
            + `<text x="50%" y="50%" fill="#BC342E" font-family="sans-serif" font-size="${Math.round(w / 16)}" `
            + `font-weight="700" text-anchor="middle" dominant-baseline="middle">VNGroup Tourist</text></svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // Paths from the build ("/img/...") are local; anything else is an API upload.
    function image(path, w, h) {
        if (!path) return placeholder(w || 600, h || 400);
        return /^(https?:|\/img\/)/.test(path) ? path : API_BASE + path;
    }

    // For onerror="" attributes. The SVG is URI-encoded, so it carries no quotes.
    function fallback(w, h) {
        return `this.onerror=null;this.src='${placeholder(w || 600, h || 400)}'`;
    }

    /* ---------- Free-text fields (highlights, notes, policies) ---------- */

    // Bullets seen in the data: - ● ○ ❖ * • ■ ★ ⮚ ✔ 🗶 and numbered "1." lines.
    const BULLET = /^(?:[-–—•●○◦■□▪❖★☆⮚➢➤►▸*✔✓✅🗶✗✘❌]|\d{1,2}[.)](?=\s))\s*/u;
    const NO_MARK = /^[🗶✗✘❌]/u;
    const YES_MARK = /^[✔✓✅]/u;
    const LEADING_EMOJI = /^(?:\p{Extended_Pictographic}️?\s*)+/u;
    const SEPARATOR = /^[_\-=~*.\s]{3,}$/;
    const HEADING_WORDS = /\b(inclu\w*|exclu\w*|polic(y|ies)|notes?|highlights?|overview|informations?|terms|payment|standards|cancell?ation|confirmation|itinerary)\b/i;
    // "Duration: 1 Day", "Start : 7:00 AM". The label must contain a letter so "10:30" is left alone.
    const LABELLED = /^(?=[^:]*\p{L})([^:]{2,32}?)\s*:\s*(\S.*)$/u;

    function isHeading(line) {
        if (line.length > 60) return false;
        if (/:$/.test(line)) return true;
        if (/[.!?]$/.test(line)) return false;   // a sentence, even in capitals ("WE WISH YOU ... JOURNEY WITH US!!!")
        if (!/\p{Ll}/u.test(line) && /\p{L}/u.test(line)) return true;
        return line.length <= 40 && HEADING_WORDS.test(line);
    }

    // Splits a text field into headings, list items and paragraphs. Items under an
    // "Inclusions" heading are marked yes, under "Exclusions" no, unless the line
    // carries its own ✔ / 🗶.
    function parseText(raw) {
        const blocks = [];
        let mode = 'plain';
        String(raw || '').split(/\r?\n/).forEach(line => {
            let l = line.replace(/\s+/g, ' ').trim();
            if (!l || l === '.' || SEPARATOR.test(l)) return;

            if (BULLET.test(l)) {
                const mark = NO_MARK.test(l) ? 'no' : YES_MARK.test(l) ? 'yes' : mode;
                l = l.replace(BULLET, '').replace(LEADING_EMOJI, '').trim();
                if (l && !SEPARATOR.test(l)) blocks.push({ type: 'li', text: l, mark });
                return;
            }

            l = l.replace(LEADING_EMOJI, '').trim();
            if (!l) return;
            if (isHeading(l)) {
                const text = tidy(l.replace(/\s*:\s*$/, ''));
                mode = /exclu|not includ/i.test(text) ? 'no' : /inclu/i.test(text) ? 'yes' : 'plain';
                blocks.push({ type: 'h', text });
                return;
            }
            blocks.push({ type: 'p', text: l });
        });
        return blocks;
    }

    const ICON = {
        yes: '<span class="material-symbols-outlined text-tertiary text-lg leading-6 shrink-0" aria-hidden="true">check</span>',
        no: '<span class="material-symbols-outlined text-outline text-lg leading-6 shrink-0" aria-hidden="true">close</span>',
        plain: '<span class="mt-[9px] w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true"></span>',
    };

    function itemHTML(text) {
        const m = text.match(LABELLED);
        return m ? `<strong class="font-semibold text-on-surface">${esc(m[1])}:</strong> ${esc(m[2])}` : esc(text);
    }

    // skipHeading: drop a leading heading that only repeats the section title
    // ("Tour Highlights" under a "Highlights" section).
    function formatText(raw, opts) {
        opts = opts || {};
        const blocks = parseText(raw);
        if (opts.skipHeading && blocks[0] && blocks[0].type === 'h' && opts.skipHeading.test(blocks[0].text)) {
            blocks.shift();
        }
        let html = '';
        let open = false;
        blocks.forEach(b => {
            if (b.type === 'li') {
                if (!open) { html += '<ul class="space-y-1.5 mb-4">'; open = true; }
                html += `<li class="flex items-start gap-2.5">${ICON[b.mark] || ICON.plain}<span class="min-w-0 break-words">${itemHTML(b.text)}</span></li>`;
                return;
            }
            if (open) { html += '</ul>'; open = false; }
            html += b.type === 'h'
                ? `<h3 class="font-headline font-bold text-on-surface text-base mt-6 first:mt-0 mb-2">${esc(b.text)}</h3>`
                : `<p class="mb-3">${esc(b.text)}</p>`;
        });
        if (open) html += '</ul>';
        return html;
    }

    // Plain sentences from the highlights, without headings or "Label: value" lines
    // such as "Duration: 1 Day" that only repeat the tour facts.
    function sentences(raw) {
        return parseText(raw)
            .filter(b => b.type !== 'h' && !LABELLED.test(b.text))
            .map(b => b.text.replace(/[.;:,\s]+$/, ''));
    }

    // Shorten at a sentence end if there is one far enough in, else at a word.
    function cut(s, max) {
        if (s.length <= max) return s;
        const part = s.slice(0, max);
        const stop = part.lastIndexOf('. ');
        if (stop > max * 0.35) return part.slice(0, stop + 1);
        const space = part.lastIndexOf(' ');
        return (space > max * 0.55 ? part.slice(0, space) : part).replace(/[\s,.;:–—-]+$/, '') + '…';
    }

    // Meta description for a tour page: what it is, the best of the highlights, the price.
    function seoDescription(t) {
        const dest = destinationName(t.destination);
        const n = Number(t.duration) || 1;
        const opening = (n === 1 ? 'Day tour' : n + '-day tour') + (dest ? ' in ' + dest : '') + '.';
        const closing = t.web_price ? `From ${price(t.web_price)} per person.` : 'Contact us for a quote.';
        const room = 158 - opening.length - closing.length - 2;
        // Some highlights are only "Duration: 1 Day" style lines; fall back to the tour name.
        const text = sentences(t.highlights).join('. ') || tidy(t.name);
        const middle = room > 30 ? cut(text, room) : '';
        return [opening, middle && !/[.!?…]$/.test(middle) ? middle + '.' : middle, closing]
            .filter(Boolean).join(' ');
    }

    /* ---------- Tour links and cards ---------- */

    // "/tours/cu-chi-tunnels-and-black-virgin-mountain-253/". The id at the end keeps
    // the link working when a tour is renamed: 404.html sends unknown slugs to the
    // tour by id.
    function slug(t) {
        let words = stripAccents(tidy(t.name)).toLowerCase()
            .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        // Long names: cut at a word boundary.
        if (words.length > 70) words = words.slice(0, 71).replace(/-[^-]*$/, '');
        return (words ? words + '-' : 'tour-') + t.id;
    }

    // Built tours have a static page; newer ones fall back to tour-details.html.
    function tourUrl(t) {
        return t.url || '/tour-details.html?id=' + encodeURIComponent(t.id);
    }

    // Card for the tours list (tours.html and the build's pre-rendered list).
    function card(tour) {
        const name      = esc(tidy(tour.name));
        const dest      = esc(destinationName(tour.destination));
        const transport = esc(tidy(tour.transport));
        const badges    = tagBadges(tour, 2);

        return `
  <a href="${tourUrl(tour)}" class="group block bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(188,52,46,0.10)]">
    <div class="relative h-56 overflow-hidden bg-surface-container">
      <img src="${image(tour.thumbnail)}" alt="${name}" loading="lazy" decoding="async"
           class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
           onerror="${fallback()}"/>
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      ${badges ? `<div class="absolute top-3 left-3 flex gap-2 flex-wrap">${badges}</div>` : ''}
      ${dest ? `<div class="absolute bottom-3 left-3">
        <span class="bg-black/50 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <span class="material-symbols-outlined text-xs" aria-hidden="true">location_on</span>${dest}
        </span>
      </div>` : ''}
    </div>
    <div class="p-5">
      <h3 class="font-headline text-base font-bold group-hover:text-primary transition-colors mb-3 line-clamp-2 leading-snug">${name}</h3>
      <div class="flex items-center gap-4 text-on-surface-variant text-xs mb-4">
        <div class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
          <span>${days(tour.duration)}</span>
        </div>
        ${transport ? `<div class="flex items-center gap-1 min-w-0">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">directions_car</span>
          <span class="truncate max-w-[180px]">${transport}</span>
        </div>` : ''}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-outline-variant/15">
        <div>
          <span class="text-xs text-on-surface-variant font-medium block">${priceLabel(tour.web_price)}</span>
          <span class="text-base font-extrabold text-primary">${price(tour.web_price)}</span>
        </div>
        <span class="bg-surface-container-low text-primary font-bold px-4 py-2 rounded-full text-xs group-hover:bg-primary group-hover:text-on-primary transition-all">View details</span>
      </div>
    </div>
  </a>`;
    }

    // Card for the homepage's featured tours.
    function featuredCard(tour) {
        const name   = esc(tidy(tour.name));
        const dest   = destinationName(tour.destination) || 'Vietnam';
        const desc   = tour.summary || sentences(tour.highlights)[0] || 'Explore Vietnam with VNGroup Tourist.';
        const badges = tagBadges(tour, 1);
        return `
      <a href="${tourUrl(tour)}" class="group bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col">
        <div class="relative h-72 overflow-hidden rounded-t-xl bg-surface-container">
          <img src="${image(tour.thumbnail)}" alt="${name}" loading="lazy" decoding="async"
               class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
               onerror="${fallback()}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          ${badges ? `<div class="absolute top-4 left-4 flex gap-2">${badges}</div>` : ''}
          <div class="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
            ${days(tour.duration)}
          </div>
        </div>
        <div class="p-6 flex-1 flex flex-col">
          <h3 class="font-headline text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">${name}</h3>
          <p class="text-on-surface-variant text-sm mb-4 line-clamp-2 flex-1">${esc(desc)}</p>
          <div class="flex items-center justify-between pt-4 border-t border-outline-variant/10">
            <div class="text-secondary font-bold">
              <span class="text-xs block text-on-surface-variant font-normal">${priceLabel(tour.web_price)}</span>
              <span class="text-base">${price(tour.web_price)}</span>
            </div>
            <span class="text-xs text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-sm" aria-hidden="true">location_on</span>${esc(dest)}
            </span>
          </div>
        </div>
      </a>`;
    }

    // Popular tours with a price and a photo first. The API's own order starts with
    // private quotes that have neither, which is a poor first impression.
    function featured(tours, n) {
        const ready = tours.filter(t => t.web_price && t.thumbnail);
        return [
            ...ready.filter(t => hasTag(t, 'hot')),
            ...ready.filter(t => !hasTag(t, 'hot')),
        ].slice(0, n || 3);
    }

    return {
        API_BASE, loadTours,
        destinationCode, destinationName, destinationsOf, inDestination,
        hasTag, tagBadges,
        esc, days, usd, price, priceLabel, hotels, tidy,
        image, fallback, stripAccents,
        slug, tourUrl, card, featuredCard, featured,
        formatText, sentences, cut, seoDescription,
    };
})();
