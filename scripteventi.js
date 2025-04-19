let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-img');

function showNextSlide() {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

setInterval(showNextSlide, 4000); // cambia ogni 4 secondi
document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const calendarPath = './calendar/basics.ics'; // Percorso al file ICS caricato sul tuo server
  const eventsGrid = document.getElementById('events-grid');
  const modal = document.getElementById('event-modal');
  const modalContent = document.getElementById('modal-content');
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  let allEvents = [];
  let filteredEvents = [];
  let currentFilter = 'public';
  
  // Fetch calendar data
  fetchCalendarData();
  
  // Add event listeners for filters
  filterButtons.forEach(button => {
      button.addEventListener('click', function() {
          const filter = this.getAttribute('data-filter');
          
          // Update active button
          filterButtons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
          
          // Apply filter
          currentFilter = filter;
          applyFilters();
      });
  });
  
  // Add event listener for search
  searchInput.addEventListener('input', function() {
      applyFilters();
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
      if (event.target === modal) {
          closeModal();
      }
  });
  
  // Functions
  async function fetchCalendarData() {
      try {
          const response = await fetch(calendarPath);
          
          if (!response.ok) {
              throw new Error('Failed to fetch calendar data');
          }
          
          const data = await response.text();
          parseCalendarData(data);
      } catch (error) {
          console.error('Error fetching calendar data:', error);
          showError('Si è verificato un errore durante il caricamento degli eventi. Verifica che il file ICS sia stato caricato correttamente.');
      }
  }
  
  function parseCalendarData(data) {
    try {
      const jcalData = ICAL.parse(data);
      const component = new ICAL.Component(jcalData);
      const events = component.getAllSubcomponents('vevent');
  
      if (events.length === 0) {
        showNoEvents();
        return;
      }
  
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
      const now = new Date();
  
      let all = [];
  
      events.forEach(event => {
        const icalEvent = new ICAL.Event(event);
        const status = event.getFirstPropertyValue('class') || 'PUBLIC';
        const isPrivate = status.toUpperCase() === 'PRIVATE';
  
        if (icalEvent.isRecurring()) {
          const iterator = icalEvent.iterator();
          const uid = icalEvent.uid;
  
          let next;
          while ((next = iterator.next())) {
            const occurrenceDate = next.toJSDate();
            if (occurrenceDate > yearEnd) break;
  
            const occurrence = icalEvent.getOccurrenceDetails(next);
  
            all.push({
              id: uid + '-' + occurrence.startDate.toUnixTime(),
              uidBase: uid,
              title: icalEvent.summary,
              description: icalEvent.description || 'Nessuna descrizione disponibile',
              start: occurrence.startDate.toJSDate(),
              end: occurrence.endDate.toJSDate(),
              location: icalEvent.location || 'Nessuna località specificata',
              isPrivate: isPrivate,
              organizer: event.getFirstPropertyValue('organizer') || 'Nessun organizzatore specificato',
              created: icalEvent.stampTime ? icalEvent.stampTime.toJSDate() : null,
              url: event.getFirstPropertyValue('url') || null,
              isRecurring: true
            });
          }
        } else {
          all.push({
            id: icalEvent.uid,
            uidBase: icalEvent.uid,
            title: icalEvent.summary,
            description: icalEvent.description || 'Nessuna descrizione disponibile',
            start: icalEvent.startDate.toJSDate(),
            end: icalEvent.endDate.toJSDate(),
            location: icalEvent.location || 'Nessuna località specificata',
            isPrivate: isPrivate,
            organizer: event.getFirstPropertyValue('organizer') || 'Nessun organizzatore specificato',
            created: icalEvent.stampTime ? icalEvent.stampTime.toJSDate() : null,
            url: event.getFirstPropertyValue('url') || null,
            isRecurring: false
          });
        }
      });
  
      // Ordina
      all.sort((a, b) => a.start - b.start);
  
      // Salva tutto in globale
      allEvents = all;
  
      // Applica filtro iniziale
      applyFilters();
  
    } catch (error) {
      console.error('Errore durante il parsing del calendario:', error);
      showError('Errore durante l\'elaborazione degli eventi. Verifica che il file ICS sia corretto.');
    }
  }
  
  // Add event listeners for filters
filterButtons.forEach(button => {
  button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      console.log('Filtro selezionato:', filter); // Aggiungi questo per debug
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Apply filter
      currentFilter = filter;
      applyFilters();
  });
});
  
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();
  
    let eventsToFilter = [...allEvents];
  
    // Raggruppamento per occorrenze singole di eventi ricorrenti
    if (currentFilter === 'public' || currentFilter === 'upcoming-all') {
      const nextOccurrenceMap = new Map();
  
      eventsToFilter.forEach(ev => {
        const eventTimestamp = new Date(ev.start).getTime();
  
        if (ev.isRecurring) {
          if (eventTimestamp >= todayTimestamp) {
            const key = ev.uidBase;
            if (!nextOccurrenceMap.has(key) || eventTimestamp < nextOccurrenceMap.get(key).start.getTime()) {
              nextOccurrenceMap.set(key, ev);
            }
          }
        } else {
          if (
            (currentFilter === 'public' && !ev.isPrivate && eventTimestamp >= todayTimestamp) ||
            (currentFilter === 'upcoming-all' && eventTimestamp >= todayTimestamp)
          ) {
            nextOccurrenceMap.set(ev.id, ev);
          }
        }
      });
  
      eventsToFilter = Array.from(nextOccurrenceMap.values());
    }
  
    if (currentFilter === 'all') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1); // 1 gennaio
      const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59); // 31 dicembre
  
      const firstOfYearMap = new Map();
  
      allEvents.forEach(ev => {
        const eventTime = new Date(ev.start);
        if (eventTime >= yearStart && eventTime <= yearEnd) {
          if (ev.isRecurring) {
            const key = ev.uidBase;
            if (!firstOfYearMap.has(key) || ev.start < firstOfYearMap.get(key).start) {
              firstOfYearMap.set(key, ev);
            }
          } else {
            firstOfYearMap.set(ev.id, ev);
          }
        }
      });
  
      eventsToFilter = Array.from(firstOfYearMap.values());
    }
  
    // Applica filtro ricerca
    filteredEvents = eventsToFilter.filter(event => {
      if (!searchTerm) return true;
  
      return event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm);
    });
  
    // Ordina per data crescente
    filteredEvents.sort((a, b) => a.start - b.start);
  
    displayEvents(filteredEvents);
  }
  function displayEvents(events) {
    eventsGrid.innerHTML = '';
  
    if (events.length === 0) {
      eventsGrid.innerHTML = `
        <div class="no-events">
          <i class="fas fa-calendar-times"></i>
          <p>Nessun evento trovato</p>
        </div>
      `;
      return;
    }
  
    events.forEach(event => {
      const eventDate = new Date(event.start);
      let endDate = new Date(event.end);
  
      // Correggi DTEND per eventi all-day di un solo giorno
      const isAllDayEvent = eventDate.getHours() === 0 &&
                            eventDate.getMinutes() === 0 &&
                            endDate.getHours() === 0 &&
                            endDate.getMinutes() === 0 &&
                            (endDate - eventDate) >= 86400000;
  
      if (isAllDayEvent && endDate - eventDate === 86400000) {
        endDate = new Date(endDate.getTime() - 1); // fine = giorno stesso
      }
  
      const isMultiDay = eventDate.toDateString() !== endDate.toDateString();
  
      const startDay = eventDate.getDate();
      const startMonth = eventDate.toLocaleString('it', { month: 'short' });
      const endDay = endDate.getDate();
      const endMonth = endDate.toLocaleString('it', { month: 'short' });
  
      const dateDisplay = isMultiDay
        ? `${startDay} ${startMonth} – ${endDay} ${endMonth}`
        : `${startDay} ${startMonth}`;
  
      let timeDisplay = '';
      if (isAllDayEvent) {
        if (isMultiDay) {
          timeDisplay = `<i class="far fa-calendar-alt"></i> Dal ${eventDate.toLocaleDateString('it')} al ${endDate.toLocaleDateString('it')}`;
        } else {
          timeDisplay = `<i class="far fa-sun"></i> Tutto il giorno`;
        }
      } else {
        if (isMultiDay) {
          timeDisplay = `<i class="far fa-calendar-alt"></i> Dal ${eventDate.toLocaleDateString('it')} al ${endDate.toLocaleDateString('it')}`;
        } else {
          const startTime = eventDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
          const endTime = endDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
          timeDisplay = `<i class="far fa-clock"></i> ${startTime} - ${endTime}`;
        }
      }
  
      const privateClass = event.isPrivate ? 'private-event' : '';
      const badgeClass = event.isPrivate ? 'badge-private' : 'badge-public';
      const badgeText = event.isPrivate ? 'Privato' : 'Pubblico';
  
      const recurringBadge = event.isRecurring ? 
        `<span class="event-badge badge-recurring"><i class="fas fa-sync-alt"></i> Ricorrente</span>` : '';
  
      const eventCard = document.createElement('div');
      eventCard.className = `event-card ${privateClass}`;
      eventCard.setAttribute('data-event-id', event.id);
      eventCard.innerHTML = `
        <div class="event-header">
          <div class="event-date-large">
            ${dateDisplay}
          </div>
          <h3 class="event-title">${event.title}</h3>
          <div class="event-time">${timeDisplay}</div>
        </div>
        <div class="event-body">
          <p class="event-description">${event.description}</p>
          <div class="event-location">
            <i class="fas fa-map-marker-alt"></i> ${event.location}
          </div>
        </div>
        <div class="event-footer">
          <div class="event-badges">
            <span class="event-badge ${badgeClass}">${badgeText}</span>
            ${recurringBadge}
          </div>
          <a href="#" class="event-action">Dettagli <i class="fas fa-arrow-right"></i></a>
        </div>
      `;
  
      eventCard.addEventListener('click', function () {
        openEventModal(event);
      });
  
      eventsGrid.appendChild(eventCard);
    });
  }
  
function openEventModal(event) {
  const eventDate = new Date(event.start);
  const endDate = new Date(event.end);

  const formattedDate = eventDate.toLocaleDateString('it', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
  });

  // Controlla se l'evento è un evento che dura tutto il giorno
  const isAllDayEvent = eventDate.getHours() === 0 && 
                       eventDate.getMinutes() === 0 && 
                       endDate.getHours() === 0 && 
                       endDate.getMinutes() === 0 &&
                       (endDate - eventDate) >= 86400000; // 24 ore in millisecondi
  
  let timeDisplay = '';
  
  if (isAllDayEvent) {
      timeDisplay = `<div class="modal-datetime">
          <i class="far fa-sun"></i> Evento giornaliero
      </div>`;
  } else {
    const isSameDay = eventDate.toDateString() === endDate.toDateString();

    if (isAllDayEvent) {
      if (isSameDay) {
        timeDisplay = `<div class="modal-datetime">
          <i class="far fa-sun"></i> Evento giornaliero
        </div>`;
      } else {
        timeDisplay = `<div class="modal-datetime">
          <i class="far fa-calendar-alt"></i> Dal ${eventDate.toLocaleDateString('it')} al ${endDate.toLocaleDateString('it')}
        </div>`;
      }
    } else {
      if (isSameDay) {
        const startTime = eventDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
        const endTime = endDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
        timeDisplay = `<div class="modal-datetime">
          <i class="far fa-clock"></i> ${startTime} - ${endTime}
        </div>`;
      } else {
        timeDisplay = `<div class="modal-datetime">
          <i class="far fa-calendar-alt"></i> Dal ${eventDate.toLocaleDateString('it')} al ${endDate.toLocaleDateString('it')}
        </div>`;
      }
    }
  }

  const modalClass = event.isPrivate ? 'modal-private' : '';
  const recurringInfo = event.isRecurring ? 
      `<div class="info-item">
          <div class="info-icon">
              <i class="fas fa-sync-alt"></i>
          </div>
          <div class="info-content">
              <div class="info-label">Tipo di evento</div>
              <div class="info-value">Evento ricorrente</div>
          </div>
      </div>` : '';

  modalContent.innerHTML = `
      <div class="${modalClass}">
          <div class="modal-header">
              <button class="modal-close" onclick="closeModal()">
                  <i class="fas fa-times"></i>
              </button>
              <h2 class="modal-title">${event.title}</h2>
              <div class="modal-datetime">
                  <i class="far fa-calendar-alt"></i> ${formattedDate}
              </div>
              ${timeDisplay}
          </div>
          <div class="modal-body">
              <div class="modal-description">
                  ${event.description.replace(/\n/g, '<br>')}
              </div>
              <div class="modal-info">
                  <div class="info-item">
                      <div class="info-icon">
                          <i class="fas fa-map-marker-alt"></i>
                      </div>
                      <div class="info-content">
                          <div class="info-label">Luogo</div>
                          <div class="info-value">${event.location}</div>
                      </div>
                  </div>
                  <div class="info-item">
                      <div class="info-icon">
                          <i class="fas fa-user"></i>
                      </div>
                      <div class="info-content">
                          <div class="info-label">Organizzatore</div>
                          <div class="info-value">${event.organizer}</div>
                      </div>
                  </div>
                  ${recurringInfo}
                  ${event.image ? `<div class="info-item">
                      <div class="info-icon">
                          <i class="fas fa-image"></i>
                      </div>
                      <div class="info-content">
                          <div class="info-label">Immagine Evento</div>
                          <img src="${event.image}" alt="Immagine Evento" class="modal-event-image">
                      </div>
                  </div>` : ''}
              </div>
              <div class="modal-actions">
                  <button class="btn btn-primary" onclick="addToCalendar(event)">
                      <i class="far fa-calendar-plus"></i> Aggiungi al calendario
                  </button>
                  ${event.url ? `<a href="${event.url}" target="_blank" class="btn btn-outline">
                      <i class="fas fa-external-link-alt"></i> Vai all'evento
                  </a>` : ''}
              </div>
          </div>
      </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
  
  
  function showError(message) {
      eventsGrid.innerHTML = `
          <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>${message}</p>
          </div>
      `;
  }
  
  function showNoEvents() {
      eventsGrid.innerHTML = `
          <div class="no-events">
              <i class="fas fa-calendar-times"></i>
              <p>Nessun evento programmato</p>
          </div>
      `;
  }
  
  // Expose functions to global scope
  window.closeModal = function() {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
  };
  
  window.addToCalendar = function(e) {
      // Get the event data from the clicked element
      const eventId = e.target.closest('.modal-content').querySelector('.modal-title').textContent;
      const event = filteredEvents.find(event => event.title === eventId);
      
      if (!event) return;
      
      // Format the dates for Google Calendar URL
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      const formatDate = (date) => {
          return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      
      // Create Google Calendar URL
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
      
      // Open in new tab
      window.open(url, '_blank');
  };
});