// assets/js/homepage-events.js
// Carica i prossimi eventi dal calendario condiviso e li mostra come card
// cliccabili nella homepage. Il calendario viene compilato a mano da chi
// gestisce gli eventi, quindi qui trattiamo i dati con tolleranza:
// titoli/descrizioni mancanti, spazi in eccesso, doppioni ed eventi privati
// vengono gestiti senza far saltare il rendering delle altre card.
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.eventi-container');
  if (!container || typeof ICAL === 'undefined') return;

  const CALENDAR_PATH = '/calendar/basics.ics';
  const MAX_EVENTS = 6;

  fetch(CALENDAR_PATH)
    .then(res => {
      if (!res.ok) throw new Error('Calendario non raggiungibile');
      return res.text();
    })
    .then(parseAndRender)
    .catch(() => showFallback('Non è stato possibile caricare gli eventi al momento.'));

  function parseAndRender(icsText) {
    let veventComponents;
    try {
      const jcalData = ICAL.parse(icsText);
      const component = new ICAL.Component(jcalData);
      veventComponents = component.getAllSubcomponents('vevent');
    } catch (e) {
      showFallback('Il calendario contiene un errore e non può essere letto al momento.');
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const upcoming = [];
    const seen = new Set();

    const addOccurrence = (title, description, location, start, end) => {
      if (!start) return;
      const effectiveEnd = end || start;
      if (effectiveEnd < startOfToday) return; // evento già concluso

      const key = title.toLowerCase() + '|' + start.toDateString();
      if (seen.has(key)) return; // scarta i doppioni inseriti per errore
      seen.add(key);

      upcoming.push({ title, description, location, start, end: effectiveEnd });
    };

    veventComponents.forEach(raw => {
      let icalEvent;
      try {
        icalEvent = new ICAL.Event(raw);
      } catch (e) {
        return; // voce malformata, la saltiamo senza bloccare le altre
      }

      const isPrivate = (raw.getFirstPropertyValue('class') || '').toString().toUpperCase() === 'PRIVATE';
      if (isPrivate) return;

      const title = clean(icalEvent.summary) || 'Evento senza titolo';
      const description = clean(icalEvent.description);
      const location = clean(icalEvent.location);

      try {
        if (icalEvent.isRecurring()) {
          const iterator = icalEvent.iterator();
          let next;
          while ((next = iterator.next())) {
            const occDate = next.toJSDate();
            if (occDate > yearEnd) break;
            const occ = icalEvent.getOccurrenceDetails(next);
            const occStart = occ.startDate ? occ.startDate.toJSDate() : null;
            const occEnd = occ.endDate ? occ.endDate.toJSDate() : null;
            if (occEnd && occEnd >= startOfToday) {
              addOccurrence(title, description, location, occStart, occEnd);
              break; // mostriamo solo la prossima occorrenza
            }
          }
        } else {
          const start = icalEvent.startDate ? icalEvent.startDate.toJSDate() : null;
          const end = icalEvent.endDate ? icalEvent.endDate.toJSDate() : null;
          addOccurrence(title, description, location, start, end);
        }
      } catch (e) {
        // date mancanti o malformate: evento saltato, il resto continua
      }
    });

    upcoming.sort((a, b) => a.start - b.start);
    render(upcoming.slice(0, MAX_EVENTS));
  }

  function clean(value) {
    return (value || '').toString().trim();
  }

  function render(list) {
    container.innerHTML = '';
    if (!list.length) {
      showFallback('Nessun evento in programma al momento. Torna a trovarci presto!');
      return;
    }
    list.forEach(ev => container.appendChild(buildCard(ev)));
  }

  function showFallback(message) {
    container.innerHTML =
      '<div class="evento evento--empty">' +
      '<p>' + escapeHtml(message) + '</p>' +
      '<a href="/html/eventi.html">Vedi il calendario completo</a>' +
      '</div>';
  }

  function buildCard(ev) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'evento evento--clickable';
    const day = ev.start.getDate();
    const month = capitalize(ev.start.toLocaleString('it', { month: 'short' }).replace('.', ''));

    card.innerHTML =
      '<div class="evento__data-badge"><span class="evento__giorno">' + day + '</span>' +
      '<span class="evento__mese">' + escapeHtml(month) + '</span></div>' +
      '<h3>' + escapeHtml(ev.title) + '</h3>' +
      (ev.location ? '<p class="evento__luogo">📍 ' + escapeHtml(ev.location) + '</p>' : '') +
      '<span class="evento__cta">Scopri di più →</span>';

    card.addEventListener('click', () => openModal(ev));
    return card;
  }

  // ---- Modale dettaglio evento ----
  const modal = document.getElementById('homeEventModal');
  const modalBody = document.getElementById('homeEventModalBody');

  function openModal(ev) {
    if (!modal || !modalBody) return;

    const dateFmt = capitalize(ev.start.toLocaleDateString('it', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }));

    const isAllDay = ev.start.getHours() === 0 && ev.start.getMinutes() === 0;
    const multiDay = ev.end && ev.start.toDateString() !== ev.end.toDateString();

    let whenInfo;
    if (multiDay) {
      const endFmt = ev.start.toDateString() !== ev.end.toDateString()
        ? ev.end.toLocaleDateString('it', { day: 'numeric', month: 'long' })
        : '';
      whenInfo = '📅 Dal ' + dateFmt + (endFmt ? ' al ' + endFmt : '');
    } else if (isAllDay) {
      whenInfo = '📅 ' + dateFmt;
    } else {
      const time = ev.start.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
      whenInfo = '📅 ' + dateFmt + ' · 🕒 ' + time;
    }

    modalBody.innerHTML =
      '<button type="button" class="home-event-modal__close" aria-label="Chiudi">×</button>' +
      '<h3>' + escapeHtml(ev.title) + '</h3>' +
      '<p class="modal-evento__data">' + whenInfo + '</p>' +
      (ev.location ? '<p class="modal-evento__luogo">📍 ' + escapeHtml(ev.location) + '</p>' : '') +
      '<div class="modal-evento__desc">' +
        (ev.description ? escapeHtml(ev.description).replace(/\n/g, '<br>') : 'Nessuna descrizione disponibile per questo evento.') +
      '</div>' +
      '<a href="/html/eventi.html" class="btn-modal-link">Vedi tutti gli eventi →</a>';

    modalBody.querySelector('.home-event-modal__close').addEventListener('click', closeModal);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
});
