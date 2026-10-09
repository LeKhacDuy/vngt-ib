/* =============================================
   VNGroup Tourist - Tailwind config
   ---------------------------------------------
   Built by `npm run build` into dist/assets/css/site.css. The site used
   to load the Tailwind Play CDN and compile CSS in the browser on every
   visit (419 KB of JavaScript, unstyled flash); Tailwind does not
   support that in production.

   Brand palette taken from the new logo: brick red #BC342E and
   charcoal #404040, on warm cream neutrals. Same palette as
   vngrouptourist.vn so both sites read as one brand. The Material-3
   token names are kept so existing classes (bg-primary,
   text-on-surface-variant ...) keep working.
   ============================================= */

import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
    // Classes also live in JavaScript templates (cards, tour pages).
    content: ['./*.html', './assets/js/**/*.js', './scripts/**/*.mjs'],
    theme: {
        extend: {
            colors: {
                /* --- Brand red: buttons, links, highlights --- */
                "primary": "#BC342E",
                "primary-dim": "#A32A24",
                "on-primary": "#FFFFFF",
                "primary-container": "#FCEFED",
                "on-primary-container": "#8A221D",
                /* Light rose: accent text and icons on dark photos and on red panels */
                "primary-fixed": "#F6C3BC",
                "primary-fixed-dim": "#EFA79E",
                "on-primary-fixed": "#5C1612",
                "on-primary-fixed-variant": "#8A221D",
                "inverse-primary": "#F6C3BC",
                "surface-tint": "#BC342E",

                /* --- Deeper red: prices and eyebrow labels --- */
                "secondary": "#A32A24",
                "secondary-dim": "#8A221D",
                "on-secondary": "#FFFFFF",
                "secondary-container": "#F7DCD8",
                "on-secondary-container": "#7A1E1A",
                "secondary-fixed": "#F7DCD8",
                "secondary-fixed-dim": "#EFC2BC",
                "on-secondary-fixed": "#4A100D",
                "on-secondary-fixed-variant": "#7A1E1A",

                /* --- Green kept only as a meaning: verified, included, available.
                       Same choice as vngrouptourist.vn — a red tick reads as an error. --- */
                "tertiary": "#1F7A5C",
                "tertiary-dim": "#186549",
                "on-tertiary": "#FFFFFF",
                "tertiary-container": "#E8F5EF",
                "on-tertiary-container": "#145440",
                "tertiary-fixed": "#E8F5EF",
                "tertiary-fixed-dim": "#C9E8DA",
                "on-tertiary-fixed": "#0B3628",
                "on-tertiary-fixed-variant": "#145440",

                /* --- Errors: deeper than the brand red so the two are not confused --- */
                "error": "#A4161A",
                "error-dim": "#8A1216",
                "on-error": "#FFFFFF",
                "error-container": "#FBE4E4",
                "on-error-container": "#6B0E11",

                /* --- Warm neutrals --- */
                "background": "#FAF6F1",
                "surface": "#FAF6F1",
                "surface-bright": "#FFFCF8",
                "surface-dim": "#E8DFD5",
                "surface-variant": "#EFE7DD",
                "surface-container-lowest": "#FFFFFF",
                "surface-container-low": "#F5EFE8",
                "surface-container": "#EFE7DD",
                "surface-container-high": "#E8DDD2",
                "surface-container-highest": "#E0D3C5",
                "on-background": "#2A2622",
                "on-surface": "#2A2622",
                "on-surface-variant": "#5A524B",
                "outline": "#8A8078",
                "outline-variant": "#D9CCBE",
                "inverse-surface": "#1C1815",
                "inverse-on-surface": "#F2EAE2",

                /* --- Plain names used where pages had hard-coded Tailwind greens/oranges --- */
                "brand": {
                    "DEFAULT": "#BC342E",
                    "hover": "#A32A24",
                    "press": "#8A221D",
                    "tint": "#FCEFED",
                    "light": "#F6C3BC"
                },
                "ink": {
                    "DEFAULT": "#2A2622",
                    "2": "#5A524B",
                    "3": "#8A8078",
                    "dark": "#1C1815"
                },
                "cream": "#FAF6F1"
            },

            fontFamily: {
                "headline": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
                "body": ["Be Vietnam Pro", "system-ui", "sans-serif"],
                "label": ["Be Vietnam Pro", "system-ui", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            }
        }
    },
    plugins: [forms, containerQueries],
};
