// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let allAnamneses = [];
let filteredAnamneses = [];
let allPatients = [];
let currentFilter = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let selectedAnamnese = null;

// Classes pour gérer les appels API
class AnamneseAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses`);
            if (!response.ok) throw new Error('Erreur lors du chargement des anamnèses');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des anamnèses');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses/${id}`);
            if (!response.ok) throw new Error('Anamnèse introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async create(anamneseData) {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(anamneseData)
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

    static async update(id, anamneseData) {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(anamneseData)
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
            const response = await fetch(`${API_BASE_URL}/anamneses/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            return true;
        } catch (error) {
            console.error('Erreur API delete:', error);
            throw error;
        }
    }

    static async generateNumber() {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses/generate-numero`);
            if (!response.ok) throw new Error('Erreur lors de la génération du numéro');
            const data = await response.json();
            return data.numero;
        } catch (error) {
            console.error('Erreur API generateNumber:', error);
            return `AN-${String(Date.now()).slice(-3)}`;
        }
    }

    static async search(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search:', error);
            return [];
        }
    }

    static async getByStatut(statut) {
        try {
            const response = await fetch(`${API_BASE_URL}/anamneses/statut/${statut}`);
            if (!response.ok) throw new Error('Erreur lors du filtrage');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByStatut:', error);
            return [];
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

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
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

// ✅ AJOUT : Fonction pour déterminer automatiquement le statut
function determineStatutAutomatique(anamneseData) {
    // Vérifier les champs obligatoires
    const champsObligatoiresRemplis =
        anamneseData.nomPrenom && anamneseData.nomPrenom.trim() !== '' &&
        anamneseData.dateNaissance &&
        anamneseData.dateEntretien;

    if (!champsObligatoiresRemplis) {
        return 'EN_COURS';
    }

    // Compter les sections remplies
    let sectionsRemplies = 0;
    const totalSections = 8; // parents, grossesse, accouchement, allaitement, développement, langage, comportement, divers

    // Vérifier les sections
    if (hasParentsContent(anamneseData)) sectionsRemplies++;
    if (hasGrossesseContent(anamneseData)) sectionsRemplies++;
    if (hasAccouchementContent(anamneseData)) sectionsRemplies++;
    if (hasAllaitementContent(anamneseData)) sectionsRemplies++;
    if (hasDeveloppementContent(anamneseData)) sectionsRemplies++;
    if (hasLangageContent(anamneseData)) sectionsRemplies++;
    if (hasComportementContent(anamneseData)) sectionsRemplies++;
    if (hasDiversContent(anamneseData)) sectionsRemplies++;

    // Critères pour "TERMINE": au moins 5 sections sur 8 remplies
    if (sectionsRemplies >= 5) {
        return 'TERMINE';
    }

    return 'EN_COURS';
}

// Fonctions utilitaires pour vérifier le contenu des sections
function hasParentsContent(data) {
    return data.parents && (
        (data.parents.nomPere && data.parents.nomPere.trim()) ||
        (data.parents.nomMere && data.parents.nomMere.trim())
    );
}

function hasGrossesseContent(data) {
    return data.grossesse && (
        data.grossesse.desire !== null ||
        data.grossesse.compliquee !== null ||
        (data.grossesse.autres && data.grossesse.autres.trim())
    );
}

function hasAccouchementContent(data) {
    return data.accouchement && (
        data.accouchement.terme !== null ||
        data.accouchement.premature !== null ||
        data.accouchement.postMature !== null ||
        data.accouchement.voieBasse !== null ||
        data.accouchement.cesarienne !== null ||
        data.accouchement.cris !== null ||
        (data.accouchement.autres && data.accouchement.autres.trim())
    );
}

function hasAllaitementContent(data) {
    return data.allaitement && (
        data.allaitement.type ||
        data.allaitement.duree
    );
}

function hasDeveloppementContent(data) {
    return data.developpement && (
        (data.developpement.tenueTete && data.developpement.tenueTete.trim()) ||
        (data.developpement.positionAssise && data.developpement.positionAssise.trim()) ||
        (data.developpement.quatrePattes && data.developpement.quatrePattes.trim()) ||
        (data.developpement.positionDebout && data.developpement.positionDebout.trim()) ||
        (data.developpement.marche && data.developpement.marche.trim())
    );
}

function hasLangageContent(data) {
    return data.langage && (
        (data.langage.premierMot && data.langage.premierMot.trim()) ||
        (data.langage.premierePhrase && data.langage.premierePhrase.trim())
    );
}

function hasComportementContent(data) {
    return data.comportement && (
        (data.comportement.avecMere && data.comportement.avecMere.trim()) ||
        (data.comportement.avecPere && data.comportement.avecPere.trim()) ||
        (data.comportement.avecFreres && data.comportement.avecFreres.trim()) ||
        (data.comportement.aEcole && data.comportement.aEcole.trim()) ||
        (data.comportement.autres && data.comportement.autres.trim())
    );
}

function hasDiversContent(data) {
    return data.divers && (
        (data.divers.scolarisation && data.divers.scolarisation.trim()) ||
        (data.divers.sommeil && data.divers.sommeil.trim()) ||
        (data.divers.appetit && data.divers.appetit.trim()) ||
        (data.divers.proprete && data.divers.proprete.trim())
    );
}

// Gestion des anamnèses
async function loadAnamneses() {
    try {
        allAnamneses = await AnamneseAPI.getAll();
        await filterAnamneses();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des anamnèses');
    }
}

async function filterAnamneses() {
    try {
        if (currentFilter === 'all') {
            filteredAnamneses = [...allAnamneses];
        } else {
            filteredAnamneses = await AnamneseAPI.getByStatut(currentFilter);
        }

        const searchTerm = document.getElementById('searchInput')?.value.trim();
        if (searchTerm) {
            filteredAnamneses = await AnamneseAPI.search(searchTerm);
            if (currentFilter !== 'all') {
                filteredAnamneses = filteredAnamneses.filter(a => a.statut === currentFilter);
            }
        }

        updateAnamnesesList();
    } catch (error) {
        console.error('Erreur lors du filtrage:', error);
        showNotification('error', 'Erreur lors du filtrage');
    }
}

function updateAnamnesesList() {
    const totalEl = document.getElementById('totalAnamneses');
    if (totalEl) totalEl.textContent = filteredAnamneses.length;

    const totalPages = Math.ceil(filteredAnamneses.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredAnamneses.length);

    const startEl = document.getElementById('startRange');
    const endEl = document.getElementById('endRange');

    if (startEl) startEl.textContent = filteredAnamneses.length ? start + 1 : 0;
    if (endEl) endEl.textContent = end;

    const currentPageAnamneses = filteredAnamneses.slice(start, end);

    renderTable(currentPageAnamneses);
    createPagination(totalPages);
}

function renderTable(anamneses) {
    const tableBody = document.getElementById('anamnesesTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (anamneses.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                Aucune anamnèse trouvée
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    anamneses.forEach((anamnese) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        const statusClass = getStatusClass(anamnese.statut);
        const statusLabel = getStatusLabel(anamnese.statut);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${anamnese.numAnamnese || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${anamnese.nomPrenom || 'N/A'}</div>
                <div class="text-xs text-gray-500">Né(e) le ${formatDate(anamnese.dateNaissance)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${formatDate(anamnese.dateEntretien)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${anamnese.motifConsultation || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-green-600 print-anamnese-btn" data-id="${anamnese.id}">
                        <i class="ri-printer-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 edit-anamnese-btn" data-id="${anamnese.id}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-red-500 delete-anamnese-btn" data-id="${anamnese.id}">
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
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1 border border-gray-300 rounded-button text-sm text-gray-700 bg-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
    prevBtn.innerHTML = 'Précédent';
    prevBtn.disabled = currentPage === 1;

    if (currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            currentPage--;
            updateAnamnesesList();
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
                updateAnamnesesList();
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
            updateAnamnesesList();
        });
    }

    paginationContainer.appendChild(nextBtn);
}

function addButtonEventListeners() {

    document.querySelectorAll('.print-anamnese-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const anamneseId = this.dataset.id;

            // ✅ Utiliser la fonction globale de patient-records.js
            if (typeof window.printAnamneseFromList === 'function') {
                await window.printAnamneseFromList(anamneseId);
            } else {
                console.error('❌ Fonction d\'impression non disponible');
                showNotification('error', 'Fonction d\'impression non disponible');
            }
        });
    });

    document.querySelectorAll('.edit-anamnese-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const anamneseId = this.dataset.id;
            const anamnese = await AnamneseAPI.getById(anamneseId);
            if (anamnese) {
                selectedAnamnese = anamnese;
                openEditModal(anamnese);
            }
        });
    });

    document.querySelectorAll('.delete-anamnese-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const anamneseId = this.dataset.id;
            const anamnese = await AnamneseAPI.getById(anamneseId);
            if (anamnese) {
                selectedAnamnese = anamnese;
                const modal = document.getElementById('deleteConfirmModal');
                if (modal) modal.classList.remove('hidden');
            }
        });
    });
}

// Gestion des patients (recherche)
async function loadPatients() {
    try {
        allPatients = await PatientAPI.getAll();
    } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
    }
}

function initPatientSearch(searchInputId, optionsContainerId, hiddenInputId, clearBtnId, nomPrenomInputId = null) {
    const searchInput = document.getElementById(searchInputId);
    const optionsContainer = document.getElementById(optionsContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const clearBtn = document.getElementById(clearBtnId);
    const nomPrenomInput = nomPrenomInputId ? document.getElementById(nomPrenomInputId) : null;

    if (!searchInput || !optionsContainer || !hiddenInput || !clearBtn) return;

    searchInput.addEventListener('focus', function() {
        optionsContainer.style.display = 'block';
        filterPatients(searchInputId, optionsContainerId);
    });

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !optionsContainer.contains(e.target)) {
            optionsContainer.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', function() {
        filterPatients(searchInputId, optionsContainerId);
        if (searchInput.value.trim() !== '') {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    });

    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        searchInput.value = '';
        hiddenInput.value = '';
        clearBtn.style.display = 'none';

        if (nomPrenomInput) {
            nomPrenomInput.value = '';
        }

        // ✅ NOUVEAU : Effacer aussi la date de naissance lors du clear
        clearPatientData(searchInputId);

        filterPatients(searchInputId, optionsContainerId);
    });

    optionsContainer.addEventListener('click', function(e) {
        const option = e.target.closest('.patient-search-option');
        if (option) {
            const patientId = option.dataset.patientId;
            const patient = allPatients.find(p => p.id == patientId);

            if (patient) {
                searchInput.value = `${patient.prenom} ${patient.nom}`;
                hiddenInput.value = patientId;
                optionsContainer.style.display = 'none';
                clearBtn.style.display = 'block';

                if (nomPrenomInput) {
                    nomPrenomInput.value = `${patient.prenom} ${patient.nom}`;
                }

                // ✅ NOUVEAU : Auto-remplir les données du patient
                fillPatientData(searchInputId, patient);

                const event = new Event('change');
                hiddenInput.dispatchEvent(event);
            }
        }
    });
}

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

    // ✅ 1. Remplir automatiquement le nom/prénom si le champ existe
    const nomPrenomField = document.getElementById(getFieldId('nomPrenom'));
    if (nomPrenomField && nomPrenomField.value.trim() === '') {
        nomPrenomField.value = `${patient.prenom} ${patient.nom}`;
        console.log('✅ Nom/Prénom rempli automatiquement');
    }

    // ✅ 2. Remplir automatiquement la date de naissance
    const dateNaissanceField = document.getElementById(getFieldId('dateNaissance'));
    if (dateNaissanceField && patient.dateNaissance) {
        dateNaissanceField.value = formatDateForInput(patient.dateNaissance);
        console.log('✅ Date de naissance remplie automatiquement:', patient.dateNaissance);

        // Supprimer l'erreur de validation si elle existait
        dateNaissanceField.classList.remove('border-red-500');
    }

    showNotification('info', `Données du patient ${patient.prenom} ${patient.nom} chargées automatiquement`);
}

function clearPatientData(searchInputId) {
    console.log('🗑️ Effacement des données patient');

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

    // Effacer les champs auto-remplis
    const fieldsToMandatoryClear = ['nomPrenom', 'dateNaissance'];

    fieldsToMandatoryClear.forEach(fieldName => {
        const field = document.getElementById(getFieldId(fieldName));
        if (field) {
            field.value = '';
            field.classList.remove('border-red-500'); // Supprimer les erreurs de validation
            console.log(`✅ Champ ${fieldName} effacé`);
        }
    });
}

async function filterPatients(searchInputId, optionsContainerId) {
    const searchInput = document.getElementById(searchInputId);
    const optionsContainer = document.getElementById(optionsContainerId);

    if (!searchInput || !optionsContainer) return;

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

        // ✅ AMÉLIORATION : Afficher plus d'informations pour aider à identifier le patient
        const dateNaissance = patient.dateNaissance ? formatDate(patient.dateNaissance) : 'Date non renseignée';
        const pathologie = patient.pathologie || 'Aucune pathologie';

        option.innerHTML = `
            <div class="font-medium">${patient.prenom} ${patient.nom}</div>
            <div class="text-xs text-gray-500">
                <div>Né(e) le ${dateNaissance}</div>
                <div>${pathologie}</div>
            </div>
        `;
        optionsContainer.appendChild(option);
    });

    if (patientsToShow.length === 0 && searchTerm.length >= 2) {
        const noResult = document.createElement('div');
        noResult.className = 'patient-search-option text-gray-500';
        noResult.innerHTML = `
            <div class="text-center py-2">
                <div>Aucun patient trouvé</div>
                <div class="text-xs">Essayez avec un nom ou prénom différent</div>
            </div>
        `;
        optionsContainer.appendChild(noResult);
    }
}


// Gestion des sections collapsibles
function toggleSection(sectionName) {
    const section = document.getElementById(`section-${sectionName}`);
    const arrow = document.getElementById(`arrow-${sectionName}`);

    if (section && arrow) {
        const isHidden = section.classList.contains('hidden');

        if (isHidden) {
            section.classList.remove('hidden');
            arrow.classList.remove('ri-arrow-down-s-line');
            arrow.classList.add('ri-arrow-up-s-line');
        } else {
            section.classList.add('hidden');
            arrow.classList.remove('ri-arrow-up-s-line');
            arrow.classList.add('ri-arrow-down-s-line');
        }
    }
}

// ✅ MODIFICATION : Fonction getFormData mise à jour pour les radio buttons personnalisés
function getCustomRadioValue(radioName, formPrefix = '') {
    const name = formPrefix ? `${formPrefix}${radioName.charAt(0).toUpperCase()}${radioName.slice(1)}` : radioName;
    const selectedRadio = document.querySelector(`.custom-radio[data-name="${name}"].checked`);

    if (!selectedRadio) return null;

    const value = selectedRadio.dataset.value;
    return value === 'true' ? true : value === 'false' ? false : value;
}

// ✅ AJOUT : Fonction pour remplir les radio buttons lors de l'édition
function setCustomRadioValue(radioName, value, formPrefix = '') {
    const name = formPrefix ? `${formPrefix}${radioName.charAt(0).toUpperCase()}${radioName.slice(1)}` : radioName;

    // Décocher tous les radio buttons de ce groupe
    document.querySelectorAll(`.custom-radio[data-name="${name}"]`).forEach(radio => {
        radio.classList.remove('checked');
    });

    // Cocher le bon radio button
    if (value !== null && value !== undefined) {
        const targetRadio = document.querySelector(`.custom-radio[data-name="${name}"][data-value="${value}"]`);
        if (targetRadio) {
            targetRadio.classList.add('checked');
        }
    }
}

// Données de formulaire
function getFormData(formPrefix = '') {
    const getFieldValue = (fieldName) => {
        const fieldId = formPrefix ? `${formPrefix}${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}` : fieldName;
        const field = document.getElementById(fieldId);
        return field ? field.value.trim() : '';
    };

    const getRadioValue = (radioName) => {
        return getCustomRadioValue(radioName, formPrefix);
    };

    const getSelectValue = (selectName) => {
        const selectId = formPrefix ? `${formPrefix}${selectName.charAt(0).toUpperCase()}${selectName.slice(1)}` : selectName;
        const select = document.getElementById(selectId);
        return select ? select.value : '';
    };

    // Récupération des données de base
    const patientIdValue = getFieldValue('patientId');
    const patientId = patientIdValue ? parseInt(patientIdValue) : null;
    const patient = patientId ? { id: patientId } : null;

    // Construction des objets imbriqués
    const buildParents = () => {
        const nomPere = getFieldValue('nomPere');
        const agePere = getFieldValue('agePere');
        const professionPere = getFieldValue('professionPere');
        const nomMere = getFieldValue('nomMere');
        const ageMere = getFieldValue('ageMere');
        const professionMere = getFieldValue('professionMere');

        if (!nomPere && !agePere && !professionPere && !nomMere && !ageMere && !professionMere) {
            return null;
        }

        return {
            nomPere: nomPere || null,
            agePere: agePere ? parseInt(agePere) : null,
            professionPere: professionPere || null,
            nomMere: nomMere || null,
            ageMere: ageMere ? parseInt(ageMere) : null,
            professionMere: professionMere || null
        };
    };

    const buildGrossesse = () => {
        const desire = getRadioValue('grossesseDesire');
        const compliquee = getRadioValue('grossesseCompliquee');
        const autres = getFieldValue('grossesseAutres');

        if (desire === null && compliquee === null && !autres) {
            return null;
        }

        return {
            desire,
            compliquee,
            autres: autres || null
        };
    };

    const buildAccouchement = () => {
        const terme = getRadioValue('accouchementTerme');
        const premature = getRadioValue('accouchementPremature');
        const postMature = getRadioValue('accouchementPostMature');
        const voieBasse = getRadioValue('accouchementVoieBasse');
        const cesarienne = getRadioValue('accouchementCesarienne');
        const cris = getRadioValue('accouchementCris');
        const autres = getFieldValue('accouchementAutres');

        if (terme === null && premature === null && postMature === null &&
            voieBasse === null && cesarienne === null && cris === null && !autres) {
            return null;
        }

        return {
            terme,
            premature,
            postMature,
            voieBasse,
            cesarienne,
            cris,
            autres: autres || null
        };
    };

    const buildAllaitement = () => {
        const type = getRadioValue('allaitementType');
        const dureeValue = getFieldValue('allaitementDuree');

        if (!type && !dureeValue) {
            return null;
        }

        return {
            type: type || null,
            duree: dureeValue ? parseInt(dureeValue) : null
        };
    };

    const buildDeveloppement = () => {
        const tenueTete = getFieldValue('tenueTete');
        const positionAssise = getFieldValue('positionAssise');
        const quatrePattes = getFieldValue('quatrePattes');
        const positionDebout = getFieldValue('positionDebout');
        const marche = getFieldValue('marche');

        if (!tenueTete && !positionAssise && !quatrePattes && !positionDebout && !marche) {
            return null;
        }

        return {
            tenueTete: tenueTete || null,
            positionAssise: positionAssise || null,
            quatrePattes: quatrePattes || null,
            positionDebout: positionDebout || null,
            marche: marche || null
        };
    };

    const buildLangage = () => {
        const premierMot = getFieldValue('premierMot');
        const premierePhrase = getFieldValue('premierePhrase');

        if (!premierMot && !premierePhrase) {
            return null;
        }

        return {
            premierMot: premierMot || null,
            premierePhrase: premierePhrase || null
        };
    };

    const buildComportement = () => {
        const avecMere = getFieldValue('compMere');
        const avecPere = getFieldValue('compPere');
        const avecFreres = getFieldValue('compFreres');
        const aEcole = getFieldValue('compEcole');
        const autres = getFieldValue('compAutres');

        if (!avecMere && !avecPere && !avecFreres && !aEcole && !autres) {
            return null;
        }

        return {
            avecMere: avecMere || null,
            avecPere: avecPere || null,
            avecFreres: avecFreres || null,
            aEcole: aEcole || null,
            autres: autres || null
        };
    };

    const buildDivers = () => {
        const scolarisation = getFieldValue('scolarisation');
        const sommeil = getFieldValue('sommeil');
        const appetit = getFieldValue('appetit');
        const proprete = getFieldValue('proprete');

        if (!scolarisation && !sommeil && !appetit && !proprete) {
            return null;
        }

        return {
            scolarisation: scolarisation || null,
            sommeil: sommeil || null,
            appetit: appetit || null,
            proprete: proprete || null
        };
    };

    const buildAntecedents = () => {
        const personnels = getFieldValue('antecedentsPersonnels');
        const familiaux = getFieldValue('antecedentsFamiliaux');

        if (!personnels && !familiaux) {
            return null;
        }

        return {
            personnels: personnels || null,
            familiaux: familiaux || null
        };
    };

    // Construction de l'objet final
    const data = {
        numAnamnese: getFieldValue('numAnamnese'),
        dateEntretien: getFieldValue('dateEntretien'),
        nomPrenom: getFieldValue('nomPrenom'),
        dateNaissance: getFieldValue('dateNaissance'),
        adressePar: getFieldValue('adressePar') || null,
        motifConsultation: getFieldValue('motifConsultation') || null,
        reeducationAnterieure: getFieldValue('reeducationAnterieure') || null,
        statut: getSelectValue('statut') || 'EN_COURS',
        observations: getFieldValue('observations') || null
    };

    // Ajouter les propriétés optionnelles
    if (patient) data.patient = patient;

    const consanguiniteValue = getRadioValue('consanguinite');
    if (consanguiniteValue !== null) data.consanguinite = consanguiniteValue;

    const fraterie = getFieldValue('fraterie');
    if (fraterie) data.fraterie = fraterie;

    const parents = buildParents();
    if (parents) data.parents = parents;

    const grossesse = buildGrossesse();
    if (grossesse) data.grossesse = grossesse;

    const accouchement = buildAccouchement();
    if (accouchement) data.accouchement = accouchement;

    const allaitement = buildAllaitement();
    if (allaitement) data.allaitement = allaitement;

    const developpement = buildDeveloppement();
    if (developpement) data.developpement = developpement;

    const langage = buildLangage();
    if (langage) data.langage = langage;

    const comportement = buildComportement();
    if (comportement) data.comportement = comportement;

    const divers = buildDivers();
    if (divers) data.divers = divers;

    const antecedents = buildAntecedents();
    if (antecedents) data.antecedents = antecedents;

    console.log('📦 Données à envoyer:', JSON.stringify(data, null, 2));
    return data;
}

function validateFormData(data) {
    const errors = [];

    if (!data.dateEntretien) {
        errors.push('Date d\'entretien requise');
    }

    if (!data.nomPrenom) {
        errors.push('Nom et prénom requis');
    }

    if (!data.dateNaissance) {
        errors.push('Date de naissance requise');
    }

    // Validation des dates
    if (data.dateEntretien && data.dateNaissance) {
        const dateEntretien = new Date(data.dateEntretien);
        const dateNaissance = new Date(data.dateNaissance);

        if (dateNaissance > dateEntretien) {
            errors.push('La date de naissance ne peut pas être postérieure à la date d\'entretien');
        }
    }

    if (errors.length > 0) {
        console.error('❌ Erreurs de validation:', errors);
        showNotification('error', errors.join('\n'));
        return false;
    }

    return true;
}

// Validation
function validateForm() {
    const requiredFields = ['dateEntretien', 'nomPrenom', 'dateNaissance'];
    let isValid = true;
    const errors = [];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.error(`Champ ${fieldId} introuvable dans le DOM`);
            return;
        }

        if (!field.value.trim()) {
            field.classList.add('border-red-500');
            errors.push(field.previousElementSibling?.textContent || fieldId);
            isValid = false;
        } else {
            field.classList.remove('border-red-500');
        }
    });

    if (!isValid) {
        showNotification('error', `Champs requis: ${errors.join(', ')}`);
    }

    return isValid;
}

// Réinitialisation du formulaire
// Réinitialisation du formulaire
async function resetForm() {
    const form = document.getElementById('newAnamneseForm');
    if (!form) {
        console.error('Formulaire newAnamneseForm introuvable');
        return;
    }

    form.reset();

    // Reset des radio buttons personnalisés
    document.querySelectorAll('.custom-radio').forEach(radio => {
        radio.classList.remove('checked');
    });

    // Générer un nouveau numéro
    try {
        const newNumber = await AnamneseAPI.generateNumber();
        const numField = document.getElementById('numAnamnese');
        if (numField) {
            numField.value = newNumber;
        }
    } catch (error) {
        console.error('Erreur génération numéro:', error);
        const numField = document.getElementById('numAnamnese');
        if (numField) {
            numField.value = 'AN-001';
        }
    }

    // Date du jour
    const dateField = document.getElementById('dateEntretien');
    if (dateField) {
        dateField.valueAsDate = new Date();
    }

    // ✅ MODIFICATION : Reset complet des données patient
    const searchField = document.getElementById('patientSearch');
    const hiddenField = document.getElementById('patientId');
    const clearBtn = document.getElementById('patientClear');
    const nomPrenomField = document.getElementById('nomPrenom');
    const dateNaissanceField = document.getElementById('dateNaissance');

    if (searchField) searchField.value = '';
    if (hiddenField) hiddenField.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (nomPrenomField) nomPrenomField.value = '';
    if (dateNaissanceField) dateNaissanceField.value = '';

    // Fermer toutes les sections et réinitialiser les flèches
    const sections = ['parents', 'grossesse', 'accouchement', 'allaitement', 'developpement', 'langage', 'comportement', 'divers', 'antecedents', 'observations'];
    sections.forEach(section => {
        const sectionElement = document.getElementById(`section-${section}`);
        const arrow = document.getElementById(`arrow-${section}`);

        if (sectionElement) {
            sectionElement.classList.add('hidden');
        }
        if (arrow) {
            arrow.classList.remove('ri-arrow-up-s-line');
            arrow.classList.add('ri-arrow-down-s-line');
        }
    });

    // Supprimer les erreurs de validation
    document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
    });

    console.log('✅ Formulaire réinitialisé avec nettoyage complet des données patient');
}

function validatePatientSelection(searchInputId) {
    const hiddenInput = document.getElementById(searchInputId.replace('Search', 'Id'));
    const nomPrenomField = document.getElementById(searchInputId.includes('edit') ? 'editNomPrenom' : 'nomPrenom');
    const dateNaissanceField = document.getElementById(searchInputId.includes('edit') ? 'editDateNaissance' : 'dateNaissance');

    // Vérifier qu'un patient est bien sélectionné
    if (hiddenInput && hiddenInput.value) {
        // Supprimer les erreurs de validation sur les champs auto-remplis
        if (nomPrenomField) nomPrenomField.classList.remove('border-red-500');
        if (dateNaissanceField) dateNaissanceField.classList.remove('border-red-500');

        return true;
    }

    return false;
}

// Gestion des modals
function openNewAnamneseModal() {
    resetForm();
    const modal = document.getElementById('newAnamneseModal');
    if (modal) modal.classList.remove('hidden');
}

function closeNewAnamneseModal() {
    const modal = document.getElementById('newAnamneseModal');
    if (modal) modal.classList.add('hidden');
}

function openEditModal(anamnese) {
    console.log('🔄 Ouverture du modal d\'édition...');

    // Créer dynamiquement le formulaire d'édition
    createEditForm();

    // ✅ Vérifier la structure après création
    setTimeout(() => {
        verifyEditFormStructure();
        debugEditSections();
    }, 100);

    // Remplir le formulaire avec les données de l'anamnèse
    fillEditForm(anamnese);

    // Mettre à jour les informations d'en-tête
    const numberEl = document.getElementById('editAnamneseNumber');
    const statutEl = document.getElementById('editStatut');

    if (numberEl) numberEl.textContent = anamnese.numAnamnese;
    if (statutEl) {
        statutEl.innerHTML = `
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
        `;
        statutEl.value = anamnese.statut;
    }

    // Initialiser la recherche de patients pour l'édition
    initPatientSearch('editPatientSearch', 'editPatientOptions', 'editPatientId', 'editPatientClear', 'editNomPrenom');

    // ✅ SUPPRIMÉ: L'ouverture automatique des sections
    // Les sections restent fermées par défaut comme dans le formulaire de création
    console.log('📁 Sections gardées fermées par défaut');

    const modal = document.getElementById('editAnamneseModal');
    if (modal) modal.classList.remove('hidden');
}

function closeEditModal() {
    const modal = document.getElementById('editAnamneseModal');
    if (modal) modal.classList.add('hidden');
}

function createEditForm() {
    const container = document.getElementById('editAnamneseFormContainer');
    if (!container) return;

    // Cloner le formulaire de création
    const originalForm = document.getElementById('newAnamneseForm');
    if (!originalForm) return;

    const clonedForm = originalForm.cloneNode(true);
    clonedForm.id = 'editAnamneseForm';

    // Mettre à jour tous les IDs et noms pour l'édition
    updateFormIds(clonedForm, 'edit');

    container.innerHTML = '';
    container.appendChild(clonedForm);

    console.log('✅ Formulaire d\'édition créé et configuré');
}

function updateFormIds(form, prefix) {
    console.log(`🔄 Mise à jour des IDs avec le préfixe: ${prefix}`);

    // ✅ 1. D'abord, traiter spécifiquement les sections et arrows
    const sections = form.querySelectorAll('[id^="section-"], [id^="arrow-"]');
    console.log(`📋 ${sections.length} sections/arrows trouvées à renommer`);

    sections.forEach(element => {
        const oldId = element.id;
        let newId;

        if (element.id.startsWith('section-')) {
            const sectionName = element.id.replace('section-', '');
            newId = `${prefix}-section-${sectionName}`;
        } else if (element.id.startsWith('arrow-')) {
            const arrowName = element.id.replace('arrow-', '');
            newId = `${prefix}-arrow-${arrowName}`;
        }

        if (newId) {
            element.id = newId;
            console.log(`  🏷️ ${oldId} → ${newId}`);
        }
    });

    // ✅ 2. Ensuite, traiter tous les autres éléments avec ID/name
    const otherElements = form.querySelectorAll('[id]:not([id^="' + prefix + '-"]), [name]:not([name^="' + prefix + '"])');
    console.log(`📝 ${otherElements.length} autres éléments à renommer`);

    otherElements.forEach(element => {
        // Traiter les IDs
        if (element.id && !element.id.startsWith(prefix) && !element.id.startsWith('section-') && !element.id.startsWith('arrow-')) {
            const oldId = element.id;
            const newId = `${prefix}${element.id.charAt(0).toUpperCase()}${element.id.slice(1)}`;
            element.id = newId;
            console.log(`  🏷️ ID: ${oldId} → ${newId}`);
        }

        // Traiter les names
        if (element.name && !element.name.startsWith(prefix)) {
            const oldName = element.name;
            const newName = `${prefix}${element.name.charAt(0).toUpperCase()}${element.name.slice(1)}`;
            element.name = newName;
            console.log(`  📛 Name: ${oldName} → ${newName}`);
        }
    });

    // ✅ 3. Mettre à jour les data-name des radio buttons
    const customRadios = form.querySelectorAll('.custom-radio[data-name]');
    console.log(`🔘 ${customRadios.length} radio buttons trouvés`);

    customRadios.forEach(radio => {
        const currentName = radio.dataset.name;
        if (!currentName.startsWith(prefix)) {
            const newName = `${prefix}${currentName.charAt(0).toUpperCase()}${currentName.slice(1)}`;
            radio.dataset.name = newName;
            console.log(`  🔘 Radio data-name: ${currentName} → ${newName}`);
        }
    });

    // ✅ 4. Remplacer les onclick par des event listeners appropriés
    const sectionButtons = form.querySelectorAll('button[onclick*="toggleSection"]');
    console.log(`🔘 ${sectionButtons.length} boutons de section trouvés`);

    sectionButtons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        const sectionName = onclick.match(/toggleSection\('([^']+)'\)/)?.[1];

        if (sectionName) {
            // Supprimer l'ancien onclick
            button.removeAttribute('onclick');

            // Ajouter un event listener
            button.addEventListener('click', function(e) {
                e.preventDefault();
                toggleEditSection(sectionName);
                console.log(`🖱️ Clic sur section: ${sectionName}`);
            });

            console.log(`  🔘 Bouton configuré pour section: ${sectionName}`);
        }
    });

    // ✅ 5. Réinitialiser les radio buttons pour le formulaire d'édition
    console.log(`🔄 Initialisation des radio buttons pour le préfixe: ${prefix}`);
    initCustomRadioButtonsForForm(form, prefix);

    console.log(`✅ Mise à jour des IDs terminée pour le préfixe: ${prefix}`);
}


function toggleEditSection(sectionName) {
    // ✅ CORRECTION: Utiliser les IDs avec le préfixe 'edit-'
    const section = document.getElementById(`edit-section-${sectionName}`);
    const arrow = document.getElementById(`edit-arrow-${sectionName}`);

    if (section && arrow) {
        const isHidden = section.classList.contains('hidden');

        if (isHidden) {
            section.classList.remove('hidden');
            arrow.classList.remove('ri-arrow-down-s-line');
            arrow.classList.add('ri-arrow-up-s-line');
            console.log(`✅ Section ${sectionName} ouverte`);
        } else {
            section.classList.add('hidden');
            arrow.classList.remove('ri-arrow-up-s-line');
            arrow.classList.add('ri-arrow-down-s-line');
            console.log(`✅ Section ${sectionName} fermée`);
        }
    } else {
        console.warn(`❌ Section ou arrow non trouvé: edit-section-${sectionName}, edit-arrow-${sectionName}`);

        // ✅ DEBUG: Lister toutes les sections disponibles
        const allSections = document.querySelectorAll('[id*="section-"]');
        const allArrows = document.querySelectorAll('[id*="arrow-"]');

        console.log('🔍 Sections disponibles:', Array.from(allSections).map(s => s.id));
        console.log('🔍 Arrows disponibles:', Array.from(allArrows).map(a => a.id));
    }
}

function fillEditForm(anamnese) {
    // Remplir les champs de base
    const fields = {
        'editNumAnamnese': anamnese.numAnamnese,
        'editDateEntretien': formatDateForInput(anamnese.dateEntretien),
        'editNomPrenom': anamnese.nomPrenom,
        'editDateNaissance': formatDateForInput(anamnese.dateNaissance),
        'editAdressePar': anamnese.adressePar,
        'editMotifConsultation': anamnese.motifConsultation,
        'editReeducationAnterieure': anamnese.reeducationAnterieure,
        'editObservations': anamnese.observations
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
        }
    });

    // Patient
    if (anamnese.patient) {
        const patientIdField = document.getElementById('editPatientId');
        const patientSearchField = document.getElementById('editPatientSearch');
        const patientClearBtn = document.getElementById('editPatientClear');

        if (patientIdField) patientIdField.value = anamnese.patient.id;
        if (patientSearchField) patientSearchField.value = anamnese.nomPrenom;
        if (patientClearBtn) patientClearBtn.style.display = 'block';
    }

    // Parents
    if (anamnese.parents) {
        const parentFields = {
            'editNomPere': anamnese.parents.nomPere,
            'editAgePere': anamnese.parents.agePere,
            'editProfessionPere': anamnese.parents.professionPere,
            'editNomMere': anamnese.parents.nomMere,
            'editAgeMere': anamnese.parents.ageMere,
            'editProfessionMere': anamnese.parents.professionMere
        };

        Object.entries(parentFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    // ✅ RADIO BUTTONS avec la nouvelle méthode
    // Consanguinité
    if (anamnese.consanguinite !== null) {
        setCustomRadioValue('consanguinite', anamnese.consanguinite, 'edit');
    }

    const fraterieField = document.getElementById('editFraterie');
    if (fraterieField && anamnese.fraterie) {
        fraterieField.value = anamnese.fraterie;
    }

    // Grossesse
    if (anamnese.grossesse) {
        if (anamnese.grossesse.desire !== null) {
            setCustomRadioValue('grossesseDesire', anamnese.grossesse.desire, 'edit');
        }
        if (anamnese.grossesse.compliquee !== null) {
            setCustomRadioValue('grossesseCompliquee', anamnese.grossesse.compliquee, 'edit');
        }
        const grossesseAutresField = document.getElementById('editGrossesseAutres');
        if (grossesseAutresField && anamnese.grossesse.autres) {
            grossesseAutresField.value = anamnese.grossesse.autres;
        }
    }

    // Accouchement
    if (anamnese.accouchement) {
        const accouchementFields = ['terme', 'premature', 'postMature', 'voieBasse', 'cesarienne', 'cris'];
        accouchementFields.forEach(field => {
            if (anamnese.accouchement[field] !== null) {
                setCustomRadioValue(`accouchement${field.charAt(0).toUpperCase()}${field.slice(1)}`, anamnese.accouchement[field], 'edit');
            }
        });

        const accouchementAutresField = document.getElementById('editAccouchementAutres');
        if (accouchementAutresField && anamnese.accouchement.autres) {
            accouchementAutresField.value = anamnese.accouchement.autres;
        }
    }

    // Allaitement
    if (anamnese.allaitement) {
        if (anamnese.allaitement.type) {
            setCustomRadioValue('allaitementType', anamnese.allaitement.type, 'edit');
        }
        const allaitementDureeField = document.getElementById('editAllaitementDuree');
        if (allaitementDureeField && anamnese.allaitement.duree) {
            allaitementDureeField.value = anamnese.allaitement.duree;
        }
    }

    // Développement
    if (anamnese.developpement) {
        const devFields = {
            'editTenueTete': anamnese.developpement.tenueTete,
            'editPositionAssise': anamnese.developpement.positionAssise,
            'editQuatrePattes': anamnese.developpement.quatrePattes,
            'editPositionDebout': anamnese.developpement.positionDebout,
            'editMarche': anamnese.developpement.marche
        };

        Object.entries(devFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    // Langage
    if (anamnese.langage) {
        const langageFields = {
            'editPremierMot': anamnese.langage.premierMot,
            'editPremierePhrase': anamnese.langage.premierePhrase
        };

        Object.entries(langageFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    // Comportement
    if (anamnese.comportement) {
        const compFields = {
            'editCompMere': anamnese.comportement.avecMere,
            'editCompPere': anamnese.comportement.avecPere,
            'editCompFreres': anamnese.comportement.avecFreres,
            'editCompEcole': anamnese.comportement.aEcole,
            'editCompAutres': anamnese.comportement.autres
        };

        Object.entries(compFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    // Divers
    if (anamnese.divers) {
        const diversFields = {
            'editScolarisation': anamnese.divers.scolarisation,
            'editSommeil': anamnese.divers.sommeil,
            'editAppetit': anamnese.divers.appetit,
            'editProprete': anamnese.divers.proprete
        };

        Object.entries(diversFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    // Antécédents
    if (anamnese.antecedents) {
        const antFields = {
            'editAntecedentsPersonnels': anamnese.antecedents.personnels,
            'editAntecedentsFamiliaux': anamnese.antecedents.familiaux
        };

        Object.entries(antFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    if (anamnese.statut) {
        const editStatutSelect = document.getElementById('editStatut');
        if (editStatutSelect) {
            editStatutSelect.value = anamnese.statut;
        }
    }
}

function validateFormWithPrefix(prefix = '') {
    const getFieldId = (fieldName) => prefix ? `${prefix}${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}` : fieldName;

    const requiredFields = ['dateEntretien', 'nomPrenom', 'dateNaissance'];
    let isValid = true;
    const errors = [];

    requiredFields.forEach(fieldName => {
        const fieldId = getFieldId(fieldName);
        const field = document.getElementById(fieldId);

        if (!field) {
            console.error(`Champ ${fieldId} introuvable`);
            return;
        }

        if (!field.value.trim()) {
            field.classList.add('border-red-500');
            errors.push(fieldName);
            isValid = false;
        } else {
            field.classList.remove('border-red-500');
        }
    });

    if (!isValid) {
        showNotification('error', `Champs requis: ${errors.join(', ')}`);
    }

    return isValid;
}

// Sauvegarde des anamnèses
async function saveAnamnese(isEdit = false) {
    try {
        const prefix = isEdit ? 'edit' : '';

        // Validation basique des champs
        if (!validateFormWithPrefix(prefix)) {
            return;
        }

        // Récupération des données
        const formData = getFormData(prefix);

        // Validation des données
        if (!validateFormData(formData)) {
            return;
        }

        // ✅ AJOUT : Déterminer automatiquement le statut
        formData.statut = determineStatutAutomatique(formData);

        console.log('📤 Envoi des données:', formData);

        if (isEdit && selectedAnamnese) {
            // Ajouter le statut depuis le select si modifié manuellement
            const statutSelect = document.getElementById('editStatut');
            if (statutSelect) {
                const statutManuel = statutSelect.value;
                const statutAutomatique = determineStatutAutomatique(formData);

                // Si le statut manuel est différent de l'automatique, garder le manuel
                formData.statut = statutManuel !== statutAutomatique ? statutManuel : statutAutomatique;
            }

            const updatedAnamnese = await AnamneseAPI.update(selectedAnamnese.id, formData);

            // ✅ MODIFICATION : Message personnalisé selon le statut
            const statusMessage = formData.statut === 'TERMINE'
                ? 'Anamnèse mise à jour et marquée comme terminée !'
                : 'Anamnèse mise à jour (en cours).';

            showNotification('success', statusMessage);
            closeEditModal();
        } else {
            const newAnamnese = await AnamneseAPI.create(formData);

            // ✅ MODIFICATION : Message personnalisé selon le statut
            const statusMessage = formData.statut === 'TERMINE'
                ? 'Anamnèse créée et marquée comme terminée !'
                : 'Anamnèse créée en cours de rédaction.';

            showNotification('success', statusMessage);
            closeNewAnamneseModal();
        }

        await loadAnamneses();

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showNotification('error', error.message || 'Erreur lors de la sauvegarde');
    }
}

// Suppression des anamnèses
async function deleteAnamnese() {
    if (!selectedAnamnese) return;

    try {
        await AnamneseAPI.delete(selectedAnamnese.id);
        showNotification('success', 'Anamnèse supprimée avec succès');
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) modal.classList.add('hidden');
        selectedAnamnese = null;

        // Recharger la liste
        await loadAnamneses();

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('error', 'Erreur lors de la suppression');
    }
}

// ✅ AJOUT : Gestion des radio buttons personnalisés
function initCustomRadioButtons() {
    console.log('🔘 Initialisation des radio buttons personnalisés pour le formulaire principal');

    // Initialiser seulement pour le formulaire principal (nouveau)
    const mainForm = document.getElementById('newAnamneseForm');
    if (mainForm) {
        initCustomRadioButtonsForForm(mainForm, '');
    }
}

function initCustomRadioButtonsForForm(form, prefix = '') {
    console.log(`🔘 Initialisation des radio buttons pour le formulaire ${prefix || 'principal'}`);

    // Sélectionner uniquement les radio buttons du formulaire donné
    const radioContainers = form.querySelectorAll('.custom-radio-container');

    radioContainers.forEach(container => {
        // Supprimer les anciens event listeners
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);

        // Ajouter le nouvel event listener
        newContainer.addEventListener('click', function(e) {
            e.preventDefault();

            const radioButton = this.querySelector('.custom-radio');
            if (!radioButton) return;

            const name = radioButton.dataset.name;
            const value = radioButton.dataset.value;

            // Décocher tous les autres radio buttons du même groupe dans ce formulaire
            form.querySelectorAll(`.custom-radio[data-name="${name}"]`).forEach(radio => {
                radio.classList.remove('checked');
            });

            // Cocher celui cliqué
            radioButton.classList.add('checked');

            console.log(`✅ Radio sélectionné (${prefix}): ${name} = ${value}`);
        });
    });
}

function debugEditSections() {
    const editSections = ['parents', 'grossesse', 'accouchement', 'allaitement', 'developpement', 'langage', 'comportement', 'divers', 'antecedents', 'observations'];

    console.log('🔍 Debug des sections d\'édition:');
    editSections.forEach(sectionName => {
        const section = document.getElementById(`edit-section-${sectionName}`);
        const arrow = document.getElementById(`edit-arrow-${sectionName}`);

        console.log(`${sectionName}:`, {
            section: section ? '✅' : '❌',
            arrow: arrow ? '✅' : '❌'
        });
    });

    // ✅ BONUS: Afficher toutes les sections trouvées
    console.log('\n📋 Toutes les sections dans le DOM:');
    const allSections = document.querySelectorAll('[id*="section-"]');
    const allArrows = document.querySelectorAll('[id*="arrow-"]');

    allSections.forEach(section => console.log(`  Section: ${section.id}`));
    allArrows.forEach(arrow => console.log(`  Arrow: ${arrow.id}`));
}

// Notifications
function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const title = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');

    if (!notification || !title || !messageEl) return;

    // Configurer le type de notification
    notification.className = 'notification';
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
            title.textContent = 'Succès';
            break;
        case 'error':
            notification.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
            title.textContent = 'Erreur';
            break;
        case 'warning':
            notification.classList.add('bg-yellow-100', 'border-yellow-500', 'text-yellow-700');
            title.textContent = 'Attention';
            break;
        default:
            notification.classList.add('bg-blue-100', 'border-blue-500', 'text-blue-700');
            title.textContent = 'Information';
    }

    messageEl.textContent = message;
    notification.classList.add('show');

    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.className = 'notification';
        }, 300);
    }, 5000);
}

// Event Listeners
function initializeEventListeners() {

    //✅ AJOUT : Initialiser les radio buttons personnalisés
    initCustomRadioButtons();

    // Bouton nouvelle anamnèse
    const newAnamneseBtn = document.getElementById('newAnamneseBtn');
    if (newAnamneseBtn) newAnamneseBtn.addEventListener('click', openNewAnamneseModal);

    // Modals - Fermeture
    const closeNewBtn = document.getElementById('closeNewAnamneseBtn');
    const cancelNewBtn = document.getElementById('cancelNewAnamneseBtn');
    const closeEditBtn = document.getElementById('closeEditAnamneseBtn');
    const cancelEditBtn = document.getElementById('cancelEditAnamneseBtn');

    if (closeNewBtn) closeNewBtn.addEventListener('click', closeNewAnamneseModal);
    if (cancelNewBtn) cancelNewBtn.addEventListener('click', closeNewAnamneseModal);
    if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

    // Modals - Sauvegarde
    const saveNewBtn = document.getElementById('saveNewAnamneseBtn');
    const saveEditBtn = document.getElementById('saveEditAnamneseBtn');

    if (saveNewBtn) saveNewBtn.addEventListener('click', () => saveAnamnese(false));
    if (saveEditBtn) saveEditBtn.addEventListener('click', () => saveAnamnese(true));

    // Modal de suppression
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            const modal = document.getElementById('deleteConfirmModal');
            if (modal) modal.classList.add('hidden');
        });
    }
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteAnamnese);

    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterAnamneses, 300);
        });
    }

    // Filtres par statut
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Mettre à jour l'état actif
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active', 'bg-primary', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });

            this.classList.remove('bg-gray-100', 'text-gray-700');
            this.classList.add('active', 'bg-primary', 'text-white');

            // Appliquer le filtre
            currentFilter = this.dataset.filter;
            currentPage = 1;
            filterAnamneses();
        });
    });

    // Fermeture des modals en cliquant en dehors
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });

    // Touches clavier pour les modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Fermer tous les modals ouverts
            document.querySelectorAll('.modal').forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
}

// Initialisation de la page
async function initializePage() {
    try {
        console.log('🚀 Initialisation de la page anamnèse...');

        // 3. Afficher la date actuelle
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            currentDateEl.textContent = new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        // 4. Charger les données
        await loadPatients();
        await loadAnamneses();

        // 5. Initialiser la recherche de patients
        initPatientSearch('patientSearch', 'patientOptions', 'patientId', 'patientClear', 'nomPrenom');

        // 6. Initialiser les event listeners
        initializeEventListeners();

        // 7. Générer le numéro initial pour le nouveau formulaire
        try {
            const newNumber = await AnamneseAPI.generateNumber();
            const numField = document.getElementById('numAnamnese');
            if (numField) {
                numField.value = newNumber;
            }
        } catch (error) {
            console.error('Erreur génération numéro initial:', error);
        }

        // 8. Définir la date du jour par défaut
        const dateField = document.getElementById('dateEntretien');
        if (dateField) {
            dateField.valueAsDate = new Date();
        }

        console.log('✅ Page anamnèse initialisée avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showNotification('error', 'Erreur lors de l\'initialisation de la page');
    }
}

function verifyEditFormStructure() {
    const editForm = document.getElementById('editAnamneseForm');
    if (!editForm) {
        console.error('❌ Formulaire d\'édition non trouvé');
        return;
    }

    console.log('✅ Formulaire d\'édition trouvé');

    // Vérifier les sections avec le bon préfixe
    const editSections = editForm.querySelectorAll('[id^="edit-section-"]');
    const editArrows = editForm.querySelectorAll('[id^="edit-arrow-"]');
    const radios = editForm.querySelectorAll('.custom-radio');

    console.log(`📊 Structure du formulaire d'édition:`);
    console.log(`  - ${editSections.length} sections edit- trouvées`);
    console.log(`  - ${editArrows.length} arrows edit- trouvées`);
    console.log(`  - ${radios.length} radio buttons trouvés`);

    // Lister les IDs spécifiquement
    console.log(`🏷️ Sections edit-:`);
    editSections.forEach(section => console.log(`  ✅ ${section.id}`));

    console.log(`🏷️ Arrows edit-:`);
    editArrows.forEach(arrow => console.log(`  ✅ ${arrow.id}`));

    // Vérifier s'il reste des anciens IDs
    const oldSections = editForm.querySelectorAll('[id^="section-"]:not([id^="edit-section-"])');
    const oldArrows = editForm.querySelectorAll('[id^="arrow-"]:not([id^="edit-arrow-"])');

    if (oldSections.length > 0) {
        console.warn(`⚠️ ${oldSections.length} sections avec anciens IDs trouvées:`);
        oldSections.forEach(section => console.warn(`  ❌ ${section.id}`));
    }

    if (oldArrows.length > 0) {
        console.warn(`⚠️ ${oldArrows.length} arrows avec anciens IDs trouvées:`);
        oldArrows.forEach(arrow => console.warn(`  ❌ ${arrow.id}`));
    }

    return {
        editSections: editSections.length,
        editArrows: editArrows.length,
        oldSections: oldSections.length,
        oldArrows: oldArrows.length
    };
}

function checkURLParametersAnamnese() {
    const urlParams = new URLSearchParams(window.location.search);
    const openModal = urlParams.get('openModal');

    if (openModal === 'new') {
        console.log('🎯 Paramètre openModal=new détecté - ouverture automatique du modal anamnèse');

        // Attendre que la page soit complètement chargée
        setTimeout(() => {
            const newAnamneseBtn = document.getElementById('newAnamneseBtn');

            if (newAnamneseBtn) {
                console.log('📱 Ouverture automatique du modal nouvelle anamnèse');

                // Déclencher l'ouverture du modal comme si on avait cliqué sur le bouton
                newAnamneseBtn.click();

                // ✅ Nettoyer l'URL pour éviter que le modal se rouvre à chaque rafraîchissement
                const newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({}, document.title, newURL);

                console.log('✅ Modal anamnèse ouvert et URL nettoyée');
            } else {
                console.warn('⚠️ Bouton newAnamneseBtn non trouvé pour ouverture automatique');
            }
        }, 500); // Délai pour s'assurer que tous les éléments sont chargés
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('error', 'Une erreur inattendue s\'est produite');
});

// Gestion des erreurs de promesses non catchées
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesse rejetée non gérée:', e.reason);
    showNotification('error', 'Erreur de communication avec le serveur');
});

// Initialiser la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializePage);

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Initialisation de la page anamnèse...');

    // 2. ✅ NOUVEAU : Vérifier les paramètres URL pour ouverture automatique de modal
    checkURLParametersAnamnese();

    console.log('✅ Initialisation anamnèse terminée');
});

// Exposer les fonctions globalement si nécessaire
window.toggleSection = toggleSection;
window.toggleEditSection = toggleEditSection;
window.showNotification = showNotification;
window.debugEditSections = debugEditSections;
window.verifyEditFormStructure = verifyEditFormStructure;