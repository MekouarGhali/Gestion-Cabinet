// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let allRevenus = [];
let filteredRevenus = [];
let currentFilter = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth() + 1;
let currentViewingRevenu = null; // Pour stocker le revenu actuellement visualisé

// Variables pour la période sélectionnée
let selectedPeriod = {
    type: 'current', // 'current', 'previous', 'custom'
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
};

// Variables pour les graphiques
let monthlyRevenueChart = null;
let revenueByTypeChart = null;

// Classes API
class RevenuAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus`);
            if (!response.ok) throw new Error('Erreur lors du chargement des revenus');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des revenus');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/${id}`);
            if (!response.ok) throw new Error('Revenu introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async search(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API search:', error);
            return [];
        }
    }

    static async getByStatut(statut) {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/statut/${statut}`);
            if (!response.ok) throw new Error('Erreur lors du filtrage par statut');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByStatut:', error);
            return [];
        }
    }

    static async getStatistics() {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/statistics`);
            if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getStatistics:', error);
            return {};
        }
    }

    static async getMonthlyRevenueByYear(year) {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/stats/monthly/${year}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des données mensuelles');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getMonthlyRevenueByYear:', error);
            return [];
        }
    }

    static async getYearlyRevenue() {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/stats/yearly`);
            if (!response.ok) throw new Error('Erreur lors du chargement des données annuelles');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getYearlyRevenue:', error);
            return [];
        }
    }

    static async getRevenueByPrestationType(year, month) {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/stats/prestations/${year}/${month}`);
            if (!response.ok) throw new Error('Erreur lors du chargement de la répartition');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getRevenueByPrestationType:', error);
            return [];
        }
    }

    static async updateStatut(id, statut) {
        try {
            const response = await fetch(`${API_BASE_URL}/revenus/${id}/statut`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ statut })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API updateStatut:', error);
            throw error;
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

class FactureAPI {
    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/factures/${id}`);
            if (!response.ok) throw new Error('Facture introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById facture:', error);
            return null;
        }
    }
}

// Utilitaires
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function formatCurrency(amount) {
    return `${amount.toFixed(2)} DH`;
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

function getStatutClass(statut) {
    switch(statut) {
        case 'PAYE': return 'status-paye';
        case 'EN_ATTENTE': return 'status-attente';
        case 'ANNULE': return 'status-annule';
        default: return 'status-attente';
    }
}

function getStatutLabel(statut) {
    switch(statut) {
        case 'PAYE': return 'Payé';
        case 'EN_ATTENTE': return 'En attente';
        case 'ANNULE': return 'Annulé';
        default: return 'Inconnu';
    }
}

// ================================
// NOUVELLES FONCTIONS DE FILTRAGE PAR PÉRIODE
// ================================

function filterRevenusForPeriod(revenus) {
    return revenus.filter(revenu => {
        const revenuDate = new Date(revenu.dateTransaction);
        const revenuYear = revenuDate.getFullYear();
        const revenuMonth = revenuDate.getMonth() + 1;

        return revenuYear === selectedPeriod.year && revenuMonth === selectedPeriod.month;
    });
}

function calculatePeriodStatistics(revenus) {
    const periodRevenus = filterRevenusForPeriod(revenus);

    // Calculer les statistiques pour la période sélectionnée
    const currentMonthTotal = periodRevenus
        .filter(r => r.statut === 'PAYE')
        .reduce((sum, r) => sum + r.montant, 0);

    const currentMonthSessions = periodRevenus.length;

    // Calculer la période précédente pour comparison
    let previousYear = selectedPeriod.year;
    let previousMonth = selectedPeriod.month - 1;

    if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = selectedPeriod.year - 1;
    }

    const previousPeriodRevenus = revenus.filter(revenu => {
        const revenuDate = new Date(revenu.dateTransaction);
        const revenuYear = revenuDate.getFullYear();
        const revenuMonth = revenuDate.getMonth() + 1;
        return revenuYear === previousYear && revenuMonth === previousMonth;
    });

    const previousMonthTotal = previousPeriodRevenus
        .filter(r => r.statut === 'PAYE')
        .reduce((sum, r) => sum + r.montant, 0);

    const previousMonthSessions = previousPeriodRevenus.length;

    // Calculer les évolutions
    const evolutionMensuelle = previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

    const evolutionSeances = previousMonthSessions > 0
        ? ((currentMonthSessions - previousMonthSessions) / previousMonthSessions) * 100
        : 0;

    // Revenus de l'année complète (pour la période sélectionnée)
    const yearRevenus = revenus.filter(revenu => {
        const revenuDate = new Date(revenu.dateTransaction);
        return revenuDate.getFullYear() === selectedPeriod.year;
    });

    const currentYearTotal = yearRevenus
        .filter(r => r.statut === 'PAYE')
        .reduce((sum, r) => sum + r.montant, 0);

    // Année précédente pour comparison
    const previousYearRevenus = revenus.filter(revenu => {
        const revenuDate = new Date(revenu.dateTransaction);
        return revenuDate.getFullYear() === selectedPeriod.year - 1;
    });

    const previousYearTotal = previousYearRevenus
        .filter(r => r.statut === 'PAYE')
        .reduce((sum, r) => sum + r.montant, 0);

    const evolutionAnnuelle = previousYearTotal > 0
        ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100
        : 0;

    // Paiements en attente (tous confondus, pas juste la période)
    const montantEnAttente = revenus
        .filter(r => r.statut === 'EN_ATTENTE')
        .reduce((sum, r) => sum + r.montant, 0);

    const paiementsEnAttente = revenus.filter(r => r.statut === 'EN_ATTENTE').length;

    return {
        revenusCurrentMonth: currentMonthTotal,
        revenusPreviousMonth: previousMonthTotal,
        evolutionMensuelle: Math.round(evolutionMensuelle * 100) / 100,
        revenusCurrentYear: currentYearTotal,
        revenusPreviousYear: previousYearTotal,
        evolutionAnnuelle: Math.round(evolutionAnnuelle * 100) / 100,
        seancesCurrentMonth: currentMonthSessions,
        seancesPreviousMonth: previousMonthSessions,
        evolutionSeances: Math.round(evolutionSeances * 100) / 100,
        montantEnAttente: montantEnAttente,
        paiementsEnAttente: paiementsEnAttente
    };
}

function setPeriod(type, customYear = null, customMonth = null) {
    const now = new Date();

    switch(type) {
        case 'current':
            selectedPeriod = {
                type: 'current',
                year: now.getFullYear(),
                month: now.getMonth() + 1
            };
            break;
        case 'previous':
            let prevMonth = now.getMonth(); // 0-11
            let prevYear = now.getFullYear();

            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = prevYear - 1;
            }

            selectedPeriod = {
                type: 'previous',
                year: prevYear,
                month: prevMonth
            };
            break;
        case 'custom':
            selectedPeriod = {
                type: 'custom',
                year: customYear || now.getFullYear(),
                month: customMonth || now.getMonth() + 1
            };
            break;
    }

    // Mettre à jour l'affichage de la période sélectionnée
    updatePeriodDisplay();

    // Recharger toutes les données avec la nouvelle période
    refreshDataForPeriod();
}

function updatePeriodDisplay() {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const periodText = `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
    document.getElementById('selectedPeriod').textContent = periodText;

    // Mettre à jour aussi les variables globales pour les graphiques
    selectedYear = selectedPeriod.year;
    selectedMonth = selectedPeriod.month;
}

async function refreshDataForPeriod() {
    console.log('🔄 Actualisation des données pour la période:', selectedPeriod);

    try {
        // Charger toutes les données
        allRevenus = await RevenuAPI.getAll();

        // Calculer les statistiques pour la période
        const periodStats = calculatePeriodStatistics(allRevenus);
        updateStatisticsDisplay(periodStats);

        // Filtrer les revenus pour la période ET appliquer les autres filtres
        applyAllFilters();

        // Mettre à jour les graphiques
        await updateCharts(selectedYear);

        console.log('✅ Données actualisées pour la période');

    } catch (error) {
        console.error('❌ Erreur lors de l\'actualisation:', error);
        showNotification('error', 'Erreur lors de l\'actualisation des données');
    }
}

// ================================
// FONCTIONS EXISTANTES MODIFIÉES
// ================================

// Gestion des données
async function loadRevenus() {
    try {
        allRevenus = await RevenuAPI.getAll();
        applyAllFilters();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des revenus');
    }
}

async function loadStatistics() {
    try {
        // Utiliser les statistiques calculées localement selon la période
        const stats = calculatePeriodStatistics(allRevenus);
        updateStatisticsDisplay(stats);
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Afficher des valeurs par défaut en cas d'erreur
        updateStatisticsDisplay({
            revenusCurrentMonth: 0,
            revenusPreviousMonth: 0,
            evolutionMensuelle: 0,
            revenusCurrentYear: 0,
            revenusPreviousYear: 0,
            evolutionAnnuelle: 0,
            seancesCurrentMonth: 0,
            seancesPreviousMonth: 0,
            evolutionSeances: 0,
            montantEnAttente: 0,
            paiementsEnAttente: 0
        });
    }
}

function updateStatisticsDisplay(stats) {
    // Revenus du mois
    document.getElementById('revenusCurrentMonth').textContent = formatCurrency(stats.revenusCurrentMonth || 0);
    document.getElementById('revenusPreviousMonth').textContent = `vs. mois précédent (${formatCurrency(stats.revenusPreviousMonth || 0)})`;

    const evolutionMensuelle = stats.evolutionMensuelle || 0;
    const evolutionMensuelleEl = document.getElementById('evolutionMensuelle');
    evolutionMensuelleEl.innerHTML = `
        <i class="ri-arrow-${evolutionMensuelle >= 0 ? 'up' : 'down'}-s-line mr-1"></i>
        ${evolutionMensuelle >= 0 ? '+' : ''}${evolutionMensuelle.toFixed(1)}%
    `;
    evolutionMensuelleEl.className = `ml-2 text-sm font-medium flex items-center ${evolutionMensuelle >= 0 ? 'text-green-500' : 'text-red-500'}`;

    // Revenus de l'année
    document.getElementById('revenusCurrentYear').textContent = formatCurrency(stats.revenusCurrentYear || 0);
    document.getElementById('revenusPreviousYear').textContent = `vs. année précédente (${formatCurrency(stats.revenusPreviousYear || 0)})`;

    const evolutionAnnuelle = stats.evolutionAnnuelle || 0;
    const evolutionAnnuelleEl = document.getElementById('evolutionAnnuelle');
    evolutionAnnuelleEl.innerHTML = `
        <i class="ri-arrow-${evolutionAnnuelle >= 0 ? 'up' : 'down'}-s-line mr-1"></i>
        ${evolutionAnnuelle >= 0 ? '+' : ''}${evolutionAnnuelle.toFixed(1)}%
    `;
    evolutionAnnuelleEl.className = `ml-2 text-sm font-medium flex items-center ${evolutionAnnuelle >= 0 ? 'text-green-500' : 'text-red-500'}`;

    // Séances du mois
    document.getElementById('seancesCurrentMonth').textContent = stats.seancesCurrentMonth || 0;
    document.getElementById('seancesPreviousMonth').textContent = `vs. mois précédent (${stats.seancesPreviousMonth || 0})`;

    const evolutionSeances = stats.evolutionSeances || 0;
    const evolutionSeancesEl = document.getElementById('evolutionSeances');
    evolutionSeancesEl.innerHTML = `
        <i class="ri-arrow-${evolutionSeances >= 0 ? 'up' : 'down'}-s-line mr-1"></i>
        ${evolutionSeances >= 0 ? '+' : ''}${evolutionSeances.toFixed(1)}%
    `;
    evolutionSeancesEl.className = `ml-2 text-sm font-medium flex items-center ${evolutionSeances >= 0 ? 'text-green-500' : 'text-red-500'}`;

    // Paiements en attente
    document.getElementById('montantEnAttente').textContent = formatCurrency(stats.montantEnAttente || 0);
    document.getElementById('paiementsEnAttenteCount').textContent = `${stats.paiementsEnAttente || 0} paiement(s) en attente`;
}

// Gestion des filtres MODIFIÉE
function applyAllFilters() {
    let result = [...allRevenus];

    // 1. NOUVEAU: Filtrer par période sélectionnée POUR L'HISTORIQUE SEULEMENT
    result = filterRevenusForPeriod(result);

    // 2. Filtre par statut
    if (currentFilter !== 'all') {
        result = result.filter(r => r.statut === currentFilter);
    }

    filteredRevenus = result;
    updateRevenusList();
}

function updateRevenusList() {
    document.getElementById('totalTransactions').textContent = filteredRevenus.length;

    const totalPages = Math.ceil(filteredRevenus.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredRevenus.length);

    document.getElementById('startRange').textContent = filteredRevenus.length ? start + 1 : 0;
    document.getElementById('endRange').textContent = end;

    const currentPageRevenus = filteredRevenus.slice(start, end);

    renderRevenusTable(currentPageRevenus);
    createPagination(totalPages);
}

function renderRevenusTable(revenus) {
    const tableBody = document.getElementById('transactionsTableBody');
    const noTransactions = document.getElementById('noTransactions');

    tableBody.innerHTML = '';

    if (revenus.length === 0) {
        noTransactions.classList.remove('hidden');
        return;
    }

    noTransactions.classList.add('hidden');

    revenus.forEach((revenu, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transaction-row';

        const avatarColor = getAvatarColor(index);
        const initials = revenu.nomCompletPatient
            .split(' ')
            .map(n => n.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(revenu.dateTransaction)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full ${avatarColor.bg} flex items-center justify-center text-sm font-medium ${avatarColor.text} mr-3">${initials}</div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${revenu.nomCompletPatient}</div>
                        <div class="text-xs text-gray-500">Facture: ${revenu.numeroFacture}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${revenu.mutuelle === 'oui' ? 'Oui' : 'Non'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatCurrency(revenu.montant)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <span class="status-badge ${getStatutClass(revenu.statut)}">${getStatutLabel(revenu.statut)}</span>
                    ${revenu.statut !== 'PAYE' ? `
                        <button class="ml-2 w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-800 change-status-btn" 
                                data-id="${revenu.id}" data-status="PAYE" title="Marquer comme payé">
                            <i class="ri-check-line"></i>
                        </button>
                    ` : ''}
                    ${revenu.statut === 'PAYE' ? `
                        <button class="ml-2 w-6 h-6 flex items-center justify-center text-orange-600 hover:text-orange-800 change-status-btn" 
                                data-id="${revenu.id}" data-status="EN_ATTENTE" title="Marquer en attente">
                            <i class="ri-time-line"></i>
                        </button>
                    ` : ''}
                    ${revenu.statut !== 'ANNULE' ? `
                        <button class="ml-2 w-6 h-6 flex items-center justify-center text-red-600 hover:text-red-800 change-status-btn" 
                                data-id="${revenu.id}" data-status="ANNULE" title="Annuler">
                            <i class="ri-close-line"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                    <button class="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 view-transaction-btn" 
                            data-id="${revenu.id}" title="Voir détails de la transaction">
                        <i class="ri-eye-line mr-3"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    addTableEventListeners();
}

function addTableEventListeners() {
    // Boutons de visualisation des transactions
    document.querySelectorAll('.view-transaction-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const revenuId = this.dataset.id;
            await viewTransactionDetails(revenuId);
        });
    });

    // Boutons d'ouverture du dossier patient
    document.querySelectorAll('.open-patient-records-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const patientId = this.dataset.patientId;
            await openPatientRecordsFromRevenu(patientId);
        });
    });

    // Boutons de changement de statut rapide
    document.querySelectorAll('.change-status-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const revenuId = this.dataset.id;
            const newStatus = this.dataset.status;
            await changeRevenuStatusQuick(revenuId, newStatus);
        });
    });
}

// Fonction pour visualiser les détails d'une transaction (comme dans la maquette)
async function viewTransactionDetails(revenuId) {
    try {
        console.log('📊 Chargement des détails de la transaction:', revenuId);

        // Récupérer les détails du revenu
        const revenu = await RevenuAPI.getById(revenuId);
        if (!revenu) {
            showNotification('error', 'Transaction introuvable');
            return;
        }

        currentViewingRevenu = revenu;

        // Récupérer les détails de la facture pour avoir plus d'informations
        let facture = null;
        try {
            facture = await FactureAPI.getById(revenu.facture.id);
        } catch (error) {
            console.warn('Impossible de charger les détails de la facture:', error);
        }

        const modal = document.getElementById('transactionModal');
        const detailsContainer = document.getElementById('transactionDetails');

        if (!modal || !detailsContainer) {
            console.error('❌ Modal ou container des détails non trouvé');
            showNotification('error', 'Interface non disponible');
            return;
        }

        const avatarColor = getAvatarColor(0);
        const initials = revenu.nomCompletPatient
            .split(' ')
            .map(n => n.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();

        // Construire le contenu du modal avec tous les détails
        let prestationsHTML = '';
        if (facture && facture.prestations && facture.prestations.length > 0) {
            prestationsHTML = `
                <div class="mb-6">
                    <div class="text-sm text-gray-500 mb-1">Prestations</div>
                    <ul class="list-disc pl-5 text-sm text-gray-700">
                        ${facture.prestations.map(p => `
                            <li>${p.designation} (Qté: ${p.quantite}, Prix: ${p.prixUnitaire} DH)</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        detailsContainer.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full ${avatarColor.bg} flex items-center justify-center text-sm font-medium ${avatarColor.text} mr-3">${initials}</div>
                    <div>
                        <div class="text-base font-medium text-gray-900">${revenu.nomCompletPatient}</div>
                        <div class="text-sm text-gray-500">Patient ID: ${revenu.patient.id}</div>
                    </div>
                </div>
                <span class="status-badge ${getStatutClass(revenu.statut)}">${getStatutLabel(revenu.statut)}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <div class="text-sm text-gray-500 mb-1">Date</div>
                    <div class="text-sm font-medium text-gray-900">${formatDate(revenu.dateTransaction)}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 mb-1">Heure</div>
                    <div class="text-sm font-medium text-gray-900">${new Date(revenu.createdAt || revenu.dateTransaction).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 mb-1">Montant</div>
                    <div class="text-sm font-medium text-gray-900">${formatCurrency(revenu.montant)}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 mb-1">Mode de paiement</div>
                    <div class="text-sm font-medium text-gray-900">${revenu.modePaiement}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 mb-1">Numéro de facture</div>
                    <div class="text-sm font-medium text-gray-900">${revenu.numeroFacture}</div>
                </div>
                <div>
                    <div class="text-sm text-gray-500 mb-1">Mutuelle</div>
                    <div class="text-sm font-medium text-gray-900">${revenu.mutuelle === 'oui' ? 'Oui' : 'Non'}</div>
                </div>
            </div>

            ${prestationsHTML}

            <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                <button class="px-4 py-2 bg-blue-600 text-white rounded-button hover:bg-blue-700 flex items-center" onclick="openPatientRecordsFromCurrentRevenu()">
                    <i class="ri-user-line mr-2"></i>
                    Voir dossier patient
                </button>
                
                ${revenu.statut !== 'PAYE' ? `
                    <div class="flex space-x-2">
                        <button class="px-4 py-2 bg-green-600 text-white rounded-button hover:bg-green-700" onclick="updateRevenuStatut(${revenu.id}, 'PAYE')">
                            <i class="ri-check-line mr-1"></i> Marquer payé
                        </button>
                        ${revenu.statut !== 'ANNULE' ? `
                            <button class="px-4 py-2 bg-red-600 text-white rounded-button hover:bg-red-700" onclick="updateRevenuStatut(${revenu.id}, 'ANNULE')">
                                <i class="ri-close-line mr-1"></i> Annuler
                            </button>
                        ` : ''}
                    </div>
                ` : revenu.statut === 'PAYE' ? `
                    <button class="px-4 py-2 bg-orange-600 text-white rounded-button hover:bg-orange-700" onclick="updateRevenuStatut(${revenu.id}, 'EN_ATTENTE')">
                        <i class="ri-time-line mr-1"></i> Marquer en attente
                    </button>
                ` : ''}
            </div>
        `;

        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
        console.log('✅ Modal de transaction affiché');

    } catch (error) {
        console.error('❌ Erreur lors de la visualisation de la transaction:', error);
        showNotification('error', 'Erreur lors du chargement des détails de la transaction');
    }
}

// Fonction pour ouvrir le dossier patient depuis le revenu actuel
async function openPatientRecordsFromCurrentRevenu() {
    if (currentViewingRevenu && currentViewingRevenu.patient) {
        // Fermer le modal de transaction
        document.getElementById('transactionModal').classList.add('hidden');

        // Ouvrir le dossier patient
        await openPatientRecordsFromRevenu(currentViewingRevenu.patient.id);
    }
}

// Fonction pour ouvrir le dossier patient depuis l'ID
async function openPatientRecordsFromRevenu(patientId) {
    try {
        console.log('📂 Ouverture du dossier patient ID:', patientId);

        // Récupérer les données complètes du patient
        const patient = await PatientAPI.getById(patientId);

        if (!patient) {
            showNotification('error', 'Patient introuvable');
            return;
        }

        // Vérifier si la fonction openPatientRecords est disponible (depuis patient-records.js)
        if (typeof openPatientRecords === 'function') {
            console.log('📋 Ouverture du dossier patient:', patient.prenom, patient.nom);
            openPatientRecords(patient);
        } else {
            console.error('❌ Fonction openPatientRecords non disponible');
            // Fallback : rediriger vers la page patient avec l'ID
            window.location.href = `/patient.html?openRecords=${patientId}`;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture du dossier patient:', error);
        showNotification('error', 'Erreur lors de l\'ouverture du dossier patient');
    }
}

// Fonction pour changement de statut rapide (depuis le tableau)
async function changeRevenuStatusQuick(revenuId, newStatus) {
    try {
        const statusLabels = {
            'PAYE': 'payé',
            'EN_ATTENTE': 'en attente',
            'ANNULE': 'annulé'
        };

        await RevenuAPI.updateStatut(revenuId, newStatus);
        showNotification('success', `Statut mis à jour : ${statusLabels[newStatus]}`);

        // Recharger les données avec la période actuelle
        await refreshDataForPeriod();
    } catch (error) {
        console.error('Erreur lors du changement de statut:', error);
        showNotification('error', 'Erreur lors de la mise à jour du statut');
    }
}

// Fonction pour mettre à jour le statut depuis le modal (avec confirmation)
async function updateRevenuStatut(revenuId, newStatus) {
    try {
        const statusLabels = {
            'PAYE': 'payé',
            'EN_ATTENTE': 'en attente',
            'ANNULE': 'annulé'
        };

        if (confirm(`Êtes-vous sûr de vouloir marquer ce revenu comme ${statusLabels[newStatus]} ?`)) {
            await RevenuAPI.updateStatut(revenuId, newStatus);
            showNotification('success', `Statut mis à jour : ${statusLabels[newStatus]}`);

            // Fermer le modal
            document.getElementById('transactionModal').classList.add('hidden');

            // Recharger les données avec la période actuelle
            await refreshDataForPeriod();
        }
    } catch (error) {
        console.error('Erreur lors du changement de statut:', error);
        showNotification('error', 'Erreur lors de la mise à jour du statut');
    }
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
            updateRevenusList();
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
                updateRevenusList();
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
            updateRevenusList();
        });
    }

    paginationContainer.appendChild(nextBtn);
}

// Gestion des graphiques
async function initializeCharts() {
    monthlyRevenueChart = echarts.init(document.getElementById('monthlyRevenueChart'));
    revenueByTypeChart = echarts.init(document.getElementById('revenueByTypeChart'));

    await updateCharts(selectedYear);
}

async function updateCharts(year) {
    try {
        if (year === 'all') {
            // Affichage par années
            const yearlyData = await RevenuAPI.getYearlyRevenue();
            updateMonthlyChart(yearlyData, true);
        } else {
            // Affichage par mois pour l'année sélectionnée
            const monthlyData = await RevenuAPI.getMonthlyRevenueByYear(year);
            updateMonthlyChart(monthlyData, false);
        }

        // Mettre à jour le graphique de répartition
        const prestationData = await RevenuAPI.getRevenueByPrestationType(selectedYear, selectedMonth);
        updateTypeChart(prestationData);

    } catch (error) {
        console.error('Erreur lors de la mise à jour des graphiques:', error);
    }
}

function updateMonthlyChart(data, isYearly) {
    const xAxisData = [];
    const seriesData = [];

    if (isYearly) {
        // Données annuelles
        if (data && data.length > 0) {
            data.forEach(item => {
                xAxisData.push(item[0]); // Année
                seriesData.push(item[1] || 0); // Total
            });
        } else {
            // Données par défaut si pas de revenus
            const currentYear = new Date().getFullYear();
            for (let i = currentYear - 4; i <= currentYear; i++) {
                xAxisData.push(i.toString());
                seriesData.push(0);
            }
        }
    } else {
        // Données mensuelles
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
            'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        // Initialiser avec 0 pour tous les mois
        const monthlyTotals = new Array(12).fill(0);

        // Remplir avec les données réelles si elles existent
        if (data && data.length > 0) {
            data.forEach(item => {
                const monthIndex = item[0] - 1; // Les mois sont 1-indexés dans la BDD
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthlyTotals[monthIndex] = item[1] || 0;
                }
            });
        }

        months.forEach((month, index) => {
            xAxisData.push(month);
            seriesData.push(monthlyTotals[index]);
        });
    }

    const option = {
        animation: false,
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            textStyle: { color: '#1f2937' },
            formatter: function(params) {
                if (params && params[0]) {
                    return `${params[0].name}<br/>${params[0].seriesName}: ${formatCurrency(params[0].value)}`;
                }
                return '';
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisLabel: { color: '#6b7280' }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: {
                color: '#6b7280',
                formatter: value => `${value} DH`
            },
            splitLine: { lineStyle: { color: '#e2e8f0' } }
        },
        series: [{
            name: 'Revenus',
            type: 'line',
            smooth: true,
            lineStyle: { width: 3, color: '#5b67e0' },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(91, 103, 224, 0.2)' },
                    { offset: 1, color: 'rgba(91, 103, 224, 0)' }
                ])
            },
            data: seriesData
        }]
    };

    monthlyRevenueChart.setOption(option, true);
}

function updateTypeChart(data) {
    const chartData = data.map(item => ({
        value: item[1] || 0,
        name: item[0] || 'Non défini'
    }));

    // Valeurs par défaut si pas de données
    if (chartData.length === 0) {
        chartData.push(
            { value: 0, name: 'Séance' },
            { value: 0, name: 'Anamnèse' },
            { value: 0, name: 'Bilan' }
        );
    }

    const colors = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'];

    const option = {
        animation: false,
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            textStyle: { color: '#1f2937' },
            formatter: function(params) {
                if (params.value === 0) {
                    return `${params.name}: Aucune donnée`;
                }
                return `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`;
            }
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            textStyle: { color: '#1f2937', fontSize: 12 }
        },
        series: [{
            name: 'Répartition des revenus',
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['50%', '43%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: { show: false },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '16',
                    fontWeight: 'bold',
                    formatter: function(params) {
                        if (params.value === 0) return 'Aucune\ndonnée';
                        return `${formatCurrency(params.value)}`;
                    }
                }
            },
            data: chartData.map((item, index) => ({
                ...item,
                itemStyle: {
                    color: colors[index % colors.length]
                }
            }))
        }]
    };

    revenueByTypeChart.setOption(option, true);
}

// Recherche MODIFIÉE pour tenir compte de la période
async function searchRevenus() {
    const query = document.getElementById('searchTransactions').value.trim();

    if (query) {
        try {
            const results = await RevenuAPI.search(query);
            // Filtrer les résultats par période aussi
            filteredRevenus = filterRevenusForPeriod(results);
            currentPage = 1;
            updateRevenusList();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            filteredRevenus = [];
            updateRevenusList();
        }
    } else {
        applyAllFilters();
    }
}

// Export functions MODIFIÉES pour la période
function generatePDFPreviewHTML(revenus) {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const periodText = `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`;

    const totals = revenus.reduce((acc, revenu) => {
        if (revenu.statut === 'PAYE') {
            acc.total += revenu.montant;
            acc.count++;
        }
        return acc;
    }, { total: 0, count: 0 });

    return `
        <div class="max-w-4xl mx-auto">
            <div class="flex items-center mb-6">
                <div class="w-16 h-16 mr-4">
                    <img src="images/Multi-Dys.jpg" alt="Logo Centre Multi-Dys" style="max-width: 64px; height: auto;">
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Centre Multi-Dys - Bilan des Revenus</h1>
                    <p class="text-gray-600">Période: ${periodText}</p>
                </div>
            </div>

            <table class="w-full border-collapse mb-8">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border border-gray-300 px-4 py-2 text-left">Date</th>
                        <th class="border border-gray-300 px-4 py-2 text-left">Patient</th>
                        <th class="border border-gray-300 px-4 py-2 text-left">Facture</th>
                        <th class="border border-gray-300 px-4 py-2 text-left">Montant (DH)</th>
                        <th class="border border-gray-300 px-4 py-2 text-left">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${revenus.map(revenu => `
                        <tr>
                            <td class="border border-gray-300 px-4 py-2">${formatDate(revenu.dateTransaction)}</td>
                            <td class="border border-gray-300 px-4 py-2">${revenu.nomCompletPatient}</td>
                            <td class="border border-gray-300 px-4 py-2">${revenu.numeroFacture}</td>
                            <td class="border border-gray-300 px-4 py-2">${formatCurrency(revenu.montant)}</td>
                            <td class="border border-gray-300 px-4 py-2">${getStatutLabel(revenu.statut)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="mb-6">
                <h2 class="text-lg font-medium mb-3">Récapitulatif :</h2>
                <p class="mb-1">Nombre de transactions payées : ${totals.count}</p>
                <p class="font-bold mt-3">Total des revenus : ${formatCurrency(totals.total)}</p>
            </div>
        </div>
    `;
}

async function exportToPDF() {
    showLoadingModal();

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Utilise le tableau filtré pour le tableau principal
        const revenus = filteredRevenus;

        // Récupère les totaux détaillés depuis l'API
        const prestationData = await RevenuAPI.getRevenueByPrestationType(selectedYear, selectedMonth);

        // Mapping pour les titres
        const libelles = {
            'Séance': 'Total Séance',
            'Anamnèse': 'Total Anamnèse',
            'Compte rendu': 'Total Compte rendu',
            'Bilan': 'Total Bilan'
        };

        // Crée un objet totaux par type
        let totalGeneral = 0;
        let recapLignes = [];
        prestationData.forEach(([type, montant]) => {
            if (libelles[type]) {
                recapLignes.push(`${libelles[type]} : ${formatCurrency(montant)}`);
            }
            totalGeneral += montant;
        });

        // Header
        doc.setFont("helvetica", "normal");
        doc.setFontSize(20);
        doc.setTextColor(33, 33, 33);
        doc.text('Centre Multi-Dys - Bilan des Revenus', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const periodText = `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
        doc.text(`Période: ${periodText}`, 105, 30, { align: 'center' });

        // Tableau
        doc.setFillColor(240, 240, 240);
        doc.rect(10, 40, 190, 10, 'F');
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.text('Date', 15, 46);
        doc.text('Facture', 50, 46);
        doc.text('Patient', 90, 46);
        doc.text('Montant (DH)', 130, 46);
        doc.text('Statut', 170, 46);

        let y = 56;
        revenus.forEach((r, i) => {
            doc.text(formatDate(r.dateTransaction), 15, y);
            doc.text(r.numeroFacture || '', 50, y);
            doc.text(r.nomCompletPatient, 90, y);
            doc.text(formatCurrency(r.montant), 130, y);
            doc.text(getStatutLabel(r.statut), 170, y);
            if (i < revenus.length - 1) {
                doc.setDrawColor(230, 230, 230);
                doc.line(10, y + 2.5, 200, y + 2.5);
            }
            y += 10;
        });

        // Récapitulatif détaillé
        const recapY = y + 15;
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.text('Récapitulatif des totaux :', 15, recapY);

        doc.setFontSize(10);
        recapLignes.forEach((ligne, idx) => {
            doc.text(ligne, 15, recapY + 10 + idx * 10);
        });

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Général : ${formatCurrency(totalGeneral)}`, 15, recapY + 10 + recapLignes.length * 10 + 5);

        hideLoadingModal();
        doc.save(`Centre_Multi_Dys_Revenus_${periodText.replace(' ', '_')}.pdf`);
    } catch (error) {
        hideLoadingModal();
        showNotification('error', 'Erreur lors de la génération du PDF');
        console.error('PDF Error:', error);
    }
}

async function exportToExcel() {
    showLoadingModal();
    try {
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const periodText = `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`;

        // Récupérer la répartition détaillée par l'API (identique au PDF)
        const prestationData = await RevenuAPI.getRevenueByPrestationType(selectedYear, selectedMonth);

        const libelles = {
            'Séance': 'Total Séance',
            'Anamnèse': 'Total Anamnèse',
            'Compte rendu': 'Total Compte rendu',
            'Bilan': 'Total Bilan'
        };

        let totalGeneral = 0;
        let recapLignes = [];
        prestationData.forEach(([type, montant]) => {
            if (libelles[type]) {
                recapLignes.push([libelles[type], `${montant.toFixed(2)} DH`]);
            }
            totalGeneral += montant;
        });

        // Créer le workbook
        const wb = XLSX.utils.book_new();

        // Entêtes (Facture AVANT Patient)
        const headers = ["Date", "Facture", "Patient", "Montant (DH)", "Mode Paiement", "Statut"];

        // Construction des données
        const wsData = [
            ["Centre Multi-Dys - Bilan des Revenus"],
            [`Période: ${periodText}`],
            [],
            headers
        ];

        filteredRevenus.forEach(revenu => {
            wsData.push([
                formatDate(revenu.dateTransaction),
                revenu.numeroFacture,          // Facture avant Patient
                revenu.nomCompletPatient,      // Patient après Facture
                revenu.montant,
                revenu.modePaiement,
                getStatutLabel(revenu.statut)
            ]);
        });

        wsData.push([]);
        wsData.push(["Récapitulatif des totaux :"]);
        recapLignes.forEach(ligne => wsData.push(ligne));
        wsData.push(["", "", "", "Total Général :", `${totalGeneral.toFixed(2)} DH`]);

        // Création de la feuille
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Largeur des colonnes
        const colWidths = [
            { wch: 12 }, // Date
            { wch: 15 }, // Facture
            { wch: 25 }, // Patient
            { wch: 15 }, // Montant
            { wch: 15 }, // Mode Paiement
            { wch: 15 }  // Statut
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Revenus");

        // Générer et télécharger le fichier
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Centre_Multi_Dys_Revenus_${periodText.replace(' ', '_')}.xlsx`);

        hideLoadingModal();
    } catch (error) {
        hideLoadingModal();
        showNotification('error', 'Erreur lors de la génération du fichier Excel');
        console.error('Excel Error:', error);
    }
}

// Utilitaires pour les modals
function showLoadingModal() {
    document.getElementById('loadingModal').classList.remove('hidden');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.add('hidden');
}

function showPreviewModal() {
    document.getElementById('previewModal').classList.remove('hidden');
}

function hidePreviewModal() {
    document.getElementById('previewModal').classList.add('hidden');
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

    // Redimensionner les graphiques
    if (monthlyRevenueChart) monthlyRevenueChart.resize();
    if (revenueByTypeChart) revenueByTypeChart.resize();
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Initialisation de la page revenus...');

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

    // 4. Initialiser la période actuelle par défaut
    setPeriod('current');

    // 5. Initialiser les données
    await loadRevenus();
    await loadStatistics();

    // 6. Initialiser les graphiques
    await initializeCharts();

    // 7. Configurer les event listeners
    setupEventListeners();

    console.log('✅ Initialisation terminée');
});

function setupEventListeners() {
    // ================================
    // FILTRES - Event Listeners
    // ================================

    // Filtres par statut (onglets)
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
            currentFilter = this.dataset.tab;
            currentPage = 1;
            applyAllFilters();
        });
    });

    // Recherche globale
    const searchInput = document.getElementById('searchTransactions');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                searchRevenus();
            }, 300);
        });
    }

    // ================================
    // DROPDOWNS - Event Listeners
    // ================================

    // Dropdown période
    const periodDropdownBtn = document.getElementById('periodDropdownBtn');
    const periodDropdown = document.getElementById('periodDropdown');
    const customDatePicker = document.getElementById('customDatePicker');

    periodDropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        periodDropdown.classList.toggle('hidden');
        document.getElementById('yearDropdown').classList.add('hidden');
        document.getElementById('filterDropdown').classList.add('hidden');
        customDatePicker.classList.add('hidden');
    });

    // Event listeners pour les options de période
    document.querySelectorAll('#periodDropdown .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const period = this.dataset.period;

            if (period === 'current') {
                setPeriod('current');
                showNotification('info', 'Affichage du mois actuel');
            } else if (period === 'previous') {
                setPeriod('previous');
                showNotification('info', 'Affichage du mois précédent');
            } else if (period === 'custom') {
                // Ne pas fermer le dropdown, juste ouvrir le date picker
                customDatePicker.classList.toggle('hidden');
                return;
            }

            periodDropdown.classList.add('hidden');
        });
    });

    // Dropdown année
    const yearDropdownBtn = document.getElementById('yearDropdownBtn');
    const yearDropdown = document.getElementById('yearDropdown');

    yearDropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        yearDropdown.classList.toggle('hidden');
        periodDropdown.classList.add('hidden');
        document.getElementById('filterDropdown').classList.add('hidden');
        customDatePicker.classList.add('hidden');
    });

    // Dropdown filtres
    const filterDropdownBtn = document.getElementById('filterDropdownBtn');
    const filterDropdown = document.getElementById('filterDropdown');

    filterDropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        filterDropdown.classList.toggle('hidden');
        periodDropdown.classList.add('hidden');
        yearDropdown.classList.add('hidden');
        customDatePicker.classList.add('hidden');
    });

    // Appliquer la date personnalisée
    document.getElementById('applyCustomDate').addEventListener('click', function() {
        const month = document.getElementById('customMonth');
        const year = document.getElementById('customYear');

        const monthValue = parseInt(month.value);
        const yearValue = parseInt(year.value);

        setPeriod('custom', yearValue, monthValue);
        showNotification('success', `Période personnalisée appliquée`);

        customDatePicker.classList.add('hidden');
        periodDropdown.classList.add('hidden');
    });

    // Gestion de la sélection d'année pour les graphiques
    document.querySelectorAll('#yearDropdown .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const year = this.dataset.year;

            if (year === 'all') {
                yearDropdownBtn.innerHTML = 'Toutes années <i class="ri-arrow-down-s-line ml-2"></i>';
                selectedYear = 'all';
            } else {
                yearDropdownBtn.innerHTML = `${year} <i class="ri-arrow-down-s-line ml-2"></i>`;
                selectedYear = parseInt(year);
            }

            updateCharts(selectedYear);
            yearDropdown.classList.add('hidden');
        });
    });

    // Fermer les dropdowns en cliquant ailleurs
    document.addEventListener('click', function(e) {
        if (!periodDropdownBtn.contains(e.target) && !periodDropdown.contains(e.target) && !customDatePicker.contains(e.target)) {
            periodDropdown.classList.add('hidden');
            customDatePicker.classList.add('hidden');
        }
        if (!yearDropdownBtn.contains(e.target) && !yearDropdown.contains(e.target)) {
            yearDropdown.classList.add('hidden');
        }
        if (!filterDropdownBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.add('hidden');
        }
    });

    // ================================
    // MODALS - Event Listeners
    // ================================

    // Modal de transaction
    document.getElementById('closeTransactionModal').addEventListener('click', function() {
        const modal = document.getElementById('transactionModal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
        modal.style.display = 'none';
        currentViewingRevenu = null;
    });

    // Fermer le modal en cliquant en dehors
    document.getElementById('transactionModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
            this.classList.remove('show');
            this.style.display = 'none';
            currentViewingRevenu = null;
        }
    });

    // Modal de prévisualisation
    document.getElementById('closePreviewModal').addEventListener('click', hidePreviewModal);
    document.getElementById('cancelExport').addEventListener('click', hidePreviewModal);

    // ================================
    // EXPORT - Event Listeners
    // ================================

    // Export PDF direct (SANS aperçu)
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);

    // Export Excel direct (SANS aperçu)
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);

    // Info tooltip
    const infoBtn = document.getElementById('infoBtn');
    const infoTooltip = document.getElementById('infoTooltip');

    if (infoBtn && infoTooltip) {
        infoBtn.addEventListener('mouseenter', () => {
            infoTooltip.classList.remove('hidden');
        });

        infoBtn.addEventListener('mouseleave', () => {
            infoTooltip.classList.add('hidden');
        });
    }

    // ================================
    // FILTERS - Event Listeners
    // ================================

    // Bouton appliquer les filtres
    document.getElementById('applyFilters').addEventListener('click', function() {
        // Pour l'instant, on applique juste le tri
        const sortType = document.querySelector('.sort-filter:checked')?.dataset.sort || 'date-desc';

        // Trier les revenus filtrés
        filteredRevenus.sort((a, b) => {
            switch(sortType) {
                case 'date-desc':
                    return new Date(b.dateTransaction) - new Date(a.dateTransaction);
                case 'date-asc':
                    return new Date(a.dateTransaction) - new Date(b.dateTransaction);
                case 'name-asc':
                    return a.nomCompletPatient.localeCompare(b.nomCompletPatient);
                case 'name-desc':
                    return b.nomCompletPatient.localeCompare(a.nomCompletPatient);
                default:
                    return 0;
            }
        });

        currentPage = 1;
        updateRevenusList();
        filterDropdown.classList.add('hidden');
        showNotification('success', 'Filtres appliqués');
    });

    // ================================
    // RESIZE - Event Listeners
    // ================================

    // Redimensionner les graphiques lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        if (monthlyRevenueChart) monthlyRevenueChart.resize();
        if (revenueByTypeChart) revenueByTypeChart.resize();
    });
}

// Exposer les fonctions globales nécessaires
window.updateRevenuStatut = updateRevenuStatut;
window.openPatientRecordsFromCurrentRevenu = openPatientRecordsFromCurrentRevenu;

// Gérer l'ouverture automatique du dossier patient depuis l'URL
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si on doit ouvrir automatiquement un dossier patient
    const urlParams = new URLSearchParams(window.location.search);
    const openRecordsId = urlParams.get('openRecords');

    if (openRecordsId) {
        // Attendre que tout soit chargé puis ouvrir le dossier
        setTimeout(async () => {
            await openPatientRecordsFromRevenu(openRecordsId);
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000);
    }
});

console.log('📊 Module revenus chargé avec succès - Version avec filtrage par période pour les statistiques et l\'historique des transactions');