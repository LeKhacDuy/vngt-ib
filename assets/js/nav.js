/**
 * VNGroup Tourist - Shared Navigation Script
 * Handles: mobile menu toggle, navbar shadow on scroll
 */

document.addEventListener('DOMContentLoaded', () => {
    // ── Mobile Menu Toggle ──────────────────────────────
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn  = document.getElementById('close-menu-btn');
    const mobileMenu    = document.getElementById('mobile-menu');

    if (mobileMenuBtn && closeMenuBtn && mobileMenu) {
        const openMenu = () => {
            mobileMenu.classList.remove('hidden');
            setTimeout(() => mobileMenu.classList.remove('opacity-0'), 10);
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            closeMenuBtn.focus();
        };
        const closeMenu = () => {
            mobileMenu.classList.add('opacity-0');
            setTimeout(() => mobileMenu.classList.add('hidden'), 300);
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.focus();
        };

        mobileMenuBtn.addEventListener('click', openMenu);
        closeMenuBtn.addEventListener('click', closeMenu);

        // Close on backdrop click or Escape
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) closeMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) closeMenu();
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
