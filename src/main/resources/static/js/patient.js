document.addEventListener('DOMContentLoaded', function() {
    // State management
    const state = {
        currentFilter: 'all',
        currentSort: 'name-asc',
        currentPage: 1,
        itemsPerPage: 7,
        patients: [],
        selectedPatient: null
    };

    // Initialize app
    init();

    async function init() {
        await loadPatients();
        setupEventListeners();
        updateCurrentDate();
    }

    // Event Listeners
    function setupEventListeners() {
        // New patient button
        document.getElementById('newPatientBtn').addEventListener('click', showNewPatientModal);

        // Search input
        document.getElementById('searchInput').addEventListener('input', debounce(() => {
            state.currentPage = 1;
            loadPatients();
        }, 300));
    }

    // API Functions
    async function loadPatients() {
        try {
            let url = '/api/patients';
            if (state.currentFilter !== 'all') {
                url = `/api/patients/statut/${state.currentFilter}`;
            }

            const searchTerm = document.getElementById('searchInput').value.trim();
            if (searchTerm) {
                url = `/api/patients/search?q=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            state.patients = await response.json();
            renderPatients();
        } catch (error) {
            console.error('Error loading patients:', error);
            showNotification('error', 'Erreur lors du chargement des patients');
        }
    }

    async function createPatient(patientData) {
        try {
            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            });

            if (!response.ok) throw new Error('Error creating patient');

            return await response.json();
        } catch (error) {
            console.error('Error creating patient:', error);
            throw error;
        }
    }

    async function updatePatient(id, patientData) {
        try {
            const response = await fetch(`/api/patients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            });

            if (!response.ok) throw new Error('Error updating patient');

            return await response.json();
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    }

    async function deletePatient(id) {
        try {
            const response = await fetch(`/api/patients/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error deleting patient');

            return true;
        } catch (error) {
            console.error('Error deleting patient:', error);
            throw error;
        }
    }

    // Rendering Functions
    function renderPatients() {
        const container = document.getElementById('patientsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex space-x-2">
                        <button class="filter-btn ${state.currentFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}" 
                                data-filter="all">Tous</button>
                        <button class="filter-btn ${state.currentFilter === 'actif' ? 'bg-blue-600 text-white' : 'bg-gray-100'}" 
                                data-filter="actif">Actifs</button>
                        <button class="filter-btn ${state.currentFilter === 'inactif' ? 'bg-blue-600 text-white' : 'bg-gray-100'}" 
                                data-filter="inactif">Inactifs</button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="listViewBtn" class="view-toggle-btn active">
                            <i class="ri-list-check-2"></i>
                        </button>
                        <button id="gridViewBtn" class="view-toggle-btn">
                            <i class="ri-grid-line"></i>
                        </button>
                    </div>
                </div>
                <div id="patientsView"></div>
            </div>
        `;

        // Add filter event listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                state.currentFilter = this.dataset.filter;
                state.currentPage = 1;
                loadPatients();
            });
        });

        // Add view toggle listeners
        document.getElementById('listViewBtn').addEventListener('click', () => {
            document.getElementById('listViewBtn').classList.add('active');
            document.getElementById('gridViewBtn').classList.remove('active');
            renderTableView();
        });

        document.getElementById('gridViewBtn').addEventListener('click', () => {
            document.getElementById('gridViewBtn').classList.add('active');
            document.getElementById('listViewBtn').classList.remove('active');
            renderGridView();
        });

        // Render default view
        renderTableView();
    }

    function renderTableView() {
        const viewContainer = document.getElementById('patientsView');
        if (!viewContainer) return;

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const paginatedPatients = state.patients.slice(startIndex, startIndex + state.itemsPerPage);

        viewContainer.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pathologie</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière visite</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Séances</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="patientsTableBody" class="bg-white divide-y divide-gray-200"></tbody>
                </table>
            </div>
            ${renderPagination()}
        `;

        const tableBody = document.getElementById('patientsTableBody');
        if (paginatedPatients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">Aucun patient trouvé</td>
                </tr>
            `;
            return;
        }

        paginatedPatients.forEach(patient => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3">
                            <span class="text-xs font-medium">${patient.avatar}</span>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${patient.prenom} ${patient.nom}</div>
                            <div class="text-xs text-gray-500">ID: ${patient.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${calculateAge(patient.dateNaissance)} ans
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${patient.telephone}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${patient.pathologie}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${formatDate(patient.derniereVisite)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    ${patient.seancesEffectuees}/${patient.seancesPrevues}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${getStatusClass(patient.statut)}">
                        ${getStatusLabel(patient.statut)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button class="action-btn view-btn" data-id="${patient.id}">
                            <i class="ri-file-list-line"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${patient.id}">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${patient.id}">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        addPatientActionListeners();
    }

    function renderGridView() {
        const viewContainer = document.getElementById('patientsView');
        if (!viewContainer) return;

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const paginatedPatients = state.patients.slice(startIndex, startIndex + state.itemsPerPage);

        viewContainer.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${paginatedPatients.length > 0 ?
            paginatedPatients.map(patient => `
                        <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                            <div class="p-4">
                                <div class="flex items-center mb-4">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3">
                                        <span class="font-medium">${patient.avatar}</span>
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900">${patient.prenom} ${patient.nom}</div>
                                        <div class="text-xs text-gray-500">${patient.id}</div>
                                    </div>
                                    <span class="status-badge ${getStatusClass(patient.statut)} ml-auto">
                                        ${getStatusLabel(patient.statut)}
                                    </span>
                                </div>
                                <div class="space-y-2 text-sm text-gray-600 mb-4">
                                    <div class="flex items-center">
                                        <i class="ri-calendar-line mr-2 text-gray-400"></i>
                                        <span>${calculateAge(patient.dateNaissance)} ans</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="ri-phone-line mr-2 text-gray-400"></i>
                                        <span>${patient.telephone}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="ri-heart-pulse-line mr-2 text-gray-400"></i>
                                        <span class="truncate">${patient.pathologie}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="ri-time-line mr-2 text-gray-400"></i>
                                        <span>Dernière visite: ${formatDate(patient.derniereVisite)}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="ri-calendar-check-line mr-2 text-gray-400"></i>
                                        <span>Séances: ${patient.seancesEffectuees}/${patient.seancesPrevues}</span>
                                    </div>
                                </div>
                                <div class="flex justify-end space-x-2 border-t border-gray-100 pt-3">
                                    <button class="action-btn view-btn" data-id="${patient.id}">
                                        <i class="ri-file-list-line"></i>
                                    </button>
                                    <button class="action-btn edit-btn" data-id="${patient.id}">
                                        <i class="ri-edit-line"></i>
                                    </button>
                                    <button class="action-btn delete-btn" data-id="${patient.id}">
                                        <i class="ri-delete-bin-line"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') :
            '<div class="col-span-full text-center py-8 text-gray-500">Aucun patient trouvé</div>'}
            </div>
            ${renderPagination()}
        `;

        addPatientActionListeners();
    }

    function renderPagination() {
        const totalPages = Math.ceil(state.patients.length / state.itemsPerPage);
        if (totalPages <= 1) return '';

        return `
            <div class="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div class="text-sm text-gray-700">
                    Affichage de <span class="font-medium">${Math.min((state.currentPage - 1) * state.itemsPerPage + 1, state.patients.length)}</span> 
                    à <span class="font-medium">${Math.min(state.currentPage * state.itemsPerPage, state.patients.length)}</span> 
                    sur <span class="font-medium">${state.patients.length}</span> patients
                </div>
                <div class="flex space-x-2">
                    <button class="pagination-btn ${state.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${state.currentPage === 1 ? 'disabled' : ''} data-page="prev">
                        Précédent
                    </button>
                    ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = state.currentPage <= 3 ? i + 1 :
                state.currentPage >= totalPages - 2 ? totalPages - 4 + i :
                    state.currentPage - 2 + i;
            return `
                            <button class="pagination-btn ${state.currentPage === page ? 'bg-blue-600 text-white' : ''}" 
                                    data-page="${page}">
                                ${page}
                            </button>
                        `;
        }).join('')}
                    <button class="pagination-btn ${state.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${state.currentPage === totalPages ? 'disabled' : ''} data-page="next">
                        Suivant
                    </button>
                </div>
            </div>
        `;
    }

    function addPatientActionListeners() {
        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.dataset.id;
                state.selectedPatient = state.patients.find(p => p.id == patientId);
                showPatientDetailsModal();
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.dataset.id;
                state.selectedPatient = state.patients.find(p => p.id == patientId);
                showEditPatientModal();
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.dataset.id;
                state.selectedPatient = state.patients.find(p => p.id == patientId);
                showDeleteConfirmationModal();
            });
        });

        // Pagination buttons
        document.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const pageAction = this.dataset.page;

                if (pageAction === 'prev' && state.currentPage > 1) {
                    state.currentPage--;
                } else if (pageAction === 'next' && state.currentPage < Math.ceil(state.patients.length / state.itemsPerPage)) {
                    state.currentPage++;
                } else if (!isNaN(pageAction)) {
                    state.currentPage = parseInt(pageAction);
                }

                if (document.getElementById('listViewBtn').classList.contains('active')) {
                    renderTableView();
                } else {
                    renderGridView();
                }
            });
        });
    }

    // Modal Functions
    function showNewPatientModal() {
        const modalHTML = `
            <div id="newPatientModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">Nouveau Patient</h3>
                        <button id="closeNewPatientBtn" class="text-gray-400 hover:text-gray-500">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto">
                        <form id="newPatientForm">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="prenom" class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                    <input type="text" id="prenom" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                                <div>
                                    <label for="nom" class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input type="text" id="nom" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="dateNaissance" class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                                    <input type="date" id="dateNaissance" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                                    <div class="flex space-x-4 mt-2">
                                        <div class="flex items-center">
                                            <input type="radio" id="sexeHomme" name="sexe" value="homme" class="mr-2">
                                            <label for="sexeHomme" class="text-sm text-gray-700">Homme</label>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="radio" id="sexeFemme" name="sexe" value="femme" class="mr-2">
                                            <label for="sexeFemme" class="text-sm text-gray-700">Femme</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-4">
                                <label for="telephone" class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input type="tel" id="telephone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                            </div>
                            <div class="mb-4">
                                <label for="pathologie" class="block text-sm font-medium text-gray-700 mb-1">Pathologie</label>
                                <input type="text" id="pathologie" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                            </div>
                            <div class="mb-4">
                                <label for="seancesPrevues" class="block text-sm font-medium text-gray-700 mb-1">Nombre de séances prévues</label>
                                <input type="number" id="seancesPrevues" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                            </div>
                        </form>
                    </div>
                    <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button id="cancelNewPatientBtn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Annuler
                        </button>
                        <button id="saveNewPatientBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
        document.getElementById('newPatientModal').classList.remove('hidden');

        // Add event listeners
        document.getElementById('closeNewPatientBtn').addEventListener('click', () => {
            document.getElementById('newPatientModal').classList.add('hidden');
        });

        document.getElementById('cancelNewPatientBtn').addEventListener('click', () => {
            document.getElementById('newPatientModal').classList.add('hidden');
        });

        document.getElementById('saveNewPatientBtn').addEventListener('click', async () => {
            if (validatePatientForm()) {
                try {
                    const patientData = {
                        nom: document.getElementById('nom').value.trim(),
                        prenom: document.getElementById('prenom').value.trim(),
                        sexe: document.querySelector('input[name="sexe"]:checked')?.value,
                        telephone: document.getElementById('telephone').value.trim(),
                        pathologie: document.getElementById('pathologie').value.trim(),
                        dateNaissance: document.getElementById('dateNaissance').value,
                        seancesPrevues: parseInt(document.getElementById('seancesPrevues').value),
                        seancesEffectuees: 0
                    };

                    await createPatient(patientData);
                    showNotification('success', 'Patient créé avec succès');
                    document.getElementById('newPatientModal').classList.add('hidden');
                    loadPatients();
                } catch (error) {
                    showNotification('error', 'Erreur lors de la création du patient');
                }
            }
        });
    }

    function showEditPatientModal() {
        if (!state.selectedPatient) return;

        const modalHTML = `
            <div id="editPatientModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">Modifier Patient</h3>
                        <button id="closeEditPatientBtn" class="text-gray-400 hover:text-gray-500">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto">
                        <form id="editPatientForm">
                            <input type="hidden" id="editPatientId" value="${state.selectedPatient.id}">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="editPrenom" class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                    <input type="text" id="editPrenom" value="${state.selectedPatient.prenom}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                                <div>
                                    <label for="editNom" class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input type="text" id="editNom" value="${state.selectedPatient.nom}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="editDateNaissance" class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                                    <input type="date" id="editDateNaissance" value="${state.selectedPatient.dateNaissance}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                                    <div class="flex space-x-4 mt-2">
                                        <div class="flex items-center">
                                            <input type="radio" id="editSexeHomme" name="editSexe" value="homme" ${state.selectedPatient.sexe === 'homme' ? 'checked' : ''} class="mr-2">
                                            <label for="editSexeHomme" class="text-sm text-gray-700">Homme</label>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="radio" id="editSexeFemme" name="editSexe" value="femme" ${state.selectedPatient.sexe === 'femme' ? 'checked' : ''} class="mr-2">
                                            <label for="editSexeFemme" class="text-sm text-gray-700">Femme</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-4">
                                <label for="editTelephone" class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input type="tel" id="editTelephone" value="${state.selectedPatient.telephone}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                            </div>
                            <div class="mb-4">
                                <label for="editPathologie" class="block text-sm font-medium text-gray-700 mb-1">Pathologie</label>
                                <input type="text" id="editPathologie" value="${state.selectedPatient.pathologie}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="editSeancesEffectuees" class="block text-sm font-medium text-gray-700 mb-1">Séances effectuées</label>
                                    <input type="number" id="editSeancesEffectuees" min="0" value="${state.selectedPatient.seancesEffectuees}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                                <div>
                                    <label for="editSeancesPrevues" class="block text-sm font-medium text-gray-700 mb-1">Séances prévues</label>
                                    <input type="number" id="editSeancesPrevues" min="1" value="${state.selectedPatient.seancesPrevues}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button id="cancelEditPatientBtn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Annuler
                        </button>
                        <button id="saveEditPatientBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
        document.getElementById('editPatientModal').classList.remove('hidden');

        // Add event listeners
        document.getElementById('closeEditPatientBtn').addEventListener('click', () => {
            document.getElementById('editPatientModal').classList.add('hidden');
        });

        document.getElementById('cancelEditPatientBtn').addEventListener('click', () => {
            document.getElementById('editPatientModal').classList.add('hidden');
        });

        document.getElementById('saveEditPatientBtn').addEventListener('click', async () => {
            if (validateEditPatientForm()) {
                try {
                    const patientData = {
                        nom: document.getElementById('editNom').value.trim(),
                        prenom: document.getElementById('editPrenom').value.trim(),
                        sexe: document.querySelector('input[name="editSexe"]:checked')?.value,
                        telephone: document.getElementById('editTelephone').value.trim(),
                        pathologie: document.getElementById('editPathologie').value.trim(),
                        dateNaissance: document.getElementById('editDateNaissance').value,
                        seancesPrevues: parseInt(document.getElementById('editSeancesPrevues').value),
                        seancesEffectuees: parseInt(document.getElementById('editSeancesEffectuees').value)
                    };

                    await updatePatient(state.selectedPatient.id, patientData);
                    showNotification('success', 'Patient modifié avec succès');
                    document.getElementById('editPatientModal').classList.add('hidden');
                    loadPatients();
                } catch (error) {
                    showNotification('error', 'Erreur lors de la modification du patient');
                }
            }
        });
    }

    function showPatientDetailsModal() {
        if (!state.selectedPatient) return;

        const modalHTML = `
            <div id="patientDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3">
                                <span class="font-medium">${state.selectedPatient.avatar}</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${state.selectedPatient.prenom} ${state.selectedPatient.nom}</h3>
                                <div class="text-sm text-gray-500">ID: ${state.selectedPatient.id}</div>
                            </div>
                        </div>
                        <button id="closePatientDetailsBtn" class="text-gray-400 hover:text-gray-500">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 class="text-md font-medium text-gray-800 mb-4">Informations du patient</h4>
                                <div class="space-y-4">
                                    <div>
                                        <p class="text-sm text-gray-500">Date de naissance</p>
                                        <p class="text-sm text-gray-800">${formatDate(state.selectedPatient.dateNaissance)} (${calculateAge(state.selectedPatient.dateNaissance)} ans)</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Sexe</p>
                                        <p class="text-sm text-gray-800">${state.selectedPatient.sexe === 'homme' ? 'Homme' : 'Femme'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Téléphone</p>
                                        <p class="text-sm text-gray-800">${state.selectedPatient.telephone}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Pathologie</p>
                                        <p class="text-sm text-gray-800">${state.selectedPatient.pathologie}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-md font-medium text-gray-800 mb-4">Suivi des séances</h4>
                                <div class="mb-4">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-sm font-medium text-gray-700">Progression</span>
                                        <span class="text-sm text-gray-500">${state.selectedPatient.seancesEffectuees}/${state.selectedPatient.seancesPrevues} séances</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${(state.selectedPatient.seancesEffectuees / state.selectedPatient.seancesPrevues) * 100}%"></div>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Statut</p>
                                    <p class="text-sm">
                                        <span class="status-badge ${getStatusClass(state.selectedPatient.statut)}">
                                            ${getStatusLabel(state.selectedPatient.statut)}
                                        </span>
                                    </p>
                                </div>
                                <div class="mt-4">
                                    <p class="text-sm text-gray-500">Dernière visite</p>
                                    <p class="text-sm text-gray-800">${formatDate(state.selectedPatient.derniereVisite)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                        <button id="closePatientDetailsBtn2" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
        document.getElementById('patientDetailsModal').classList.remove('hidden');

        // Add event listeners
        document.getElementById('closePatientDetailsBtn').addEventListener('click', () => {
            document.getElementById('patientDetailsModal').classList.add('hidden');
        });

        document.getElementById('closePatientDetailsBtn2').addEventListener('click', () => {
            document.getElementById('patientDetailsModal').classList.add('hidden');
        });
    }

    function showDeleteConfirmationModal() {
        if (!state.selectedPatient) return;

        Swal.fire({
            title: 'Confirmer la suppression',
            text: `Êtes-vous sûr de vouloir supprimer ${state.selectedPatient.prenom} ${state.selectedPatient.nom} ?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deletePatient(state.selectedPatient.id);
                    showNotification('success', 'Patient supprimé avec succès');
                    loadPatients();
                } catch (error) {
                    showNotification('error', 'Erreur lors de la suppression du patient');
                }
            }
        });
    }

    // Form Validation
    function validatePatientForm() {
        let isValid = true;
        const requiredFields = ['prenom', 'nom', 'dateNaissance', 'telephone', 'pathologie', 'seancesPrevues'];

        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (!element.value.trim()) {
                element.classList.add('border-red-500');
                isValid = false;
            } else {
                element.classList.remove('border-red-500');
            }
        });

        if (!document.querySelector('input[name="sexe"]:checked')) {
            document.getElementById('sexeHomme').closest('div').classList.add('text-red-500');
            document.getElementById('sexeFemme').closest('div').classList.add('text-red-500');
            isValid = false;
        } else {
            document.getElementById('sexeHomme').closest('div').classList.remove('text-red-500');
            document.getElementById('sexeFemme').closest('div').classList.remove('text-red-500');
        }

        if (!isValid) {
            showNotification('error', 'Veuillez remplir tous les champs obligatoires');
        }

        return isValid;
    }

    function validateEditPatientForm() {
        let isValid = true;
        const requiredFields = ['editPrenom', 'editNom', 'editDateNaissance', 'editTelephone', 'editPathologie', 'editSeancesPrevues', 'editSeancesEffectuees'];

        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (!element.value.trim()) {
                element.classList.add('border-red-500');
                isValid = false;
            } else {
                element.classList.remove('border-red-500');
            }
        });

        if (!document.querySelector('input[name="editSexe"]:checked')) {
            document.getElementById('editSexeHomme').closest('div').classList.add('text-red-500');
            document.getElementById('editSexeFemme').closest('div').classList.add('text-red-500');
            isValid = false;
        } else {
            document.getElementById('editSexeHomme').closest('div').classList.remove('text-red-500');
            document.getElementById('editSexeFemme').closest('div').classList.remove('text-red-500');
        }

        if (!isValid) {
            showNotification('error', 'Veuillez remplir tous les champs obligatoires');
        }

        return isValid;
    }

    // Utility Functions
    function calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }

    function getStatusClass(status) {
        return {
            'actif': 'bg-green-100 text-green-800',
            'inactif': 'bg-gray-100 text-gray-800',
            'nouveau': 'bg-yellow-100 text-yellow-800'
        }[status.toLowerCase()] || 'bg-blue-100 text-blue-800';
    }

    function getStatusLabel(status) {
        return {
            'actif': 'Actif',
            'inactif': 'Inactif',
            'nouveau': 'Nouveau'
        }[status.toLowerCase()] || status;
    }

    function showNotification(type, message) {
        Swal.fire({
            icon: type,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function updateCurrentDate() {
        const today = new Date();
        document.getElementById('currentDate').textContent = today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
});