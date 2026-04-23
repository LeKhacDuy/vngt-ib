/* =============================================
   VNGroup Tourist - Tailwind Config (shared)
   Used by all pages via CDN
   ============================================= */

window.__VNGT_TAILWIND_CONFIG = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "on-tertiary-fixed": "#00494a",
                "inverse-on-surface": "#9a9e9c",
                "on-secondary": "#fff0e9",
                "error-dim": "#9f0519",
                "on-primary": "#caffdc",
                "primary-fixed": "#7bfeb8",
                "inverse-primary": "#7bfeb8",
                "surface-container": "#e5e9e7",
                "surface-container-lowest": "#ffffff",
                "on-primary-fixed": "#004b2d",
                "tertiary-fixed-dim": "#4aedef",
                "primary-fixed-dim": "#6cefab",
                "secondary-fixed-dim": "#ffb287",
                "error-container": "#fb5151",
                "surface-container-highest": "#d8dedc",
                "primary-container": "#7bfeb8",
                "on-primary-container": "#00603b",
                "on-background": "#2b2f2e",
                "primary-dim": "#005c38",
                "inverse-surface": "#0b0f0e",
                "on-error-container": "#570008",
                "secondary-container": "#ffc5a6",
                "outline-variant": "#aaaeac",
                "outline": "#747876",
                "secondary": "#964300",
                "surface-bright": "#f4f7f5",
                "surface-variant": "#d8dedc",
                "on-tertiary": "#befeff",
                "surface-container-low": "#eef2ef",
                "secondary-fixed": "#ffc5a6",
                "on-secondary-fixed-variant": "#853b00",
                "tertiary-fixed": "#5dfbfe",
                "on-surface-variant": "#585c5b",
                "secondary-dim": "#843a00",
                "error": "#b31b25",
                "tertiary": "#006668",
                "on-tertiary-fixed-variant": "#00686a",
                "on-secondary-container": "#773400",
                "surface-tint": "#006941",
                "on-tertiary-container": "#005d5f",
                "surface": "#f4f7f5",
                "on-surface": "#2b2f2e",
                "tertiary-container": "#5dfbfe",
                "surface-container-high": "#dfe4e1",
                "background": "#f4f7f5",
                "on-primary-fixed-variant": "#006b43",
                "on-secondary-fixed": "#592500",
                "tertiary-dim": "#00595b",
                "surface-dim": "#d0d6d3",
                "on-error": "#ffefee",
                "primary": "#006941"
            },
            fontFamily: {
                "headline": ["Plus Jakarta Sans"],
                "body": ["Be Vietnam Pro"],
                "label": ["Be Vietnam Pro"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            }
        }
    }
};

// Apply tailwind config (must run before tailwind CDN parses)
if (typeof tailwind !== 'undefined') {
    tailwind.config = window.__VNGT_TAILWIND_CONFIG;
}
