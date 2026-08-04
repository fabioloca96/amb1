document.addEventListener('DOMContentLoaded', () => {

  // ---- Header solido allo scroll ----
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Menu mobile ----
  const menuToggle = document.getElementById('menuToggle');
  const navbar = document.getElementById('navbar');
  if (menuToggle && navbar) {
    const closeMenu = () => {
      menuToggle.classList.remove('active');
      navbar.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navbar.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    navbar.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  // ---- Chiudi banner annuncio ----
  const announce = document.getElementById('announce');
  const announceClose = document.getElementById('announceClose');
  if (announce && announceClose) {
    if (sessionStorage.getItem('announceClosed') === '1') announce.classList.add('hidden');
    announceClose.addEventListener('click', () => {
      announce.classList.add('hidden');
      sessionStorage.setItem('announceClosed', '1');
    });
  }

  // ---- Reveal on scroll ----
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  // ---- Contatore statistiche ----
  const statNums = document.querySelectorAll('.stat__num');
  if (statNums.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const ioStats = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach(el => ioStats.observe(el));
  }

  // ---- Torna in cima ----
  const toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
});
