// assets/js/script.js
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ script.js caricato");

    // ---- Fade-in / IntersectionObserver ----
    const fadeElements = document.querySelectorAll(".fade-in");
    if (fadeElements.length) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        fadeElements.forEach(el => observer.observe(el));
    }

    // Team list animation
    const teamItems = document.querySelectorAll('.team-list li');
    if (teamItems.length) {
        const obsTeam = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        teamItems.forEach(i => obsTeam.observe(i));
    }

   

    // ---- Hamburger menu (accessibile) ----
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    if (menuToggle && navbar) {
        function closeMenu() {
            menuToggle.classList.remove('active');
            navbar.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
        function openMenu() {
            menuToggle.classList.add('active');
            navbar.classList.add('open');
            menuToggle.setAttribute('aria-expanded', 'true');
        }

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navbar.classList.contains('open')) closeMenu();
            else openMenu();
        });

        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        navbar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
    }

    // ---- Parallax / movimento leggerm. del contenuto hero ----
    let lastScroll = 0;
    window.addEventListener('scroll', function () {
        const sc = window.scrollY;
        if (Math.abs(sc - lastScroll) < 4) return;
        lastScroll = sc;
        document.querySelectorAll('.hero').forEach(hero => {
            const content = hero.querySelector('.hero__content');
            if (!content) return;
            const movement = Math.min(Math.max((window.scrollY - hero.offsetTop) * 0.12, -40), 40);
            const title = content.querySelector('.hero__title');
            const subtitle = content.querySelector('.hero__subtitle');
            const btn = content.querySelector('.cta-btn');
            if (title) title.style.transform = `translateY(${movement}px)`;
            if (subtitle) subtitle.style.transform = `translateY(${movement * 1.1}px)`;
            if (btn) btn.style.transform = `translateY(${movement * 1.2}px)`;
        });
    }, { passive: true });
});
