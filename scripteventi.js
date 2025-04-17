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
  let currentFilter = 'all';
  
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
        
        allEvents = [];
        
        events.forEach(event => {
            const icalEvent = new ICAL.Event(event);
            
            // Check if event has a status and make it private if marked as PRIVATE
            const status = event.getFirstPropertyValue('class') || 'PUBLIC';
            const isPrivate = status.toUpperCase() === 'PRIVATE';
            
            // Handle recurring events
            if (icalEvent.isRecurring()) {
                const iterator = icalEvent.iterator();
                const expandedEvents = [];
                
                // Espandi per i prossimi 6 mesi (puoi regolare secondo necessità)
                const sixMonthsFromNow = new Date();
                sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                
                let next;
                while ((next = iterator.next()) && next.compare(ICAL.Time.fromJSDate(sixMonthsFromNow)) < 0) {
                    const occurrence = icalEvent.getOccurrenceDetails(next);
                    
                    expandedEvents.push({
                        id: icalEvent.uid + '-' + occurrence.startDate.toUnixTime(),
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
                
                allEvents = allEvents.concat(expandedEvents);
            } else {
                // Handle normal, non-recurring events
                allEvents.push({
                    id: icalEvent.uid,
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
        
        // Sort events by start date (ascending)
        allEvents.sort((a, b) => a.start - b.start);
        
        // Apply initial filter
        applyFilters();
    } catch (error) {
        console.error('Error parsing calendar data:', error);
        showError('Si è verificato un errore durante l\'elaborazione degli eventi. Verifica che il file ICS sia nel formato corretto.');
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
    const today = new Date();
    console.log('Data odierna:', today);
    
    // Debug: controlla quanti eventi sono nel futuro
    const futureEvents = allEvents.filter(event => new Date(event.start) >= today);
    console.log('Eventi futuri trovati:', futureEvents.length);
    
    
    // Filter events based on current filter and search term
    filteredEvents = allEvents.filter(event => {
        // First apply type filter
        if (currentFilter === 'public' && event.isPrivate) {
            return false;
        }
        
        if (currentFilter === 'private' && !event.isPrivate) {
            return false;
        }
        
        // Filter for upcoming events (events starting today or in the future)
       // Filter for upcoming events (events starting today or in the future)
if (currentFilter === 'upcoming') {
  // Reset time to start of day for comparison
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  // Convert both dates to timestamps for reliable comparison
  const todayTimestamp = todayStart.getTime();
  const eventTimestamp = new Date(event.start).getTime();
  
  // Check if event starts today or later
  if (eventTimestamp < todayTimestamp) {
      return false;
  }
}

        
        // Then apply search filter if there's a search term
        if (searchTerm) {
            return event.title.toLowerCase().includes(searchTerm) ||
                   event.description.toLowerCase().includes(searchTerm) ||
                   event.location.toLowerCase().includes(searchTerm);
        }
        
        return true;
    });
    
    // Display filtered events
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
      const day = eventDate.getDate();
      const month = eventDate.toLocaleString('it', { month: 'short' });

      // Controlla se l'evento è un evento che dura tutto il giorno
      const isAllDayEvent = eventDate.getHours() === 0 && 
                           eventDate.getMinutes() === 0 && 
                           new Date(event.end).getHours() === 0 && 
                           new Date(event.end).getMinutes() === 0 &&
                           (new Date(event.end) - eventDate) >= 86400000; // 24 ore in millisecondi
      
      let timeDisplay = '';
      
      if (isAllDayEvent) {
          timeDisplay = `<i class="far fa-sun"></i> Tutto il giorno`;
      } else {
          const startTime = eventDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
          const endTime = new Date(event.end).toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
          timeDisplay = `<i class="far fa-clock"></i> ${startTime} - ${endTime}`;
      }

      const privateClass = event.isPrivate ? 'private-event' : '';
      const badgeClass = event.isPrivate ? 'badge-private' : 'badge-public';
      const badgeText = event.isPrivate ? 'Privato' : 'Pubblico';
      
      // Aggiungi badge per eventi ricorrenti
      const recurringBadge = event.isRecurring ? 
          `<span class="event-badge badge-recurring"><i class="fas fa-sync-alt"></i> Ricorrente</span>` : '';

      const eventCard = document.createElement('div');
      eventCard.className = `event-card ${privateClass}`;
      eventCard.setAttribute('data-event-id', event.id);
      eventCard.innerHTML = `
          <div class="event-header">
              <div class="event-date">
                  <div class="event-day">${day}</div>
                  <div class="event-month">${month}</div>
              </div>
              <h3 class="event-title">${event.title}</h3>
              <div class="event-time">
                  ${timeDisplay}
              </div>
          </div>
          <div class="event-body">
              <p class="event-description">${event.description}</p>
              <div class="event-location">
                  <i class="fas fa-map-marker-alt"></i> ${event.location}
              </div>
              ${event.image ? `<img src="${event.image}" alt="Immagine Evento" class="event-image">` : ''}
          </div>
          <div class="event-footer">
              <div class="event-badges">
                  <span class="event-badge ${badgeClass}">${badgeText}</span>
                  ${recurringBadge}
              </div>
              <a href="#" class="event-action">Dettagli <i class="fas fa-arrow-right"></i></a>
          </div>
      `;

      eventCard.addEventListener('click', function() {
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
      const startTime = eventDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
      const endTime = endDate.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' });
      timeDisplay = `<div class="modal-datetime">
          <i class="far fa-clock"></i> ${startTime} - ${endTime}
      </div>`;
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