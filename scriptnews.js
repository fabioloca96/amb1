document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ News JavaScript caricato!");

    // Variabili globali
    let allArticles = [];
    let filteredArticles = [];
    let currentPage = 1;
    const articlesPerPage = 6;
    let currentCategory = 'all';

    // Elementi DOM
    const newsGrid = document.getElementById('news-grid');
    const pagination = document.getElementById('pagination');
    const modal = document.getElementById('news-modal');
    const modalBody = document.getElementById('modal-body');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Caricamento degli articoli dal JSON
    async function loadArticles() {
        try {
            const response = await fetch('./data/articles.json');
            if (!response.ok) throw new Error('Errore nel caricamento degli articoli');
            
            allArticles = await response.json();
            filteredArticles = [...allArticles];
            
            // Ordina per data (più recenti prima)
            filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            renderArticles();
            renderPagination();
            
        } catch (error) {
            console.error('Errore nel caricamento degli articoli:', error);
            newsGrid.innerHTML = `
                <div class="no-results">
                    <h3>Errore nel caricamento</h3>
                    <p>Non è possibile caricare gli articoli al momento. Riprova più tardi.</p>
                </div>
            `;
        }
    }

    // Rendering degli articoli
    function renderArticles() {
        if (filteredArticles.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-results">
                    <h3>Nessun articolo trovato</h3>
                    <p>Non ci sono articoli per la categoria selezionata.</p>
                </div>
            `;
            return;
        }

        const startIndex = (currentPage - 1) * articlesPerPage;
        const endIndex = startIndex + articlesPerPage;
        const articlesToShow = filteredArticles.slice(startIndex, endIndex);

        newsGrid.innerHTML = '';

        articlesToShow.forEach((article, index) => {
            const articleCard = createArticleCard(article);
            newsGrid.appendChild(articleCard);
            
            // Animazione di entrata con delay
            setTimeout(() => {
                articleCard.classList.add('visible');
            }, index * 100);
        });
    }

    // Creazione di una card articolo
    function createArticleCard(article) {
        const cardElement = document.createElement('div');
        cardElement.className = 'news-card fade-in';
        cardElement.addEventListener('click', () => openModal(article));

        const imageStyle = article.featured_image 
            ? `background-image: url('${article.featured_image}')` 
            : `background: linear-gradient(135deg, #4C7031, #6B8A42)`;

        cardElement.innerHTML = `
            <div class="news-card__image" style="${imageStyle}">
                <div class="news-card__category">${getCategoryName(article.category)}</div>
            </div>
            <div class="news-card__content">
                <div class="news-card__date">${formatDate(article.date)}</div>
                <h3 class="news-card__title">${article.title}</h3>
                <p class="news-card__excerpt">${article.excerpt}</p>
                <span class="news-card__read-more">Leggi tutto</span>
            </div>
        `;

        return cardElement;
    }

    // Rendering della paginazione
    function renderPagination() {
        const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Bottone Previous
        paginationHTML += `
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                ‹
            </button>
        `;

        // Numeri di pagina
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += '<span>...</span>';
            }
        }

        // Bottone Next
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                ›
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // Cambio pagina
    window.changePage = function(page) {
        const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
        if (page < 1 || page > totalPages) return;

        currentPage = page;
        renderArticles();
        renderPagination();
        
        // Scroll smooth verso l'alto della griglia
        document.querySelector('.news-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    };

    // Gestione filtri
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Rimuovi classe active da tutti i bottoni
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Aggiungi classe active al bottone cliccato
            button.classList.add('active');

            currentCategory = button.dataset.category;
            currentPage = 1;

            // Filtra gli articoli
            if (currentCategory === 'all') {
                filteredArticles = [...allArticles];
            } else {
                filteredArticles = allArticles.filter(article => 
                    article.category === currentCategory
                );
            }

            // Ordina per data
            filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

            renderArticles();
            renderPagination();
        });
    });

    // Apertura modal
    function openModal(article) {
        const modalContent = createModalContent(article);
        modalBody.innerHTML = modalContent;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Creazione contenuto modal
    function createModalContent(article) {
        let contentHTML = `
            <div class="article-header">
                <div class="article-category">${getCategoryName(article.category)}</div>
                <h1 class="article-title">${article.title}</h1>
                <div class="article-date">${formatDate(article.date)}</div>
            </div>
        `;

        if (article.featured_image) {
            contentHTML += `
                <img src="${article.featured_image}" alt="${article.title}" class="article-featured-image">
            `;
        }

        contentHTML += '<div class="article-content">';
        
        // Processa il contenuto per gestire le immagini e i paragrafi
        article.content.forEach(block => {
            switch (block.type) {
                case 'paragraph':
                    contentHTML += `<p>${block.text}</p>`;
                    break;
                case 'heading':
                    contentHTML += `<h${block.level}>${block.text}</h${block.level}>`;
                    break;
                case 'image':
                    contentHTML += `
                        <img src="${block.src}" alt="${block.alt || ''}" 
                             style="width: ${block.width || '100%'}; margin: ${block.margin || '20px 0'};">
                    `;
                    break;
                case 'quote':
                    contentHTML += `<blockquote>${block.text}</blockquote>`;
                    break;
                case 'list':
                    if (block.ordered) {
                        contentHTML += '<ol>';
                        block.items.forEach(item => {
                            contentHTML += `<li>${item}</li>`;
                        });
                        contentHTML += '</ol>';
                    } else {
                        contentHTML += '<ul>';
                        block.items.forEach(item => {
                            contentHTML += `<li>${item}</li>`;
                        });
                        contentHTML += '</ul>';
                    }
                    break;
                default:
                    if (block.text) {
                        contentHTML += `<p>${block.text}</p>`;
                    }
            }
        });

        contentHTML += '</div>';
        return contentHTML;
    }

    // Chiusura modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners per il modal
    document.querySelector('.news-modal__close').addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Utility functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getCategoryName(category) {
        const categories = {
            'scoperte': 'Scoperte',
            'eventi': 'Eventi',
            'educazione': 'Educazione',
            'ricerca': 'Ricerca',
            'notizie': 'Notizie'
        };
        return categories[category] || category;
    }

    // Animazione di fade-in per elementi in viewport
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Osserva tutti gli elementi fade-in
    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });

    // Search functionality (opzionale)
    let searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredArticles = currentCategory === 'all' ? [...allArticles] : 
                allArticles.filter(article => article.category === currentCategory);
        } else {
            let articlesToSearch = currentCategory === 'all' ? allArticles : 
                allArticles.filter(article => article.category === currentCategory);
            
            filteredArticles = articlesToSearch.filter(article =>
                article.title.toLowerCase().includes(searchTerm) ||
                article.excerpt.toLowerCase().includes(searchTerm) ||
                article.content.some(block => 
                    block.text && block.text.toLowerCase().includes(searchTerm)
                )
            );
        }

        filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        currentPage = 1;
        renderArticles();
        renderPagination();
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Effetto parallax leggero per l'hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.news-hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Carica gli articoli all'avvio
    loadArticles();
});