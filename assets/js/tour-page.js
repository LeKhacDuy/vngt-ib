/* =============================================
   VNGroup Tourist - tour page content
   ---------------------------------------------
   Builds the body of a tour page from the API's tour object. Used in
   two places so they always match:
     - scripts/build.mjs renders every tour into a static page
       (/tours/<slug>/) that search engines can read;
     - tour-details.html renders a tour that is newer than the last
       build, in the browser, from the API.
   Needs tour-utils.js (window.VNGT).
   ============================================= */

(function (VNGT) {
    const PARTS = [
        ['morning', 'Morning', 'text-primary'],
        ['noon', 'Afternoon', 'text-secondary'],
        ['evening', 'Evening', 'text-tertiary'],
    ];
    const filled = v => v && String(v).trim() && String(v).trim() !== '.';
    // Some itineraries end with a line of underscores, which would push the page sideways on phones.
    const clean = v => String(v).replace(/_{3,}/g, '').trim();

    /**
     * opts.image(kind, path, index) -> URL for 'hero', 'gallery' and 'og' images
     * opts.siteUrl                  -> e.g. https://vngrouptourist.com
     * opts.pageUrl                  -> canonical URL of this tour page
     */
    function renderTour(t, opts) {
        const esc = VNGT.esc;
        const name = VNGT.tidy(t.name);
        const dest = VNGT.destinationName(t.destination) || 'Vietnam';
        const transport = VNGT.tidy(t.transport);
        const duration = Number(t.duration) || 1;
        // Day trips carry the API's default "3 sao" but have no hotel.
        const hotels = duration > 1 ? VNGT.hotels(t.hotel_rating) : '';
        const price = VNGT.price(t.web_price);
        const hero = opts.image('hero', t.thumbnail);
        const description = VNGT.seoDescription(t);
        const ogImage = t.thumbnail ? opts.image('og', t.thumbnail) : opts.siteUrl + '/assets/img/og-default.jpg';

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            'name': name,
            'description': description,
            'image': ogImage,
            'url': opts.pageUrl,
            'touristType': 'International tourists',
            'provider': { '@type': 'TravelAgency', 'name': 'VNGroup Tourist', 'url': opts.siteUrl },
        };
        if (t.web_price) {
            schema.offers = {
                '@type': 'Offer',
                'price': VNGT.usd(t.web_price),
                'priceCurrency': 'USD',
                'availability': 'https://schema.org/InStock',
                'url': opts.pageUrl,
            };
        }
        const breadcrumb = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': opts.siteUrl + '/' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Tours', 'item': opts.siteUrl + '/tours/' },
                { '@type': 'ListItem', 'position': 3, 'name': name, 'item': opts.pageUrl },
            ],
        };

        // Gallery
        const galleryImgs = (t.gallery_images || []).slice(0, 3);
        const galleryHTML = galleryImgs.length
            ? `<section class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12 h-[360px]">
          <div class="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-lg bg-surface-container">
            <img src="${opts.image('gallery', galleryImgs[0], 0)}" alt="${esc(name)}, photo 1" loading="lazy" decoding="async" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" onerror="${VNGT.fallback()}"/>
          </div>
          ${galleryImgs.slice(1).map((g, i) => `
          <div class="rounded-xl overflow-hidden shadow-lg bg-surface-container">
            <img src="${opts.image('gallery', g, i + 1)}" alt="${esc(name)}, photo ${i + 2}" loading="lazy" decoding="async" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" onerror="${VNGT.fallback()}"/>
          </div>`).join('')}
        </section>`
            : '';

        // Itinerary: morning / afternoon / evening of each day
        const itin = t.itineraries || [];
        const itinHTML = itin.length ? itin.map(day => {
            const parts = PARTS.map(([key, label, color]) => {
                const p = day[key];
                if (!p || !filled(p.description)) return '';
                const title = filled(p.title) ? ` · ${esc(VNGT.tidy(p.title))}` : '';
                return `<div class="mb-3"><span class="text-[10px] font-bold ${color} uppercase tracking-widest block mb-1">${label}${title}</span><p class="text-on-surface-variant leading-relaxed text-sm break-words">${esc(clean(p.description)).replace(/\r?\n/g, '<br>')}</p></div>`;
            }).join('');

            return `<div class="group relative pl-12 pb-10">
        <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary-container flex items-center justify-center z-10">
          <span class="text-xs font-bold text-on-primary-container">${esc(day.day_number)}</span>
        </div>
        <div class="absolute left-4 top-8 bottom-0 w-[2px] bg-primary-container/30 group-last:bg-transparent"></div>
        <h3 class="font-headline text-lg font-bold text-on-surface mb-3">${filled(day.title) ? esc(VNGT.tidy(day.title)) : 'Day ' + esc(day.day_number)}</h3>
        ${parts || '<p class="text-on-surface-variant text-sm">Full details are sent with your booking confirmation.</p>'}
      </div>`;
        }).join('') : '<p class="text-on-surface-variant">The day-by-day itinerary is available on request. <a href="/contact/" class="text-primary font-bold">Contact us</a>.</p>';

        const highlightsHTML = VNGT.formatText(t.highlights, { skipHeading: /^(tour )?highlights?$/i });
        const notesHTML = VNGT.formatText(t.special_notes);
        const policyHTML = VNGT.formatText(t.cancellation_policy);
        const textBox = html => `<div class="bg-surface-container-low rounded-2xl p-6 text-sm text-on-surface-variant leading-relaxed break-words">${html}</div>`;
        const tags = VNGT.tagBadges(t, 2);

        const html = `
    <!-- Hero -->
    <section class="relative h-[500px] min-h-[400px] w-full rounded-3xl overflow-hidden mb-10 bg-surface-container">
      <img src="${hero}" alt="${esc(name)}" fetchpriority="high" class="absolute inset-0 w-full h-full object-cover" onerror="${VNGT.fallback(1200, 600)}"/>
      <div class="absolute inset-0 bg-gradient-to-t from-on-surface/85 via-black/20 to-transparent"></div>
      <div class="absolute bottom-0 left-0 p-8 md:p-12 w-full">
        <div class="flex flex-wrap gap-2 mb-4">
          ${tags}
          <span class="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">${VNGT.days(duration)}</span>
        </div>
        <h1 class="text-3xl md:text-5xl font-extrabold text-white font-headline leading-tight max-w-3xl mb-5">${esc(name)}</h1>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90">
          ${transport ? `<div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary-fixed" aria-hidden="true">directions_car</span>
            <span class="font-medium text-sm">${esc(transport)}</span>
          </div>` : ''}
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary-fixed" aria-hidden="true">location_on</span>
            <span class="font-medium text-sm">${esc(dest)}</span>
          </div>
          ${hotels ? `<div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary-fixed" aria-hidden="true">hotel</span>
            <span class="font-medium text-sm">${hotels}</span>
          </div>` : ''}
        </div>
      </div>
    </section>

    <!-- Gallery -->
    ${galleryHTML}

    <!-- Grid layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">

      <!-- Left column -->
      <div class="lg:col-span-8 space-y-14 min-w-0">

        <!-- Highlights -->
        ${highlightsHTML ? `<section>
          <h2 class="font-headline text-2xl font-bold mb-5">Highlights</h2>
          <div class="text-sm text-on-surface-variant leading-relaxed break-words">${highlightsHTML}</div>
        </section>` : ''}

        <!-- Itinerary -->
        <section>
          <h2 class="font-headline text-2xl font-bold mb-8">Itinerary</h2>
          <div class="space-y-2">${itinHTML}</div>
        </section>

        <!-- Inclusions and notes -->
        ${notesHTML ? `<section>
          <h2 class="font-headline text-2xl font-bold mb-5">What's included &amp; good to know</h2>
          ${textBox(notesHTML)}
        </section>` : ''}

        <!-- Payment and cancellation, as entered for this tour -->
        ${policyHTML ? `<section id="terms" class="scroll-mt-28">
          <h2 class="font-headline text-2xl font-bold mb-5">Payment &amp; cancellation</h2>
          ${textBox(policyHTML)}
        </section>` : ''}
      </div>

      <!-- Sticky sidebar -->
      <aside class="lg:col-span-4">
        <div class="sticky top-24 space-y-6">
          <div class="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_32px_64px_-16px_rgba(188,52,46,0.10)] border border-outline-variant/10">
            <div class="flex justify-between items-baseline mb-6">
              <div>
                <span class="text-xs text-on-surface-variant uppercase font-bold tracking-widest">${VNGT.priceLabel(t.web_price)}</span>
                <p class="text-3xl font-headline font-extrabold text-primary mt-1">${price}</p>
              </div>
              ${t.web_price ? '<span class="text-sm text-on-surface-variant font-medium">per person</span>' : ''}
            </div>
            <div class="space-y-4 mb-6">
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-primary text-lg" aria-hidden="true">schedule</span>
                <span class="text-on-surface-variant">Duration: <strong>${VNGT.days(duration)}</strong></span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-primary text-lg" aria-hidden="true">location_on</span>
                <span class="text-on-surface-variant">Destination: <strong>${esc(dest)}</strong></span>
              </div>
              ${transport ? `<div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-primary text-lg" aria-hidden="true">directions_car</span>
                <span class="text-on-surface-variant">Transport: <strong>${esc(transport)}</strong></span>
              </div>` : ''}
              ${hotels ? `<div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-primary text-lg" aria-hidden="true">hotel</span>
                <span class="text-on-surface-variant">Hotels: <strong>${hotels.replace(' hotels', '')}</strong></span>
              </div>` : ''}
            </div>
            <a href="/booking/?tour_id=${esc(t.id)}"
               class="block w-full py-4 bg-primary text-on-primary rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 text-center">
              Book this tour
            </a>
            <p class="text-center text-xs text-on-surface-variant mt-4">
              ${policyHTML
                ? '<a href="#terms" class="underline underline-offset-2 hover:text-primary">Payment &amp; cancellation terms</a>'
                : '<a href="/faqs/#booking" class="underline underline-offset-2 hover:text-primary">Cancellation policy</a>'}
            </p>
          </div>

          ${t.tour_code ? `<div class="bg-secondary-container/20 border border-secondary/20 p-5 rounded-2xl flex items-start gap-3">
            <span class="material-symbols-outlined text-secondary text-2xl" style="font-variation-settings:'FILL' 1;" aria-hidden="true">confirmation_number</span>
            <div>
              <p class="font-bold text-on-secondary-container text-sm">Tour code</p>
              <p class="text-on-secondary-container/80 text-lg font-bold">${esc(t.tour_code)}</p>
            </div>
          </div>` : ''}
        </div>
      </aside>
    </div>`;

        return {
            html,
            name,
            title: `${name} | VNGroup Tourist`,
            description,
            ogImage,
            schema,
            breadcrumb,
        };
    }

    VNGT.renderTour = renderTour;
})(window.VNGT);
