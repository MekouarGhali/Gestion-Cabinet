// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let currentFilter = 'all';
let currentSort = 'name-asc';
let currentPage = 1;
let itemsPerPage = 8;
let filteredPatients = [];
let selectedPatient = null;
let allPatients = [];

// Classe pour gérer les appels API
class PatientAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/patients`);
            if (!response.ok) throw new Error('Erreur lors du chargement des patients');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des patients');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${id}`);
            if (!response.ok) throw new Error('Patient introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async getByStatus(status) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/statut/${status}`);
            if (!response.ok) throw new Error('Erreur lors du filtrage');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByStatus:', error);
            return [];
        }
    }

    static async search(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search:', error);
            return [];
        }
    }

    static async create(patientData) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            });
            if (!response.ok) throw new Error('Erreur lors de la création');
            return await response.json();
        } catch (error) {
            console.error('Erreur API create:', error);
            throw error;
        }
    }

    static async update(id, patientData) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour');
            return await response.json();
        } catch (error) {
            console.error('Erreur API update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            return true;
        } catch (error) {
            console.error('Erreur API delete:', error);
            throw error;
        }
    }
}

// Utilitaires
function calculateAge(birthDate) {
    if (!birthDate) return 'N/A';

    const today = new Date();
    const birth = new Date(birthDate);

    if (birth > today) {
        return 'N/A';
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years === 0) {
        if (months === 0) {
            return days <= 1 ? '1 jour' : `${days} jours`;
        }
        return months === 1 ? '1 mois' : `${months} mois`;
    }

    return years === 1 ? '1 an' : `${years} ans`;
}

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

function getAvatarColor(index) {
    const colors = [
        { bg: 'bg-indigo-200', text: 'text-indigo-700' },
        { bg: 'bg-blue-200', text: 'text-blue-700' },
        { bg: 'bg-red-200', text: 'text-red-700' },
        { bg: 'bg-green-200', text: 'text-green-700' },
        { bg: 'bg-purple-200', text: 'text-purple-700' },
        { bg: 'bg-yellow-200', text: 'text-yellow-700' },
        { bg: 'bg-pink-200', text: 'text-pink-700' }
    ];
    return colors[index % colors.length];
}

function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'actif': return 'status-actif';
        case 'inactif': return 'status-inactif';
        case 'nouveau': return 'status-nouveau';
        default: return 'status-nouveau';
    }
}

function getStatusLabel(status) {
    switch(status?.toLowerCase()) {
        case 'actif': return 'Actif';
        case 'inactif': return 'Inactif';
        case 'nouveau': return 'Nouveau';
        default: return 'Nouveau';
    }
}

// Gestion des patients
async function loadPatients() {
    try {
        allPatients = await PatientAPI.getAll();
        await filterPatients();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des patients');
    }
}

async function filterPatients() {
    try {
        if (currentFilter === 'all') {
            filteredPatients = [...allPatients];
        } else {
            filteredPatients = await PatientAPI.getByStatus(currentFilter);
        }

        const searchTerm = document.getElementById('searchInput').value.trim();
        if (searchTerm) {
            filteredPatients = await PatientAPI.search(searchTerm);
            if (currentFilter !== 'all') {
                filteredPatients = filteredPatients.filter(p => p.statut?.toLowerCase() === currentFilter);
            }
        }

        sortPatients();
        updatePatientsList();
    } catch (error) {
        console.error('Erreur lors du filtrage:', error);
        showNotification('error', 'Erreur lors du filtrage');
    }
}

function sortPatients() {
    filteredPatients.sort((a, b) => {
        switch(currentSort) {
            case 'name-asc':
                return (a.nom || '').localeCompare(b.nom || '');
            case 'name-desc':
                return (b.nom || '').localeCompare(a.nom || '');
            case 'date':
                return new Date(b.derniereVisite || 0) - new Date(a.derniereVisite || 0);
            case 'age':
                const ageA = calculateAge(a.dateNaissance);
                const ageB = calculateAge(b.dateNaissance);
                const numA = parseInt(ageA) || 0;
                const numB = parseInt(ageB) || 0;
                return numA - numB;
            default:
                return 0;
        }
    });
}

function updatePatientsList() {
    document.getElementById('totalPatients').textContent = filteredPatients.length;
    document.getElementById('gridTotalPatients').textContent = filteredPatients.length;

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredPatients.length);

    document.getElementById('startRange').textContent = filteredPatients.length ? start + 1 : 0;
    document.getElementById('endRange').textContent = end;
    document.getElementById('gridStartRange').textContent = filteredPatients.length ? start + 1 : 0;
    document.getElementById('gridEndRange').textContent = end;

    const currentPagePatients = filteredPatients.slice(start, end);

    renderTableView(currentPagePatients);
    renderGridView(currentPagePatients);
    createPagination(totalPages);
}

function renderTableView(patients) {
    const tableBody = document.getElementById('patientsTableBody');
    tableBody.innerHTML = '';

    if (patients.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                Aucun patient trouvé
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    patients.forEach((patient, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        const age = calculateAge(patient.dateNaissance);
        const statusClass = getStatusClass(patient.statut);
        const statusLabel = getStatusLabel(patient.statut);
        const avatarColor = getAvatarColor(index);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full ${avatarColor.bg} flex items-center justify-center ${avatarColor.text} mr-3">
                        <span class="text-xs font-medium">${patient.avatar || ''}</span>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${patient.prenom || ''} ${patient.nom || ''}</div>
                        <div class="text-xs text-gray-500">ID: ${patient.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${age}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${patient.telephone || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${patient.pathologie || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${formatDate(patient.derniereVisite)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                ${patient.seancesEffectuees || 0}/${patient.seancesPrevues || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-primary view-patient-btn" data-id="${patient.id}">
                        <i class="ri-file-list-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 edit-patient-btn" data-id="${patient.id}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-red-500 delete-patient-btn" data-id="${patient.id}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    addButtonEventListeners();
}

function renderGridView(patients) {
    const gridContainer = document.getElementById('gridView');
    gridContainer.innerHTML = '';

    if (patients.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'col-span-full text-center py-8 text-gray-500';
        emptyMessage.textContent = 'Aucun patient trouvé';
        gridContainer.appendChild(emptyMessage);
        return;
    }

    patients.forEach((patient, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200 grid-view-card';

        const age = calculateAge(patient.dateNaissance);
        const statusClass = getStatusClass(patient.statut);
        const statusLabel = getStatusLabel(patient.statut);
        const avatarColor = getAvatarColor(index);

        card.innerHTML = `
            <div class="p-4">
                <div class="flex items-center mb-4">
                    <div class="w-10 h-10 rounded-full ${avatarColor.bg} flex items-center justify-center ${avatarColor.text} mr-3">
                        <span class="font-medium">${patient.avatar || ''}</span>
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${patient.prenom || ''} ${patient.nom || ''}</div>
                        <div class="text-xs text-gray-500">ID: ${patient.id}</div>
                    </div>
                    <span class="status-badge ${statusClass} ml-auto">${statusLabel}</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600 mb-4">
                    <div class="flex items-center">
                        <div class="w-5 h-5 flex items-center justify-center mr-2 text-gray-400">
                            <i class="ri-calendar-line"></i>
                        </div>
                        <span>${age}</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-5 h-5 flex items-center justify-center mr-2 text-gray-400">
                            <i class="ri-phone-line"></i>
                        </div>
                        <span>${patient.telephone || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-5 h-5 flex items-center justify-center mr-2 text-gray-400">
                            <i class="ri-heart-pulse-line"></i>
                        </div>
                        <span class="truncate">${patient.pathologie || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-5 h-5 flex items-center justify-center mr-2 text-gray-400">
                            <i class="ri-time-line"></i>
                        </div>
                        <span>Dernière visite: ${formatDate(patient.derniereVisite)}</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-5 h-5 flex items-center justify-center mr-2 text-gray-400">
                            <i class="ri-calendar-check-line"></i>
                        </div>
                        <span>Séances: ${patient.seancesEffectuees || 0}/${patient.seancesPrevues || 0}</span>
                    </div>
                </div>
                <div class="flex justify-end space-x-2 border-t border-gray-100 pt-3">
                    <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary view-patient-btn" data-id="${patient.id}">
                        <i class="ri-file-list-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary edit-patient-btn" data-id="${patient.id}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 delete-patient-btn" data-id="${patient.id}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `;

        gridContainer.appendChild(card);
    });

    addButtonEventListeners();
}

function createPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    const gridPaginationContainer = document.getElementById('gridPaginationContainer');

    paginationContainer.innerHTML = '';
    gridPaginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    function createPaginationButtons(container) {
        const prevBtn = document.createElement('button');
        prevBtn.className = `px-3 py-1 border border-gray-300 rounded-button text-sm text-gray-700 bg-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
        prevBtn.innerHTML = 'Précédent';
        prevBtn.disabled = currentPage === 1;

        if (currentPage > 1) {
            prevBtn.addEventListener('click', () => {
                currentPage--;
                updatePatientsList();
            });
        }

        container.appendChild(prevBtn);

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
                    updatePatientsList();
                });
            }

            container.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = `px-3 py-1 border border-gray-300 rounded-button text-sm text-gray-700 bg-white ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
        nextBtn.innerHTML = 'Suivant';
        nextBtn.disabled = currentPage === totalPages;

        if (currentPage < totalPages) {
            nextBtn.addEventListener('click', () => {
                currentPage++;
                updatePatientsList();
            });
        }

        container.appendChild(nextBtn);
    }

    createPaginationButtons(paginationContainer);
    createPaginationButtons(gridPaginationContainer);
}

function addButtonEventListeners() {
    console.log('🔧 Ajout des event listeners pour les boutons...');

    // Boutons "Voir le dossier"
    document.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const patientId = this.dataset.id;
            console.log('👁️ Clic sur voir dossier pour patient ID:', patientId);

            const patient = await PatientAPI.getById(patientId);

            if (patient) {
                selectedPatient = patient;
                // Appeler la fonction du module patient-records
                if (typeof openPatientRecords === 'function') {
                    await openPatientRecords(patient);
                } else {
                    console.error('Module patient-records non chargé ou fonction openPatientRecords non disponible');
                    showNotification('error', 'Erreur lors de l\'ouverture du dossier patient');
                }
            }
        });
    });

    // Boutons "Modifier"
    document.querySelectorAll('.edit-patient-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const patientId = this.dataset.id;
            console.log('✏️ Clic sur modifier pour patient ID:', patientId);

            try {
                const patient = await PatientAPI.getById(patientId);
                console.log('📋 Patient récupéré:', patient);

                if (patient) {
                    openEditPatientModal(patient);
                } else {
                    console.error('❌ Patient non trouvé');
                    showNotification('error', 'Patient introuvable');
                }
            } catch (error) {
                console.error('❌ Erreur lors de la récupération du patient:', error);
                showNotification('error', 'Erreur lors du chargement du patient');
            }
        });
    });

    // Boutons "Supprimer"
    document.querySelectorAll('.delete-patient-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const patientId = this.dataset.id;
            console.log('🗑️ Clic sur supprimer pour patient ID:', patientId);

            const patient = await PatientAPI.getById(patientId);

            if (patient) {
                selectedPatient = patient;
                const deleteModal = document.getElementById('deleteConfirmModal');
                if (deleteModal) {
                    deleteModal.classList.remove('hidden');
                    // Force l'affichage avec du CSS direct et z-index élevé
                    deleteModal.style.display = 'flex';
                    deleteModal.style.opacity = '1';
                    deleteModal.style.zIndex = '9999';
                    deleteModal.style.position = 'fixed';
                    deleteModal.style.top = '0';
                    deleteModal.style.left = '0';
                    deleteModal.style.width = '100%';
                    deleteModal.style.height = '100%';
                    console.log('🗑️ Modal suppression ouvert');
                }
            }
        });
    });

    console.log('✅ Event listeners ajoutés:', {
        view: document.querySelectorAll('.view-patient-btn').length,
        edit: document.querySelectorAll('.edit-patient-btn').length,
        delete: document.querySelectorAll('.delete-patient-btn').length
    });
}

// Modals (CRUD seulement - sans modal ajout séances)
function openEditPatientModal(patient) {
    console.log('✏️ Ouverture modal édition pour:', patient.prenom, patient.nom);

    const editModal = document.getElementById('editPatientModal');
    if (!editModal) {
        console.error('❌ Modal editPatientModal introuvable');
        return;
    }

    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('editFirstName').value = patient.prenom || '';
    document.getElementById('editLastName').value = patient.nom || '';
    document.getElementById('editBirthDate').value = patient.dateNaissance || '';
    document.getElementById('editPhone').value = patient.telephone || '';
    document.getElementById('editPathology').value = patient.pathologie || '';
    document.getElementById('editSessionCount').value = patient.seancesEffectuees || 0;
    document.getElementById('editTotalSessions').value = patient.seancesPrevues || 0;

    // Sexe
    document.querySelectorAll('#editPatientModal .custom-radio').forEach(radio => {
        radio.classList.remove('checked');
    });

    if (patient.sexe === 'M') {
        document.getElementById('editGenderMale').classList.add('checked');
    } else if (patient.sexe === 'F') {
        document.getElementById('editGenderFemale').classList.add('checked');
    }

    // Switch
    const activeSwitch = document.getElementById('editActiveStatus');
    if (patient.statut === 'inactif') {
        activeSwitch.classList.add('checked');
    } else {
        activeSwitch.classList.remove('checked');
    }

    console.log('📱 Ouverture du modal...');
    editModal.classList.remove('hidden');
    // Force l'affichage avec du CSS direct et z-index élevé
    editModal.style.display = 'flex';
    editModal.style.opacity = '1';
    editModal.style.zIndex = '9999';
    editModal.style.position = 'fixed';
    editModal.style.top = '0';
    editModal.style.left = '0';
    editModal.style.width = '100%';
    editModal.style.height = '100%';
    console.log('✅ Modal édition ouvert');
}

// Validation et sauvegarde
function validatePatientForm(isEdit = false) {
    const prefix = isEdit ? 'edit' : '';
    const firstNameId = isEdit ? 'editFirstName' : 'firstName';
    const lastNameId = isEdit ? 'editLastName' : 'lastName';
    const phoneId = isEdit ? 'editPhone' : 'phone';
    const pathologyId = isEdit ? 'editPathology' : 'pathology';
    const totalSessionsId = isEdit ? 'editTotalSessions' : 'totalSessions';
    const birthDateId = isEdit ? 'editBirthDate' : 'birthDate';

    const requiredFields = [firstNameId, lastNameId, phoneId, pathologyId, totalSessionsId, birthDateId];
    let valid = true;
    let hasEmptyFields = false;
    let hasFutureDate = false;

    // Vérifier les champs vides
    requiredFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input.value.trim()) {
            input.classList.add('border-red-500');
            valid = false;
            hasEmptyFields = true;
        } else {
            input.classList.remove('border-red-500');
        }
    });

    // Validation date de naissance
    const birthDateInput = document.getElementById(birthDateId);
    if (birthDateInput.value) {
        const today = new Date();
        const birthDate = new Date(birthDateInput.value);

        if (birthDate > today) {
            birthDateInput.classList.add('border-red-500');
            valid = false;
            hasFutureDate = true;
        } else {
            birthDateInput.classList.remove('border-red-500');
        }
    }

    // Vérifier le sexe
    const modalId = isEdit ? 'editPatientModal' : 'newPatientModal';
    const genderSelected = document.querySelector(`#${modalId} .custom-radio.checked`);
    if (!genderSelected) {
        valid = false;
        hasEmptyFields = true;
        document.querySelectorAll(`#${modalId} .custom-radio`).forEach(r => {
            r.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        });
    } else {
        document.querySelectorAll(`#${modalId} .custom-radio`).forEach(r => {
            r.style.borderColor = '#d1d5db';
        });
    }

    if (!valid) {
        if (hasEmptyFields) {
            showNotification('error', 'Veuillez remplir tous les champs obligatoires.');
        } else if (hasFutureDate) {
            showNotification('error', 'La date de naissance ne peut pas être dans le futur.');
        }
    }

    return valid;
}

async function saveNewPatient() {
    if (!validatePatientForm()) return;

    const genderSelected = document.querySelector('#newPatientModal .custom-radio.checked');

    const patientData = {
        prenom: document.getElementById('firstName').value.trim(),
        nom: document.getElementById('lastName').value.trim(),
        dateNaissance: document.getElementById('birthDate').value,
        sexe: genderSelected.dataset.gender,
        telephone: document.getElementById('phone').value.trim(),
        pathologie: document.getElementById('pathology').value.trim(),
        seancesPrevues: parseInt(document.getElementById('totalSessions').value) || 0
    };

    try {
        await PatientAPI.create(patientData);
        const newModal = document.getElementById('newPatientModal');
        newModal.classList.add('hidden');
        newModal.style.display = 'none';
        showNotification('success', 'Patient ajouté avec succès!');
        await loadPatients();
    } catch (error) {
        showNotification('error', 'Erreur lors de la création du patient');
    }
}

async function saveEditedPatient() {
    if (!validatePatientForm(true)) return;

    const patientId = document.getElementById('editPatientId').value;
    const genderSelected = document.querySelector('#editPatientModal .custom-radio.checked');

    const activeSwitch = document.getElementById('editActiveStatus');
    const isSwitchChecked = activeSwitch.classList.contains('checked');
    const sessionsDone = parseInt(document.getElementById('editSessionCount').value) || 0;

    let newStatus;
    if (isSwitchChecked) {
        newStatus = 'inactif';
    } else {
        newStatus = sessionsDone > 0 ? 'actif' : 'nouveau';
    }

    const patientData = {
        prenom: document.getElementById('editFirstName').value.trim(),
        nom: document.getElementById('editLastName').value.trim(),
        dateNaissance: document.getElementById('editBirthDate').value,
        sexe: genderSelected.dataset.gender,
        telephone: document.getElementById('editPhone').value.trim(),
        pathologie: document.getElementById('editPathology').value.trim(),
        seancesEffectuees: sessionsDone,
        seancesPrevues: parseInt(document.getElementById('editTotalSessions').value) || 0,
        statut: newStatus
    };

    try {
        const updatedPatient = await PatientAPI.update(patientId, patientData);
        const editModal = document.getElementById('editPatientModal');
        editModal.classList.add('hidden');
        editModal.style.display = 'none';
        showNotification('success', 'Patient modifié avec succès!');
        selectedPatient = updatedPatient;
        await loadPatients();
    } catch (error) {
        showNotification('error', 'Erreur lors de la modification du patient');
    }
}

async function deletePatient() {
    if (!selectedPatient) return;

    try {
        await PatientAPI.delete(selectedPatient.id);
        const deleteModal = document.getElementById('deleteConfirmModal');
        deleteModal.classList.add('hidden');
        deleteModal.style.display = 'none';
        showNotification('success', 'Patient supprimé avec succès!');
        await loadPatients();
    } catch (error) {
        showNotification('error', 'Erreur lors de la suppression du patient');
    }
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
            notificationIcon.innerHTML = '<svg viewBox="0 0 20 20"><path fill="#FFCC00" d="M10 2L2 18h16L10 2z"/><path fill="#000" d="M10 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 6a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-3 0v-3A1.5 1.5 0 0110 6z"/></svg>';
            notificationTitle.textContent = 'Information';
            break;
    }

    notificationMessage.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    form.reset();

    form.querySelectorAll('.custom-radio').forEach(radio => {
        radio.classList.remove('checked');
        radio.style.borderColor = '#d1d5db';
    });

    form.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
    });
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

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Initialisation de la page patients...');

    // 1. Charger la sidebar
    try {
        const response = await fetch('/partials/sidebar.html');
        const sidebarHTML = await response.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;
        console.log('✅ Sidebar chargée');
    } catch (error) {
        console.error("❌ Erreur lors du chargement de la sidebar :", error);
    }

    checkURLParameters();

    // 3. Attendre que la sidebar soit chargée puis configurer les event listeners
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

    // 4. Configurer la date actuelle
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

    // 5. Configurer les filtres patients
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
            filterPatients();
        });
    });

    // 6. Configurer la recherche
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                filterPatients();
            }, 300);
        });
    }

    // 7. Configurer le dropdown de tri
    const sortDropdownBtn = document.getElementById('sortDropdownBtn');
    const sortDropdown = document.getElementById('sortDropdown');

    if (sortDropdownBtn && sortDropdown) {
        sortDropdownBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            sortDropdown.classList.toggle('show');
        });

        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                currentSort = this.dataset.sort;
                sortDropdownBtn.querySelector('span').textContent = 'Trier par: ' + this.textContent.trim();
                sortDropdown.classList.remove('show');
                filterPatients();
            });
        });

        // Fermer le dropdown si on clique ailleurs
        document.addEventListener('click', function (e) {
            if (!sortDropdownBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
                sortDropdown.classList.remove('show');
            }
        });
    }

    // 8. Configurer les vues liste/grille
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableView = document.getElementById('tableView');
    const gridView = document.getElementById('gridView');
    const gridPagination = document.getElementById('gridPagination');

    if (listViewBtn && gridViewBtn && tableView && gridView && gridPagination) {
        listViewBtn.addEventListener('click', function () {
            // Activer vue liste
            listViewBtn.classList.add('bg-gray-100', 'text-gray-700');
            listViewBtn.classList.remove('bg-white');
            gridViewBtn.classList.remove('bg-gray-100', 'text-gray-700');
            gridViewBtn.classList.add('bg-white');

            // Afficher/masquer les vues
            tableView.classList.remove('hidden');
            gridView.classList.add('hidden');
            gridPagination.classList.add('hidden');
        });

        gridViewBtn.addEventListener('click', function () {
            // Activer vue grille
            gridViewBtn.classList.add('bg-gray-100', 'text-gray-700');
            gridViewBtn.classList.remove('bg-white');
            listViewBtn.classList.remove('bg-gray-100', 'text-gray-700');
            listViewBtn.classList.add('bg-white');

            // Afficher/masquer les vues
            tableView.classList.add('hidden');
            gridView.classList.remove('hidden');
            gridPagination.classList.remove('hidden');
        });
    }

    // 9. Initialiser les modals et charger les patients
    setupModalEventListeners();
    await loadPatients();

    console.log('✅ Initialisation terminée');
});

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const openModal = urlParams.get('openModal');

    if (openModal === 'new') {
        console.log('🎯 Paramètre openModal=new détecté - ouverture automatique du modal');

        // Attendre que la page soit complètement chargée
        setTimeout(() => {
            const newPatientModal = document.getElementById('newPatientModal');
            const newPatientBtn = document.getElementById('newPatientBtn');

            if (newPatientModal && newPatientBtn) {
                console.log('📱 Ouverture automatique du modal nouveau patient');

                // Déclencher l'ouverture du modal comme si on avait cliqué sur le bouton
                newPatientBtn.click();

                // ✅ Nettoyer l'URL pour éviter que le modal se rouvre à chaque rafraîchissement
                const newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({}, document.title, newURL);

                console.log('✅ Modal ouvert et URL nettoyée');
            } else {
                console.warn('⚠️ Éléments modal non trouvés pour ouverture automatique');
            }
        }, 500); // Délai pour s'assurer que tous les éléments sont chargés
    }
}

function setupModalEventListeners() {
    console.log('⚙️ Configuration des event listeners pour les modals...');

    // Modal nouveau patient
    const newPatientBtn = document.getElementById('newPatientBtn');
    const newPatientModal = document.getElementById('newPatientModal');
    const closeNewPatientBtn = document.getElementById('closeNewPatientBtn');
    const cancelNewPatientBtn = document.getElementById('cancelNewPatientBtn');
    const saveNewPatientBtn = document.getElementById('saveNewPatientBtn');

    console.log('🔍 Éléments trouvés:', {
        newPatientBtn: !!newPatientBtn,
        newPatientModal: !!newPatientModal,
        closeNewPatientBtn: !!closeNewPatientBtn,
        cancelNewPatientBtn: !!cancelNewPatientBtn,
        saveNewPatientBtn: !!saveNewPatientBtn
    });

    if (newPatientBtn && newPatientModal) {
        newPatientBtn.addEventListener('click', function() {
            console.log('➕ Clic sur nouveau patient - Ouverture modal');
            console.log('Modal state before:', newPatientModal.classList.contains('hidden'));
            newPatientModal.classList.remove('hidden');
            // Force l'affichage avec du CSS direct et z-index élevé
            newPatientModal.style.display = 'flex';
            newPatientModal.style.opacity = '1';
            newPatientModal.style.zIndex = '9999';
            newPatientModal.style.position = 'fixed';
            newPatientModal.style.top = '0';
            newPatientModal.style.left = '0';
            newPatientModal.style.width = '100%';
            newPatientModal.style.height = '100%';
            console.log('Modal state after:', newPatientModal.classList.contains('hidden'));
            resetForm('newPatientForm');
        });
        console.log('✅ Bouton nouveau patient configuré');
    } else {
        console.error('❌ Bouton nouveau patient ou modal introuvable');
    }

    if (closeNewPatientBtn) {
        closeNewPatientBtn.addEventListener('click', function() {
            console.log('❌ Fermeture modal nouveau patient');
            newPatientModal.classList.add('hidden');
            newPatientModal.style.display = 'none';
        });
    }

    if (cancelNewPatientBtn) {
        cancelNewPatientBtn.addEventListener('click', function() {
            console.log('🚫 Annulation nouveau patient');
            newPatientModal.classList.add('hidden');
            newPatientModal.style.display = 'none';
        });
    }

    if (saveNewPatientBtn) {
        saveNewPatientBtn.addEventListener('click', saveNewPatient);
    }

    // Modal édition patient
    const editPatientModal = document.getElementById('editPatientModal');
    const closeEditPatientBtn = document.getElementById('closeEditPatientBtn');
    const cancelEditPatientBtn = document.getElementById('cancelEditPatientBtn');
    const saveEditPatientBtn = document.getElementById('saveEditPatientBtn');
    const editActiveStatus = document.getElementById('editActiveStatus');

    if (closeEditPatientBtn && editPatientModal) {
        closeEditPatientBtn.addEventListener('click', function() {
            console.log('❌ Fermeture modal édition');
            editPatientModal.classList.add('hidden');
            editPatientModal.style.display = 'none';
        });
    }

    if (cancelEditPatientBtn && editPatientModal) {
        cancelEditPatientBtn.addEventListener('click', function() {
            console.log('🚫 Annulation édition');
            editPatientModal.classList.add('hidden');
            editPatientModal.style.display = 'none';
        });
    }

    if (editActiveStatus) {
        editActiveStatus.addEventListener('click', function() {
            this.classList.toggle('checked');
        });
    }

    if (saveEditPatientBtn) {
        saveEditPatientBtn.addEventListener('click', saveEditedPatient);
    }

    // Modal confirmation suppression
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (cancelDeleteBtn && deleteConfirmModal) {
        cancelDeleteBtn.addEventListener('click', function() {
            console.log('🚫 Annulation suppression');
            deleteConfirmModal.classList.add('hidden');
            deleteConfirmModal.style.display = 'none';
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            console.log('✅ Confirmation suppression');
            deletePatient();
        });
    }

    // Boutons radio personnalisés
    document.querySelectorAll('.custom-radio').forEach(radio => {
        radio.addEventListener('click', function() {
            const form = this.closest('form') || this.closest('.modal');
            if (form) {
                form.querySelectorAll('.custom-radio').forEach(r => {
                    r.classList.remove('checked');
                });
            }
            this.classList.add('checked');
        });
    });
}

// Exporter la classe PatientAPI pour utilisation dans patient-records.js
window.PatientAPI = PatientAPI;