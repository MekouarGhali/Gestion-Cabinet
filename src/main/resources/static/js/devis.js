// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let allDevis = [];
let filteredDevis = [];
let selectedDevis = null;
let devisToDelete = null;
let currentDevisId = null;
let currentFilter = 'all';
let currentPage = 1;
let itemsPerPage = 10;

// Filtres avancés
let advancedFilters = {
    dateDebut: null,
    dateFin: null,
    montantMin: null,
    montantMax: null
};

// Classes API
class DevisAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/devis`);
            if (!response.ok) throw new Error('Erreur lors du chargement des devis');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des devis');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/devis/${id}`);
            if (!response.ok) throw new Error('Devis introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async create(devisData) {
        try {
            const response = await fetch(`${API_BASE_URL}/devis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(devisData)
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

    static async update(id, devisData) {
        try {
            const response = await fetch(`${API_BASE_URL}/devis/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(devisData)
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
            const response = await fetch(`${API_BASE_URL}/devis/${id}`, {
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
            const response = await fetch(`${API_BASE_URL}/devis/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search:', error);
            return [];
        }
    }

    static async getNextNumber() {
        try {
            const response = await fetch(`${API_BASE_URL}/devis/next-numero`);
            if (!response.ok) throw new Error('Erreur lors de la génération du numéro');
            const data = await response.json();
            return data.numero;
        } catch (error) {
            console.error('Erreur API getNextNumber:', error);
            return 'DV-001';
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
    let result = [...allDevis];

    // 1. Filtre par mutuelle
    if (currentFilter !== 'all') {
        result = result.filter(d => d.mutuelle === currentFilter);
    }

    // 2. Filtres avancés - Date
    if (advancedFilters.dateDebut) {
        const dateDebut = new Date(advancedFilters.dateDebut);
        result = result.filter(d => new Date(d.date) >= dateDebut);
    }

    if (advancedFilters.dateFin) {
        const dateFin = new Date(advancedFilters.dateFin);
        result = result.filter(d => new Date(d.date) <= dateFin);
    }

    // 3. Filtres avancés - Montant
    if (advancedFilters.montantMin !== null && advancedFilters.montantMin !== '') {
        result = result.filter(d => d.montantTotal >= parseFloat(advancedFilters.montantMin));
    }

    if (advancedFilters.montantMax !== null && advancedFilters.montantMax !== '') {
        result = result.filter(d => d.montantTotal <= parseFloat(advancedFilters.montantMax));
    }

    filteredDevis = result;
    updateDevisList();
    updateFiltersCount();
}

// Met à jour les compteurs de filtres
function updateFiltersCount() {
    document.getElementById('devisTotalCount').textContent = filteredDevis.length;
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
        montantMax: null
    };

    // Réinitialiser les champs du formulaire
    document.getElementById('dateDebut').value = '';
    document.getElementById('dateFin').value = '';
    document.getElementById('montantMin').value = '';
    document.getElementById('montantMax').value = '';

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
// GESTION DES DEVIS
// ================================

async function loadDevis() {
    try {
        allDevis = await DevisAPI.getAll();
        applyAllFilters();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des devis');
    }
}

// Gestion des prestations
function addPrestation(designation = '', quantite = 1, prixUnitaire = 0) {
    const tableBody = document.getElementById('prestationsTable');
    const row = document.createElement('tr');
    row.className = 'prestation-row';

    // Prix par défaut selon la prestation et la mutuelle
    if (prixUnitaire === 0) {
        const mutuelle = document.querySelector('input[name="mutuelle"]:checked')?.value === 'oui';
        switch (designation) {
            case 'Bilan psychomoteur (évaluation complète)':
                prixUnitaire = mutuelle ? 1200 : 1000;
                break;
            case 'Séance':
                prixUnitaire = mutuelle ? 250 : 200;
                break;
            case 'Anamnèse':
                prixUnitaire = mutuelle ? 250 : 200;
                break;
            default:
                prixUnitaire = 1000;
        }
    }

    const total = quantite * prixUnitaire;

    row.innerHTML = `
        <td class="px-4 py-3">
            <select name="designation" class="w-full px-2 py-1 border border-gray-300 rounded" onchange="updatePrestationPrix(this)">
                <option value="Bilan psychomoteur (évaluation complète)" ${designation === 'Bilan psychomoteur (évaluation complète)' ? 'selected' : ''}>Bilan psychomoteur (évaluation complète)</option>
                <option value="Séance" ${designation === 'Séance' ? 'selected' : ''}>Séance</option>
                <option value="Anamnèse" ${designation === 'Anamnèse' ? 'selected' : ''}>Anamnèse</option>
            </select>
        </td>
        <td class="px-4 py-3">
            <input type="number" name="quantite" class="w-full px-2 py-1 border border-gray-300 rounded text-center" 
                   value="${quantite}" min="1" onchange="updatePrestationTotal(this)">
        </td>
        <td class="px-4 py-3">
            <input type="number" name="prixUnitaire" class="w-full px-2 py-1 border border-gray-300 rounded text-center" 
                   value="${prixUnitaire}" step="0.01" onchange="updatePrestationTotal(this)">
        </td>
        <td class="px-4 py-3">
            <input type="number" name="total" class="w-full px-2 py-1 border border-gray-300 rounded text-center bg-gray-100" 
                   value="${total}" readonly>
        </td>
        <td class="px-4 py-3 text-center">
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
    const prixInput = row.querySelector('input[name="prixUnitaire"]');
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
    const prixUnitaire = parseFloat(row.querySelector('input[name="prixUnitaire"]').value) || 0;
    const totalInput = row.querySelector('input[name="total"]');

    totalInput.value = (quantite * prixUnitaire).toFixed(2);
}

// Gestion des champs verrouillés/déverrouillés
function setupLockToggle(fieldId) {
    const toggleBtn = document.getElementById(`toggle${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
    const input = document.getElementById(fieldId);
    const lock = document.getElementById(`${fieldId}Lock`);

    if (!toggleBtn || !input || !lock) return;

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

function updateDevisList() {
    document.getElementById('totalDevis').textContent = filteredDevis.length;

    const totalPages = Math.ceil(filteredDevis.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredDevis.length);

    document.getElementById('startRange').textContent = filteredDevis.length ? start + 1 : 0;
    document.getElementById('endRange').textContent = end;

    const currentPageDevis = filteredDevis.slice(start, end);

    renderDevisTable(currentPageDevis);
    createPagination(totalPages);
}

function renderDevisTable(devis) {
    const tableBody = document.getElementById('devisTableBody');
    const noDevis = document.getElementById('noDevis');

    tableBody.innerHTML = '';

    if (devis.length === 0) {
        noDevis.classList.remove('hidden');
        return;
    }

    noDevis.classList.add('hidden');

    devis.forEach(devis => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${devis.numero}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${devis.nomPatient}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatDate(devis.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${devis.montantTotal.toFixed(2)} DH</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${devis.mutuelle === 'oui' ? 'Oui' : 'Non'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-600 view-devis-btn" data-id="${devis.id}">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-green-600 print-devis-btn" data-id="${devis.id}">
                        <i class="ri-printer-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 edit-devis-btn" data-id="${devis.id}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-red-500 delete-devis-btn" data-id="${devis.id}">
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
            updateDevisList();
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
                updateDevisList();
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
            updateDevisList();
        });
    }

    paginationContainer.appendChild(nextBtn);
}

function addTableEventListeners() {
    // Boutons de visualisation
    document.querySelectorAll('.view-devis-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const devisId = this.dataset.id;
            await viewDevis(devisId);
        });
    });

    // Boutons d'impression
    document.querySelectorAll('.print-devis-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const devisId = this.dataset.id;
            await printDevisById(devisId);
        });
    });

    // Boutons d'édition
    document.querySelectorAll('.edit-devis-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const devisId = this.dataset.id;
            await editDevis(devisId);
        });
    });

    // Boutons de suppression
    document.querySelectorAll('.delete-devis-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const devisId = this.dataset.id;
            confirmDeleteDevis(devisId);
        });
    });
}

// Gestion du formulaire
function validateForm() {
    const nomPatient = document.getElementById('nomPatient').value.trim();
    const date = document.getElementById('dateDevis').value;
    const mutuelle = document.querySelector('input[name="mutuelle"]:checked');
    const prestations = document.querySelectorAll('#prestationsTable tr');

    let isValid = true;
    const errors = [];

    if (!nomPatient) {
        errors.push('Le nom du patient est obligatoire');
        document.getElementById('nomPatient').classList.add('border-red-500');
        isValid = false;
    } else {
        document.getElementById('nomPatient').classList.remove('border-red-500');
    }

    if (!date) {
        errors.push('La date est obligatoire');
        document.getElementById('dateDevis').classList.add('border-red-500');
        isValid = false;
    } else {
        document.getElementById('dateDevis').classList.remove('border-red-500');
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

async function saveDevis() {
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
            const prixUnitaire = parseFloat(row.querySelector('input[name="prixUnitaire"]').value);

            prestations.push({
                designation,
                quantite,
                prixUnitaire
            });
        });

        // Préparer les données du devis
        const devisData = {
            nomPatient: document.getElementById('nomPatient').value.trim(),
            date: document.getElementById('dateDevis').value,
            mutuelle: document.querySelector('input[name="mutuelle"]:checked').value,
            adresse: document.getElementById('adresse').value,
            gsm: document.getElementById('gsm').value,
            ice: document.getElementById('ice').value,
            prestations: prestations
        };

        // Ajouter le numéro si modifié
        const numDevis = document.getElementById('numDevis').value;
        if (numDevis && !document.getElementById('numDevis').readOnly) {
            devisData.numero = numDevis;
        }

        let savedDevis;
        if (currentDevisId) {
            savedDevis = await DevisAPI.update(currentDevisId, devisData);
            showNotification('success', 'Devis modifié avec succès!');
        } else {
            savedDevis = await DevisAPI.create(devisData);
            showNotification('success', 'Devis créé avec succès!');
        }

        // Recharger la liste et masquer le formulaire
        await loadDevis();
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
    const previewArea = document.getElementById('devisPreview');
    const previewBtn = document.getElementById('previewBtn');

    if (previewArea.classList.contains('show')) {
        // Fermer l'aperçu avec animation slide up
        previewArea.classList.add('closing');

        setTimeout(() => {
            previewArea.classList.remove('show');
            previewArea.classList.remove('closing');
            previewBtn.innerHTML = '<i class="ri-eye-line mr-2"></i> Aperçu du devis';
        }, 300);
    } else {
        if (!validateForm()) return;

        // Mettre à jour l'aperçu avec les valeurs du formulaire
        const numDevis = document.getElementById('numDevis').value;
        document.getElementById('preview-numDevis').textContent = numDevis.replace('DV-', '');

        const nomPatient = document.getElementById('nomPatient').value;
        document.getElementById('preview-nomPatient').textContent = nomPatient.toUpperCase();

        // Formater la date
        const dateInput = document.getElementById('dateDevis').value;
        const formattedDate = dateInput ? new Date(dateInput).toLocaleDateString('fr-FR') : '';
        document.getElementById('preview-dateDevis').textContent = formattedDate;

        document.getElementById('preview-adresse').textContent = document.getElementById('adresse').value;
        document.getElementById('preview-gsm').textContent = document.getElementById('gsm').value;
        document.getElementById('preview-ice').textContent = document.getElementById('ice').value;

        // Mettre à jour les prestations et calculer le total
        const prestationRows = document.querySelectorAll('#prestationsTable tr');
        const previewPrestations = document.getElementById('preview-prestations');
        previewPrestations.innerHTML = '';

        let total = 0;

        prestationRows.forEach(row => {
            const designation = row.querySelector('select[name="designation"]').value;
            const quantite = row.querySelector('input[name="quantite"]').value;
            const prixUnitaire = row.querySelector('input[name="prixUnitaire"]').value;
            const rowTotal = row.querySelector('input[name="total"]').value;

            total += parseFloat(rowTotal);

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="border border-gray-300 p-2">${designation}</td>
                <td class="border border-gray-300 p-2 text-center">${quantite}</td>
                <td class="border border-gray-300 p-2 text-center">${prixUnitaire} Dhs</td>
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
    const previewArea = document.getElementById('devisPreview');
    const previewBtn = document.getElementById('previewBtn');

    if (previewArea.classList.contains('show')) {
        previewArea.classList.add('closing');

        setTimeout(() => {
            previewArea.classList.remove('show');
            previewArea.classList.remove('closing');
            previewBtn.innerHTML = '<i class="ri-eye-line mr-2"></i> Aperçu du devis';
        }, 300);
    }
}

// Fonction pour créer le contenu HTML imprimable - CONFORME À LA MAQUETTE
function createPrintableContent(devis) {
    // Récupérer le chemin absolu de l'image depuis la page actuelle
    const baseUrl = window.location.origin;
    const imagePath = `${baseUrl}/images/Multi-Dys.jpg`;

    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Devis ${devis.numero || devis.numDevis}</title>
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
                <h1>DEVIS ${(devis.numero || devis.numDevis || '').replace('DV-', '')}</h1>
            </div>
            
            <div class="patient-info">
                <p class="patient-name">Nom: ${devis.nomPatient || ''}</p>
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
                        ${devis.prestations.map(p => `
                            <tr>
                                <td>${p.designation}</td>
                                <td class="text-center">${p.quantite}</td>
                                <td class="text-center">${p.prixUnitaire} Dhs</td>
                                <td class="text-center">${p.total || (p.quantite * p.prixUnitaire)} Dhs</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="3" class="text-right font-bold">Total</td>
                            <td class="text-center font-bold">${devis.montantTotal} Dhs</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="date-section">
                <p><strong>Fait le:</strong> ${formatDate(devis.date || devis.dateDevis)}</p>
            </div>
            
            <div class="footer-info">
                <p><strong>Adresse:</strong> ${devis.adresse}</p>
                <p><strong>GSM:</strong> ${devis.gsm}</p>
                <p><strong>ICE:</strong> ${devis.ice}</p>
            </div>
        </body>
        </html>
    `;
}

// Fonction d'impression améliorée avec iframe
function printDevis() {
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
        const prixUnitaire = parseFloat(row.querySelector('input[name="prixUnitaire"]').value);
        const total = quantite * prixUnitaire;

        prestations.push({
            designation,
            quantite,
            prixUnitaire,
            total
        });
        montantTotal += total;
    });

    const devisData = {
        numero: document.getElementById('numDevis').value,
        nomPatient: document.getElementById('nomPatient').value,
        date: document.getElementById('dateDevis').value,
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

    const printContent = createPrintableContent(devisData);

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

async function printDevisById(id) {
    try {
        const devis = await DevisAPI.getById(id);
        if (!devis) return;

        // Créer l'iframe pour l'impression
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.top = '-1000px';
        printFrame.style.left = '-1000px';
        printFrame.style.width = '1px';
        printFrame.style.height = '1px';
        printFrame.style.opacity = '0';
        document.body.appendChild(printFrame);

        const printContent = createPrintableContent(devis);

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
    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    document.getElementById('formSection').classList.add('hidden');
    hidePreview();
    resetFormData();
}

async function viewDevis(id) {
    try {
        const devis = await DevisAPI.getById(id);
        if (!devis) return;

        // Masquer le formulaire
        hideForm();

        // Remplir l'aperçu avec les données du devis
        document.getElementById('preview-numDevis').textContent = devis.numero.replace('DV-', '');
        document.getElementById('preview-nomPatient').textContent = devis.nomPatient.toUpperCase();
        document.getElementById('preview-dateDevis').textContent = formatDate(devis.date);
        document.getElementById('preview-adresse').textContent = devis.adresse;
        document.getElementById('preview-gsm').textContent = devis.gsm;
        document.getElementById('preview-ice').textContent = devis.ice;

        // Remplir les prestations
        const previewPrestations = document.getElementById('preview-prestations');
        previewPrestations.innerHTML = '';

        devis.prestations.forEach(prestation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border border-gray-300 p-2">${prestation.designation}</td>
                <td class="border border-gray-300 p-2 text-center">${prestation.quantite}</td>
                <td class="border border-gray-300 p-2 text-center">${prestation.prixUnitaire.toFixed(2)} Dhs</td>
                <td class="border border-gray-300 p-2 text-center">${prestation.total.toFixed(2)} Dhs</td>
            `;
            previewPrestations.appendChild(row);
        });

        document.getElementById('preview-total').textContent = `${devis.montantTotal.toFixed(2)} Dhs`;

        // Afficher l'aperçu
        const previewSection = document.getElementById('devisPreview');
        previewSection.classList.remove('hidden');
        previewSection.classList.add('show');
        previewSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Erreur lors de la visualisation:', error);
        showNotification('error', 'Erreur lors de la visualisation du devis');
    }
}

async function editDevis(id) {
    try {
        const devis = await DevisAPI.getById(id);
        if (!devis) return;

        currentDevisId = id;

        // Afficher le formulaire
        showForm();

        // Attendre que le formulaire soit affiché avant de le remplir
        setTimeout(async () => {
            // Générer et remplir le formulaire avec les données du devis
            await resetFormData();

            document.getElementById('numDevis').value = devis.numero;
            document.getElementById('nomPatient').value = devis.nomPatient;
            document.getElementById('dateDevis').value = devis.date;
            document.getElementById('adresse').value = devis.adresse;
            document.getElementById('gsm').value = devis.gsm;
            document.getElementById('ice').value = devis.ice;

            // Sélectionner la mutuelle
            const mutuelleRadio = document.querySelector(`input[name="mutuelle"][value="${devis.mutuelle}"]`);
            if (mutuelleRadio) mutuelleRadio.checked = true;

            // Remplir les prestations
            const tableBody = document.getElementById('prestationsTable');
            tableBody.innerHTML = '';

            devis.prestations.forEach(prestation => {
                addPrestation(prestation.designation, prestation.quantite, prestation.prixUnitaire);
            });
        }, 100);

    } catch (error) {
        console.error('Erreur lors de l\'édition:', error);
        showNotification('error', 'Erreur lors du chargement du devis');
    }
}

function confirmDeleteDevis(id) {
    devisToDelete = id;
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

async function deleteDevis() {
    if (!devisToDelete) return;

    try {
        await DevisAPI.delete(devisToDelete);
        showNotification('success', 'Devis supprimé avec succès!');
        await loadDevis();
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        devisToDelete = null;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('error', 'Erreur lors de la suppression');
    }
}

// Recherche
async function searchDevis() {
    const query = document.getElementById('searchInput').value.trim();

    if (query) {
        try {
            const results = await DevisAPI.search(query);
            // Appliquer les filtres aux résultats de recherche
            filteredDevis = results;
            applyAllFilters();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            filteredDevis = [];
            updateDevisList();
        }
    } else {
        applyAllFilters();
    }
}

// Réinitialisation des données du formulaire
async function resetFormData() {
    currentDevisId = null;

    // Générer un nouveau numéro de devis
    try {
        const nextNumber = await DevisAPI.getNextNumber();
        document.getElementById('numDevis').value = nextNumber;
    } catch (error) {
        document.getElementById('numDevis').value = 'DV-001';
    }

    // Réinitialiser les champs
    document.getElementById('nomPatient').value = '';
    document.getElementById('dateDevis').value = formatDateForAPI(new Date());
    document.querySelector('input[name="mutuelle"][value="non"]').checked = true;

    // Remettre les valeurs par défaut des champs du cabinet
    document.getElementById('adresse').value = 'Centre Multi-dys, Lot Perla N° 138, Bouskoura';
    document.getElementById('gsm').value = '06 49 60 26 47';
    document.getElementById('ice').value = '003663065000094';

    // Réinitialiser les prestations
    const tableBody = document.getElementById('prestationsTable');
    tableBody.innerHTML = '';
    addPrestation('Bilan psychomoteur (évaluation complète)');

    selectedDevis = null;
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
    console.log('🚀 Initialisation de la page devis...');

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
    await loadDevis();

    // 6. Configurer les event listeners
    setupEventListeners();

    console.log('✅ Initialisation terminée');
});

function setupEventListeners() {
    // ================================
    // FILTRES - Event Listeners
    // ================================

    // Filtres par mutuelle
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
                searchDevis();
            }, 300);
        });
    }

    // ================================
    // FORMULAIRE - Event Listeners
    // ================================

    // Gestion des champs verrouillés
    setupLockToggle('numDevis');
    setupLockToggle('adresse');
    setupLockToggle('gsm');
    setupLockToggle('ice');

    // Boutons du formulaire
    document.getElementById('addPrestationBtn').addEventListener('click', () => {
        addPrestation();
    });

    document.getElementById('saveBtn').addEventListener('click', saveDevis);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('printBtn').addEventListener('click', printDevis);
    document.getElementById('closePreviewBtn').addEventListener('click', hidePreview);

    // Nouveau devis
    document.getElementById('newDevisBtn').addEventListener('click', async () => {
        await resetFormData();
        showForm();
    });

    // Fermeture du formulaire
    document.getElementById('closeFormBtn').addEventListener('click', hideForm);

    // Modal de suppression
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        devisToDelete = null;
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteDevis);

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
}

// Fonctions globales pour les événements inline
window.updatePrestationPrix = updatePrestationPrix;
window.updatePrestationTotal = updatePrestationTotal;
window.removePrestation = removePrestation;