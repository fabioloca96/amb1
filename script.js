
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript caricato!");

    // Fade-in quando entrano in viewport
    const elements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(element => observer.observe(element));

    // Caricamento eventi dinamici
    const calendarUrl = './calendar/basics.ics'; // percorso al file ICS
const container = document.querySelector('.eventi-container');

if (container) {
  fetch(calendarUrl)
    .then(res => res.text())
    .then(data => {
      const jcalData = ICAL.parse(data);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents('vevent');

      const now = new Date();
      const pubbliciFuturi = events.map(ev => new ICAL.Event(ev))
        .filter(ev => {
          const start = ev.startDate.toJSDate();
          const isPublic = (ev.component.getFirstPropertyValue('class') || 'PUBLIC').toUpperCase() === 'PUBLIC';
          return isPublic && start >= now;
        })
        .sort((a, b) => a.startDate.toJSDate() - b.startDate.toJSDate())
        .slice(0, 4); // Solo i primi 4

      container.innerHTML = "";

      pubbliciFuturi.forEach(ev => {
        const data = ev.startDate.toJSDate().toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        const ora = ev.startDate.toJSDate().toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const titolo = ev.summary || 'Evento senza titolo';
        const descrizione = ev.description || 'Nessuna descrizione disponibile';
        const link = ev.component.getFirstPropertyValue('url') || '#';
        const immagine = 'images/evento_default.jpg'; // puoi personalizzarlo

        const eventoHTML = `
          <div class="evento fade-in">
            
            <h3>${titolo}</h3>
            <p class="data"><strong>${data} - ${ora}</strong></p>
            <p class="descrizione">${descrizione}</p>
           
          </div>
        `;

        container.innerHTML += eventoHTML;
      });
    })
    .catch(err => {
      console.error('Errore nel caricamento del file ICS:', err);
      container.innerHTML = '<p>⚠️ Impossibile caricare gli eventi al momento.</p>';
    });
}

    // Gestione hamburger menu solo su mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            menuToggle.classList.toggle('active');
            navbar.classList.toggle('active');
        });

        document.addEventListener('click', function (e) {
            if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navbar.classList.remove('active');
            }
        });

        navbar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navbar.classList.remove('active');
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === "Escape") {
                menuToggle.classList.remove('active');
                navbar.classList.remove('active');
            }
        });
    }
});

// Effetto parallax + distanziamento dinamico dei testi e bottoni
document.addEventListener("scroll", function () {
    let scrollTop = window.scrollY;

    document.querySelectorAll(".hero").forEach((hero) => {
        let content = hero.querySelector('.hero__content');
        if (content) {
            let title = content.querySelector(".hero__title");
            let subtitle = content.querySelector(".hero__subtitle");
            let button = content.querySelector(".cta-btn");

            if (title && subtitle && button) {
                let movement = Math.min(Math.max((scrollTop - hero.offsetTop) * 0.2, -50), 50);
                let spacing = Math.min(Math.max(50 + movement * 0.3, 50), 120);
                let buttonSpacing = Math.min(Math.max(40 + movement * 0.3, 40), 100);

                title.style.transform = `translateY(${movement * 0.3}px)`;
                subtitle.style.transform = `translateY(${movement * 0.4}px)`;
                subtitle.style.marginTop = `${spacing}px`;
                button.style.transform = `translateY(${movement * 0.4}px)`;
                button.style.marginTop = `${buttonSpacing}px`;
            }
        }
    });
});
