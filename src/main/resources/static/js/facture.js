// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let allPatients = [];
let allFactures = [];
let filteredFactures = [];
let selectedPatient = null;
let factureToDelete = null;
let currentFactureId = null;
let currentFilter = 'all';
let currentPage = 1;
let itemsPerPage = 10;

// Filtres avancés
let advancedFilters = {
    dateDebut: null,
    dateFin: null,
    montantMin: null,
    montantMax: null,
    mutuelle: null
};

// Classes API
class FactureAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/factures`);
            if (!response.ok) throw new Error('Erreur lors du chargement des factures');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des factures');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/factures/${id}`);
            if (!response.ok) throw new Error('Facture introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async create(factureData) {
        try {
            const response = await fetch(`${API_BASE_URL}/factures`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(factureData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API create:', error);
            throw error;
        }
    }

    static async update(id, factureData) {
        try {
            const response = await fetch(`${API_BASE_URL}/factures/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(factureData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/factures/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            return true;
        } catch (error) {
            console.error('Erreur API delete:', error);
            throw error;
        }
    }

    static async search(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/factures/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search:', error);
            return [];
        }
    }

    static async getNextNumber() {
        try {
            const response = await fetch(`${API_BASE_URL}/factures/next-numero`);
            if (!response.ok) throw new Error('Erreur lors de la génération du numéro');
            const data = await response.json();
            return data.numero;
        } catch (error) {
            console.error('Erreur API getNextNumber:', error);
            return 'F-001';
        }
    }
}

class PatientAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/patients`);
            if (!response.ok) throw new Error('Erreur lors du chargement des patients');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll patients:', error);
            return [];
        }
    }

    static async search(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search patients:', error);
            return [];
        }
    }
}

// Utilitaires
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

// ================================
// GESTION DES FILTRES
// ================================

// Applique tous les filtres (base + avancés)
function applyAllFilters() {
    let result = [...allFactures];

    // 1. Filtre par mode de paiement
    if (currentFilter !== 'all') {
        result = result.filter(f => f.modePaiement === currentFilter);
    }

    // 2. Filtres avancés - Date
    if (advancedFilters.dateDebut) {
        const dateDebut = new Date(advancedFilters.dateDebut);
        result = result.filter(f => new Date(f.date) >= dateDebut);
    }

    if (advancedFilters.dateFin) {
        const dateFin = new Date(advancedFilters.dateFin);
        result = result.filter(f => new Date(f.date) <= dateFin);
    }

    // 3. Filtres avancés - Montant
    if (advancedFilters.montantMin !== null && advancedFilters.montantMin !== '') {
        result = result.filter(f => f.montantTotal >= parseFloat(advancedFilters.montantMin));
    }

    if (advancedFilters.montantMax !== null && advancedFilters.montantMax !== '') {
        result = result.filter(f => f.montantTotal <= parseFloat(advancedFilters.montantMax));
    }

    // 4. Filtres avancés - Mutuelle
    if (advancedFilters.mutuelle && advancedFilters.mutuelle !== '') {
        result = result.filter(f => f.mutuelle === advancedFilters.mutuelle);
    }

    filteredFactures = result;
    updateFacturesList();
    updateFiltersCount();
}

// Met à jour les compteurs de filtres
function updateFiltersCount() {
    document.getElementById('facturesTotalCount').textContent = filteredFactures.length;
}

// Gestion du dropdown des filtres avancés
function setupAdvancedFiltersDropdown() {
    const dropdownBtn = document.getElementById('advancedFiltersBtn');
    const dropdown = document.getElementById('advancedFiltersDropdown');
    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');

    // Toggle dropdown
    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });

    // Fermer si clic en dehors
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Appliquer les filtres
    applyBtn.addEventListener('click', function() {
        applyAdvancedFilters();
        dropdown.classList.add('hidden');
    });

    // Effacer les filtres
    clearBtn.addEventListener('click', function() {
        clearAdvancedFilters();
        dropdown.classList.add('hidden');
    });
}

// Applique les filtres avancés
function applyAdvancedFilters() {
    // Récupérer les valeurs des filtres
    advancedFilters.dateDebut = document.getElementById('dateDebut').value || null;
    advancedFilters.dateFin = document.getElementById('dateFin').value || null;
    advancedFilters.montantMin = document.getElementById('montantMin').value || null;
    advancedFilters.montantMax = document.getElementById('montantMax').value || null;
    advancedFilters.mutuelle = document.getElementById('mutuelleFilter').value || null;

    // Valider les dates
    if (advancedFilters.dateDebut && advancedFilters.dateFin) {
        if (new Date(advancedFilters.dateDebut) > new Date(advancedFilters.dateFin)) {
            showNotification('error', 'La date de début doit être antérieure à la date de fin');
            return;
        }
    }

    // Valider les montants
    if (advancedFilters.montantMin && advancedFilters.montantMax) {
        if (parseFloat(advancedFilters.montantMin) > parseFloat(advancedFilters.montantMax)) {
            showNotification('error', 'Le montant minimum doit être inférieur au montant maximum');
            return;
        }
    }

    // Remettre la page à 1 et appliquer les filtres
    currentPage = 1;
    applyAllFilters();

    // Mettre à jour l'indicateur du bouton
    updateFiltersIndicator();

    showNotification('success', 'Filtres appliqués avec succès');
}

// Efface tous les filtres avancés
function clearAdvancedFilters() {
    advancedFilters = {
        dateDebut: null,
        dateFin: null,
        montantMin: null,
        montantMax: null,
        mutuelle: null
    };

    // Réinitialiser les champs du formulaire
    document.getElementById('dateDebut').value = '';
    document.getElementById('dateFin').value = '';
    document.getElementById('montantMin').value = '';
    document.getElementById('montantMax').value = '';
    document.getElementById('mutuelleFilter').value = '';

    // Remettre la page à 1 et appliquer les filtres
    currentPage = 1;
    applyAllFilters();

    // Mettre à jour l'indicateur du bouton
    updateFiltersIndicator();

    showNotification('info', 'Filtres effacés');
}

// Met à jour l'indicateur visuel des filtres actifs
function updateFiltersIndicator() {
    const btn = document.getElementById('advancedFiltersBtn');
    const hasActiveFilters = Object.values(advancedFilters).some(value => value !== null && value !== '');

    if (hasActiveFilters) {
        btn.classList.add('bg-primary', 'text-white');
        btn.classList.remove('bg-white', 'text-gray-700');
    } else {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-white', 'text-gray-700');
    }
}

// ================================
// GESTION DES FACTURES
// ================================

async function loadFactures() {
    try {
        allFactures = await FactureAPI.getAll();
        applyAllFilters();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des factures');
    }
}

// Gestion des patients
async function loadPatients() {
    try {
        allPatients = await PatientAPI.getAll();
    } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
    }
}

function initPatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    const optionsContainer = document.getElementById('patientOptions');
    const hiddenInput = document.getElementById('selectedPatient');
    const clearBtn = document.getElementById('patientClear');

    searchInput.addEventListener('focus', function() {
        optionsContainer.style.display = 'block';
        filterPatients('');
    });

    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        filterPatients(query);

        if (query !== '') {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
            hiddenInput.value = '';
            selectedPatient = null;
        }
    });

    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        searchInput.value = '';
        hiddenInput.value = '';
        selectedPatient = null;
        clearBtn.style.display = 'none';
        optionsContainer.style.display = 'none';
    });

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !optionsContainer.contains(e.target)) {
            optionsContainer.style.display = 'none';
        }
    });

    optionsContainer.addEventListener('click', function(e) {
        const option = e.target.closest('.patient-search-option');
        if (option) {
            const patientId = option.dataset.patientId;
            const patient = allPatients.find(p => p.id == patientId);

            if (patient) {
                searchInput.value = `${patient.prenom} ${patient.nom}`;
                hiddenInput.value = patientId;
                selectedPatient = patient;
                optionsContainer.style.display = 'none';
                clearBtn.style.display = 'block';
            }
        }
    });
}

async function filterPatients(query) {
    const optionsContainer = document.getElementById('patientOptions');
    optionsContainer.innerHTML = '';

    let patientsToShow = [];

    if (query.length >= 2) {
        try {
            patientsToShow = await PatientAPI.search(query);
        } catch (error) {
            patientsToShow = allPatients.filter(patient =>
                patient.prenom.toLowerCase().includes(query.toLowerCase()) ||
                patient.nom.toLowerCase().includes(query.toLowerCase())
            );
        }
    } else if (query.length === 0) {
        patientsToShow = allPatients.slice(0, 10);
    }

    patientsToShow.forEach(patient => {
        const option = document.createElement('div');
        option.className = 'patient-search-option';
        option.dataset.patientId = patient.id;
        option.innerHTML = `
            <div class="font-medium">${patient.prenom} ${patient.nom}</div>
            <div class="text-xs text-gray-500">${patient.pathologie || 'Aucune pathologie'}</div>
        `;
        optionsContainer.appendChild(option);
    });

    if (patientsToShow.length === 0 && query.length >= 2) {
        const noResult = document.createElement('div');
        noResult.className = 'patient-search-option text-gray-500';
        noResult.textContent = 'Aucun patient trouvé';
        optionsContainer.appendChild(noResult);
    }
}

// Gestion des prestations
function addPrestation(designation = '', quantite = 1, prix = 0) {
    const tableBody = document.getElementById('prestationsTable');
    const row = document.createElement('tr');
    row.className = 'prestation-row';

    // Prix par défaut selon la prestation et la mutuelle
    if (prix === 0) {
        const mutuelle = document.querySelector('input[name="mutuelle"]:checked')?.value === 'oui';
        switch (designation) {
            case 'Bilan psychomoteur (évaluation complète)':
                prix = mutuelle ? 1200 : 1000;
                break;
            case 'Séance':
                prix = mutuelle ? 250 : 200;
                break;
            case 'Anamnèse':
                prix = mutuelle ? 250 : 200;
                break;
            default:
                prix = 1000;
        }
    }

    const total = quantite * prix;

    row.innerHTML = `
        <td class="px-4 py-2">
            <select name="designation" class="w-full px-2 py-1 border border-gray-300 rounded" onchange="updatePrestationPrix(this)">
                <option value="Bilan psychomoteur (évaluation complète)" ${designation === 'Bilan psychomoteur (évaluation complète)' ? 'selected' : ''}>Bilan psychomoteur (évaluation complète)</option>
                <option value="Séance" ${designation === 'Séance' ? 'selected' : ''}>Séance</option>
                <option value="Anamnèse" ${designation === 'Anamnèse' ? 'selected' : ''}>Anamnèse</option>
            </select>
        </td>
        <td class="px-4 py-2">
            <input type="number" name="quantite" class="w-full px-2 py-1 border border-gray-300 rounded text-center" 
                   value="${quantite}" min="1" onchange="updatePrestationTotal(this)">
        </td>
        <td class="px-4 py-2">
            <input type="number" name="prix" class="w-full px-2 py-1 border border-gray-300 rounded text-center" 
                   value="${prix}" step="0.01" onchange="updatePrestationTotal(this)">
        </td>
        <td class="px-4 py-2">
            <input type="number" name="total" class="w-full px-2 py-1 border border-gray-300 rounded text-center bg-gray-100" 
                   value="${total}" readonly>
        </td>
        <td class="px-4 py-2 text-center">
            <button type="button" class="text-red-500 hover:text-red-700" onclick="removePrestation(this)">
                <i class="ri-delete-bin-line"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(row);
}

function removePrestation(button) {
    const tableBody = document.getElementById('prestationsTable');
    if (tableBody.children.length > 1) {
        button.closest('tr').remove();
    } else {
        showNotification('error', 'Vous devez avoir au moins une prestation');
    }
}

function updatePrestationPrix(select) {
    const row = select.closest('tr');
    const prixInput = row.querySelector('input[name="prix"]');
    const mutuelle = document.querySelector('input[name="mutuelle"]:checked')?.value === 'oui';

    switch (select.value) {
        case 'Bilan psychomoteur (évaluation complète)':
            prixInput.value = mutuelle ? 1200 : 1000;
            break;
        case 'Séance':
            prixInput.value = mutuelle ? 250 : 200;
            break;
        case 'Anamnèse':
            prixInput.value = mutuelle ? 250 : 200;
            break;
    }

    updatePrestationTotal(prixInput);
}

function updatePrestationTotal(input) {
    const row = input.closest('tr');
    const quantite = parseFloat(row.querySelector('input[name="quantite"]').value) || 0;
    const prix = parseFloat(row.querySelector('input[name="prix"]').value) || 0;
    const totalInput = row.querySelector('input[name="total"]');

    totalInput.value = (quantite * prix).toFixed(2);
}

// Gestion des champs verrouillés/déverrouillés
function setupLockToggle(fieldId) {
    const toggleBtn = document.getElementById(`toggle${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
    const input = document.getElementById(fieldId);
    const lock = document.getElementById(`${fieldId}Lock`);

    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();

        if (input.readOnly) {
            input.readOnly = false;
            input.classList.remove('bg-gray-100');
            input.classList.add('unlocked-field');
            lock.classList.remove('ri-lock-line');
            lock.classList.add('ri-lock-unlock-line');
        } else {
            input.readOnly = true;
            input.classList.add('bg-gray-100');
            input.classList.remove('unlocked-field');
            lock.classList.remove('ri-lock-unlock-line');
            lock.classList.add('ri-lock-line');
        }
    });
}

function updateFacturesList() {
    document.getElementById('totalFactures').textContent = filteredFactures.length;

    const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredFactures.length);

    document.getElementById('startRange').textContent = filteredFactures.length ? start + 1 : 0;
    document.getElementById('endRange').textContent = end;

    const currentPageFactures = filteredFactures.slice(start, end);

    renderFacturesTable(currentPageFactures);
    createPagination(totalPages);
}

function renderFacturesTable(factures) {
    const tableBody = document.getElementById('facturesTableBody');
    const noFactures = document.getElementById('noFactures');

    tableBody.innerHTML = '';

    if (factures.length === 0) {
        noFactures.classList.remove('hidden');
        return;
    }

    noFactures.classList.add('hidden');

    factures.forEach(facture => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${facture.numero}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${facture.nomCompletPatient || `${facture.patient?.prenom || ''} ${facture.patient?.nom || ''}`}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatDate(facture.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${facture.montantTotal.toFixed(2)} DH</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${facture.modePaiement}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${facture.mutuelle === 'oui' ? 'Oui' : 'Non'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-600 view-facture-btn" data-id="${facture.id}">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-green-600 print-facture-btn" data-id="${facture.id}">
                        <i class="ri-printer-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 edit-facture-btn" data-id="${facture.id}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-red-500 delete-facture-btn" data-id="${facture.id}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    addTableEventListeners();
}

function createPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1 border border-gray-300 rounded-button text-sm text-gray-700 bg-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
    prevBtn.innerHTML = 'Précédent';
    prevBtn.disabled = currentPage === 1;

    if (currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            currentPage--;
            updateFacturesList();
        });
    }

    paginationContainer.appendChild(prevBtn);

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `px-3 py-1 border border-gray-300 rounded-button text-sm ${i === currentPage ? 'bg-primary text-white' : 'text-gray-700 bg-white hover:bg-gray-50'}`;
        pageBtn.textContent = i;

        if (i !== currentPage) {
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                updateFacturesList();
            });
        }

        paginationContainer.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1 border border-gray-300 rounded-button text-sm text-gray-700 bg-white ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
    nextBtn.innerHTML = 'Suivant';
    nextBtn.disabled = currentPage === totalPages;

    if (currentPage < totalPages) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            updateFacturesList();
        });
    }

    paginationContainer.appendChild(nextBtn);
}

function addTableEventListeners() {
    // Boutons de visualisation
    document.querySelectorAll('.view-facture-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const factureId = this.dataset.id;
            await viewFacture(factureId);
        });
    });

    // Boutons d'impression
    document.querySelectorAll('.print-facture-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const factureId = this.dataset.id;
            await printFactureById(factureId);
        });
    });

    // Boutons d'édition
    document.querySelectorAll('.edit-facture-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const factureId = this.dataset.id;
            await editFacture(factureId);
        });
    });

    // Boutons de suppression
    document.querySelectorAll('.delete-facture-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const factureId = this.dataset.id;
            confirmDeleteFacture(factureId);
        });
    });
}

// Gestion du formulaire
function validateForm() {
    const patient = document.getElementById('selectedPatient').value;
    const date = document.getElementById('dateFacture').value;
    const modePaiement = document.getElementById('modePaiement').value;
    const mutuelle = document.querySelector('input[name="mutuelle"]:checked');
    const prestations = document.querySelectorAll('#prestationsTable tr');

    let isValid = true;
    const errors = [];

    if (!patient) {
        errors.push('Veuillez sélectionner un patient');
        isValid = false;
    }

    if (!date) {
        errors.push('La date est obligatoire');
        isValid = false;
    }

    if (!modePaiement) {
        errors.push('Le mode de paiement est obligatoire');
        isValid = false;
    }

    if (!mutuelle) {
        errors.push('Veuillez indiquer si le patient a une mutuelle');
        isValid = false;
    }

    if (prestations.length === 0) {
        errors.push('Au moins une prestation est obligatoire');
        isValid = false;
    }

    if (!isValid) {
        showNotification('error', errors.join(', '));
    }

    return isValid;
}

async function saveFacture() {
    if (!validateForm()) return;

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    try {
        // Récupérer les prestations
        const prestations = [];
        const prestationRows = document.querySelectorAll('#prestationsTable tr');

        prestationRows.forEach(row => {
            const designation = row.querySelector('select[name="designation"]').value;
            const quantite = parseInt(row.querySelector('input[name="quantite"]').value);
            const prixUnitaire = parseFloat(row.querySelector('input[name="prix"]').value);

            prestations.push({
                designation,
                quantite,
                prixUnitaire
            });
        });

        // Préparer les données de la facture
        const factureData = {
            patient: { id: parseInt(document.getElementById('selectedPatient').value) },
            date: document.getElementById('dateFacture').value,
            modePaiement: document.getElementById('modePaiement').value,
            mutuelle: document.querySelector('input[name="mutuelle"]:checked').value,
            adresse: document.getElementById('adresse').value,
            gsm: document.getElementById('gsm').value,
            ice: document.getElementById('ice').value,
            prestations: prestations
        };

        // Ajouter le numéro si modifié
        const numFacture = document.getElementById('numFacture').value;
        if (numFacture && !document.getElementById('numFacture').readOnly) {
            factureData.numero = numFacture;
        }

        let savedFacture;
        if (currentFactureId) {
            savedFacture = await FactureAPI.update(currentFactureId, factureData);
            showNotification('success', 'Facture modifiée avec succès!');
        } else {
            savedFacture = await FactureAPI.create(factureData);
            showNotification('success', 'Facture créée avec succès!');
        }

        // Recharger la liste et masquer le formulaire
        await loadFactures();
        hideForm();

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('error', error.message || 'Erreur lors de la sauvegarde');
    } finally {
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
    }
}

// Gestion de l'aperçu - Style identique à la maquette
function showPreview() {
    const previewArea = document.getElementById('facturePreview');
    const previewBtn = document.getElementById('previewBtn');

    if (previewArea.classList.contains('show')) {
        // Fermer l'aperçu avec animation slide up
        previewArea.classList.add('closing');

        setTimeout(() => {
            previewArea.classList.remove('show');
            previewArea.classList.remove('closing');
            previewBtn.innerHTML = '<i class="ri-eye-line mr-2"></i> Aperçu de la facture';
        }, 300);
    } else {
        if (!validateForm()) return;

        // Mettre à jour l'aperçu avec les valeurs du formulaire
        const numFacture = document.getElementById('numFacture').value;
        document.getElementById('preview-numFacture').textContent = numFacture.replace('F-', '');

        const nomPatient = selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : document.getElementById('patientSearch').value;
        document.getElementById('preview-nomPatient').textContent = nomPatient.toUpperCase();

        // Formater la date
        const dateInput = document.getElementById('dateFacture').value;
        const formattedDate = dateInput ? new Date(dateInput).toLocaleDateString('fr-FR') : '';
        document.getElementById('preview-dateFacture').textContent = formattedDate;

        document.getElementById('preview-adresse').textContent = document.getElementById('adresse').value;
        document.getElementById('preview-gsm').textContent = document.getElementById('gsm').value;
        document.getElementById('preview-ice').textContent = document.getElementById('ice').value;
        document.getElementById('preview-modePaiement').textContent = document.getElementById('modePaiement').value;

        // Mettre à jour les prestations et calculer le total
        const prestationRows = document.querySelectorAll('#prestationsTable tr');
        const previewPrestations = document.getElementById('preview-prestations');
        previewPrestations.innerHTML = '';

        let total = 0;

        prestationRows.forEach(row => {
            const designation = row.querySelector('select[name="designation"]').value;
            const quantite = row.querySelector('input[name="quantite"]').value;
            const prix = row.querySelector('input[name="prix"]').value;
            const rowTotal = row.querySelector('input[name="total"]').value;

            total += parseFloat(rowTotal);

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="border border-gray-300 p-2">${designation}</td>
                <td class="border border-gray-300 p-2 text-center">${quantite}</td>
                <td class="border border-gray-300 p-2 text-center">${prix} Dhs</td>
                <td class="border border-gray-300 p-2 text-center">${rowTotal} Dhs</td>
            `;
            previewPrestations.appendChild(newRow);
        });

        // Mettre à jour le total
        document.getElementById('preview-total').textContent = total + ' Dhs';

        // Ouvrir l'aperçu avec animation slide down
        previewArea.classList.add('show');
        previewBtn.innerHTML = '<i class="ri-eye-off-line mr-2"></i> Masquer l\'aperçu';
    }
}

function hidePreview() {
    const previewArea = document.getElementById('facturePreview');
    const previewBtn = document.getElementById('previewBtn');

    if (previewArea.classList.contains('show')) {
        previewArea.classList.add('closing');

        setTimeout(() => {
            previewArea.classList.remove('show');
            previewArea.classList.remove('closing');
            previewBtn.innerHTML = '<i class="ri-eye-line mr-2"></i> Aperçu de la facture';
        }, 300);
    }
}

// Fonction pour créer le contenu HTML imprimable - CORRIGÉ SELON LA MAQUETTE
function createPrintableContent(facture) {
    // Récupérer le chemin absolu de l'image depuis la page actuelle
    const baseUrl = window.location.origin;
    const imagePath = `${baseUrl}/images/Multi-Dys.jpg`;

    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Facture ${facture.numero || facture.numFacture}</title>
            <style>
                @media screen, print {
                    body { 
                        font-family: 'Times New Roman', serif; 
                        font-size: 12pt; 
                        padding: 20px; 
                        line-height: 1.6;
                        margin: 0;
                        color: #000;
                    }
                    
                    .header-section {
                        margin-bottom: 30px;
                    }
                    
                    .logo {
                        max-width: 150px; 
                        height: auto; 
                        margin-bottom: 10px;
                        display: block;
                    }
                    
                    h1 { 
                        text-align: center; 
                        font-size: 18pt; 
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    
                    .patient-info {
                        margin-bottom: 30px;
                    }
                    
                    .patient-name {
                        font-weight: bold;
                        font-size: 14pt;
                    }
                    
                    .prestations-section {
                        margin-bottom: 30px;
                    }
                    
                    .prestations-title {
                        font-weight: bold;
                        margin-bottom: 10px;
                        font-size: 13pt;
                    }
                    
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 10px 0;
                    }
                    
                    th, td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    
                    th { 
                        background-color: #f5f5f5; 
                        font-weight: bold; 
                        text-align: center;
                    }
                    
                    .text-center { 
                        text-align: center; 
                    }
                    
                    .text-right { 
                        text-align: right; 
                    }
                    
                    .font-bold { 
                        font-weight: bold; 
                    }
                    
                    .payment-info {
                        margin: 30px 0;
                        font-size: 13pt;
                    }
                    
                    .date-section {
                        text-align: right;
                        margin: 40px 0;
                        font-weight: bold;
                    }
                    
                    .footer-info {
                        text-align: center;
                        margin-top: 50px;
                        font-size: 11pt;
                    }
                    
                    .footer-info p {
                        margin: 5px 0;
                    }
                }
                
                @media print {
                    body { 
                        padding: 15px; 
                    }
                    
                    @page {
                        margin: 1cm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header-section">
                <img src="${imagePath}" alt="Logo Centre Multi-Dys" class="logo">
                <h1>FACTURE N° ${(facture.numero || facture.numFacture || '').replace('F-', '')}</h1>
            </div>
            
            <div class="patient-info">
                <p class="patient-name">Nom: ${facture.nomCompletPatient || facture.nomPatient || `${facture.patient?.prenom || ''} ${facture.patient?.nom || ''}`}</p>
            </div>
            
            <div class="prestations-section">
                <p class="prestations-title">Description des prestations:</p>
                <table>
                    <thead>
                        <tr>
                            <th>Désignation</th>
                            <th>Quantité</th>
                            <th>Prix</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${facture.prestations.map(p => `
                            <tr>
                                <td>${p.designation}</td>
                                <td class="text-center">${p.quantite}</td>
                                <td class="text-center">${p.prixUnitaire || p.prix} DH</td>
                                <td class="text-center">${p.total || (p.quantite * (p.prixUnitaire || p.prix))} DH</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="3" class="text-right font-bold">TOTAL</td>
                            <td class="text-center font-bold">${facture.montantTotal} DH</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="payment-info">
                <p><strong>Mode de paiement:</strong> ${facture.modePaiement}</p>
            </div>
            
            <div class="date-section">
                <p><strong>Fait le:</strong> ${formatDate(facture.date || facture.dateFacture)}</p>
            </div>
            
            <div class="footer-info">
                <p><strong>Adresse:</strong> ${facture.adresse}</p>
                <p><strong>GSM:</strong> ${facture.gsm}</p>
                <p><strong>ICE:</strong> ${facture.ice}</p>
            </div>
        </body>
        </html>
    `;
}

// Fonction d'impression améliorée avec iframe - CORRIGÉE
function printFacture() {
    if (!validateForm()) {
        showNotification('error', 'Veuillez remplir tous les champs obligatoires avant d\'imprimer');
        return;
    }

    // Récupérer les données du formulaire
    const prestations = [];
    const prestationRows = document.querySelectorAll('#prestationsTable tr');
    let montantTotal = 0;

    prestationRows.forEach(row => {
        const designation = row.querySelector('select[name="designation"]').value;
        const quantite = parseInt(row.querySelector('input[name="quantite"]').value);
        const prix = parseFloat(row.querySelector('input[name="prix"]').value);
        const total = quantite * prix;

        prestations.push({
            designation,
            quantite,
            prixUnitaire: prix,
            total
        });
        montantTotal += total;
    });

    const factureData = {
        numero: document.getElementById('numFacture').value,
        nomPatient: selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : document.getElementById('patientSearch').value,
        date: document.getElementById('dateFacture').value,
        modePaiement: document.getElementById('modePaiement').value,
        adresse: document.getElementById('adresse').value,
        gsm: document.getElementById('gsm').value,
        ice: document.getElementById('ice').value,
        prestations: prestations,
        montantTotal: montantTotal
    };

    // Créer l'iframe pour l'impression
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.opacity = '0';
    document.body.appendChild(printFrame);

    const printContent = createPrintableContent(factureData);

    // Écrire le contenu dans l'iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printContent);
    frameDoc.close();

    // Attendre que l'image soit chargée puis imprimer
    const img = frameDoc.querySelector('.logo');
    if (img) {
        img.onload = function() {
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        };

        img.onerror = function() {
            console.warn('Image non trouvée, impression sans image');
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        };
    } else {
        // Si pas d'image, imprimer directement
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 1000);
        }, 500);
    }
}

async function printFactureById(id) {
    try {
        const facture = await FactureAPI.getById(id);
        if (!facture) return;

        // Créer l'iframe pour l'impression
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.top = '-1000px';
        printFrame.style.left = '-1000px';
        printFrame.style.width = '1px';
        printFrame.style.height = '1px';
        printFrame.style.opacity = '0';
        document.body.appendChild(printFrame);

        const printContent = createPrintableContent(facture);

        // Écrire le contenu dans l'iframe
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(printContent);
        frameDoc.close();

        // Attendre que l'image soit chargée puis imprimer
        const img = frameDoc.querySelector('.logo');
        if (img) {
            img.onload = function() {
                setTimeout(() => {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                    }, 1000);
                }, 500);
            };

            img.onerror = function() {
                console.warn('Image non trouvée, impression sans image');
                setTimeout(() => {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                    }, 1000);
                }, 500);
            };
        } else {
            // Si pas d'image, imprimer directement
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        }

    } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
        showNotification('error', 'Erreur lors de l\'impression');
    }
}

// Fonctions d'affichage/masquage du formulaire
function showForm() {
    document.getElementById('formSection').classList.remove('hidden');
    // Scroll vers le formulaire
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    document.getElementById('formSection').classList.add('hidden');
    hidePreview();
    resetFormData();
}

async function viewFacture(id) {
    try {
        const facture = await FactureAPI.getById(id);
        if (!facture) return;

        // Masquer le formulaire
        hideForm();

        // Remplir l'aperçu avec les données de la facture
        document.getElementById('preview-numFacture').textContent = facture.numero.replace('F-', '');
        document.getElementById('preview-nomPatient').textContent = facture.nomCompletPatient || `${facture.patient?.prenom || ''} ${facture.patient?.nom || ''}`;
        document.getElementById('preview-dateFacture').textContent = formatDate(facture.date);
        document.getElementById('preview-modePaiement').textContent = facture.modePaiement;
        document.getElementById('preview-adresse').textContent = facture.adresse;
        document.getElementById('preview-gsm').textContent = facture.gsm;
        document.getElementById('preview-ice').textContent = facture.ice;

        // Remplir les prestations
        const previewPrestations = document.getElementById('preview-prestations');
        previewPrestations.innerHTML = '';

        facture.prestations.forEach(prestation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border border-gray-300 p-2">${prestation.designation}</td>
                <td class="border border-gray-300 p-2 text-center">${prestation.quantite}</td>
                <td class="border border-gray-300 p-2 text-center">${prestation.prixUnitaire.toFixed(2)} Dhs</td>
                <td class="border border-gray-300 p-2 text-center">${prestation.total.toFixed(2)} Dhs</td>
            `;
            previewPrestations.appendChild(row);
        });

        document.getElementById('preview-total').textContent = `${facture.montantTotal.toFixed(2)} Dhs`;

        // Afficher l'aperçu
        const previewSection = document.getElementById('facturePreview');
        previewSection.classList.remove('hidden');
        previewSection.classList.add('show');
        previewSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Erreur lors de la visualisation:', error);
        showNotification('error', 'Erreur lors de la visualisation de la facture');
    }
}

async function editFacture(id) {
    try {
        const facture = await FactureAPI.getById(id);
        if (!facture) return;

        currentFactureId = id;

        // Afficher le formulaire
        showForm();

        // Attendre que le formulaire soit affiché avant de le remplir
        setTimeout(async () => {
            // Générer et remplir le formulaire avec les données de la facture
            await resetFormData();

            document.getElementById('numFacture').value = facture.numero;
            document.getElementById('dateFacture').value = facture.date;
            document.getElementById('modePaiement').value = facture.modePaiement;
            document.getElementById('adresse').value = facture.adresse;
            document.getElementById('gsm').value = facture.gsm;
            document.getElementById('ice').value = facture.ice;

            // Sélectionner la mutuelle
            const mutuelleRadio = document.querySelector(`input[name="mutuelle"][value="${facture.mutuelle}"]`);
            if (mutuelleRadio) mutuelleRadio.checked = true;

            // Remplir le patient
            if (facture.patient) {
                selectedPatient = facture.patient;
                document.getElementById('patientSearch').value = `${facture.patient.prenom} ${facture.patient.nom}`;
                document.getElementById('selectedPatient').value = facture.patient.id;
                document.getElementById('patientClear').style.display = 'block';
            }

            // Remplir les prestations
            const tableBody = document.getElementById('prestationsTable');
            tableBody.innerHTML = '';

            facture.prestations.forEach(prestation => {
                addPrestation(prestation.designation, prestation.quantite, prestation.prixUnitaire);
            });
        }, 100);

    } catch (error) {
        console.error('Erreur lors de l\'édition:', error);
        showNotification('error', 'Erreur lors du chargement de la facture');
    }
}

function confirmDeleteFacture(id) {
    factureToDelete = id;
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

async function deleteFacture() {
    if (!factureToDelete) return;

    try {
        await FactureAPI.delete(factureToDelete);
        showNotification('success', 'Facture supprimée avec succès!');
        await loadFactures();
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        factureToDelete = null;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('error', 'Erreur lors de la suppression');
    }
}

// Recherche
async function searchFactures() {
    const query = document.getElementById('searchInput').value.trim();
    console.log('🔍 Recherche factures locale:', query);

    if (query) {
        const queryLower = query.toLowerCase();

        const searchResults = allFactures.filter(facture => {
            // Données du patient
            const patientNom = facture.patient?.nom || '';
            const patientPrenom = facture.patient?.prenom || '';

            // Autres champs
            const numero = facture.numero || '';
            const modePaiement = facture.modePaiement || '';

            return (
                numero.toLowerCase().includes(queryLower) ||
                modePaiement.toLowerCase().includes(queryLower) ||
                patientNom.toLowerCase().includes(queryLower) ||
                patientPrenom.toLowerCase().includes(queryLower) ||

                // ✅ RECHERCHE BIDIRECTIONNELLE
                `${patientPrenom} ${patientNom}`.toLowerCase().includes(queryLower) ||
                `${patientNom} ${patientPrenom}`.toLowerCase().includes(queryLower)
            );
        });

        console.log(`📈 ${searchResults.length}/${allFactures.length} factures trouvées`);

        // Appliquer les filtres sur les résultats
        const originalAllFactures = allFactures;
        allFactures = searchResults;
        applyAllFilters();
        allFactures = originalAllFactures;

    } else {
        applyAllFilters();
    }
}

// Réinitialisation des données du formulaire
async function resetFormData() {
    currentFactureId = null;

    // Générer un nouveau numéro de facture
    try {
        const nextNumber = await FactureAPI.getNextNumber();
        document.getElementById('numFacture').value = nextNumber;
    } catch (error) {
        document.getElementById('numFacture').value = 'F-001';
    }

    // Réinitialiser les champs
    document.getElementById('patientSearch').value = '';
    document.getElementById('selectedPatient').value = '';
    document.getElementById('dateFacture').value = formatDateForAPI(new Date());
    document.getElementById('modePaiement').value = '';
    document.querySelector('input[name="mutuelle"][value="non"]').checked = true;

    // Réinitialiser les prestations
    const tableBody = document.getElementById('prestationsTable');
    tableBody.innerHTML = '';
    addPrestation('Bilan psychomoteur (évaluation complète)');

    // Masquer les éléments
    document.getElementById('patientClear').style.display = 'none';

    selectedPatient = null;
}

// Notifications
function showNotification(type, message, title = null) {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationIcon = notification.querySelector('.notification-icon svg');

    switch(type) {
        case 'success':
            notification.style.borderLeftColor = '#10b981';
            notification.querySelector('.notification-icon').style.color = '#10b981';
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />';
            notificationTitle.textContent = title || 'Succès';
            break;
        case 'error':
            notification.style.borderLeftColor = '#ef4444';
            notification.querySelector('.notification-icon').style.color = '#ef4444';
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M10 20a10 10 0 100-20 10 10 0 000 20zM8.45 4.3c.765-1.36 2.722-1.36 3.486 0l5.14 9.14c.75 1.334-.213 2.98-1.742 2.98H5.07c-1.53 0-2.493-1.646-1.743-2.98l5.14-9.14zM11 12a1 1 0 11-2 0 1 1 0 012 0zm-1-7a1 1 0 00-1 1v2.8a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';
            notificationTitle.textContent = title || 'Erreur';
            break;
        case 'info':
            notification.style.borderLeftColor = '#3b82f6';
            notification.querySelector('.notification-icon').style.color = '#3b82f6';
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />';
            notificationTitle.textContent = title || 'Information';
            break;
    }

    notificationMessage.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Fonction simplifiée pour le toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (!sidebar || !mainContent || !openSidebarBtn || !closeSidebarBtn) return;

    const isOpen = !sidebar.classList.contains('sidebar-hidden');

    if (isOpen) {
        // Fermer
        sidebar.classList.add('sidebar-hidden');
        mainContent.classList.remove('ml-64');
        openSidebarBtn.classList.remove('hidden');
        openSidebarBtn.style.display = 'flex';
        closeSidebarBtn.classList.add('hidden');
    } else {
        // Ouvrir
        sidebar.classList.remove('sidebar-hidden');
        mainContent.classList.add('ml-64');
        openSidebarBtn.classList.add('hidden');
        openSidebarBtn.style.display = 'none';
        closeSidebarBtn.classList.remove('hidden');
    }
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Initialisation de la page facture...');

    // 1. Charger la sidebar
    try {
        const response = await fetch('/partials/sidebar.html');
        const sidebarHTML = await response.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;
        console.log('✅ Sidebar chargée');
    } catch (error) {
        console.error("❌ Erreur lors du chargement de la sidebar :", error);
    }

    // 2. Attendre que la sidebar soit chargée puis configurer les event listeners
    setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const openSidebarBtn = document.getElementById('openSidebarBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');

        if (sidebar && mainContent && openSidebarBtn && closeSidebarBtn) {
            // Event listeners pour le toggle
            openSidebarBtn.addEventListener('click', toggleSidebar);
            closeSidebarBtn.addEventListener('click', toggleSidebar);

            // État initial : sidebar ouverte
            sidebar.classList.remove('sidebar-hidden');
            mainContent.classList.add('ml-64');
            openSidebarBtn.classList.add('hidden');
            openSidebarBtn.style.display = 'none';
            closeSidebarBtn.classList.remove('hidden');

            console.log('✅ Toggle sidebar configuré');
        }
    }, 200);

    // 3. Configurer la date actuelle
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        const today = new Date();
        currentDate.textContent = today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // 4. Masquer le formulaire au démarrage
    document.getElementById('formSection').classList.add('hidden');

    // 5. Initialiser les données
    await loadPatients();
    await loadFactures();

    // 6. Configurer les event listeners
    setupEventListeners();

    console.log('✅ Initialisation terminée');
});

function setupEventListeners() {
    // ================================
    // FILTRES - Event Listeners
    // ================================

    // Filtres par mode de paiement
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function () {
            // Mettre à jour l'apparence des boutons
            document.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });
            this.classList.add('active');
            this.classList.remove('bg-gray-100', 'text-gray-700');

            // Appliquer le filtre
            currentFilter = this.dataset.filter;
            currentPage = 1;
            applyAllFilters();
        });
    });

    // Configurer le dropdown des filtres avancés
    setupAdvancedFiltersDropdown();

    // Recherche globale
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                searchFactures();
            }, 300);
        });
    }

    // ================================
    // FORMULAIRE - Event Listeners
    // ================================

    // Recherche de patients
    initPatientSearch();

    // Gestion des champs verrouillés
    setupLockToggle('numFacture');
    setupLockToggle('adresse');
    setupLockToggle('gsm');
    setupLockToggle('ice');

    // Boutons du formulaire
    document.getElementById('addPrestationBtn').addEventListener('click', () => {
        addPrestation();
    });

    document.getElementById('saveBtn').addEventListener('click', saveFacture);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('printBtn').addEventListener('click', printFacture);
    document.getElementById('closePreviewBtn').addEventListener('click', hidePreview);

    // Nouvelle facture
    document.getElementById('newFactureBtn').addEventListener('click', async () => {
        await resetFormData();
        showForm();
    });

    // Modal de suppression
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        factureToDelete = null;
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteFacture);

    // Mise à jour des prix selon la mutuelle
    document.querySelectorAll('input[name="mutuelle"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const tableBody = document.getElementById('prestationsTable');
            const prestationRows = tableBody.querySelectorAll('tr');

            prestationRows.forEach(row => {
                const select = row.querySelector('select[name="designation"]');
                if (select) {
                    updatePrestationPrix(select);
                }
            });
        });
    });

    // Bouton de fermeture du formulaire
    const closeFormBtn = document.getElementById('closeFormBtn');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', hideForm);
    }
}

// Fonctions globales pour les événements inline
window.updatePrestationPrix = updatePrestationPrix;
window.updatePrestationTotal = updatePrestationTotal;
window.removePrestation = removePrestation;