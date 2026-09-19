let medikamenteDatenbank = [];
let favoriten = JSON.parse(localStorage.getItem('at_med_favs')) || [];
let searchTimeout = null;

const searchBox = document.getElementById('search-box');
const resultsContainer = document.getElementById('results-container');
const loadingSpinner = document.getElementById('loading-spinner');
const clearBtn = document.getElementById('clear-btn');

async function ladeDaten() {
    try {
        loadingSpinner.style.display = 'block';
        const antwort = await fetch('data/drugs.json');
        medikamenteDatenbank = await antwort.json();
        loadingSpinner.style.display = 'none';

        updateResults();
    } catch (fehler) {
        loadingSpinner.style.display = 'none';
        resultsContainer.innerHTML = '<p class="no-results" style="color: #e74c3c;">Fehler beim Laden der Spitalsdaten.</p>';
    }
}

function toggleFavorit(handelsname) {
    if (favoriten.includes(handelsname)) {
        favoriten = favoriten.filter(name => name !== handelsname);
    } else {
        favoriten.push(handelsname);
    }
    localStorage.setItem('at_med_favs', JSON.stringify(favoriten));
    updateResults();
}

function getBoxLabel(box) {
    if (box === 'gruen') return 'Grüne Box';
    if (box === 'gelb') return 'Gelbe Box (RE)';
    return 'Rote Box / Chefärztlich';
}

function updateResults() {
    const suchbegriff = searchBox.value.toLowerCase().trim();
    resultsContainer.innerHTML = '';

    clearBtn.style.display = suchbegriff.length > 0 ? 'block' : 'none';

    let anzuzeigendeMedikamente = [];
    let istFavoritenAnsicht = false;

    if (suchbegriff === '') {
        anzuzeigendeMedikamente = medikamenteDatenbank.filter(med => favoriten.includes(med.handelsname));
        istFavoritenAnsicht = true;

        if (anzuzeigendeMedikamente.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Deine Favoritenliste ist noch leer. Suche einen Wirkstoff und klicke auf das Sternchen.</p>';
            return;
        }
    } else {
        anzuzeigendeMedikamente = medikamenteDatenbank.filter(med =>
            med.wirkstoff.toLowerCase().includes(suchbegriff) ||
            med.handelsname.toLowerCase().includes(suchbegriff)
        );

        if (anzuzeigendeMedikamente.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Keine Treffer im Register gefunden.</p>';
            return;
        }

        anzuzeigendeMedikamente.sort((a, b) => {
            const aWirkstoffStartet = a.wirkstoff.toLowerCase().startsWith(suchbegriff);
            const bWirkstoffStartet = b.wirkstoff.toLowerCase().startsWith(suchbegriff);
            if (aWirkstoffStartet && !bWirkstoffStartet) return -1;
            if (!aWirkstoffStartet && bWirkstoffStartet) return 1;
            return 0;
        });

        if (anzuzeigendeMedikamente.length > 50) {
            anzuzeigendeMedikamente = anzuzeigendeMedikamente.slice(0, 50);
        }
    }

    let htmlInhalt = istFavoritenAnsicht ? '<h3 style="font-size: 14px; color: #000000; margin-bottom: 10px;">Deine Favoriten:</h3>' : '';

    anzuzeigendeMedikamente.forEach(med => {
        const istFav = favoriten.includes(med.handelsname);

        htmlInhalt += `
            <div class="result-item ${med.box}">
                <div class="result-header">
                    <div class="brand-name">${med.handelsname}</div>
                    <button class="fav-btn ${istFav ? 'active' : ''}" onclick="toggleFavorit('${med.handelsname}')">
                        <svg viewBox="0 0 24 24" xmlns="http://w3.org">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                    </button>
                </div>
                <span class="badge ${med.box}">${getBoxLabel(med.box)}</span>
                <p class="info-text">Wirkstoff: </strong>${med.wirkstoff}</strong></p>
                <p class="info-text">${med.info}</p>
            </div>
        `;
    });

    resultsContainer.innerHTML = htmlInhalt;
}

searchBox.addEventListener('input', () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        updateResults();
    }, 200);
});

clearBtn.addEventListener('click', () => {
    searchBox.value = '';
    updateResults();
    searchBox.focus();
});

ladeDaten();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker aktiv!', reg))
            .catch(err => console.log('Service Worker Fehler:', err));
    });
}