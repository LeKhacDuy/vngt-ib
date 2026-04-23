/**
 * VNGroup Tourist - Shared Navigation Script
 * Handles: mobile menu toggle, active nav highlighting
 */

document.addEventListener('DOMContentLoaded', () => {
    // ── Mobile Menu Toggle ──────────────────────────────
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn  = document.getElementById('close-menu-btn');
    const mobileMenu    = document.getElementById('mobile-menu');

    if (mobileMenuBtn && closeMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            setTimeout(() => mobileMenu.classList.remove('opacity-0'), 10);
        });

        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('opacity-0');
            setTimeout(() => mobileMenu.classList.add('hidden'), 300);
        });

        // Close on backdrop click
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.add('opacity-0');
                setTimeout(() => mobileMenu.classList.add('hidden'), 300);
            }
        });
    }

    // ── Navbar Scroll Effect ────────────────────────────
    const nav = document.querySelector('nav[class*="fixed top-4"]');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) {
                nav.classList.add('shadow-lg');
            } else {
                nav.classList.remove('shadow-lg');
            }
        });
    }
});
