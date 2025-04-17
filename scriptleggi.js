// Effetto dissolvenza al scroll
document.addEventListener("DOMContentLoaded", () => {
    const fadeElements = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target); // Rimuove l'osservazione dopo l'animazione
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach((el) => observer.observe(el));
});

// Effetto Parallax
window.addEventListener("scroll", () => {
    const parallaxElement = document.querySelector(".hero-leggi");
    if (parallaxElement) {
        const scrollPosition = window.scrollY;
        parallaxElement.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
    }
});