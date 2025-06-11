// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let currentFilter = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let filteredComptesRendus = [];
let selectedCompteRendu = null;
let allComptesRendus = [];
let allPatients = [];
let selectedTests = [];

// Classe pour gérer les appels API
class CompteRenduAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus`);
            if (!response.ok) throw new Error('Erreur lors du chargement des comptes rendus');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des comptes rendus');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/${id}`);
            if (!response.ok) throw new Error('Compte rendu introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async getByStatut(statut) {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/statut/${statut}`);
            if (!response.ok) throw new Error('Erreur lors du filtrage');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByStatut:', error);
            return [];
        }
    }

    static async search(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search:', error);
            return [];
        }
    }

    static async create(compteRenduData) {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(compteRenduData)
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

    static async update(id, compteRenduData) {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(compteRenduData)
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
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            return true;
        } catch (error) {
            console.error('Erreur API delete:', error);
            throw error;
        }
    }

    static async generateNumero() {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/generate-numero`);
            if (!response.ok) throw new Error('Erreur lors de la génération du numéro');
            const data = await response.json();
            return data.numero;
        } catch (error) {
            console.error('Erreur API generateNumero:', error);
            return 'CR-001';
        }
    }

    static async getTestsDisponibles() {
        try {
            const response = await fetch(`${API_BASE_URL}/comptes-rendus/tests-disponibles`);
            if (!response.ok) throw new Error('Erreur lors du chargement des tests');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getTestsDisponibles:', error);
            return [
                "GOODENOUGH",
                "SOMATOGNOSIE DE BERGES",
                "Piaget",
                "l'image de Rey",
                "la figure de Rey",
                "Naville",
                "rythme de Mira Stimbak",
                "graphisme BHK",
                "des cloches",
                "d'attention et de concentration de STROOP",
                "latéralité de BERGES",
                "Charlop-Atwell"
            ];
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

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${id}`);
            if (!response.ok) throw new Error('Patient introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById patient:', error);
            return null;
        }
    }
}

// Fonction pour remplir automatiquement les données du patient
function fillPatientData(searchInputId, patient) {
    console.log('🔄 Auto-remplissage des données patient:', patient);

    // Déterminer le préfixe selon le formulaire
    let prefix = '';
    if (searchInputId.includes('edit')) {
        prefix = 'edit';
    }

    // Fonction utilitaire pour obtenir l'ID des champs
    const getFieldId = (fieldName) => {
        if (prefix) {
            return `${prefix}${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
        }
        return fieldName;
    };

    // Remplir automatiquement le nom/prénom
    const nomPatientField = document.getElementById(getFieldId('nomPatient'));
    if (nomPatientField && nomPatientField.value.trim() === '') {
        nomPatientField.value = `${patient.prenom} ${patient.nom}`;
        console.log('✅ Nom/Prénom rempli automatiquement');
    }

    // Remplir automatiquement la date de naissance
    const dateNaissanceField = document.getElementById(getFieldId('dateNaissance'));
    if (dateNaissanceField && patient.dateNaissance) {
        dateNaissanceField.value = formatDateForInput(patient.dateNaissance);
        console.log('✅ Date de naissance remplie automatiquement:', patient.dateNaissance);
        dateNaissanceField.classList.remove('border-red-500');
    }

    showNotification('info', `Données du patient ${patient.prenom} ${patient.nom} chargées automatiquement`);
}

// Fonction pour effacer les données patient
function clearPatientFields(searchInputId) {
    console.log('🗑️ Effacement des données patient');

    let prefix = '';
    if (searchInputId.includes('edit')) {
        prefix = 'edit';
    }

    const getFieldId = (fieldName) => {
        if (prefix) {
            return `${prefix}${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
        }
        return fieldName;
    };

    // Effacer les champs auto-remplis
    const fieldsToMandatoryClear = ['nomPatient', 'dateNaissance'];

    fieldsToMandatoryClear.forEach(fieldName => {
        const field = document.getElementById(getFieldId(fieldName));
        if (field) {
            field.value = '';
            field.classList.remove('border-red-500');
            console.log(`✅ Champ ${fieldName} effacé`);
        }
    });
}

// Fonction utilitaire pour formater la date
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Utilitaires
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function getStatusClass(statut) {
    switch(statut) {
        case 'TERMINE': return 'status-termine';
        case 'EN_COURS': return 'status-en-cours';
        default: return 'status-en-cours'; // Par défaut en cours
    }
}

function getStatusLabel(statut) {
    switch(statut) {
        case 'TERMINE': return 'Terminé';
        case 'EN_COURS': return 'En cours';
        default: return 'En cours'; // Par défaut en cours
    }
}

function determineStatutAutomatique(compteRenduData) {
    // Champs obligatoires de base
    const champsObligatoires = [
        compteRenduData.nomPatient,
        compteRenduData.dateNaissance,
        compteRenduData.dateBilan,
        compteRenduData.niveauScolaire
    ];

    // Champs de contenu principaux
    const champsContenu = [
        compteRenduData.contenu?.presentation,
        compteRenduData.contenu?.anamnese,
        compteRenduData.contenu?.comportement,
        compteRenduData.contenu?.conclusion,
        compteRenduData.contenu?.projetTherapeutique
    ];

    // Champs de bilan
    const champsBilan = [
        compteRenduData.bilan?.schemaCorporel,
        compteRenduData.bilan?.espace,
        compteRenduData.bilan?.tempsRythmes,
        compteRenduData.bilan?.lateralite,
        compteRenduData.bilan?.graphisme,
        compteRenduData.bilan?.fonctionCognitive,
        compteRenduData.bilan?.equipementMoteur
    ];

    // Vérifier si tous les champs obligatoires sont remplis
    const champsObligatoiresRemplis = champsObligatoires.every(champ =>
        champ && champ.toString().trim() !== ''
    );

    // Vérifier si au moins la moitié des champs de contenu sont remplis
    const champsContenuRemplis = champsContenu.filter(champ =>
        champ && champ.toString().trim() !== ''
    ).length;

    // Vérifier si au moins la moitié des champs de bilan sont remplis
    const champsBilanRemplis = champsBilan.filter(champ =>
        champ && champ.toString().trim() !== ''
    ).length;

    // Critères pour "TERMINE":
    // - Tous les champs obligatoires remplis
    // - Au moins 3 champs de contenu remplis sur 5
    // - Au moins 4 champs de bilan remplis sur 7
    if (champsObligatoiresRemplis &&
        champsContenuRemplis >= 3 &&
        champsBilanRemplis >= 4) {
        return 'TERMINE';
    }

    // Sinon, statut "EN_COURS"
    return 'EN_COURS';
}

// Gestion des comptes rendus
async function loadComptesRendus() {
    try {
        allComptesRendus = await CompteRenduAPI.getAll();
        await filterComptesRendus();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des comptes rendus');
    }
}

async function filterComptesRendus() {
    try {
        if (currentFilter === 'all') {
            filteredComptesRendus = [...allComptesRendus];
        } else {
            filteredComptesRendus = await CompteRenduAPI.getByStatut(currentFilter);
        }

        const searchTerm = document.getElementById('searchInput').value.trim();
        if (searchTerm) {
            filteredComptesRendus = await CompteRenduAPI.search(searchTerm);
            if (currentFilter !== 'all') {
                filteredComptesRendus = filteredComptesRendus.filter(cr => cr.statut === currentFilter);
            }
        }

        updateComptesRendusList();
    } catch (error) {
        console.error('Erreur lors du filtrage:', error);
        showNotification('error', 'Erreur lors du filtrage');
    }
}

function updateComptesRendusList() {
    document.getElementById('totalComptesRendus').textContent = filteredComptesRendus.length;

    const totalPages = Math.ceil(filteredComptesRendus.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredComptesRendus.length);

    document.getElementById('startRange').textContent = filteredComptesRendus.length ? start + 1 : 0;
    document.getElementById('endRange').textContent = end;

    const currentPageComptesRendus = filteredComptesRendus.slice(start, end);

    renderTableView(currentPageComptesRendus);
    createPagination(totalPages);
}

function renderTableView(comptesRendus) {
    const tableBody = document.getElementById('comptesRendusTableBody');
    tableBody.innerHTML = '';

    if (comptesRendus.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                Aucun compte rendu trouvé
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    comptesRendus.forEach((compteRendu) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        const statusClass = getStatusClass(compteRendu.statut);
        const statusLabel = getStatusLabel(compteRendu.statut);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${compteRendu.numCompteRendu}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${compteRendu.nomPatient}</div>
                <div class="text-xs text-gray-500">ID: ${compteRendu.id}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${formatDate(compteRendu.dateBilan)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${compteRendu.niveauScolaire || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-blue-500 view-compte-rendu-btn" data-id="${compteRendu.id}">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 edit-compte-rendu-btn" data-id="${compteRendu.id}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-red-500 delete-compte-rendu-btn" data-id="${compteRendu.id}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    addButtonEventListeners();
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
            updateComptesRendusList();
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
                updateComptesRendusList();
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
            updateComptesRendusList();
        });
    }

    paginationContainer.appendChild(nextBtn);
}

function addButtonEventListeners() {
    document.querySelectorAll('.view-compte-rendu-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            const compteRendu = await CompteRenduAPI.getById(compteRenduId);

            if (compteRendu) {
                openViewModal(compteRendu);
            }
        });
    });

    document.querySelectorAll('.edit-compte-rendu-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            const compteRendu = await CompteRenduAPI.getById(compteRenduId);

            if (compteRendu) {
                openEditModal(compteRendu);
            }
        });
    });

    document.querySelectorAll('.delete-compte-rendu-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            const compteRendu = await CompteRenduAPI.getById(compteRenduId);

            if (compteRendu) {
                selectedCompteRendu = compteRendu;
                document.getElementById('deleteConfirmModal').classList.remove('hidden');
            }
        });
    });
}

// Gestion des patients
async function loadPatients() {
    try {
        allPatients = await PatientAPI.getAll();
    } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
    }
}

function initPatientSearch(searchInputId, optionsContainerId, hiddenInputId, clearBtnId) {
    console.log('🔧 Initialisation recherche patient:', { searchInputId, optionsContainerId, hiddenInputId, clearBtnId });

    const searchInput = document.getElementById(searchInputId);
    const optionsContainer = document.getElementById(optionsContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const clearBtn = document.getElementById(clearBtnId);

    if (!searchInput || !optionsContainer || !hiddenInput || !clearBtn) {
        console.error('❌ Éléments manquants pour la recherche patient:', {
            searchInput: searchInput ? '✅' : '❌',
            optionsContainer: optionsContainer ? '✅' : '❌',
            hiddenInput: hiddenInput ? '✅' : '❌',
            clearBtn: clearBtn ? '✅' : '❌'
        });
        return;
    }

    // Event listener: Focus -> afficher options
    searchInput.addEventListener('focus', function() {
        optionsContainer.style.display = 'block';
        filterPatients(searchInputId, optionsContainerId);
    });

    // Event listener: Clic ailleurs -> cacher options
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !optionsContainer.contains(e.target)) {
            optionsContainer.style.display = 'none';
        }
    });

    // Event listener: Saisie -> filtrer
    searchInput.addEventListener('input', function() {
        filterPatients(searchInputId, optionsContainerId);

        if (searchInput.value.trim() !== '') {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    });

    // ✅ Event listener: Bouton Clear
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('🗑️ Clic sur clear button');

        searchInput.value = '';
        hiddenInput.value = '';
        clearBtn.style.display = 'none';

        // ✅ EFFACER LES CHAMPS AUTO-REMPLIS
        clearPatientFields(searchInputId);

        filterPatients(searchInputId, optionsContainerId);
    });

    // ✅ Event listener: Sélection d'un patient
    optionsContainer.addEventListener('click', function(e) {
        const option = e.target.closest('.patient-search-option');
        if (option) {
            const patientId = option.dataset.patientId;
            const patient = allPatients.find(p => p.id == patientId);

            if (patient) {
                console.log('✅ Patient sélectionné:', patient);

                // Remplir les champs de recherche
                searchInput.value = `${patient.prenom} ${patient.nom}`;
                hiddenInput.value = patientId;
                optionsContainer.style.display = 'none';
                clearBtn.style.display = 'block';

                // ✅ AUTO-REMPLIR LES AUTRES CHAMPS
                updatePatientFields(searchInputId, patient);

                // Déclencher l'événement change
                const event = new Event('change');
                hiddenInput.dispatchEvent(event);
            }
        }
    });

    console.log('✅ Recherche patient initialisée avec succès');
}

async function filterPatients(searchInputId, optionsContainerId) {
    const searchInput = document.getElementById(searchInputId);
    const optionsContainer = document.getElementById(optionsContainerId);
    const searchTerm = searchInput.value.toLowerCase();

    optionsContainer.innerHTML = '';

    let patientsToShow = [];

    if (searchTerm.length >= 2) {
        try {
            patientsToShow = await PatientAPI.search(searchTerm);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            patientsToShow = allPatients.filter(patient =>
                patient.prenom.toLowerCase().includes(searchTerm) ||
                patient.nom.toLowerCase().includes(searchTerm)
            );
        }
    } else if (searchTerm.length === 0) {
        patientsToShow = allPatients.slice(0, 10);
    }

    patientsToShow.forEach(patient => {
        const option = document.createElement('div');
        option.className = 'patient-search-option';
        option.dataset.patientId = patient.id;
        option.innerHTML = `
            <div class="font-medium">${patient.prenom} ${patient.nom}</div>
            <div class="text-xs text-gray-500">${patient.pathologie || 'Aucune pathologie'} - ${patient.dateNaissance ? formatDate(patient.dateNaissance) : 'Date inconnue'}</div>
        `;
        optionsContainer.appendChild(option);
    });

    if (patientsToShow.length === 0 && searchTerm.length >= 2) {
        const noResult = document.createElement('div');
        noResult.className = 'patient-search-option text-gray-500';
        noResult.textContent = 'Aucun patient trouvé';
        optionsContainer.appendChild(noResult);
    }
}

function updatePatientFields(searchInputId, patient) {
    console.log('🔄 Auto-remplissage des données patient:', patient);
    console.log('🔍 SearchInputId:', searchInputId);

    // Déterminer le préfixe selon le formulaire
    let prefix = '';
    if (searchInputId.includes('edit')) {
        prefix = 'edit';
    }

    // ✅ MÉTHODE 1: Essayer avec le préfixe standard
    let nomPatientField = document.getElementById(prefix ? `${prefix}NomPatient` : 'nomPatient');
    let dateNaissanceField = document.getElementById(prefix ? `${prefix}DateNaissance` : 'dateNaissance');

    // ✅ MÉTHODE 2: Si pas trouvé, essayer sans préfixe (pour certains formulaires)
    if (!nomPatientField) {
        nomPatientField = document.getElementById('nomPatient');
        console.log('🔍 Tentative sans préfixe pour nomPatient');
    }
    if (!dateNaissanceField) {
        dateNaissanceField = document.getElementById('dateNaissance');
        console.log('🔍 Tentative sans préfixe pour dateNaissance');
    }

    // ✅ DEBUG: Vérifier quels champs existent
    console.log('🔍 Champs trouvés:', {
        nomPatient: nomPatientField ? '✅' : '❌',
        dateNaissance: dateNaissanceField ? '✅' : '❌'
    });

    // ✅ REMPLIR LE NOM/PRÉNOM si le champ existe et est vide
    if (nomPatientField) {
        if (nomPatientField.value.trim() === '') {
            nomPatientField.value = `${patient.prenom} ${patient.nom}`;
            console.log('✅ Nom/Prénom rempli automatiquement:', nomPatientField.value);
        } else {
            console.log('⚠️ Champ nomPatient déjà rempli, pas de modification');
        }
    } else {
        console.error('❌ Champ nomPatient introuvable');
    }

    // ✅ REMPLIR LA DATE DE NAISSANCE si le champ existe
    if (dateNaissanceField && patient.dateNaissance) {
        const formattedDate = formatDateForInput(patient.dateNaissance);
        dateNaissanceField.value = formattedDate;
        dateNaissanceField.classList.remove('border-red-500'); // Supprimer erreurs
        console.log('✅ Date de naissance remplie automatiquement:', formattedDate);
    } else if (!dateNaissanceField) {
        console.error('❌ Champ dateNaissance introuvable');
    } else {
        console.warn('⚠️ Pas de date de naissance pour ce patient');
    }

    // ✅ NOTIFICATION DE SUCCÈS
    if (nomPatientField || dateNaissanceField) {
        showNotification('info', `Données du patient ${patient.prenom} ${patient.nom} chargées automatiquement`);
    }
}

function initializeDateBilan() {
    console.log('📅 Initialisation de la date du bilan');

    // Définir la date du bilan à aujourd'hui pour le nouveau formulaire
    const dateBilanField = document.getElementById('dateBilan');
    if (dateBilanField && !dateBilanField.value) {
        const today = new Date();
        dateBilanField.value = today.toISOString().split('T')[0];
        console.log('✅ Date du bilan initialisée à:', dateBilanField.value);
    }
}

function clearPatientFields(searchInputId) {
    console.log('🗑️ Effacement des données patient pour:', searchInputId);

    // Déterminer le préfixe
    let prefix = '';
    if (searchInputId.includes('edit')) {
        prefix = 'edit';
    }

    // Essayer de trouver les champs avec et sans préfixe
    const fieldsToTry = [
        { id: prefix ? `${prefix}NomPatient` : 'nomPatient', fallback: 'nomPatient' },
        { id: prefix ? `${prefix}DateNaissance` : 'dateNaissance', fallback: 'dateNaissance' }
    ];

    fieldsToTry.forEach(fieldConfig => {
        let field = document.getElementById(fieldConfig.id);

        // Si pas trouvé avec préfixe, essayer sans
        if (!field && fieldConfig.fallback) {
            field = document.getElementById(fieldConfig.fallback);
        }

        if (field) {
            field.value = '';
            field.classList.remove('border-red-500');
            console.log(`✅ Champ ${fieldConfig.id} effacé`);
        } else {
            console.warn(`⚠️ Champ ${fieldConfig.id} non trouvé pour effacement`);
        }
    });
}

// Gestion des sections du formulaire
function toggleSection(sectionName) {
    const section = document.getElementById('section-' + sectionName);
    const arrow = document.getElementById('arrow-' + sectionName);

    if (!section || !arrow) return;

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        arrow.classList.remove('ri-arrow-down-s-line');
        arrow.classList.add('ri-arrow-up-s-line');
    } else {
        section.classList.add('hidden');
        arrow.classList.remove('ri-arrow-up-s-line');
        arrow.classList.add('ri-arrow-down-s-line');
    }
}

// Gestion des tests
function initTestsCheckboxes() {
    document.querySelectorAll('.custom-checkbox[data-test]').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            const testName = this.dataset.test;

            if (this.classList.contains('checked')) {
                this.classList.remove('checked');
                selectedTests = selectedTests.filter(test => test !== testName);
            } else {
                this.classList.add('checked');
                if (!selectedTests.includes(testName)) {
                    selectedTests.push(testName);
                }
            }
        });
    });
}

// Validation
function validateCompteRenduForm() {
    const requiredFields = ['nomPatient', 'dateNaissance', 'dateBilan', 'niveauScolaire'];
    let valid = true;
    let hasEmptyFields = false;

    requiredFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input && (!input.value || input.value.trim() === '')) {
            input.classList.add('border-red-500');
            valid = false;
            hasEmptyFields = true;
        } else if (input) {
            input.classList.remove('border-red-500');
        }
    });

    // Validation date de naissance
    const dateNaissanceInput = document.getElementById('dateNaissance');
    const dateBilanInput = document.getElementById('dateBilan');

    if (dateNaissanceInput && dateBilanInput && dateNaissanceInput.value && dateBilanInput.value) {
        const dateNaissance = new Date(dateNaissanceInput.value);
        const dateBilan = new Date(dateBilanInput.value);
        const today = new Date();

        if (dateNaissance > today) {
            dateNaissanceInput.classList.add('border-red-500');
            valid = false;
            showNotification('error', 'La date de naissance ne peut pas être dans le futur.');
        } else if (dateNaissance > dateBilan) {
            dateNaissanceInput.classList.add('border-red-500');
            dateBilanInput.classList.add('border-red-500');
            valid = false;
            showNotification('error', 'La date de naissance ne peut pas être postérieure à la date du bilan.');
        }
    }

    if (!valid && hasEmptyFields) {
        showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
    }

    return valid;
}

// CRUD Operations
async function saveNewCompteRendu() {
    if (!validateCompteRenduForm()) return;

    const compteRenduData = {
        numCompteRendu: document.getElementById('numCompteRendu').value,
        nomPatient: document.getElementById('nomPatient').value.trim(),
        dateNaissance: document.getElementById('dateNaissance').value,
        dateBilan: document.getElementById('dateBilan').value,
        niveauScolaire: document.getElementById('niveauScolaire').value.trim(),
        observations: document.getElementById('observations').value.trim(),
        testsUtilises: [...selectedTests],
        contenu: {
            presentation: document.getElementById('presentation').value.trim(),
            anamnese: document.getElementById('anamnese').value.trim(),
            comportement: document.getElementById('comportement').value.trim(),
            conclusion: document.getElementById('conclusion').value.trim(),
            projetTherapeutique: document.getElementById('projetTherapeutique').value.trim()
        },
        bilan: {
            schemaCorporel: document.getElementById('schemaCorporel').value.trim(),
            espace: document.getElementById('espace').value.trim(),
            tempsRythmes: document.getElementById('tempsRythmes').value.trim(),
            lateralite: document.getElementById('lateralite').value.trim(),
            graphisme: document.getElementById('graphisme').value.trim(),
            fonctionCognitive: document.getElementById('fonctionCognitive').value.trim(),
            equipementMoteur: document.getElementById('equipementMoteur').value.trim()
        }
    };

    // Déterminer automatiquement le statut
    compteRenduData.statut = determineStatutAutomatique(compteRenduData);

    // Associer le patient si sélectionné
    const patientId = document.getElementById('patientId').value;
    if (patientId) {
        compteRenduData.patient = { id: parseInt(patientId) };
    }

    try {
        const result = await CompteRenduAPI.create(compteRenduData);
        document.getElementById('newCompteRenduModal').classList.add('hidden');

        // Message personnalisé selon le statut
        const statusMessage = compteRenduData.statut === 'TERMINE'
            ? 'Compte rendu créé et marqué comme terminé !'
            : 'Compte rendu créé en cours de rédaction.';

        showNotification('success', statusMessage);
        await loadComptesRendus();
        resetNewForm();
    } catch (error) {
        showNotification('error', error.message || 'Erreur lors de la création du compte rendu');
    }
}

async function saveEditedCompteRendu() {
    if (!validateEditForm()) return;

    const compteRenduId = document.getElementById('editCompteRenduId').value;

    const compteRenduData = {
        numCompteRendu: document.getElementById('editNumCompteRendu').value,
        nomPatient: document.getElementById('editNomPatient').value.trim(),
        dateNaissance: document.getElementById('editDateNaissance').value,
        dateBilan: document.getElementById('editDateBilan').value,
        niveauScolaire: document.getElementById('editNiveauScolaire').value.trim(),
        observations: document.getElementById('editObservations').value.trim(),
        testsUtilises: [...selectedTests],
        contenu: {
            presentation: document.getElementById('editPresentation').value.trim(),
            anamnese: document.getElementById('editAnamnese').value.trim(),
            comportement: document.getElementById('editComportement').value.trim(),
            conclusion: document.getElementById('editConclusion').value.trim(),
            projetTherapeutique: document.getElementById('editProjetTherapeutique').value.trim()
        },
        bilan: {
            schemaCorporel: document.getElementById('editSchemaCorporel').value.trim(),
            espace: document.getElementById('editEspace').value.trim(),
            tempsRythmes: document.getElementById('editTempsRythmes').value.trim(),
            lateralite: document.getElementById('editLateralite').value.trim(),
            graphisme: document.getElementById('editGraphisme').value.trim(),
            fonctionCognitive: document.getElementById('editFonctionCognitive').value.trim(),
            equipementMoteur: document.getElementById('editEquipementMoteur').value.trim()
        }
    };

    // Vérifier si l'utilisateur a modifié manuellement le statut
    const statutActuel = document.getElementById('editStatut').value;
    const statutAutomatique = determineStatutAutomatique(compteRenduData);

    // Si le statut actuel est différent du statut automatique, garder le choix de l'utilisateur
    // Sinon, utiliser le statut automatique
    compteRenduData.statut = statutActuel !== statutAutomatique ? statutActuel : statutAutomatique;

    // Associer le patient si sélectionné
    const patientId = document.getElementById('editPatientId').value;
    if (patientId) {
        compteRenduData.patient = { id: parseInt(patientId) };
    }

    try {
        await CompteRenduAPI.update(compteRenduId, compteRenduData);
        document.getElementById('editCompteRenduModal').classList.add('hidden');

        // Message personnalisé selon le statut
        const statusMessage = compteRenduData.statut === 'TERMINE'
            ? 'Compte rendu modifié et marqué comme terminé !'
            : 'Compte rendu modifié (en cours).';

        showNotification('success', statusMessage);
        await loadComptesRendus();
    } catch (error) {
        showNotification('error', error.message || 'Erreur lors de la modification du compte rendu');
    }
}

function validateEditForm() {
    const requiredFields = ['editNomPatient', 'editDateNaissance', 'editDateBilan', 'editNiveauScolaire'];
    let valid = true;

    requiredFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input && (!input.value || input.value.trim() === '')) {
            input.classList.add('border-red-500');
            valid = false;
        } else if (input) {
            input.classList.remove('border-red-500');
        }
    });

    if (!valid) {
        showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
    }

    return valid;
}

async function deleteCompteRendu() {
    if (!selectedCompteRendu) return;

    try {
        await CompteRenduAPI.delete(selectedCompteRendu.id);
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        showNotification('success', 'Compte rendu supprimé avec succès!');
        await loadComptesRendus();
        selectedCompteRendu = null;
    } catch (error) {
        showNotification('error', 'Erreur lors de la suppression du compte rendu');
    }
}

// Modals
async function openNewModal() {
    try {
        const numero = await CompteRenduAPI.generateNumero();
        document.getElementById('numCompteRendu').value = numero;

        // ✅ CORRECTION: Initialiser la date du bilan à aujourd'hui
        initializeDateBilan();

        resetNewForm();
        document.getElementById('newCompteRenduModal').classList.remove('hidden');
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du modal:', error);
        showNotification('error', 'Erreur lors de l\'initialisation du formulaire');
    }
}

function openEditModal(compteRendu) {
    // Créer le formulaire d'édition en copiant le formulaire de création
    copyFormToEdit();

    // Remplir le formulaire avec les données du compte rendu
    document.getElementById('editCompteRenduId').value = compteRendu.id;
    document.getElementById('editNumCompteRendu').value = compteRendu.numCompteRendu;
    document.getElementById('editNomPatient').value = compteRendu.nomPatient;
    document.getElementById('editDateNaissance').value = compteRendu.dateNaissance;
    document.getElementById('editDateBilan').value = compteRendu.dateBilan;
    document.getElementById('editNiveauScolaire').value = compteRendu.niveauScolaire;
    document.getElementById('editStatut').value = compteRendu.statut;
    document.getElementById('editObservations').value = compteRendu.observations || '';

    // Remplir les champs du patient si associé
    if (compteRendu.patient) {
        document.getElementById('editPatientSearch').value = compteRendu.patient.prenom + ' ' + compteRendu.patient.nom;
        document.getElementById('editPatientId').value = compteRendu.patient.id;
        document.getElementById('editPatientClear').style.display = 'block';
    }

    // Remplir les tests utilisés
    selectedTests = compteRendu.testsUtilises || [];
    updateTestsCheckboxes('edit');

    // Remplir le contenu
    if (compteRendu.contenu) {
        document.getElementById('editPresentation').value = compteRendu.contenu.presentation || '';
        document.getElementById('editAnamnese').value = compteRendu.contenu.anamnese || '';
        document.getElementById('editComportement').value = compteRendu.contenu.comportement || '';
        document.getElementById('editConclusion').value = compteRendu.contenu.conclusion || '';
        document.getElementById('editProjetTherapeutique').value = compteRendu.contenu.projetTherapeutique || '';
    }

    // Remplir le bilan
    if (compteRendu.bilan) {
        document.getElementById('editSchemaCorporel').value = compteRendu.bilan.schemaCorporel || '';
        document.getElementById('editEspace').value = compteRendu.bilan.espace || '';
        document.getElementById('editTempsRythmes').value = compteRendu.bilan.tempsRythmes || '';
        document.getElementById('editLateralite').value = compteRendu.bilan.lateralite || '';
        document.getElementById('editGraphisme').value = compteRendu.bilan.graphisme || '';
        document.getElementById('editFonctionCognitive').value = compteRendu.bilan.fonctionCognitive || '';
        document.getElementById('editEquipementMoteur').value = compteRendu.bilan.equipementMoteur || '';
    }

    // Mettre à jour le numéro dans le header
    document.getElementById('editCompteRenduNumber').textContent = compteRendu.numCompteRendu;

    document.getElementById('editCompteRenduModal').classList.remove('hidden');
}

function openViewModal(compteRendu) {
    // Mettre à jour le header
    document.getElementById('viewCompteRenduNumber').textContent = compteRendu.numCompteRendu;
    document.getElementById('viewCompteRenduStatut').className = `status-badge ${getStatusClass(compteRendu.statut)}`;
    document.getElementById('viewCompteRenduStatut').textContent = getStatusLabel(compteRendu.statut);

    // Stocker l'ID pour l'édition depuis la vue
    document.getElementById('editFromViewBtn').dataset.id = compteRendu.id;

    // Générer le contenu de visualisation
    const viewContent = document.getElementById('viewCompteRenduContent');
    viewContent.innerHTML = generateViewContent(compteRendu);

    document.getElementById('viewCompteRenduModal').classList.remove('hidden');
}

function generateViewContent(compteRendu) {
    let content = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <h4 class="font-medium text-gray-700 mb-2">Informations générales</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div><span class="font-medium">Numéro:</span> ${compteRendu.numCompteRendu}</div>
                    <div><span class="font-medium">Patient:</span> ${compteRendu.nomPatient}</div>
                    <div><span class="font-medium">Date de naissance:</span> ${formatDate(compteRendu.dateNaissance)}</div>
                    <div><span class="font-medium">Date du bilan:</span> ${formatDate(compteRendu.dateBilan)}</div>
                    <div><span class="font-medium">Niveau scolaire:</span> ${compteRendu.niveauScolaire}</div>
                </div>
            </div>
            <div>
                <h4 class="font-medium text-gray-700 mb-2">Tests utilisés</h4>
                <div class="bg-gray-50 rounded-lg p-4">
    `;

    if (compteRendu.testsUtilises && compteRendu.testsUtilises.length > 0) {
        content += '<div class="flex flex-wrap gap-2">';
        compteRendu.testsUtilises.forEach(test => {
            content += `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${test}</span>`;
        });
        content += '</div>';
    } else {
        content += '<div class="text-gray-500 text-sm">Aucun test spécifié</div>';
    }

    content += `
                </div>
            </div>
        </div>
    `;

    // Sections du contenu
    const sections = [
        { key: 'presentation', title: 'Présentation', content: compteRendu.contenu?.presentation },
        { key: 'anamnese', title: 'Anamnèse', content: compteRendu.contenu?.anamnese },
        { key: 'comportement', title: 'Comportement', content: compteRendu.contenu?.comportement },
        { key: 'conclusion', title: 'Conclusion', content: compteRendu.contenu?.conclusion },
        { key: 'projetTherapeutique', title: 'Projet thérapeutique', content: compteRendu.contenu?.projetTherapeutique }
    ];

    sections.forEach(section => {
        if (section.content && section.content.trim()) {
            content += `
                <div class="mb-6">
                    <h4 class="font-medium text-gray-700 mb-2">${section.title}</h4>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-700 whitespace-pre-wrap">${section.content}</p>
                    </div>
                </div>
            `;
        }
    });

    // Bilan psychomoteur
    if (compteRendu.bilan) {
        const bilanItems = [
            { key: 'schemaCorporel', title: 'Schéma corporel', content: compteRendu.bilan.schemaCorporel },
            { key: 'espace', title: 'Espace', content: compteRendu.bilan.espace },
            { key: 'tempsRythmes', title: 'Temps et rythmes', content: compteRendu.bilan.tempsRythmes },
            { key: 'lateralite', title: 'Latéralité', content: compteRendu.bilan.lateralite },
            { key: 'graphisme', title: 'Graphisme', content: compteRendu.bilan.graphisme },
            { key: 'fonctionCognitive', title: 'Fonction cognitive', content: compteRendu.bilan.fonctionCognitive },
            { key: 'equipementMoteur', title: 'Équipement moteur', content: compteRendu.bilan.equipementMoteur }
        ];

        const hasAnyBilanContent = bilanItems.some(item => item.content && item.content.trim());

        if (hasAnyBilanContent) {
            content += `
                <div class="mb-6">
                    <h4 class="font-medium text-gray-700 mb-2">Bilan Psychomoteur</h4>
                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            `;

            bilanItems.forEach(item => {
                if (item.content && item.content.trim()) {
                    content += `
                        <div>
                            <span class="font-medium text-sm text-gray-600">${item.title}:</span>
                            <p class="text-sm text-gray-700 mt-1 whitespace-pre-wrap">${item.content}</p>
                        </div>
                    `;
                }
            });

            content += `
                    </div>
                </div>
            `;
        }
    }

    // Observations
    if (compteRendu.observations && compteRendu.observations.trim()) {
        content += `
            <div class="mb-6">
                <h4 class="font-medium text-gray-700 mb-2">Observations</h4>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">${compteRendu.observations}</p>
                </div>
            </div>
        `;
    }

    return content;
}

function copyFormToEdit() {
    const editContainer = document.getElementById('editCompteRenduFormContainer');
    const originalForm = document.getElementById('newCompteRenduForm');

    // Cloner le formulaire
    const clonedForm = originalForm.cloneNode(true);
    clonedForm.id = 'editCompteRenduForm';

    // Changer tous les IDs et names pour l'édition
    updateFormIds(clonedForm, 'edit');

    // Ajouter un champ caché pour l'ID
    const hiddenId = document.createElement('input');
    hiddenId.type = 'hidden';
    hiddenId.id = 'editCompteRenduId';
    clonedForm.appendChild(hiddenId);

    editContainer.innerHTML = '';
    editContainer.appendChild(clonedForm);

    // Réinitialiser les event listeners pour le formulaire d'édition
    initEditFormEventListeners();
}

function updateFormIds(element, prefix) {
    // Mettre à jour l'ID et le name de l'élément
    if (element.id) {
        element.id = prefix + element.id.charAt(0).toUpperCase() + element.id.slice(1);
    }
    if (element.name) {
        element.name = prefix + element.name.charAt(0).toUpperCase() + element.name.slice(1);
    }

    // Mettre à jour les attributs for des labels
    if (element.tagName === 'LABEL' && element.getAttribute('for')) {
        const forAttr = element.getAttribute('for');
        element.setAttribute('for', prefix + forAttr.charAt(0).toUpperCase() + forAttr.slice(1));
    }

    // Mettre à jour les attributs onclick pour les fonctions toggleSection
    if (element.getAttribute('onclick')) {
        const onclick = element.getAttribute('onclick');
        if (onclick.includes('toggleSection')) {
            element.setAttribute('onclick', onclick.replace('toggleSection', 'toggleEditSection'));
        }
    }

    // Récursivement pour tous les enfants
    for (let child of element.children) {
        updateFormIds(child, prefix);
    }
}

function initEditFormEventListeners() {
    // Réinitialiser les event listeners pour les checkboxes de tests
    document.querySelectorAll('#editCompteRenduForm .custom-checkbox[data-test]').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            const testName = this.dataset.test;

            if (this.classList.contains('checked')) {
                this.classList.remove('checked');
                selectedTests = selectedTests.filter(test => test !== testName);
            } else {
                this.classList.add('checked');
                if (!selectedTests.includes(testName)) {
                    selectedTests.push(testName);
                }
            }
        });
    });

    setTimeout(() => {
        initPatientSearch('editPatientSearch', 'editPatientOptions', 'editPatientId', 'editPatientClear');
        console.log('✅ Recherche patient réinitialisée pour l\'édition');
    }, 200);

}

function toggleEditSection(sectionName) {
    const section = document.getElementById('editSection-' + sectionName);
    const arrow = document.getElementById('editArrow-' + sectionName);

    if (!section || !arrow) return;

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        arrow.classList.remove('ri-arrow-down-s-line');
        arrow.classList.add('ri-arrow-up-s-line');
    } else {
        section.classList.add('hidden');
        arrow.classList.remove('ri-arrow-up-s-line');
        arrow.classList.add('ri-arrow-down-s-line');
    }
}

function updateTestsCheckboxes(prefix = '') {
    const formPrefix = prefix ? prefix : '';
    const selector = formPrefix ? `#${formPrefix}CompteRenduForm .custom-checkbox[data-test]` : '.custom-checkbox[data-test]';

    document.querySelectorAll(selector).forEach(checkbox => {
        const testName = checkbox.dataset.test;
        if (selectedTests.includes(testName)) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    });
}

function resetNewForm() {
    // Réinitialiser tous les champs du formulaire
    document.getElementById('newCompteRenduForm').reset();

    setTimeout(() => {
        initializeDateBilan();
    }, 100);

    // Réinitialiser la recherche patient
    document.getElementById('patientSearch').value = '';
    document.getElementById('patientId').value = '';
    document.getElementById('patientClear').style.display = 'none';

    // Réinitialiser les tests sélectionnés
    selectedTests = [];
    document.querySelectorAll('.custom-checkbox[data-test]').forEach(checkbox => {
        checkbox.classList.remove('checked');
    });

    // Fermer toutes les sections
    const sections = ['tests', 'presentation', 'anamnese', 'comportement', 'bilan', 'conclusion', 'projetTherapeutique'];
    sections.forEach(section => {
        const sectionElement = document.getElementById('section-' + section);
        const arrow = document.getElementById('arrow-' + section);

        if (sectionElement && !sectionElement.classList.contains('hidden')) {
            sectionElement.classList.add('hidden');
        }
        if (arrow) {
            arrow.classList.remove('ri-arrow-up-s-line');
            arrow.classList.add('ri-arrow-down-s-line');
        }
    });

    // Supprimer les classes d'erreur
    document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
    });
}

// Impression
function printCompteRendu(compteRendu) {
    const printContent = generatePrintContent(compteRendu);

    // Créer une iframe pour l'impression
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printContent);
    frameDoc.close();

    printFrame.onload = function() {
        try {
            printFrame.contentWindow.focus();
            setTimeout(() => {
                printFrame.contentWindow.print();
                setTimeout(() => {
                    if (printFrame && printFrame.parentNode) {
                        printFrame.parentNode.removeChild(printFrame);
                    }
                }, 1000);
            }, 200);
        } catch (error) {
            console.error('Erreur lors de l\'impression:', error);
            showNotification('error', 'Erreur lors de l\'impression');
            if (printFrame && printFrame.parentNode) {
                printFrame.parentNode.removeChild(printFrame);
            }
        }
    };
}

function generatePrintContent(compteRendu) {
    const testsHtml = compteRendu.testsUtilises && compteRendu.testsUtilises.length > 0
        ? compteRendu.testsUtilises.map(test => `<div class="test-item">${test}</div>`).join('')
        : '<div class="text-muted">Aucun test spécifié</div>';

    return `<!DOCTYPE html>
        <html>
        <head>
            <title>Compte Rendu ${compteRendu.numCompteRendu}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    font-size: 12pt; 
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .header h1 {
                    font-size: 18pt;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .patient-info {
                    margin-bottom: 20px;
                }
                .patient-info p {
                    margin: 5px 0;
                }
                .section {
                    margin-bottom: 15px;
                }
                .section-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                }
                .two-columns {
                    display: flex;
                    justify-content: space-between;
                }
                .column {
                    width: 48%;
                }
                .test-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 5px;
                }
                .test-item {
                    background-color: #f3f4f6;
                    padding: 4px 10px;
                    border-radius: 4px;
                    display: inline-block;
                    font-size: 10pt;
                }
                .bilan-items {
                    margin-top: 5px;
                }
                .bilan-item {
                    margin-bottom: 8px;
                }
                .bilan-item-title {
                    font-weight: bold;
                }
                .text-muted {
                    color: #666;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Compte rendu du bilan psychomoteur</h1>
            </div>
            
            <div class="patient-info">
                <div class="two-columns">
                    <div class="column">
                        <p><strong>Nom et prénom:</strong> ${compteRendu.nomPatient}</p>
                        <p><strong>Date de naissance:</strong> ${formatDate(compteRendu.dateNaissance)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Date du bilan:</strong> ${formatDate(compteRendu.dateBilan)}</p>
                        <p><strong>Niveau:</strong> ${compteRendu.niveauScolaire}</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">TESTS UTILISÉS</div>
                <div class="test-grid">
                    ${testsHtml}
                </div>
            </div>
            
            ${compteRendu.contenu?.presentation ? `
            <div class="section">
                <div class="section-title">PRÉSENTATION</div>
                <p>${compteRendu.contenu.presentation}</p>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.anamnese ? `
            <div class="section">
                <div class="section-title">ANAMNÈSE</div>
                <p>${compteRendu.contenu.anamnese}</p>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.comportement ? `
            <div class="section">
                <div class="section-title">COMPORTEMENT</div>
                <p>${compteRendu.contenu.comportement}</p>
            </div>
            ` : ''}
            
            ${compteRendu.bilan ? `
            <div class="section">
                <div class="section-title">BILAN PSYCHOMOTEUR</div>
                <div class="bilan-items">
                    ${compteRendu.bilan.schemaCorporel ? `<div class="bilan-item"><span class="bilan-item-title">Schéma corporel :</span> ${compteRendu.bilan.schemaCorporel}</div>` : ''}
                    ${compteRendu.bilan.espace ? `<div class="bilan-item"><span class="bilan-item-title">Espace :</span> ${compteRendu.bilan.espace}</div>` : ''}
                    ${compteRendu.bilan.tempsRythmes ? `<div class="bilan-item"><span class="bilan-item-title">Temps et rythmes :</span> ${compteRendu.bilan.tempsRythmes}</div>` : ''}
                    ${compteRendu.bilan.lateralite ? `<div class="bilan-item"><span class="bilan-item-title">Latéralité :</span> ${compteRendu.bilan.lateralite}</div>` : ''}
                    ${compteRendu.bilan.graphisme ? `<div class="bilan-item"><span class="bilan-item-title">Graphisme :</span> ${compteRendu.bilan.graphisme}</div>` : ''}
                    ${compteRendu.bilan.fonctionCognitive ? `<div class="bilan-item"><span class="bilan-item-title">Fonction cognitive :</span> ${compteRendu.bilan.fonctionCognitive}</div>` : ''}
                    ${compteRendu.bilan.equipementMoteur ? `<div class="bilan-item"><span class="bilan-item-title">Équipement moteur :</span> ${compteRendu.bilan.equipementMoteur}</div>` : ''}
                </div>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.conclusion ? `
            <div class="section">
                <div class="section-title">CONCLUSION</div>
                <p>${compteRendu.contenu.conclusion}</p>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.projetTherapeutique ? `
            <div class="section">
                <div class="section-title">PROJET THÉRAPEUTIQUE</div>
                <p>${compteRendu.contenu.projetTherapeutique}</p>
            </div>
            ` : ''}
            
            ${compteRendu.observations ? `
            <div class="section">
                <div class="section-title">OBSERVATIONS</div>
                <p>${compteRendu.observations}</p>
            </div>
            ` : ''}
            
        </body>
        </html>`;
}

// Notifications
function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationIcon = notification.querySelector('.notification-icon svg');

    switch(type) {
        case 'success':
            notification.style.borderLeftColor = '#10b981';
            notification.querySelector('.notification-icon').style.color = '#10b981';
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />';
            notificationTitle.textContent = 'Succès';
            break;
        case 'error':
            notification.style.borderLeftColor = '#ef4444';
            notification.querySelector('.notification-icon').style.color = '#ef4444';
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M10 20a10 10 0 100-20 10 10 0 000 20zM8.45 4.3c.765-1.36 2.722-1.36 3.486 0l5.14 9.14c.75 1.334-.213 2.98-1.742 2.98H5.07c-1.53 0-2.493-1.646-1.743-2.98l5.14-9.14zM11 12a1 1 0 11-2 0 1 1 0 012 0zm-1-7a1 1 0 00-1 1v2.8a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';
            notificationTitle.textContent = 'Erreur';
            break;
        case 'info':
            notification.style.borderLeftColor = '#3b82f6';
            notification.querySelector('.notification-icon').style.color = '#3b82f6';
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />';
            notificationTitle.textContent = 'Information';
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
    console.log('🚀 Initialisation de la page comptes rendus...');

    // 1. Charger la sidebar
    try {
        const response = await fetch('/partials/sidebar.html');
        const sidebarHTML = await response.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;
        console.log('✅ Sidebar chargée');
    } catch (error) {
        console.error("❌ Erreur lors du chargement de la sidebar :", error);
    }

    checkURLParametersCompteRendu();

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

    setTimeout(() => {
        initializeDateBilan();
    }, 500);

    // 4. Configurer les filtres
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function () {
            // Mettre à jour l'apparence des boutons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });
            this.classList.add('active');
            this.classList.remove('bg-gray-100', 'text-gray-700');

            // Appliquer le filtre
            currentFilter = this.dataset.filter;
            currentPage = 1;
            filterComptesRendus();
        });
    });

    // 5. Configurer la recherche
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                filterComptesRendus();
            }, 300);
        });
    }

    // 6. Configurer les modals
    setupModalEventListeners();

    // 7. Initialiser les fonctionnalités
    initTestsCheckboxes();
    initPatientSearch('patientSearch', 'patientOptions', 'patientId', 'patientClear');

    // 8. Charger les données
    await loadPatients();
    await loadComptesRendus();

    console.log('✅ Initialisation terminée');
});

function clearPatientFields(searchInputId) {
    console.log('🗑️ Effacement des données patient pour:', searchInputId);

    // Déterminer le préfixe
    let prefix = '';
    if (searchInputId.includes('edit')) {
        prefix = 'edit';
    }

    // Essayer de trouver les champs avec et sans préfixe
    const fieldsToTry = [
        { id: prefix ? `${prefix}NomPatient` : 'nomPatient', fallback: 'nomPatient' },
        { id: prefix ? `${prefix}DateNaissance` : 'dateNaissance', fallback: 'dateNaissance' }
    ];

    fieldsToTry.forEach(fieldConfig => {
        let field = document.getElementById(fieldConfig.id);

        // Si pas trouvé avec préfixe, essayer sans
        if (!field && fieldConfig.fallback) {
            field = document.getElementById(fieldConfig.fallback);
        }

        if (field) {
            field.value = '';
            field.classList.remove('border-red-500');
            console.log(`✅ Champ ${fieldConfig.id} effacé`);
        } else {
            console.warn(`⚠️ Champ ${fieldConfig.id} non trouvé pour effacement`);
        }
    });
}

function setupModalEventListeners() {
    // Modal nouveau compte rendu
    const newCompteRenduBtn = document.getElementById('newCompteRenduBtn');
    const newCompteRenduModal = document.getElementById('newCompteRenduModal');
    const closeNewCompteRenduBtn = document.getElementById('closeNewCompteRenduBtn');
    const cancelNewCompteRenduBtn = document.getElementById('cancelNewCompteRenduBtn');
    const saveNewCompteRenduBtn = document.getElementById('saveNewCompteRenduBtn');

    if (newCompteRenduBtn) {
        newCompteRenduBtn.addEventListener('click', openNewModal);
    }

    if (closeNewCompteRenduBtn && newCompteRenduModal) {
        closeNewCompteRenduBtn.addEventListener('click', function() {
            newCompteRenduModal.classList.add('hidden');
        });
    }

    if (cancelNewCompteRenduBtn && newCompteRenduModal) {
        cancelNewCompteRenduBtn.addEventListener('click', function() {
            newCompteRenduModal.classList.add('hidden');
        });
    }

    if (saveNewCompteRenduBtn) {
        saveNewCompteRenduBtn.addEventListener('click', saveNewCompteRendu);
    }

    // Modal édition compte rendu
    const editCompteRenduModal = document.getElementById('editCompteRenduModal');
    const closeEditCompteRenduBtn = document.getElementById('closeEditCompteRenduBtn');
    const cancelEditCompteRenduBtn = document.getElementById('cancelEditCompteRenduBtn');
    const saveEditCompteRenduBtn = document.getElementById('saveEditCompteRenduBtn');

    if (closeEditCompteRenduBtn && editCompteRenduModal) {
        closeEditCompteRenduBtn.addEventListener('click', function() {
            editCompteRenduModal.classList.add('hidden');
        });
    }

    if (cancelEditCompteRenduBtn && editCompteRenduModal) {
        cancelEditCompteRenduBtn.addEventListener('click', function() {
            editCompteRenduModal.classList.add('hidden');
        });
    }

    if (saveEditCompteRenduBtn) {
        saveEditCompteRenduBtn.addEventListener('click', saveEditedCompteRendu);
    }

    // Modal visualisation compte rendu
    const viewCompteRenduModal = document.getElementById('viewCompteRenduModal');
    const closeViewCompteRenduBtn = document.getElementById('closeViewCompteRenduBtn');
    const editFromViewBtn = document.getElementById('editFromViewBtn');
    const printCompteRenduBtn = document.getElementById('printCompteRenduBtn');

    if (closeViewCompteRenduBtn && viewCompteRenduModal) {
        closeViewCompteRenduBtn.addEventListener('click', function() {
            viewCompteRenduModal.classList.add('hidden');
        });
    }

    if (editFromViewBtn) {
        editFromViewBtn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            const compteRendu = await CompteRenduAPI.getById(compteRenduId);

            if (compteRendu) {
                viewCompteRenduModal.classList.add('hidden');
                openEditModal(compteRendu);
            }
        });
    }

    if (printCompteRenduBtn) {
        printCompteRenduBtn.addEventListener('click', async function() {
            const compteRenduId = document.getElementById('editFromViewBtn').dataset.id;
            const compteRendu = await CompteRenduAPI.getById(compteRenduId);

            if (compteRendu) {
                printCompteRendu(compteRendu);
            }
        });
    }

    // Modal confirmation suppression
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (cancelDeleteBtn && deleteConfirmModal) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmModal.classList.add('hidden');
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCompteRendu);
    }

    // Modal sélection patient
    const patientSelectionModal = document.getElementById('patientSelectionModal');
    const closePatientSelectionBtn = document.getElementById('closePatientSelectionBtn');
    const cancelPatientSelectionBtn = document.getElementById('cancelPatientSelectionBtn');
    const patientSearchModal = document.getElementById('patientSearchModal');

    if (closePatientSelectionBtn && patientSelectionModal) {
        closePatientSelectionBtn.addEventListener('click', function() {
            patientSelectionModal.classList.add('hidden');
        });
    }

    if (cancelPatientSelectionBtn && patientSelectionModal) {
        cancelPatientSelectionBtn.addEventListener('click', function() {
            patientSelectionModal.classList.add('hidden');
        });
    }

    if (patientSearchModal) {
        patientSearchModal.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const patientsList = document.getElementById('patientsList');

            if (searchTerm.length >= 2) {
                filterPatientsModal(searchTerm);
            } else {
                renderAllPatientsModal();
            }
        });
    }

    // Modal sélection tests
    const testsSelectionModal = document.getElementById('testsSelectionModal');
    const closeTestsSelectionBtn = document.getElementById('closeTestsSelectionBtn');
    const confirmTestsSelectionBtn = document.getElementById('confirmTestsSelectionBtn');
    const clearAllTestsBtn = document.getElementById('clearAllTestsBtn');

    if (closeTestsSelectionBtn && testsSelectionModal) {
        closeTestsSelectionBtn.addEventListener('click', function() {
            testsSelectionModal.classList.add('hidden');
        });
    }

    if (confirmTestsSelectionBtn) {
        confirmTestsSelectionBtn.addEventListener('click', function() {
            testsSelectionModal.classList.add('hidden');
            updateTestsDisplay();
        });
    }

    if (clearAllTestsBtn) {
        clearAllTestsBtn.addEventListener('click', function() {
            selectedTests = [];
            document.querySelectorAll('#testsAvailableList .custom-checkbox').forEach(checkbox => {
                checkbox.classList.remove('checked');
            });
            updateSelectedTestsCount();
        });
    }
}

// Fonctions utilitaires pour les modals
function filterPatientsModal(searchTerm) {
    const filteredPatients = allPatients.filter(patient =>
        patient.prenom.toLowerCase().includes(searchTerm) ||
        patient.nom.toLowerCase().includes(searchTerm)
    );
    renderPatientsModal(filteredPatients);
}

function renderAllPatientsModal() {
    renderPatientsModal(allPatients.slice(0, 20)); // Limiter à 20 pour les performances
}

function renderPatientsModal(patients) {
    const patientsList = document.getElementById('patientsList');
    patientsList.innerHTML = '';

    patients.forEach(patient => {
        const patientItem = document.createElement('div');
        patientItem.className = 'p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer';
        patientItem.innerHTML = `
            <div class="font-medium">${patient.prenom} ${patient.nom}</div>
            <div class="text-sm text-gray-500">${patient.pathologie || 'Aucune pathologie'}</div>
            <div class="text-xs text-gray-400">Né(e) le ${formatDate(patient.dateNaissance)}</div>
        `;

        patientItem.addEventListener('click', function() {
            selectPatientFromModal(patient);
        });

        patientsList.appendChild(patientItem);
    });

    if (patients.length === 0) {
        patientsList.innerHTML = '<div class="text-center text-gray-500 py-4">Aucun patient trouvé</div>';
    }
}

function selectPatientFromModal(patient) {
    // Remplir les champs du formulaire actif
    const activeModal = document.querySelector('.modal:not(.hidden)');

    if (activeModal && activeModal.id === 'newCompteRenduModal') {
        document.getElementById('patientSearch').value = `${patient.prenom} ${patient.nom}`;
        document.getElementById('patientId').value = patient.id;
        document.getElementById('patientClear').style.display = 'block';

        // Remplir automatiquement les champs
        if (!document.getElementById('nomPatient').value) {
            document.getElementById('nomPatient').value = `${patient.prenom} ${patient.nom}`;
        }
        if (!document.getElementById('dateNaissance').value) {
            document.getElementById('dateNaissance').value = patient.dateNaissance;
        }
    }

    document.getElementById('patientSelectionModal').classList.add('hidden');
}

function updateTestsDisplay() {
    updateSelectedTestsCount();
    updateTestsCheckboxes();
}

function updateSelectedTestsCount() {
    const countElement = document.getElementById('selectedTestsCount');
    if (countElement) {
        countElement.textContent = selectedTests.length;
    }
}

function checkURLParametersCompteRendu() {
    const urlParams = new URLSearchParams(window.location.search);
    const openModal = urlParams.get('openModal');

    if (openModal === 'new') {
        console.log('🎯 Paramètre openModal=new détecté - ouverture automatique du modal compte rendu');

        // Attendre que la page soit complètement chargée
        setTimeout(() => {
            const newCompteRenduBtn = document.getElementById('newCompteRenduBtn');

            if (newCompteRenduBtn) {
                console.log('📱 Ouverture automatique du modal nouveau compte rendu');

                // Utiliser la fonction openNewModal qui initialise déjà la date
                if (typeof openNewModal === 'function') {
                    openNewModal();
                } else {
                    newCompteRenduBtn.click();
                    // ✅ FALLBACK: Initialiser la date si la fonction n'est pas disponible
                    setTimeout(initializeDateBilan, 200);
                }

                // ✅ Nettoyer l'URL pour éviter que le modal se rouvre à chaque rafraîchissement
                const newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({}, document.title, newURL);

                console.log('✅ Modal compte rendu ouvert et URL nettoyée');
            } else {
                console.warn('⚠️ Bouton newCompteRenduBtn non trouvé pour ouverture automatique');
            }
        }, 800); // Délai plus long pour s'assurer que tout est chargé
    }
}

// Fonction globale pour les sections (appelée depuis l'HTML)
window.toggleSection = toggleSection;
window.toggleEditSection = toggleEditSection;

// Fonctions globales pour l'ouverture des modals (si nécessaire)
window.openPatientSelectionModal = function() {
    renderAllPatientsModal();
    document.getElementById('patientSelectionModal').classList.remove('hidden');
};

window.openTestsSelectionModal = async function() {
    try {
        const testsDisponibles = await CompteRenduAPI.getTestsDisponibles();
        renderTestsModal(testsDisponibles);
        updateSelectedTestsCount();
        document.getElementById('testsSelectionModal').classList.remove('hidden');
    } catch (error) {
        console.error('Erreur lors du chargement des tests:', error);
        showNotification('error', 'Erreur lors du chargement des tests disponibles');
    }
};

function renderTestsModal(tests) {
    const testsContainer = document.getElementById('testsAvailableList');
    testsContainer.innerHTML = '';

    tests.forEach(test => {
        const testItem = document.createElement('div');
        testItem.className = 'flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50';

        const isSelected = selectedTests.includes(test);

        testItem.innerHTML = `
            <div class="custom-checkbox mr-3 ${isSelected ? 'checked' : ''}" data-test="${test}"></div>
            <label class="text-sm text-gray-700 cursor-pointer flex-1">${test}</label>
        `;

        testItem.addEventListener('click', function() {
            const checkbox = testItem.querySelector('.custom-checkbox');
            const testName = checkbox.dataset.test;

            if (checkbox.classList.contains('checked')) {
                checkbox.classList.remove('checked');
                selectedTests = selectedTests.filter(t => t !== testName);
            } else {
                checkbox.classList.add('checked');
                if (!selectedTests.includes(testName)) {
                    selectedTests.push(testName);
                }
            }

            updateSelectedTestsCount();
        });

        testsContainer.appendChild(testItem);
    });
}

// Gestion des fermetures de modals avec échap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal:not(.hidden)');
        if (activeModal) {
            activeModal.classList.add('hidden');
        }
    }
});

// Gestion des clics en dehors des modals
document.addEventListener('click', function(e) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (!modal.classList.contains('hidden')) {
            const modalContent = modal.querySelector('.bg-white');
            if (modalContent && !modalContent.contains(e.target)) {
                modal.classList.add('hidden');
            }
        }
    });
});

// Prévenir la fermeture des modals lors des clics sur le contenu
document.querySelectorAll('.modal .bg-white').forEach(modalContent => {
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

window.debugFormFields = function() {
    console.log('🔍 DEBUG: Vérification des champs du formulaire');

    const fieldsToCheck = [
        'nomPatient', 'editNomPatient',
        'dateNaissance', 'editDateNaissance',
        'patientSearch', 'editPatientSearch',
        'patientId', 'editPatientId'
    ];

    fieldsToCheck.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        console.log(`${fieldId}: ${field ? '✅ Trouvé' : '❌ Manquant'}`);
        if (field) {
            console.log(`  Valeur actuelle: "${field.value}"`);
        }
    });
};

console.log('✅ Fichier compte-rendu.js chargé avec succès');