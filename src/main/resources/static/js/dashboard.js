// Dashboard JavaScript - Version avec gestion des limites et mise à jour des sections
console.log('🚀 Initialisation du tableau de bord...');

// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let dashboardData = null;
let currentPatient = null;
let refreshInterval = null;
let allAppointments = []; // Stocker tous les RDV pour les modals
let allPatients = []; // Stocker tous les patients pour les modals

// Classes API
class DashboardAPI {
    static async getComplete() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/complete`);
            if (!response.ok) throw new Error('Erreur lors du chargement du dashboard');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur Dashboard API:', error);
            return null;
        }
    }

    static async updateStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/update`, { method: 'POST' });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur mise à jour dashboard:', error);
            return null;
        }
    }
}

class RendezVousAPI {
    static async getTodayAppointments() {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous/today`);
            if (!response.ok) throw new Error('Erreur lors du chargement des RDV');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur RDV API:', error);
            return [];
        }
    }

    static async updateStatus(id, statut) {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous/${id}/${statut}`, { method: 'PUT' });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur mise à jour statut RDV:', error);
            throw error;
        }
    }

    static async reschedule(id, newDate, newTime) {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous/${id}/reporter?nouvelleDate=${newDate}&nouvelleHeure=${newTime}`, { method: 'PUT' });
            if (!response.ok) throw new Error('Erreur lors du report');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur report RDV:', error);
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
            console.error('❌ Erreur Patients API:', error);
            return [];
        }
    }

    static async getRecentPatients(limit = 10) {
        try {
            // Essayer d'abord l'endpoint spécialisé
            const response = await fetch(`${API_BASE_URL}/patients/recents?limit=${limit}`);
            if (response.ok) {
                const patients = await response.json();
                console.log(`✅ ${patients.length} patients récents chargés depuis l'API spécialisée`);
                return patients;
            }
        } catch (error) {
            console.warn('Endpoint /recents non disponible, utilisation du fallback');
        }

        // Fallback vers l'ancienne méthode
        try {
            const patients = await this.getAll();
            console.log('🔄 Utilisation du tri côté frontend pour les patients récents');

            return patients
                .filter(p => p.derniereVisite)
                .sort((a, b) => new Date(b.derniereVisite) - new Date(a.derniereVisite))
                .slice(0, limit);
        } catch (error) {
            console.error('❌ Erreur patients récents fallback:', error);
            return [];
        }
    }

    static async updateLastVisit(patientId) {
        try {
            console.log('🔄 Mise à jour dernière visite pour patient:', patientId);

            // ✅ SOLUTION SIMPLE : Utiliser l'API spécifique
            const response = await fetch(`${API_BASE_URL}/patients/${patientId}/derniere-visite`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erreur serveur:', errorText);
                throw new Error(`Erreur ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Patient mis à jour avec succès:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur mise à jour dernière visite:', error);
            throw error;
        }
    }
}

class TacheAPI {
    static async getToday() {
        try {
            const response = await fetch(`${API_BASE_URL}/taches/aujourd-hui`);
            if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur Tâches API:', error);
            return [];
        }
    }

    static async create(tache) {
        try {
            const response = await fetch(`${API_BASE_URL}/taches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tache)
            });
            if (!response.ok) throw new Error('Erreur lors de la création de la tâche');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur création tâche:', error);
            throw error;
        }
    }

    static async markCompleted(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/taches/${id}/terminer`, { method: 'PUT' });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour de la tâche');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur mise à jour tâche:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/taches/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erreur lors de la suppression de la tâche');
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression tâche:', error);
            throw error;
        }
    }
}

class SeanceAPI {
    static async getByPatient(patientId) {
        try {
            const response = await fetch(`${API_BASE_URL}/seances/patient/${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des séances');
            return await response.json();
        } catch (error) {
            console.error('❌ Erreur Séances API:', error);
            return [];
        }
    }

    static async createFromRendezVous(rendezVousId, observations) {
        console.log('🚀 DÉBUT création séance - RDV ID:', rendezVousId);
        console.log('📝 Observations reçues:', observations);

        try {
            // ✅ ÉTAPE 1: Vérification des paramètres
            if (!rendezVousId) {
                throw new Error('ID du rendez-vous manquant');
            }

            console.log('🌐 Récupération RDV depuis:', `${API_BASE_URL}/rendez-vous/${rendezVousId}`);

            // ✅ ÉTAPE 2: Récupération du RDV
            const rdvResponse = await fetch(`${API_BASE_URL}/rendez-vous/${rendezVousId}`);
            console.log('📡 RDV Response status:', rdvResponse.status);

            if (!rdvResponse.ok) {
                const rdvErrorText = await rdvResponse.text();
                console.error('❌ Erreur récupération RDV:', rdvResponse.status, rdvErrorText);
                throw new Error(`Impossible de récupérer le RDV (${rdvResponse.status}): ${rdvErrorText}`);
            }

            const rdvData = await rdvResponse.json();
            console.log('📋 Données RDV récupérées:', rdvData);

            // ✅ ÉTAPE 3: Validation des données RDV
            if (!rdvData.patient || !rdvData.patient.id) {
                throw new Error('Données patient manquantes dans le RDV');
            }
            if (!rdvData.dateRendezVous) {
                throw new Error('Date du RDV manquante');
            }
            if (!rdvData.heureDebut || !rdvData.heureFin) {
                throw new Error('Heures du RDV manquantes');
            }

            console.log('✅ Validation RDV OK - Patient ID:', rdvData.patient.id);

            // ✅ ÉTAPE 4: Récupération du profil (optionnel)
            let createdByName = null;
            try {
                const profilResponse = await fetch(`${API_BASE_URL}/profil/me`);
                if (profilResponse.ok) {
                    const profilData = await profilResponse.json();
                    createdByName = `${profilData.prenom || ''} ${profilData.nom || ''}`.trim();
                    console.log('👤 Profil récupéré:', createdByName);
                }
            } catch (profilError) {
                console.warn('⚠️ Erreur profil (non bloquante):', profilError.message);
            }

            // ✅ ÉTAPE 5: Construction des données séance
            const seanceData = {
                patient: {
                    id: rdvData.patient.id
                },
                dateSeance: rdvData.dateRendezVous,
                heureDebut: rdvData.heureDebut,
                heureFin: rdvData.heureFin,
                type: 'SEANCE',
                observations: observations || null
            };

            // Ajouter les champs optionnels
            if (rendezVousId) {
                seanceData.rendezVous = { id: parseInt(rendezVousId) };
            }

            if (createdByName) {
                seanceData.createdBy = createdByName;
            }

            console.log('📤 Données séance à envoyer:');
            console.log(JSON.stringify(seanceData, null, 2));
            console.log('🌐 URL cible:', `${API_BASE_URL}/seances`);

            // ✅ ÉTAPE 6: Envoi de la requête
            console.log('📡 Envoi de la requête POST...');

            const response = await fetch(`${API_BASE_URL}/seances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(seanceData)
            });

            console.log('📡 Réponse reçue - Status:', response.status);
            console.log('📡 Response OK:', response.ok);

            // ✅ ÉTAPE 7: Traitement de la réponse
            const responseText = await response.text();
            console.log('📡 Body de la réponse:');
            console.log(responseText);

            if (!response.ok) {
                console.error('❌ ERREUR SERVEUR:');
                console.error('Status:', response.status);
                console.error('Body:', responseText);

                try {
                    const errorJson = JSON.parse(responseText);
                    console.error('📋 Erreur parsée:', errorJson);
                    throw new Error(`Erreur ${response.status}: ${errorJson.error || errorJson.message || responseText}`);
                } catch (parseError) {
                    throw new Error(`Erreur ${response.status}: ${responseText}`);
                }
            }

            // ✅ SUCCÈS
            const result = JSON.parse(responseText);
            console.log('✅ Séance créée avec succès:', result);
            return result;

        } catch (error) {
            console.error('❌ ERREUR COMPLÈTE dans createFromRendezVous:');
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }
}

// Fonctions utilitaires
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return 'Date invalide';
    }
}

function formatTime(timeString) {
    if (!timeString) return '';
    try {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    } catch (error) {
        return timeString;
    }
}

function getAvatarInitials(prenom, nom) {
    const p = prenom ? prenom.charAt(0).toUpperCase() : '';
    const n = nom ? nom.charAt(0).toUpperCase() : '';
    return p + n || '??';
}

function getAvatarColor(index) {
    const colors = [
        'bg-indigo-200 text-indigo-700',
        'bg-blue-200 text-blue-700',
        'bg-red-200 text-red-700',
        'bg-green-200 text-green-700',
        'bg-purple-200 text-purple-700',
        'bg-yellow-200 text-yellow-700',
        'bg-pink-200 text-pink-700'
    ];
    return colors[index % colors.length];
}

function getStatutBadgeClass(statut) {
    switch(statut?.toLowerCase()) {
        case 'actif': return 'bg-green-100 text-green-800';
        case 'nouveau': return 'bg-blue-100 text-blue-800';
        case 'inactif': return 'bg-gray-100 text-gray-800';
        case 'confirme': return 'bg-green-100 text-green-800';
        case 'planifie': return 'bg-blue-100 text-blue-800';
        case 'en_cours': return 'bg-yellow-100 text-yellow-800';
        case 'termine': return 'bg-green-100 text-green-800';
        case 'annule': return 'bg-red-100 text-red-800';
        case 'reporte': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatutLabel(statut) {
    switch(statut?.toLowerCase()) {
        case 'actif': return 'Actif';
        case 'nouveau': return 'Nouveau';
        case 'inactif': return 'Inactif';
        case 'confirme': return 'Confirmé';
        case 'planifie': return 'Planifié';
        case 'en_cours': return 'En cours';
        case 'termine': return 'Terminé';
        case 'annule': return 'Annulé';
        case 'reporte': return 'Reporté';
        default: return statut || 'Inconnu';
    }
}

async function updateRecentPatientsOrder(patientId) {
    console.log('🔄 Mise à jour de l\'ordre des patients récents pour:', patientId);

    try {
        // Mettre à jour la dernière visite du patient
        await PatientAPI.updateLastVisit(patientId);

        // Recharger tous les patients pour avoir les données à jour
        const allPatientsUpdated = await PatientAPI.getAll();

        // Trier les patients par dernière visite (plus récent en premier)
        const sortedPatients = allPatientsUpdated
            .filter(p => p.derniereVisite)
            .sort((a, b) => new Date(b.derniereVisite) - new Date(a.derniereVisite));

        // Mettre à jour la variable globale
        allPatients = sortedPatients;

        // Re-rendre la section des patients récents
        renderRecentPatients(sortedPatients, true);

        console.log('✅ Ordre des patients récents mis à jour');

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'ordre:', error);
    }
}

// Fonction pour vérifier si c'est l'heure du RDV
function isAppointmentAtCurrentTime(apt, currentTime) {
    const aptStartTime = apt.heureDebut;
    const aptEndTime = apt.heureFin;

    // Vérifier si l'heure actuelle est dans la plage du RDV (±5 minutes)
    const currentMinutes = timeToMinutes(currentTime);
    const startMinutes = timeToMinutes(aptStartTime);
    const endMinutes = timeToMinutes(aptEndTime);

    return currentMinutes >= (startMinutes - 5) && currentMinutes <= endMinutes;
}

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Fonctions de rendu
function renderStatsCards(data) {
    const container = document.getElementById('statsCards');
    if (!container || !data?.cards) return;

    container.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-800">Rendez-Vous</h3>
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <i class="ri-calendar-2-line"></i>
                </div>
            </div>
            <div class="flex items-end justify-between">
                <div>
                    <p class="text-3xl font-bold text-gray-800" id="rdvTodayCount">${data.cards.rendezVous?.value || 0}</p>
                    <p class="text-sm text-gray-500">${data.cards.rendezVous?.label || 'Aujourd\'hui'}</p>
                </div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-800">Patients</h3>
                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <i class="ri-user-line"></i>
                </div>
            </div>
            <div class="flex items-end justify-between">
                <div>
                    <p class="text-3xl font-bold text-gray-800">${data.cards.patients?.value || 0}</p>
                    <p class="text-sm text-gray-500">${data.cards.patients?.label || 'Actifs'}</p>
                </div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-800">RDV Annulés</h3>
                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <i class="ri-calendar-close-line"></i>
                </div>
            </div>
            <div class="flex items-end justify-between">
                <div>
                    <p class="text-3xl font-bold text-gray-800">${data.cards.rdvAnnules?.value || 0}</p>
                    <p class="text-sm text-gray-500">${data.cards.rdvAnnules?.label || 'Ce mois'}</p>
                </div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-800">Revenus</h3>
                <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <i class="ri-money-dollar-circle-line"></i>
                </div>
            </div>
            <div class="flex items-end justify-between">
                <div>
                    <p class="text-3xl font-bold text-gray-800">${data.cards.revenus?.formatted || (data.cards.revenus?.value + ' DH') || '0 DH'}</p>
                    <p class="text-sm text-gray-500">${data.cards.revenus?.label || 'Ce mois'}</p>
                </div>
            </div>
        </div>
    `;
}

function renderAppointments(appointments, limitTo4 = true) {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;

    // Stocker tous les RDV pour les modals
    allAppointments = appointments || [];

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <i class="ri-calendar-line text-4xl mb-2"></i>
                <p>Aucun rendez-vous aujourd'hui</p>
            </div>
        `;
        return;
    }

    // Filtrer les RDV non terminés pour l'affichage principal
    const visibleAppointments = appointments.filter(apt =>
        apt.statut !== 'TERMINE'
    );

    if (visibleAppointments.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <i class="ri-check-circle-line text-4xl mb-2 text-green-500"></i>
                <p>Tous les rendez-vous sont terminés</p>
            </div>
        `;
        return;
    }

    // ✅ LIMITATION À 4 RDV pour l'affichage principal
    const displayedAppointments = limitTo4 ? visibleAppointments.slice(0, 4) : visibleAppointments;

    // Déterminer quels RDV peuvent être gérés (heure actuelle ou EN_COURS)
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

    let html = '';

    displayedAppointments.forEach((apt, index) => {
        const isCurrentTime = isAppointmentAtCurrentTime(apt, currentTime);
        const isInProgress = apt.statut === 'EN_COURS';
        const isActive = apt.statut !== 'ANNULE'; // Les RDV annulés ne sont pas actifs

        if (isCurrentTime || isInProgress) {
            html += renderCurrentAppointment(apt);
        } else {
            html += renderRegularAppointment(apt, index, isActive);
        }
    });

    container.innerHTML = html;

    // Ajouter les event listeners
    setupAppointmentEventListeners();
}

function renderCurrentAppointment(apt) {
    const initials = getAvatarInitials(apt.patient?.prenom, apt.patient?.nom);
    const avatarColor = getAvatarColor(0);

    return `
        <div id="activeAppointment" class="flex flex-col p-4 rounded-lg bg-blue-50 border border-blue-200 transition-all">
            <div class="flex items-start">
                <div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="font-medium">${initials}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${apt.nomCompletPatient || 'Patient inconnu'}</p>
                    <p class="text-sm text-gray-600">${formatTime(apt.heureDebut)} - ${formatTime(apt.heureFin)}</p>
                    <p class="text-xs text-gray-500 mt-1">${apt.type === 'SEANCE' ? 'Séance' : apt.type === 'ANAMNESE' ? 'Anamnèse' : 'Compte rendu'}</p>
                </div>
                <div class="ml-2 flex items-center">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatutBadgeClass(apt.statut)}">${getStatutLabel(apt.statut)}</span>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-3 justify-center">
                <button class="confirm-apt-btn px-3 py-1.5 bg-green-600 text-white rounded-button text-sm hover:bg-green-700" data-id="${apt.id}">
                    Confirmer
                </button>
                <button class="cancel-apt-btn px-3 py-1.5 bg-red-600 text-white rounded-button text-sm hover:bg-red-700" data-id="${apt.id}">
                    Annuler
                </button>
                <button class="reschedule-apt-btn px-3 py-1.5 bg-blue-600 text-white rounded-button text-sm hover:bg-blue-700" data-id="${apt.id}">
                    Reporter
                </button>
            </div>
            
            <div id="confirmContainer-${apt.id}" class="mt-3 p-3 bg-white rounded-lg border border-gray-200 hidden">
                <label class="block text-sm font-medium text-gray-700 mb-1">Observation:</label>
                <textarea class="confirm-note w-full px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" rows="2"></textarea>
                <div class="flex justify-end mt-2">
                    <button class="validate-confirm-btn px-3 py-1.5 bg-green-600 text-white rounded-button text-sm hover:bg-green-700" data-id="${apt.id}">
                        Valider
                    </button>
                </div>
            </div>
            
            <div id="rescheduleContainer-${apt.id}" class="mt-3 p-3 bg-white rounded-lg border border-gray-200 hidden">
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nouvelle date:</label>
                        <input type="date" class="reschedule-date w-full px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nouvelle heure:</label>
                        <input type="time" class="reschedule-time w-full px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    </div>
                </div>
                <div class="flex justify-end mt-2">
                    <button class="validate-reschedule-btn px-3 py-1.5 bg-primary text-white rounded-button text-sm hover:bg-primary/90" data-id="${apt.id}">
                        Valider le report
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderRegularAppointment(apt, index, clickable = false) {
    const initials = getAvatarInitials(apt.patient?.prenom, apt.patient?.nom);
    const avatarColor = getAvatarColor(index + 1);

    return `
        <div class="appointment-item ${clickable ? 'clickable-appointment' : ''} p-3 rounded-lg hover:bg-gray-50 border border-gray-100 ${clickable ? 'cursor-pointer' : ''}" data-id="${apt.id}">
            <div class="flex items-start">
                <div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="font-medium">${initials}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${apt.nomCompletPatient || 'Patient inconnu'}</p>
                    <p class="text-sm text-gray-600">${formatTime(apt.heureDebut)} - ${formatTime(apt.heureFin)}</p>
                    <p class="text-xs text-gray-500 mt-1">${apt.type === 'SEANCE' ? 'Séance' : apt.type === 'ANAMNESE' ? 'Anamnèse' : 'Compte rendu'}</p>
                </div>
                <div class="ml-2 flex items-center">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatutBadgeClass(apt.statut)}">${getStatutLabel(apt.statut)}</span>
                </div>
            </div>
            
            ${clickable ? `
            <!-- Boutons d'action cachés par défaut -->
            <div class="appointment-actions hidden flex flex-wrap gap-2 mt-3 justify-center">
                <button class="confirm-apt-btn px-3 py-1.5 bg-green-600 text-white rounded-button text-sm hover:bg-green-700" data-id="${apt.id}">
                    Confirmer
                </button>
                <button class="cancel-apt-btn px-3 py-1.5 bg-red-600 text-white rounded-button text-sm hover:bg-red-700" data-id="${apt.id}">
                    Annuler
                </button>
                <button class="reschedule-apt-btn px-3 py-1.5 bg-blue-600 text-white rounded-button text-sm hover:bg-blue-700" data-id="${apt.id}">
                    Reporter
                </button>
            </div>
            
            <!-- Containers pour les actions -->
            <div id="confirmContainer-${apt.id}" class="mt-3 p-3 bg-white rounded-lg border border-gray-200 hidden">
                <label class="block text-sm font-medium text-gray-700 mb-1">Observation:</label>
                <textarea class="confirm-note w-full px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" rows="2"></textarea>
                <div class="flex justify-end mt-2">
                    <button class="validate-confirm-btn px-3 py-1.5 bg-green-600 text-white rounded-button text-sm hover:bg-green-700" data-id="${apt.id}">
                        Valider
                    </button>
                </div>
            </div>
            
            <div id="rescheduleContainer-${apt.id}" class="mt-3 p-3 bg-white rounded-lg border border-gray-200 hidden">
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nouvelle date:</label>
                        <input type="date" class="reschedule-date w-full px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nouvelle heure:</label>
                        <input type="time" class="reschedule-time w-full px-3 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    </div>
                </div>
                <div class="flex justify-end mt-2">
                    <button class="validate-reschedule-btn px-3 py-1.5 bg-primary text-white rounded-button text-sm hover:bg-primary/90" data-id="${apt.id}">
                        Valider le report
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="ri-task-line text-3xl mb-2"></i>
                <p>Aucune tâche pour aujourd'hui</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => {
        const isCompleted = task.terminee;
        const taskDate = task.date ? formatDate(task.date) : 'Aucune date';
        const taskTime = task.heure ? formatTime(task.heure) : '';
        const fullDateTime = taskTime ? `${taskDate}, ${taskTime}` : taskDate;

        return `
            <div class="task-item flex items-center p-3 rounded-lg hover:bg-gray-50 border border-gray-100 ${isCompleted ? 'completed-task' : ''}">
                <div class="w-5 h-5 flex items-center justify-center mr-3">
                    <input type="checkbox" ${isCompleted ? 'checked' : ''} class="task-checkbox form-checkbox h-4 w-4 text-primary rounded focus:ring-primary" data-id="${task.id}">
                </div>
                <div class="flex-1">
                    <p class="text-sm text-gray-800 task-text ${isCompleted ? 'line-through text-gray-500' : ''}">${task.description}</p>
                    <p class="text-xs text-gray-500 task-date ${isCompleted ? 'text-gray-400' : ''}">${fullDateTime}</p>
                </div>
                <button class="delete-task-btn w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${task.id}">
                    <i class="ri-delete-bin-line text-sm"></i>
                </button>
            </div>
        `;
    }).join('');

    // Ajouter les event listeners pour les tâches
    setupTaskEventListeners();
}

function renderRecentPatients(patients, limitTo7 = true) {
    const tableBody = document.getElementById('recentPatientsTableBody');
    if (!tableBody) return;

    // ✅ CORRECTION : Ne pas re-trier si les patients sont déjà dans le bon ordre
    // (quand ils viennent de movePatientToFirst)
    let displayPatients = patients || [];

    // Seulement trier si ce n'est pas déjà fait par movePatientToFirst
    if (!patients._alreadySorted) {
        displayPatients = displayPatients
            .filter(p => p.derniereVisite)
            .sort((a, b) => new Date(b.derniereVisite) - new Date(a.derniereVisite));
    }

    // Stocker tous les patients pour les modals
    allPatients = displayPatients;

    if (displayPatients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                    Aucun patient récent
                </td>
            </tr>
        `;
        return;
    }

    // Limitation à 7 patients pour l'affichage principal
    const displayedPatients = limitTo7 ? displayPatients.slice(0, 7) : displayPatients;

    tableBody.innerHTML = displayedPatients.map((patient, index) => {
        const initials = getAvatarInitials(patient.prenom, patient.nom);
        const avatarColor = getAvatarColor(index);
        const seancesText = `${patient.seancesEffectuees || 0}/${patient.seancesPrevues || 0}`;
        const age = patient.dateNaissance ? new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear() : 'N/A';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center mr-3">
                            <span class="text-xs font-medium">${initials}</span>
                        </div>
                        <div>
                            <p class="font-medium text-gray-800">${patient.prenom} ${patient.nom}</p>
                            <p class="text-xs text-gray-500">${age} ans</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    ${formatDate(patient.derniereVisite)}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatutBadgeClass(patient.statut)}">
                        ${getStatutLabel(patient.statut)}
                    </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    ${seancesText}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <button class="view-patient-btn text-primary hover:text-primary/80" data-patient='${JSON.stringify(patient)}'>
                        Voir dossier
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Ajouter les event listeners pour les patients
    setupPatientEventListeners();

    console.log('✅ Patients récents affichés. Premier patient:', displayedPatients[0]?.prenom, displayedPatients[0]?.nom);
}

// ✅ NOUVELLE FONCTION : Supprimer un RDV de l'affichage et mettre à jour les stats
function removeAppointmentFromDisplay(appointmentId) {
    console.log('🗑️ Suppression du RDV de l\'affichage:', appointmentId);

    // ✅ CORRECTION CRITIQUE : Trouver le RDV et récupérer les infos du patient
    const appointmentIndex = allAppointments.findIndex(apt => apt.id === parseInt(appointmentId));
    let patientToMoveFirst = null;

    if (appointmentIndex !== -1) {
        const appointment = allAppointments[appointmentIndex];

        // ✅ RÉCUPÉRER LES INFOS COMPLÈTES DU PATIENT
        patientToMoveFirst = appointment.patient;

        // Marquer comme terminé/annulé localement
        if (appointment.statut === 'PLANIFIE' || appointment.statut === 'CONFIRME' || appointment.statut === 'EN_COURS') {
            appointment.statut = 'TERMINE';
        }

        console.log('🔄 RDV mis à jour localement. Patient à déplacer:', patientToMoveFirst?.prenom, patientToMoveFirst?.nom);
    }

    // Mettre à jour le compteur de RDV
    const rdvCountElement = document.getElementById('rdvTodayCount');
    if (rdvCountElement) {
        const currentCount = parseInt(rdvCountElement.textContent) || 0;
        const newCount = Math.max(0, currentCount - 1);
        rdvCountElement.textContent = newCount;

        // Animation de mise à jour
        rdvCountElement.style.transform = 'scale(1.1)';
        rdvCountElement.style.color = '#ef4444';
        setTimeout(() => {
            rdvCountElement.style.transform = 'scale(1)';
            rdvCountElement.style.color = '';
        }, 300);
    }

    // Filtrer les RDV pour l'affichage
    const filteredAppointments = allAppointments.filter(apt =>
        apt.statut !== 'TERMINE' && apt.statut !== 'ANNULE'
    );
    renderAppointments(filteredAppointments, true);

    // ✅ SOLUTION IMMÉDIATE : Déplacer le patient en premier dans la liste
    if (patientToMoveFirst) {
        movePatientToFirst(patientToMoveFirst);
    }
}

// 2. NOUVELLE FONCTION : Déplacer un patient en premier dans les patients récents
function movePatientToFirst(patientData) {
    console.log('🔝 Déplacement du patient en première position:', patientData.prenom, patientData.nom);

    try {
        // ✅ MISE À JOUR IMMÉDIATE des données locales

        // Mettre à jour la dernière visite du patient avec la date d'aujourd'hui
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        patientData.derniereVisite = today;

        // Trouver l'index du patient dans allPatients
        const patientIndex = allPatients.findIndex(p => p.id === patientData.id);

        if (patientIndex !== -1) {
            // Supprimer le patient de sa position actuelle
            allPatients.splice(patientIndex, 1);
        }

        // ✅ AJOUTER LE PATIENT EN PREMIÈRE POSITION
        allPatients.unshift(patientData);

        console.log('✅ Patient déplacé en première position. Nouvelle liste:',
            allPatients.slice(0, 3).map(p => `${p.prenom} ${p.nom} (${p.derniereVisite})`));

        // ✅ RE-RENDRE IMMÉDIATEMENT la liste des patients récents
        renderRecentPatients(allPatients, true);

        // ✅ MISE À JOUR ASYNCHRONE en arrière-plan (sans attendre)
        updatePatientLastVisitInBackground(patientData.id);

    } catch (error) {
        console.error('❌ Erreur lors du déplacement du patient:', error);
    }
}

// 3. NOUVELLE FONCTION : Mise à jour en arrière-plan (sans bloquer l'affichage)
async function updatePatientLastVisitInBackground(patientId) {
    try {
        console.log('🔄 Mise à jour en arrière-plan de la dernière visite pour patient:', patientId);

        // Appel API en arrière-plan (ne pas attendre le résultat)
        await PatientAPI.updateLastVisit(patientId);
        console.log('✅ Dernière visite mise à jour en base de données');

    } catch (error) {
        console.error('⚠️ Erreur arrière-plan (non bloquante):', error);
        // Ne pas afficher d'erreur à l'utilisateur car l'affichage fonctionne déjà
    }
}

// Event Listeners
function setupAppointmentEventListeners() {
    // Clic sur les RDV pour afficher les boutons d'action
    document.querySelectorAll('.clickable-appointment').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const aptId = this.dataset.id;
            const actionsDiv = this.querySelector('.appointment-actions');

            document.querySelectorAll('.appointment-actions').forEach(actions => {
                if (actions !== actionsDiv) {
                    actions.classList.add('hidden');
                }
            });

            if (actionsDiv) {
                actionsDiv.classList.toggle('hidden');

                if (!actionsDiv.classList.contains('hidden')) {
                    this.style.flexDirection = 'column';
                    this.style.alignItems = 'stretch';
                } else {
                    this.style.flexDirection = '';
                    this.style.alignItems = '';
                }
            }
        });
    });

    // Boutons de confirmation
    document.querySelectorAll('.confirm-apt-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const aptId = this.dataset.id;

            // ✅ DEBUG : Vérifier la structure
            debugAppointmentStructure(aptId);

            const container = document.getElementById(`confirmContainer-${aptId}`);
            const rescheduleContainer = document.getElementById(`rescheduleContainer-${aptId}`);

            if (rescheduleContainer) rescheduleContainer.classList.add('hidden');
            if (container) {
                container.classList.toggle('hidden');
                if (!container.classList.contains('hidden')) {
                    const noteElement = container.querySelector('.confirm-note');
                    if (noteElement) {
                        noteElement.focus();
                    } else {
                        console.warn('⚠️ Element .confirm-note non trouvé dans le container');
                    }
                }
            } else {
                console.warn('⚠️ Container confirmContainer-' + aptId + ' non trouvé');
            }
        });
    });

    // ✅ CORRECTION : Boutons de report avec vérifications
    document.querySelectorAll('.reschedule-apt-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const aptId = this.dataset.id;

            // ✅ DEBUG : Vérifier la structure
            debugAppointmentStructure(aptId);

            const container = document.getElementById(`rescheduleContainer-${aptId}`);
            const confirmContainer = document.getElementById(`confirmContainer-${aptId}`);

            if (confirmContainer) confirmContainer.classList.add('hidden');
            if (container) {
                container.classList.toggle('hidden');
                if (!container.classList.contains('hidden')) {
                    // Définir la date par défaut à demain
                    const dateElement = container.querySelector('.reschedule-date');
                    const timeElement = container.querySelector('.reschedule-time');

                    if (dateElement) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        dateElement.valueAsDate = tomorrow;
                    } else {
                        console.warn('⚠️ Element .reschedule-date non trouvé');
                    }

                    if (timeElement) {
                        timeElement.value = '10:00';
                    } else {
                        console.warn('⚠️ Element .reschedule-time non trouvé');
                    }
                }
            } else {
                console.warn('⚠️ Container rescheduleContainer-' + aptId + ' non trouvé');
            }
        });
    });

    // Boutons d'annulation (pas de problème probable ici)
    document.querySelectorAll('.cancel-apt-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const aptId = this.dataset.id;

            const result = await Swal.fire({
                title: 'Confirmer l\'annulation',
                text: 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Oui, annuler',
                cancelButtonText: 'Non'
            });

            if (result.isConfirmed) {
                try {
                    const appointment = allAppointments.find(apt => apt.id === parseInt(aptId));

                    if (!appointment) {
                        console.error('❌ RDV introuvable:', aptId);
                        showNotification('error', 'Rendez-vous introuvable');
                        return;
                    }

                    await RendezVousAPI.updateStatus(aptId, 'annuler');
                    showNotification('success', 'Rendez-vous annulé avec succès');

                    removeAppointmentFromDisplay(aptId);

                } catch (error) {
                    console.error('❌ Erreur annulation:', error);
                    showNotification('error', 'Erreur lors de l\'annulation du rendez-vous');
                }
            }
        });
    });

    document.querySelectorAll('.validate-confirm-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const aptId = this.dataset.id;

            // ✅ CORRECTION : Utiliser l'ID direct au lieu de naviguer dans le DOM
            const confirmContainer = document.getElementById(`confirmContainer-${aptId}`);
            const noteElement = confirmContainer ? confirmContainer.querySelector('.confirm-note') : null;
            const note = noteElement ? noteElement.value.trim() : '';

            console.log('🎯 Confirmation RDV:', aptId);
            console.log('📝 Note:', note);

            try {
                // Récupérer les infos du RDV AVANT l'action
                const appointment = allAppointments.find(apt => apt.id === parseInt(aptId));

                if (!appointment) {
                    console.error('❌ RDV introuvable:', aptId);
                    showNotification('error', 'Rendez-vous introuvable');
                    return;
                }

                console.log('👤 Patient du RDV:', appointment.patient?.prenom, appointment.patient?.nom);

                // Terminer le RDV
                await RendezVousAPI.updateStatus(aptId, 'terminer');
                console.log('✅ RDV terminé avec succès');

                // Créer une séance si c'est une séance
                if (appointment && appointment.type === 'SEANCE') {
                    console.log('🏥 Type SEANCE détecté - création de séance...');
                    await SeanceAPI.createFromRendezVous(aptId, note);
                    console.log('✅ Séance créée avec succès');
                }

                // ✅ NOUVEAU : Mettre à jour la dernière visite du patient
                if (appointment.patient && appointment.patient.id) {
                    console.log('🔄 Mise à jour dernière visite du patient...');
                    await PatientAPI.updateLastVisit(appointment.patient.id);
                    console.log('✅ Dernière visite mise à jour');
                }

                showNotification('success', 'Rendez-vous confirmé et séance créée avec succès');

                // ✅ CORRECTION : Masquer le container de confirmation
                if (confirmContainer) {
                    confirmContainer.classList.add('hidden');
                    if (noteElement) {
                        noteElement.value = ''; // Vider le champ
                    }
                }

                // ✅ APPELER la fonction de suppression et déplacement
                removeAppointmentFromDisplay(aptId);

            } catch (error) {
                console.error('❌ Erreur complète:', error);
                showNotification('error', 'Erreur lors de la confirmation du rendez-vous: ' + error.message);
            }
        });
    });

    function debugAppointmentStructure(aptId) {
        console.log('🔍 Debug structure pour RDV:', aptId);

        const confirmContainer = document.getElementById(`confirmContainer-${aptId}`);
        const rescheduleContainer = document.getElementById(`rescheduleContainer-${aptId}`);

        console.log('📝 Confirm container:', confirmContainer);
        if (confirmContainer) {
            const noteElement = confirmContainer.querySelector('.confirm-note');
            console.log('📝 Note element dans confirm:', noteElement);
        }

        console.log('📅 Reschedule container:', rescheduleContainer);
        if (rescheduleContainer) {
            const dateElement = rescheduleContainer.querySelector('.reschedule-date');
            const timeElement = rescheduleContainer.querySelector('.reschedule-time');
            console.log('📅 Date element dans reschedule:', dateElement);
            console.log('🕐 Time element dans reschedule:', timeElement);
        }
    }

    // Boutons de validation report
    document.querySelectorAll('.validate-reschedule-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const aptId = this.dataset.id;

            // ✅ CORRECTION : Utiliser l'ID direct au lieu de naviguer dans le DOM
            const rescheduleContainer = document.getElementById(`rescheduleContainer-${aptId}`);
            const dateElement = rescheduleContainer ? rescheduleContainer.querySelector('.reschedule-date') : null;
            const timeElement = rescheduleContainer ? rescheduleContainer.querySelector('.reschedule-time') : null;

            const newDate = dateElement ? dateElement.value : '';
            const newTime = timeElement ? timeElement.value : '';

            console.log('🎯 Report RDV:', aptId);
            console.log('📅 Nouvelle date:', newDate);
            console.log('🕐 Nouvelle heure:', newTime);

            if (!newDate || !newTime) {
                showNotification('error', 'Veuillez sélectionner une date et une heure');
                return;
            }

            try {
                // Récupérer les infos du RDV AVANT l'action
                const appointment = allAppointments.find(apt => apt.id === parseInt(aptId));

                if (!appointment) {
                    console.error('❌ RDV introuvable:', aptId);
                    showNotification('error', 'Rendez-vous introuvable');
                    return;
                }

                console.log('👤 Patient du RDV à reporter:', appointment.patient?.prenom, appointment.patient?.nom);

                await RendezVousAPI.reschedule(aptId, newDate, newTime);
                showNotification('success', 'Rendez-vous reporté avec succès');

                // ✅ APPELER la fonction de suppression et déplacement
                removeAppointmentFromDisplay(aptId);

            } catch (error) {
                console.error('❌ Erreur report:', error);
                showNotification('error', 'Erreur lors du report du rendez-vous: ' + error.message);
            }
        });
    });
}

function setupTaskEventListeners() {
    // Checkboxes des tâches
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            const taskId = this.dataset.id;
            const isCompleted = this.checked;

            try {
                if (isCompleted) {
                    await TacheAPI.markCompleted(taskId);
                    showNotification('success', 'Tâche marquée comme terminée');

                    // Programmer la suppression après 2 heures
                    setTimeout(async () => {
                        try {
                            await TacheAPI.delete(taskId);
                            await refreshTasks();
                        } catch (error) {
                            console.error('Erreur lors de la suppression automatique:', error);
                        }
                    }, 2 * 60 * 60 * 1000);
                }

                // Mettre à jour l'affichage
                const taskItem = this.closest('.task-item');
                const taskText = taskItem.querySelector('.task-text');
                const taskDate = taskItem.querySelector('.task-date');

                if (isCompleted) {
                    taskItem.classList.add('completed-task');
                    taskText.classList.add('line-through', 'text-gray-500');
                    taskDate.classList.add('text-gray-400');
                } else {
                    taskItem.classList.remove('completed-task');
                    taskText.classList.remove('line-through', 'text-gray-500');
                    taskDate.classList.remove('text-gray-400');
                }
            } catch (error) {
                this.checked = !isCompleted; // Revert checkbox state
                showNotification('error', 'Erreur lors de la mise à jour de la tâche');
            }
        });
    });

    // Boutons de suppression des tâches
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const taskId = this.dataset.id;

            const result = await Swal.fire({
                title: 'Supprimer la tâche',
                text: 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Supprimer',
                cancelButtonText: 'Annuler'
            });

            if (result.isConfirmed) {
                try {
                    await TacheAPI.delete(taskId);
                    showNotification('success', 'Tâche supprimée avec succès');
                    await refreshTasks();
                } catch (error) {
                    showNotification('error', 'Erreur lors de la suppression de la tâche');
                }
            }
        });
    });
}

function setupPatientEventListeners() {
    document.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            try {
                const patientData = JSON.parse(this.dataset.patient);
                if (typeof openPatientRecords === 'function') {
                    openPatientRecords(patientData);
                } else {
                    showNotification('info', 'Fonction de consultation des dossiers en cours de chargement...');
                }
            } catch (error) {
                console.error('Erreur lors de l\'ouverture du dossier patient:', error);
                showNotification('error', 'Erreur lors de l\'ouverture du dossier patient');
            }
        });
    });
}

// Fonctions de rafraîchissement
async function refreshDashboard() {
    console.log('🔄 Rafraîchissement du dashboard...');

    try {
        // Afficher les indicateurs de chargement
        showLoadingIndicators();

        // Charger les données
        const [dashboardData, appointments, tasks, patients] = await Promise.all([
            DashboardAPI.getComplete(),
            RendezVousAPI.getTodayAppointments(),
            TacheAPI.getToday(),
            PatientAPI.getRecentPatients()
        ]);

        // Mettre à jour l'affichage
        if (dashboardData) {
            renderStatsCards(dashboardData);
        }

        renderAppointments(appointments, true); // ✅ Limiter à 4
        renderTasks(tasks);
        renderRecentPatients(patients, true); // ✅ Limiter à 7

        console.log('✅ Dashboard rafraîchi avec succès');

    } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement:', error);
        showNotification('error', 'Erreur lors du rafraîchissement des données');
    }
}

async function refreshRecentPatients() {
    try {
        const patients = await PatientAPI.getRecentPatients();
        renderRecentPatients(patients, true); // ✅ Limiter à 7
        console.log('✅ Patients récents rafraîchis');
    } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement des patients récents:', error);
    }
}

async function refreshTasks() {
    try {
        const tasks = await TacheAPI.getToday();
        renderTasks(tasks);
    } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement des tâches:', error);
    }
}

function showLoadingIndicators() {
    // Cartes de stats
    const statsContainer = document.getElementById('statsCards');
    if (statsContainer) {
        statsContainer.innerHTML = Array(4).fill(0).map(() => `
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
        `).join('');
    }

    // Rendez-vous
    const appointmentsContainer = document.getElementById('appointmentsContainer');
    if (appointmentsContainer) {
        appointmentsContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Chargement des rendez-vous...
            </div>
        `;
    }

    // Tâches
    const tasksContainer = document.getElementById('tasksContainer');
    if (tasksContainer) {
        tasksContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Chargement des tâches...
            </div>
        `;
    }
}

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Notifications
function showNotification(type, message, title = '') {
    const notification = document.getElementById('notification');
    const titleElement = document.getElementById('notificationTitle');
    const messageElement = document.getElementById('notificationMessage');
    const iconElement = notification.querySelector('.notification-icon i');

    if (!notification) return;

    // Définir le style selon le type
    const styles = {
        success: { color: '#10b981', icon: 'ri-check-line', title: 'Succès' },
        error: { color: '#ef4444', icon: 'ri-error-warning-line', title: 'Erreur' },
        warning: { color: '#f59e0b', icon: 'ri-alert-line', title: 'Attention' },
        info: { color: '#3b82f6', icon: 'ri-information-line', title: 'Information' }
    };

    const style = styles[type] || styles.info;

    notification.style.borderLeftColor = style.color;
    notification.querySelector('.notification-icon').style.color = style.color;
    iconElement.className = style.icon;
    titleElement.textContent = title || style.title;
    messageElement.textContent = message;

    notification.classList.remove('hidden');
    notification.classList.add('show');

    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 300);
    }
}

// Gestion des modals
function setupModals() {
    // Modal ajout tâche
    const addTaskModal = document.getElementById('addTaskModal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const closeTaskBtn = document.getElementById('closeTaskBtn');
    const submitTaskBtn = document.getElementById('submitTaskBtn');

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            // Définir la date par défaut à aujourd'hui
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('taskDate').value = today;
            showModal('addTaskModal');
        });
    }

    if (closeTaskBtn) {
        closeTaskBtn.addEventListener('click', () => hideModal('addTaskModal'));
    }

    if (submitTaskBtn) {
        submitTaskBtn.addEventListener('click', async () => {
            const description = document.getElementById('taskDescription').value.trim();
            const date = document.getElementById('taskDate').value;
            const time = document.getElementById('taskTime').value;

            if (!description) {
                showNotification('warning', 'Veuillez saisir une description pour la tâche');
                return;
            }

            if (!date) {
                showNotification('warning', 'Veuillez sélectionner une date');
                return;
            }

            try {
                const taskData = {
                    description: description,
                    date: date,
                    heure: time || null,
                    terminee: false
                };

                await TacheAPI.create(taskData);
                showNotification('success', 'Tâche créée avec succès');

                // Réinitialiser le formulaire
                document.getElementById('addTaskForm').reset();
                hideModal('addTaskModal');

                // Rafraîchir les tâches
                await refreshTasks();

            } catch (error) {
                showNotification('error', 'Erreur lors de la création de la tâche');
            }
        });
    }

    // Modal tous les rendez-vous
    const viewAllAppointmentsBtn = document.getElementById('viewAllAppointmentsBtn');
    const allAppointmentsModal = document.getElementById('allAppointmentsModal');
    const closeAllAppointmentsBtn = document.getElementById('closeAllAppointmentsBtn');

    if (viewAllAppointmentsBtn) {
        viewAllAppointmentsBtn.addEventListener('click', async () => {
            showModal('allAppointmentsModal');

            try {
                // ✅ Utiliser allAppointments stockés localement pour éviter un appel API
                const appointments = allAppointments.length > 0 ? allAppointments : await RendezVousAPI.getTodayAppointments();
                const container = document.getElementById('allAppointmentsContainer');

                if (appointments.length === 0) {
                    container.innerHTML = `
                        <div class="p-6 text-center text-gray-500">
                            <i class="ri-calendar-line text-4xl mb-2"></i>
                            <p>Aucun rendez-vous aujourd'hui</p>
                        </div>
                    `;
                } else {
                    // ✅ Afficher TOUS les RDV dans le modal (sans limitation)
                    container.innerHTML = appointments.map((apt, index) => {
                        const initials = getAvatarInitials(apt.patient?.prenom, apt.patient?.nom);
                        const avatarColor = getAvatarColor(index);

                        return `
                            <div class="flex items-start p-4 rounded-lg border border-gray-100">
                                <div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center mr-3 flex-shrink-0">
                                    <span class="font-medium">${initials}</span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-gray-800">${apt.nomCompletPatient || 'Patient inconnu'}</p>
                                    <p class="text-sm text-gray-600">${formatTime(apt.heureDebut)} - ${formatTime(apt.heureFin)}</p>
                                    <p class="text-xs text-gray-500 mt-1">${apt.type === 'SEANCE' ? 'Séance' : apt.type === 'ANAMNESE' ? 'Anamnèse' : 'Compte rendu'}</p>
                                </div>
                                <div class="ml-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${getStatutBadgeClass(apt.statut)}">${getStatutLabel(apt.statut)}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch (error) {
                const container = document.getElementById('allAppointmentsContainer');
                container.innerHTML = `
                    <div class="p-6 text-center text-red-500">
                        <i class="ri-error-warning-line text-4xl mb-2"></i>
                        <p>Erreur lors du chargement des rendez-vous</p>
                    </div>
                `;
            }
        });
    }

    if (closeAllAppointmentsBtn) {
        closeAllAppointmentsBtn.addEventListener('click', () => hideModal('allAppointmentsModal'));
    }

    // Modal tous les patients
    const viewAllPatientsBtn = document.getElementById('viewAllPatientsBtn');
    const allPatientsModal = document.getElementById('allPatientsModal');
    const closeAllPatientsBtn = document.getElementById('closeAllPatientsBtn');

    if (viewAllPatientsBtn) {
        viewAllPatientsBtn.addEventListener('click', async () => {
            showModal('allPatientsModal');

            try {
                // ✅ Utiliser allPatients stockés localement ou recharger si nécessaire
                const patients = allPatients.length > 0 ? allPatients : await PatientAPI.getAll();
                const tableBody = document.getElementById('allPatientsTableBody');

                if (patients.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                                Aucun patient enregistré
                            </td>
                        </tr>
                    `;
                } else {
                    // ✅ Afficher TOUS les patients dans le modal (sans limitation)
                    tableBody.innerHTML = patients.map((patient, index) => {
                        const initials = getAvatarInitials(patient.prenom, patient.nom);
                        const avatarColor = getAvatarColor(index);
                        const age = patient.dateNaissance ? new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear() : 'N/A';
                        const seancesText = `${patient.seancesEffectuees || 0}/${patient.seancesPrevues || 0}`;

                        return `
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center mr-3">
                                            <span class="text-xs font-medium">${initials}</span>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">${patient.prenom} ${patient.nom}</p>
                                            <p class="text-xs text-gray-500">${age} ans</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    ${formatDate(patient.derniereVisite)}
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap">
                                    <span class="px-2 py-1 text-xs rounded-full ${getStatutBadgeClass(patient.statut)}">
                                        ${getStatutLabel(patient.statut)}
                                    </span>
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    ${seancesText}
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
                                    <button class="view-patient-modal-btn text-primary hover:text-primary/80" data-patient='${JSON.stringify(patient)}'>
                                        Voir dossier
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');

                    // Ajouter les event listeners pour les boutons "Voir dossier"
                    document.querySelectorAll('.view-patient-modal-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            try {
                                const patientData = JSON.parse(this.dataset.patient);
                                hideModal('allPatientsModal');
                                if (typeof openPatientRecords === 'function') {
                                    openPatientRecords(patientData);
                                } else {
                                    showNotification('info', 'Fonction de consultation des dossiers en cours de chargement...');
                                }
                            } catch (error) {
                                console.error('Erreur lors de l\'ouverture du dossier patient:', error);
                                showNotification('error', 'Erreur lors de l\'ouverture du dossier patient');
                            }
                        });
                    });
                }
            } catch (error) {
                const tableBody = document.getElementById('allPatientsTableBody');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-4 py-6 text-center text-red-500">
                            Erreur lors du chargement des patients
                        </td>
                    </tr>
                `;
            }
        });
    }

    if (closeAllPatientsBtn) {
        closeAllPatientsBtn.addEventListener('click', () => hideModal('allPatientsModal'));
    }

    // Fermer les modals en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
}

// Autres fonctions utilitaires
// Recherche globale avec sélecteur de patients
function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;

    // Créer le conteneur des options de recherche
    const searchContainer = searchInput.parentElement;
    searchContainer.style.position = 'relative';

    const searchOptions = document.createElement('div');
    searchOptions.id = 'globalSearchOptions';
    searchOptions.className = 'absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-button shadow-lg z-50 max-h-60 overflow-y-auto hidden';
    searchContainer.appendChild(searchOptions);

    let searchTimeout;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();

        if (query.length < 2) {
            searchOptions.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                // Rechercher dans tous les patients
                const patients = allPatients.length > 0 ? allPatients : await PatientAPI.getAll();
                const filteredPatients = patients.filter(patient =>
                    patient.nom.toLowerCase().includes(query.toLowerCase()) ||
                    patient.prenom.toLowerCase().includes(query.toLowerCase()) ||
                    patient.pathologie?.toLowerCase().includes(query.toLowerCase())
                );

                // Afficher les résultats dans le dropdown
                if (filteredPatients.length > 0) {
                    searchOptions.innerHTML = filteredPatients.slice(0, 8).map((patient, index) => {
                        const initials = getAvatarInitials(patient.prenom, patient.nom);
                        const avatarColor = getAvatarColor(index);
                        const age = patient.dateNaissance ? new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear() : 'N/A';
                        const seancesText = `${patient.seancesEffectuees || 0}/${patient.seancesPrevues || 0}`;

                        return `
                            <div class="search-patient-option px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" data-patient='${JSON.stringify(patient)}'>
                                <div class="flex items-center">
                                    <div class="w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center mr-3">
                                        <span class="text-xs font-medium">${initials}</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-800">${patient.prenom} ${patient.nom}</p>
                                        <p class="text-xs text-gray-500">${patient.pathologie || 'Aucune pathologie'} • ${age} ans • ${seancesText} séances</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

                    searchOptions.classList.remove('hidden');

                    // Ajouter les event listeners pour les options
                    document.querySelectorAll('.search-patient-option').forEach(option => {
                        option.addEventListener('click', function() {
                            try {
                                const patientData = JSON.parse(this.dataset.patient);
                                searchInput.value = ''; // Vider la recherche
                                searchOptions.classList.add('hidden');

                                if (typeof openPatientRecords === 'function') {
                                    openPatientRecords(patientData);
                                } else {
                                    showNotification('info', 'Fonction de consultation des dossiers en cours de chargement...');
                                }
                            } catch (error) {
                                console.error('Erreur lors de l\'ouverture du dossier patient:', error);
                                showNotification('error', 'Erreur lors de l\'ouverture du dossier patient');
                            }
                        });
                    });
                } else {
                    searchOptions.innerHTML = `
                        <div class="px-4 py-3 text-center text-gray-500">
                            <i class="ri-search-line text-lg mb-1"></i>
                            <p class="text-sm">Aucun patient trouvé</p>
                        </div>
                    `;
                    searchOptions.classList.remove('hidden');
                }
            } catch (error) {
                searchOptions.innerHTML = `
                    <div class="px-4 py-3 text-center text-red-500">
                        <i class="ri-error-warning-line text-lg mb-1"></i>
                        <p class="text-sm">Erreur lors de la recherche</p>
                    </div>
                `;
                searchOptions.classList.remove('hidden');
            }
        }, 300);
    });

    // Fermer les options quand on clique ailleurs
    document.addEventListener('click', function(e) {
        if (!searchContainer.contains(e.target)) {
            searchOptions.classList.add('hidden');
        }
    });

    // Afficher les options quand on focus l'input (si il y a du contenu)
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            const event = new Event('input');
            this.dispatchEvent(event);
        }
    });

    // Fermer les options quand on appuie sur Échap
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchOptions.classList.add('hidden');
            this.blur();
        }
    });
}

function setupNewPatientButton() {
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', () => {
            // Redirection vers la page de création de patient
            window.location.href = '/patients/page';
        });
    }
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateElement.textContent = today.toLocaleDateString('fr-FR', options);
    }
}

function setupAutoRefresh() {
    // Rafraîchir automatiquement toutes les 5 minutes
    refreshInterval = setInterval(async () => {
        console.log('🔄 Rafraîchissement automatique...');
        await refreshDashboard();
    }, 5 * 60 * 1000);
}

function setupVisibilityChange() {
    // Rafraîchir quand l'utilisateur revient sur la page
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            console.log('👁️ Page visible - rafraîchissement...');
            await refreshDashboard();
        }
    });
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation du tableau de bord...');

    try {
        // Mise à jour de la date
        updateCurrentDate();

        // Configuration des modals
        setupModals();

        // Configuration de la recherche globale
        setupGlobalSearch();

        // Configuration du bouton nouveau patient
        setupNewPatientButton();

        // Configuration du rafraîchissement automatique
        setupAutoRefresh();

        // Configuration du changement de visibilité
        setupVisibilityChange();

        // Chargement initial des données
        await refreshDashboard();

        console.log('✅ Tableau de bord initialisé avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showNotification('error', 'Erreur lors de l\'initialisation du tableau de bord');
    }
});

// Nettoyage lors de la fermeture
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});