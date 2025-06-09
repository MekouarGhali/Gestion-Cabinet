// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let currentWeekStart = new Date();
let selectedAppointment = null;
let allPatients = [];
let currentRendezVous = [];

// Classe pour gérer les appels API Rendez-vous
class RendezVousAPI {
    static async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous`);
            if (!response.ok) throw new Error('Erreur lors du chargement des rendez-vous');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getAll:', error);
            showNotification('error', 'Erreur lors du chargement des rendez-vous');
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous/${id}`);
            if (!response.ok) throw new Error('Rendez-vous introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById:', error);
            return null;
        }
    }

    static async getByWeek(startDate) {
        try {
            console.log(`🔍 getByWeek appelé avec startDate: ${startDate.toDateString()}`);

            const weekStart = new Date(startDate);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 5);

            console.log(`📅 Avant formatage:`);
            console.log(`  weekStart: ${weekStart.toDateString()} (${weekStart.toISOString()})`);
            console.log(`  weekEnd: ${weekEnd.toDateString()} (${weekEnd.toISOString()})`);

            const startDateStr = formatDateForAPI(weekStart);
            const endDateStr = formatDateForAPI(weekEnd);

            console.log(`📅 Après formatage:`);
            console.log(`  startDateStr: ${startDateStr}`);
            console.log(`  endDateStr: ${endDateStr}`);

            // ✅ VÉRIFICATION CRITIQUE : Comparer ce qu'on calcule vs ce qu'on envoie
            if (startDateStr !== '2025-06-02' || endDateStr !== '2025-06-07') {
                console.error(`❌ PROBLÈME DE FORMATAGE DÉTECTÉ !`);
                console.error(`❌ Attendu: 2025-06-02 à 2025-06-07`);
                console.error(`❌ Obtenu: ${startDateStr} à ${endDateStr}`);
            } else {
                console.log(`✅ Formatage correct !`);
            }

            const url = `${API_BASE_URL}/rendez-vous/date-range?dateDebut=${startDateStr}&dateFin=${endDateStr}`;
            console.log(`🌐 URL finale: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                throw new Error('Erreur lors du chargement de la semaine');
            }

            const data = await response.json();
            console.log(`📡 API Response: ${data.length} RDV reçus`);

            return data;
        } catch (error) {
            console.error('❌ Erreur API getByWeek:', error);
            return [];
        }
    }

    static async create(rendezVousData) {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rendezVousData)
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

    static async update(id, rendezVousData) {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rendezVousData)
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
            const response = await fetch(`${API_BASE_URL}/rendez-vous/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            return true;
        } catch (error) {
            console.error('Erreur API delete:', error);
            throw error;
        }
    }

    static async searchByPatient(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/rendez-vous/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erreur lors de la recherche');
            return await response.json();
        } catch (error) {
            console.error('Erreur API searchByPatient:', error);
            return [];
        }
    }
}

// Classe pour gérer les appels API Patients
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
            console.error('Erreur API update patient:', error);
            throw error;
        }
    }
}

// Utilitaires
function formatDateForAPI(date) {
    console.log(`🔍 formatDateForAPI appelé avec:`, date);
    console.log(`📅 Date input: ${date.toDateString()}`);
    console.log(`📅 Date ISO: ${date.toISOString()}`);

    // ✅ MÉTHODE SÛRE : Utiliser les getters pour éviter les problèmes de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 car getMonth() retourne 0-11
    const day = String(date.getDate()).padStart(2, '0');

    const formatted = `${year}-${month}-${day}`;
    console.log(`📅 Date formatée: ${formatted}`);

    return formatted;
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatTimeForDisplay(timeString) {
    return timeString.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
}

function getMonthName(monthIndex) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthIndex];
}

function getTypeLabel(type) {
    switch(type) {
        case 'SEANCE': return 'Séance';
        case 'ANAMNESE': return 'Anamnèse';
        case 'COMPTE_RENDU': return 'Compte Rendu';
        default: return type;
    }
}

function calculateSeancesRestantes(patient) {
    if (!patient) return 0;
    const prevues = patient.seancesPrevues || 0;
    const effectuees = patient.seancesEffectuees || 0;
    return Math.max(0, prevues - effectuees);
}

// Gestion du calendrier
async function loadRendezVous() {
    try {
        console.log(`🔄 Chargement des RDV pour la semaine du ${formatDateForAPI(currentWeekStart)}`);
        console.log(`📅 currentWeekStart raw:`, currentWeekStart);

        // ✅ Normaliser les dates pour l'API
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);

        console.log(`📅 weekStart normalisé:`, weekStart.toDateString());

        // ✅ AJOUT: Vérifier aussi en récupérant TOUS les RDV pour debug
        console.log(`🔍 Test: récupération de TOUS les RDV pour debug...`);
        const tousLesRdv = await RendezVousAPI.getAll();
        console.log(`📊 Total RDV dans la base: ${tousLesRdv.length}`);

        // Filtrer manuellement pour voir s'il y a des RDV du 7 juin
        const rdvDu7 = tousLesRdv.filter(rdv => rdv.dateRendezVous === '2025-06-07');
        console.log(`📅 RDV du 2025-06-07: ${rdvDu7.length}`, rdvDu7);

        // Filtrer pour la semaine courante
        const rdvSemaine = tousLesRdv.filter(rdv => {
            const rdvDate = rdv.dateRendezVous;
            return rdvDate >= formatDateForAPI(weekStart) &&
                rdvDate <= formatDateForAPI(new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000));
        });
        console.log(`📅 RDV de la semaine (filtrés manuellement): ${rdvSemaine.length}`, rdvSemaine);

        // Appel API normal
        currentRendezVous = await RendezVousAPI.getByWeek(weekStart);
        console.log(`📊 ${currentRendezVous.length} RDV trouvés via API pour la semaine:`, currentRendezVous);

        // Si l'API ne retourne rien mais qu'on a des RDV manuellement, utiliser le filtre manuel
        if (currentRendezVous.length === 0 && rdvSemaine.length > 0) {
            console.log(`🔧 Utilisation du filtre manuel car API ne retourne rien`);
            currentRendezVous = rdvSemaine;
        }

        // Afficher les détails de chaque RDV
        currentRendezVous.forEach((rdv, index) => {
            const recurringText = rdv.estRecurrent ? ' (RÉCURRENT)' : '';
            console.log(`  ${index + 1}. ${rdv.patient.prenom} ${rdv.patient.nom} - ${rdv.dateRendezVous} ${rdv.heureDebut}${recurringText}`);
        });

        // Compter les RDV récurrents
        const recurringCount = currentRendezVous.filter(rdv => rdv.estRecurrent).length;
        console.log(`🔄 ${recurringCount} RDV récurrents dans cette semaine`);

        updateCalendarView();
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        showNotification('error', 'Erreur lors du chargement des rendez-vous');
    }
}

function updateWeekView() {
    const weekDaysContainer = document.getElementById('weekDays');
    weekDaysContainer.innerHTML = '';

    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dateIds = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    // Mise à jour de la date actuelle
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('fr-FR', options);

    // ✅ CORRECTION: Normaliser currentWeekStart
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    console.log(`📅 Génération semaine du ${weekStart.toDateString()}`);

    // Génération des colonnes des jours
    daysOfWeek.forEach((day, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);

        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column bg-white';
        dayColumn.id = `day-${dateIds[index]}`;
        dayColumn.dataset.date = formatDateForAPI(dayDate);

        console.log(`📋 Création colonne: day-${dateIds[index]} pour ${dayDate.toDateString()} (${formatDateForAPI(dayDate)})`);

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';

        // Vérifier si c'est aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dayDate.getTime() === today.getTime()) {
            dayHeader.classList.add('today-highlight');
            console.log(`🎯 Jour actuel: ${day}`);
        }

        const combinedDate = document.createElement('div');
        combinedDate.className = 'combined-date';
        combinedDate.innerHTML = `
            <div>${day}</div>
            <div class="day-number">${dayDate.getDate()}</div>
            <div>${getMonthName(dayDate.getMonth())}</div>
        `;

        dayHeader.appendChild(combinedDate);
        dayColumn.appendChild(dayHeader);

        const timeSlotsContainer = document.createElement('div');
        timeSlotsContainer.className = 'relative bg-white';

        // Ajouter les créneaux horaires (12 créneaux pour 8h à 19h)
        for (let i = 0; i < 12; i++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot bg-white';
            timeSlotsContainer.appendChild(timeSlot);
        }

        dayColumn.appendChild(timeSlotsContainer);
        weekDaysContainer.appendChild(dayColumn);
    });

    // Mise à jour de l'affichage de la plage de semaine
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 5); // Samedi
    document.getElementById('weekRange').textContent =
        `${weekStart.getDate()} ${getMonthName(weekStart.getMonth())} - ${weekEnd.getDate()} ${getMonthName(weekEnd.getMonth())} ${weekStart.getFullYear()}`;

    console.log(`📅 Semaine mise à jour: ${formatDateForAPI(weekStart)} à ${formatDateForAPI(weekEnd)}`);

    // Debug: Lister toutes les colonnes créées
    setTimeout(() => {
        const allColumns = document.querySelectorAll('[id^="day-"]');
        console.log('📋 Colonnes créées:', Array.from(allColumns).map(col => col.id));
    }, 100);
}

function updateCalendarView() {
    console.log(`🎨 Mise à jour du calendrier avec ${currentRendezVous.length} RDV`);

    // Effacer tous les rendez-vous existants
    const existingAppointments = document.querySelectorAll('.appointment');
    console.log(`🗑️ Suppression de ${existingAppointments.length} RDV existants`);
    existingAppointments.forEach(app => app.remove());

    // Ajouter les rendez-vous de la semaine courante
    currentRendezVous.forEach((rendezVous, index) => {
        console.log(`➕ Ajout RDV ${index + 1}: ${rendezVous.patient.prenom} ${rendezVous.patient.nom}`);
        createAppointmentElement(rendezVous);
    });

    console.log(`✅ Calendrier mis à jour`);
}

function createAppointmentElement(rendezVous) {
    console.log(`🔍 Traitement RDV: ${rendezVous.patient.prenom} ${rendezVous.patient.nom} - Date: ${rendezVous.dateRendezVous}`);

    // ✅ CORRECTION CRITIQUE: Créer la date sans problème de timezone
    const dateString = rendezVous.dateRendezVous; // "2025-06-07"
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // Mois 0-indexé

    const dayOfWeek = dateObj.getDay(); // 0=Dimanche, 1=Lundi, etc.
    console.log(`📅 Date obj: ${dateObj.toDateString()}, Day of week: ${dayOfWeek}`);

    // Ajuster pour notre affichage de semaine (Lundi=0 à Samedi=5)
    let dayIndex = dayOfWeek === 0 ? 5 : dayOfWeek - 1; // Dimanche devient Samedi (index 5)
    console.log(`📊 Day index calculé: ${dayIndex}`);

    // ✅ CORRECTION: Vérifier si la date est dans la semaine courante
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 5); // Lundi à Samedi
    weekEnd.setHours(23, 59, 59, 999);

    // Normaliser la date du RDV pour comparaison
    const rdvDate = new Date(year, month - 1, day);
    rdvDate.setHours(12, 0, 0, 0); // Midi pour éviter les problèmes de timezone

    console.log(`📅 RDV Date: ${rdvDate.toDateString()}`);
    console.log(`📅 Week Start: ${weekStart.toDateString()}`);
    console.log(`📅 Week End: ${weekEnd.toDateString()}`);
    console.log(`📅 Is in week? ${rdvDate >= weekStart && rdvDate <= weekEnd}`);

    // Vérifier si le RDV est dans la semaine courante
    if (rdvDate < weekStart || rdvDate > weekEnd) {
        console.log(`❌ RDV hors de la semaine courante`);
        return;
    }

    // Vérifier que l'index du jour est valide (0-5 pour Lundi-Samedi)
    if (dayIndex < 0 || dayIndex > 5) {
        console.log(`❌ Index de jour invalide: ${dayIndex} pour ${dateString}`);
        return;
    }

    const dayColumns = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayColumnId = `day-${dayColumns[dayIndex]}`;
    const dayColumn = document.getElementById(dayColumnId);

    console.log(`🎯 Recherche colonne: ${dayColumnId}`);

    if (!dayColumn) {
        console.log(`❌ Colonne ${dayColumnId} introuvable pour index ${dayIndex}`);
        // Debug: afficher toutes les colonnes disponibles
        const allColumns = document.querySelectorAll('[id^="day-"]');
        console.log('📋 Colonnes disponibles:', Array.from(allColumns).map(col => col.id));
        return;
    }

    const timeSlotsContainer = dayColumn.querySelector('.relative');
    if (!timeSlotsContainer) {
        console.log(`❌ Container .relative introuvable dans ${dayColumnId}`);
        return;
    }

    // Calculer la position basée sur l'heure
    const startTime = rendezVous.heureDebut;
    const endTime = rendezVous.heureFin;

    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);

    const startPosition = (startHour - 8) * 60 + startMinute; // 60px par heure, base 8h
    const duration = (endHour - startHour) * 60 + (endMinute - startMinute);

    // Choisir la couleur basée sur le type de rendez-vous
    const typeClass = rendezVous.type.toLowerCase().replace(/_/g, '-');

    const appointment = document.createElement('div');
    appointment.className = `appointment ${typeClass}`;
    appointment.style.top = `${startPosition}px`;
    appointment.style.height = `${duration}px`;

    appointment.innerHTML = `
        <div class="appointment-header">
        <div class="text-xs font-medium">${formatTimeForDisplay(startTime)} - ${formatTimeForDisplay(endTime)}</div>
        ${rendezVous.estRecurrent ? '<div class="recurring-icon"><i class="fa-solid fa-arrows-rotate"></i></div>' : ''}
    </div>
    <div class="text-sm">${rendezVous.patient.prenom} ${rendezVous.patient.nom}</div>
    `;

    // Stocker les données du rendez-vous
    appointment.dataset.id = rendezVous.id;
    appointment.dataset.patientId = rendezVous.patient.id;
    if (rendezVous.estRecurrent) {
        appointment.dataset.recurring = 'true';
    }

    appointment.addEventListener('click', function(e) {
        e.stopPropagation();
        selectAppointment(this, rendezVous);
    });

    timeSlotsContainer.appendChild(appointment);
    console.log(`✅ RDV ajouté au calendrier dans ${dayColumnId}: ${rendezVous.patient.prenom} ${rendezVous.patient.nom} (${startTime}-${endTime})`);
}

function selectAppointment(appointmentElement, rendezVousData) {
    // Supprimer la classe selected de tous les rendez-vous
    document.querySelectorAll('.appointment').forEach(app => {
        app.classList.remove('selected');
    });

    // Ajouter la classe selected au rendez-vous cliqué
    appointmentElement.classList.add('selected');
    selectedAppointment = appointmentElement;

    // Calculer les séances restantes
    const seancesRestantes = calculateSeancesRestantes(rendezVousData.patient);

    // Mettre à jour le modal de détails - SUPPRESSION DU STATUT
    document.getElementById('detailPatientName').textContent = `${rendezVousData.patient.prenom} ${rendezVousData.patient.nom}`;
    document.getElementById('detailAppointmentType').textContent = getTypeLabel(rendezVousData.type);
    document.getElementById('detailPathologie').textContent = rendezVousData.patient.pathologie || '-';
    document.getElementById('detailTime').textContent = `${formatTimeForDisplay(rendezVousData.heureDebut)} - ${formatTimeForDisplay(rendezVousData.heureFin)}`;
    document.getElementById('detailDate').textContent = formatDateForDisplay(rendezVousData.dateRendezVous);
    document.getElementById('detailSeancesRestantes').textContent = `${seancesRestantes} séance(s)`;
    document.getElementById('detailNotes').textContent = rendezVousData.notes || '-';

    // Afficher le modal de détails
    document.getElementById('appointmentDetailsModal').classList.remove('hidden');
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
    const searchInput = document.getElementById(searchInputId);
    const optionsContainer = document.getElementById(optionsContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const clearBtn = document.getElementById(clearBtnId);

    // Afficher les options quand l'input est focus
    searchInput.addEventListener('focus', function() {
        optionsContainer.style.display = 'block';
        filterPatients(searchInputId, optionsContainerId);
    });

    // Cacher les options quand on clique ailleurs
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !optionsContainer.contains(e.target)) {
            optionsContainer.style.display = 'none';
        }
    });

    // Filtrer les options basées sur l'input
    searchInput.addEventListener('input', function() {
        filterPatients(searchInputId, optionsContainerId);

        // Afficher/cacher le bouton clear
        if (searchInput.value.trim() !== '') {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    });

    // Effacer la sélection
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        searchInput.value = '';
        hiddenInput.value = '';
        clearBtn.style.display = 'none';
        clearPathology(searchInputId);
        clearSeancesRestantes(searchInputId);
        filterPatients(searchInputId, optionsContainerId);
    });

    // Sélectionner une option
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

                // Mettre à jour la pathologie et les séances restantes
                updatePathologyField(searchInputId, patient.pathologie);
                updateSeancesRestantesField(searchInputId, patient);

                // Déclencher l'événement de changement
                const event = new Event('change');
                hiddenInput.dispatchEvent(event);
            }
        }
    });
}

async function filterPatients(searchInputId, optionsContainerId) {
    const searchInput = document.getElementById(searchInputId);
    const optionsContainer = document.getElementById(optionsContainerId);
    const searchTerm = searchInput.value.toLowerCase();

    // Effacer les options existantes
    optionsContainer.innerHTML = '';

    let patientsToShow = [];

    if (searchTerm.length >= 2) {
        // Rechercher dans l'API si le terme fait au moins 2 caractères
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
        // Afficher tous les patients si pas de recherche
        patientsToShow = allPatients.slice(0, 10); // Limiter à 10 pour les performances
    }

    patientsToShow.forEach(patient => {
        const seancesRestantes = calculateSeancesRestantes(patient);
        const option = document.createElement('div');
        option.className = 'patient-search-option';
        option.dataset.patientId = patient.id;
        option.innerHTML = `
            <div class="font-medium">${patient.prenom} ${patient.nom}</div>
            <div class="text-xs text-gray-500">${patient.pathologie || 'Aucune pathologie'} - ${seancesRestantes} séances restantes</div>
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

function updatePathologyField(searchInputId, pathologie) {
    if (searchInputId.includes('add')) {
        document.getElementById('addPathologie').value = pathologie || '';
    } else if (searchInputId.includes('edit')) {
        document.getElementById('editPathologie').value = pathologie || '';
    }
}

function updateSeancesRestantesField(searchInputId, patient) {
    const seancesRestantes = calculateSeancesRestantes(patient);
    if (searchInputId.includes('add')) {
        document.getElementById('addSeancesRestantes').value = seancesRestantes;
    } else if (searchInputId.includes('edit')) {
        document.getElementById('editSeancesRestantes').value = seancesRestantes;
    }
}

function clearPathology(searchInputId) {
    if (searchInputId.includes('add')) {
        document.getElementById('addPathologie').value = '';
    } else if (searchInputId.includes('edit')) {
        document.getElementById('editPathologie').value = '';
    }
}

function clearSeancesRestantes(searchInputId) {
    if (searchInputId.includes('add')) {
        document.getElementById('addSeancesRestantes').value = '';
    } else if (searchInputId.includes('edit')) {
        document.getElementById('editSeancesRestantes').value = '';
    }
}

// Gestion des heures
function populateTimeOptions() {
    const startTimeSelects = ['addStartTime', 'editStartTime'];
    const endTimeSelects = ['addEndTime', 'editEndTime'];

    startTimeSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '';

        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = timeString;
                option.textContent = timeString;
                select.appendChild(option);
            }
        }
    });

    endTimeSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '';

        for (let hour = 8; hour <= 19; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = timeString;
                option.textContent = timeString;
                select.appendChild(option);
            }
        }
    });
}

function updateEndTimeOptions(startTimeId, endTimeId) {
    const startTimeSelect = document.getElementById(startTimeId);
    const endTimeSelect = document.getElementById(endTimeId);
    const startTime = startTimeSelect.value;

    if (!startTime) return;

    // Effacer les options existantes
    endTimeSelect.innerHTML = '';

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startValue = startHour * 60 + startMinute;

    // Créer les créneaux de 8h à 19h
    for (let hour = 8; hour <= 19; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeValue = hour * 60 + minute;
            if (timeValue <= startValue) continue;

            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            endTimeSelect.appendChild(option);
        }
    }

    // Si aucune option n'a été ajoutée, ajouter au moins une option 30 minutes après
    if (endTimeSelect.options.length === 0) {
        const nextTime = new Date(`2000-01-01T${startTime}`);
        nextTime.setMinutes(nextTime.getMinutes() + 30);
        const nextTimeStr = nextTime.toTimeString().substring(0, 5);

        const option = document.createElement('option');
        option.value = nextTimeStr;
        option.textContent = nextTimeStr;
        endTimeSelect.appendChild(option);
    }

    // Sélectionner la première option
    if (endTimeSelect.options.length > 0) {
        endTimeSelect.selectedIndex = 0;
    }
}

// Validation
function validateRendezVousForm(isEdit = false) {
    const prefix = isEdit ? 'edit' : 'add';

    const date = document.getElementById(`${prefix}Date`).value;
    const patientId = document.getElementById(`${prefix}Patient`).value;
    const startTime = document.getElementById(`${prefix}StartTime`).value;
    const endTime = document.getElementById(`${prefix}EndTime`).value;

    if (!date) {
        showNotification('error', 'La date est obligatoire');
        return false;
    }

    if (!patientId) {
        showNotification('error', 'Veuillez sélectionner un patient');
        return false;
    }

    if (!startTime || !endTime) {
        showNotification('error', 'Les heures de début et fin sont obligatoires');
        return false;
    }

    if (startTime >= endTime) {
        showNotification('error', 'L\'heure de fin doit être après l\'heure de début');
        return false;
    }

    // Vérifier que la date n'est pas dans le passé
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today && !isEdit) {
        showNotification('error', 'Impossible de créer un rendez-vous dans le passé');
        return false;
    }

    // Permettre les dates passées en modification si récurrence activée
    if (selectedDate < today && isEdit) {
        const isRecurrent = document.getElementById(`${prefix}Recurring`).classList.contains('checked');

        if (!isRecurrent) {
            showNotification('error', 'Impossible de modifier un rendez-vous vers une date passée');
            return false;
        }
    }

    return true;
}

// CRUD Operations
async function saveNewRendezVous() {
    if (!validateRendezVousForm()) return;

    const rendezVousData = {
        patient: { id: parseInt(document.getElementById('addPatient').value) },
        dateRendezVous: document.getElementById('addDate').value,
        heureDebut: document.getElementById('addStartTime').value,
        heureFin: document.getElementById('addEndTime').value,
        type: document.getElementById('addAppointmentType').value,
        notes: document.getElementById('addNotes').value.trim(),
        estRecurrent: document.getElementById('addRecurring').classList.contains('checked'),
        statut: 'PLANIFIE' // ✅ FORCER LE STATUT À PLANIFIE
    };

    console.log(`💾 Création RDV:`, rendezVousData);

    try {
        const nouveauRDV = await RendezVousAPI.create(rendezVousData);
        console.log(`✅ RDV créé avec succès:`, nouveauRDV);

        document.getElementById('addAppointmentModal').classList.add('hidden');

        if (rendezVousData.estRecurrent) {
            showNotification('success', 'Rendez-vous récurrent créé avec succès ! Tous les RDV futurs ont été générés.');
        } else {
            showNotification('success', 'Rendez-vous ajouté avec succès!');
        }

        // Recharger les données ET mettre à jour l'affichage
        await loadRendezVous();
        resetForm('add');
    } catch (error) {
        console.error(`❌ Erreur création RDV:`, error);
        showNotification('error', error.message || 'Erreur lors de la création du rendez-vous');
    }
}

async function saveEditedRendezVous() {
    if (!validateRendezVousForm(true)) return;

    const rendezVousId = document.getElementById('editAppointmentId').value;

    // ✅ CORRECTION : Trouver le RDV actuel dans la liste globale
    const currentRdv = currentRendezVous.find(rv => rv.id == rendezVousId);
    const wasRecurrent = currentRdv ? currentRdv.estRecurrent : false;
    const isNowRecurrent = document.getElementById('editRecurring').classList.contains('checked');

    const rendezVousData = {
        patient: { id: parseInt(document.getElementById('editPatient').value) },
        dateRendezVous: document.getElementById('editDate').value,
        heureDebut: document.getElementById('editStartTime').value,
        heureFin: document.getElementById('editEndTime').value,
        type: document.getElementById('editAppointmentType').value,
        notes: document.getElementById('editNotes').value.trim(),
        estRecurrent: isNowRecurrent
    };

    try {
        if (wasRecurrent && !isNowRecurrent) {
            // ✅ CAS 1 : RDV était récurrent → devient normal (supprimer futurs)
            console.log('🗑️ RDV était récurrent et maintenant décoché - Suppression des RDV futurs...');

            await RendezVousAPI.update(rendezVousId, rendezVousData);
            const nbSupprimés = await supprimerRdvRecurrentsFuturs(currentRdv);

            showNotification('success', `Rendez-vous modifié et ${nbSupprimés} RDV récurrents futurs supprimés!`);

        } else if (!wasRecurrent && isNowRecurrent) {
            // ✅ CAS 2 : RDV était normal → devient récurrent (créer futurs)
            console.log('➕ RDV était normal et maintenant coché récurrent - Création des RDV futurs...');

            await RendezVousAPI.update(rendezVousId, rendezVousData);
            const nbCrées = await creerRdvRecurrentsFuturs(currentRdv, rendezVousData);

            showNotification('success', `Rendez-vous modifié et ${nbCrées} RDV récurrents futurs créés!`);

        } else {
            // ✅ CAS 3 : Modification normale (pas de changement de récurrence)
            await RendezVousAPI.update(rendezVousId, rendezVousData);
            showNotification('success', 'Rendez-vous modifié avec succès!');
        }

        document.getElementById('editAppointmentModal').classList.add('hidden');
        await loadRendezVous();
        resetForm('edit');

    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showNotification('error', error.message || 'Erreur lors de la modification du rendez-vous');
    }
}

// ✅ NOUVELLE FONCTION : Créer les RDV récurrents futurs
async function creerRdvRecurrentsFuturs(rdvOriginal, rdvData) {
    try {
        console.log('🔍 Calcul des séances restantes pour créer les RDV futurs...');

        // Récupérer les infos complètes du patient
        const patient = await PatientAPI.getById(rdvOriginal.patient.id);
        if (!patient) {
            throw new Error('Patient introuvable');
        }

        // Calculer les séances restantes
        const seancesRestantes = calculateSeancesRestantes(patient);
        console.log(`📊 Séances restantes: ${seancesRestantes}`);

        if (seancesRestantes <= 1) {
            console.log('⚠️ Pas assez de séances restantes pour créer des RDV récurrents');
            return 0;
        }

        // Créer les RDV futurs (séancesRestantes - 1 car le RDV actuel compte pour 1)
        const rdvACreer = seancesRestantes - 1;
        let currentDate = new Date(rdvData.dateRendezVous);
        let nbCrées = 0;

        for (let i = 1; i <= rdvACreer; i++) {
            // Ajouter 1 semaine à chaque fois
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 7);

            // Vérifier s'il n'y a pas de conflit d'horaire
            const dateStr = formatDateForAPI(currentDate);
            const conflicts = await verifierConflitHoraire(dateStr, rdvData.heureDebut, rdvData.heureFin);

            if (conflicts.length === 0) {
                // Pas de conflit, créer le RDV
                const nouveauRdv = {
                    patient: { id: rdvOriginal.patient.id },
                    dateRendezVous: dateStr,
                    heureDebut: rdvData.heureDebut,
                    heureFin: rdvData.heureFin,
                    type: rdvData.type,
                    notes: `RDV récurrent - Séance ${i + 1}/${seancesRestantes}`,
                    estRecurrent: true,
                    statut: 'PLANIFIE'
                };

                try {
                    await RendezVousAPI.create(nouveauRdv);
                    console.log(`✅ RDV récurrent créé: ${dateStr} ${rdvData.heureDebut}-${rdvData.heureFin}`);
                    nbCrées++;
                } catch (error) {
                    console.error(`❌ Erreur création RDV ${dateStr}:`, error);
                }
            } else {
                console.log(`⚠️ Conflit pour le ${dateStr} - RDV non créé`);
            }
        }

        console.log(`🎯 ${nbCrées} RDV récurrents créés avec succès`);
        return nbCrées;

    } catch (error) {
        console.error('❌ Erreur lors de la création des RDV récurrents:', error);
        throw new Error('Erreur lors de la création des rendez-vous récurrents');
    }
}

// ✅ FONCTION UTILITAIRE : Vérifier les conflits d'horaire
async function verifierConflitHoraire(date, heureDebut, heureFin) {
    try {
        // Récupérer tous les RDV de cette date
        const response = await fetch(`${API_BASE_URL}/rendez-vous/date/${date}`);
        if (!response.ok) return [];

        const rdvDuJour = await response.json();

        // Vérifier les conflits d'horaire
        return rdvDuJour.filter(rdv => {
            const debut1 = heureDebut;
            const fin1 = heureFin;
            const debut2 = rdv.heureDebut;
            const fin2 = rdv.heureFin;

            // Logique de détection de conflit
            return (debut1 < fin2 && fin1 > debut2);
        });
    } catch (error) {
        console.error('❌ Erreur vérification conflit:', error);
        return [];
    }
}

// ✅ FONCTION CORRIGÉE : Supprimer les RDV récurrents futurs
async function supprimerRdvRecurrentsFuturs(rdvOriginal) {
    try {
        console.log('🔍 Recherche des RDV récurrents futurs à supprimer...');

        // Récupérer TOUS les RDV (pas seulement du patient)
        const tousLesRdv = await RendezVousAPI.getAll();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filtrer pour trouver les RDV récurrents futurs du même "groupe"
        const rdvASupprimer = tousLesRdv.filter(rdv => {
            const rdvDate = new Date(rdv.dateRendezVous);
            rdvDate.setHours(0, 0, 0, 0);

            return rdv.id != rdvOriginal.id &&                    // Pas le RDV actuel
                rdv.estRecurrent &&                            // Est récurrent
                rdv.patient.id === rdvOriginal.patient.id &&   // Même patient
                rdv.heureDebut === rdvOriginal.heureDebut &&   // Même heure début
                rdv.heureFin === rdvOriginal.heureFin &&       // Même heure fin
                rdv.type === rdvOriginal.type &&               // Même type
                rdvDate > today &&                             // Dans le futur
                rdv.statut !== 'TERMINE' &&                   // Pas terminé
                rdv.statut !== 'ANNULE';                      // Pas annulé
        });

        console.log(`📊 ${rdvASupprimer.length} RDV récurrents futurs trouvés à supprimer`);

        // Supprimer chaque RDV futur
        let nbSupprimés = 0;
        for (const rdv of rdvASupprimer) {
            try {
                await RendezVousAPI.delete(rdv.id);
                console.log(`✅ RDV supprimé: ${rdv.dateRendezVous} ${rdv.heureDebut}-${rdv.heureFin}`);
                nbSupprimés++;
            } catch (error) {
                console.error(`❌ Erreur suppression RDV ${rdv.id}:`, error);
            }
        }

        console.log(`🎯 ${nbSupprimés} RDV récurrents supprimés avec succès`);
        return nbSupprimés;

    } catch (error) {
        console.error('❌ Erreur lors de la suppression des RDV récurrents:', error);
        throw new Error('Erreur lors de la suppression des rendez-vous récurrents');
    }
}

async function deleteRendezVous() {
    if (!selectedAppointment) return;

    const rendezVousId = selectedAppointment.dataset.id;

    try {
        await RendezVousAPI.delete(rendezVousId);
        document.getElementById('deleteConfirmModal').classList.add('hidden');
        document.getElementById('appointmentDetailsModal').classList.add('hidden');
        showNotification('success', 'Rendez-vous supprimé avec succès!');
        await loadRendezVous();
        selectedAppointment = null;
    } catch (error) {
        showNotification('error', 'Erreur lors de la suppression du rendez-vous');
    }
}

// Gestion des modals
function openAddModal() {
    // Définir la date par défaut à aujourd'hui
    const today = new Date();
    const formattedDate = formatDateForAPI(today);
    document.getElementById('addDate').value = formattedDate;

    resetForm('add');
    document.getElementById('addAppointmentModal').classList.remove('hidden');
}

function openEditModal() {
    if (!selectedAppointment) return;

    const rendezVousId = selectedAppointment.dataset.id;

    // Trouver le rendez-vous dans les données actuelles
    const rendezVous = currentRendezVous.find(rv => rv.id == rendezVousId);
    if (!rendezVous) return;

    // Remplir le formulaire
    document.getElementById('editAppointmentId').value = rendezVous.id;
    document.getElementById('editDate').value = rendezVous.dateRendezVous;
    document.getElementById('editAppointmentType').value = rendezVous.type;
    document.getElementById('editStartTime').value = formatTimeForDisplay(rendezVous.heureDebut);
    document.getElementById('editEndTime').value = formatTimeForDisplay(rendezVous.heureFin);
    document.getElementById('editNotes').value = rendezVous.notes || '';

    // Sélectionner le patient
    const patientSearchInput = document.getElementById('editPatientSearch');
    const patientHiddenInput = document.getElementById('editPatient');
    patientSearchInput.value = `${rendezVous.patient.prenom} ${rendezVous.patient.nom}`;
    patientHiddenInput.value = rendezVous.patient.id;
    document.getElementById('editPatientClear').style.display = 'block';

    // Mettre à jour la pathologie et les séances restantes
    document.getElementById('editPathologie').value = rendezVous.patient.pathologie || '';
    const seancesRestantes = calculateSeancesRestantes(rendezVous.patient);
    document.getElementById('editSeancesRestantes').value = seancesRestantes;

    // Checkbox récurrent
    if (rendezVous.estRecurrent) {
        document.getElementById('editRecurring').classList.add('checked');
    } else {
        document.getElementById('editRecurring').classList.remove('checked');
    }

    // Mettre à jour les options d'heure de fin
    updateEndTimeOptions('editStartTime', 'editEndTime');
    document.getElementById('editEndTime').value = formatTimeForDisplay(rendezVous.heureFin);

    document.getElementById('appointmentDetailsModal').classList.add('hidden');
    document.getElementById('editAppointmentModal').classList.remove('hidden');
}

function resetForm(prefix) {
    document.getElementById(`${prefix}PatientSearch`).value = '';
    document.getElementById(`${prefix}Patient`).value = '';
    document.getElementById(`${prefix}Pathologie`).value = '';
    document.getElementById(`${prefix}SeancesRestantes`).value = '';
    document.getElementById(`${prefix}Notes`).value = '';
    document.getElementById(`${prefix}Recurring`).classList.remove('checked');
    document.getElementById(`${prefix}AppointmentType`).value = 'SEANCE';
    document.getElementById(`${prefix}PatientClear`).style.display = 'none';

    if (prefix === 'add') {
        // Réinitialiser les heures par défaut
        updateEndTimeOptions('addStartTime', 'addEndTime');
    }
}

// Gestion des séances
async function addSessionToPatient(patientId) {
    if (!patientId) return;

    const additionalSessions = parseInt(document.getElementById('additionalSessions').value) || 0;
    if (additionalSessions <= 0) {
        showNotification('error', 'Veuillez entrer un nombre valide de séances à ajouter');
        return;
    }

    try {
        // Récupérer le patient actuel
        const patient = await PatientAPI.getById(patientId);
        if (!patient) {
            showNotification('error', 'Patient introuvable');
            return;
        }

        const newTotalSessions = (patient.seancesPrevues || 0) + additionalSessions;

        const patientData = {
            ...patient,
            seancesPrevues: newTotalSessions
        };

        const updatedPatient = await PatientAPI.update(patientId, patientData);

        // Mettre à jour les champs dans le formulaire
        const seancesRestantes = calculateSeancesRestantes(updatedPatient);
        if (document.getElementById('addSeancesRestantes')) {
            document.getElementById('addSeancesRestantes').value = seancesRestantes;
        }
        if (document.getElementById('editSeancesRestantes')) {
            document.getElementById('editSeancesRestantes').value = seancesRestantes;
        }

        document.getElementById('addSessionsModal').classList.add('hidden');
        showNotification('success', `${additionalSessions} séance(s) ajoutée(s) au total avec succès.`);

        // Recharger les patients
        await loadPatients();

    } catch (error) {
        console.error('Erreur lors de l\'ajout de séances:', error);
        showNotification('error', 'Erreur lors de l\'ajout de séances');
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

function getMonday(date = new Date()) {
    console.log(`🔍 getMonday appelé avec: ${date.toDateString()}`);

    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi = 1
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    console.log(`📅 Lundi calculé: ${monday.toDateString()}`);
    console.log(`📅 Lundi formaté API: ${formatDateForAPI(monday)}`);

    return monday;
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Initialisation de la page rendez-vous...');

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

    // 4. Initialiser la semaine courante (lundi de cette semaine)
    console.log('📅 Calcul du lundi de la semaine courante...');
    currentWeekStart = getMonday(new Date());
    console.log(`📅 currentWeekStart défini à: ${currentWeekStart.toDateString()}`);

    // 5. Configurer la navigation de semaine
    document.getElementById('prevWeekBtn').addEventListener('click', function() {
        console.log('⬅️ Semaine précédente');
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        console.log(`📅 Nouvelle semaine: ${currentWeekStart.toDateString()}`);
        updateWeekView();
        loadRendezVous();
    });

    document.getElementById('nextWeekBtn').addEventListener('click', function() {
        console.log('➡️ Semaine suivante');
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        console.log(`📅 Nouvelle semaine: ${currentWeekStart.toDateString()}`);
        updateWeekView();
        loadRendezVous();
    });

    document.getElementById('todayBtn').addEventListener('click', function() {
        console.log('🎯 Retour à aujourd\'hui');
        currentWeekStart = getMonday(new Date());
        console.log(`📅 Semaine courante: ${currentWeekStart.toDateString()}`);
        updateWeekView();
        loadRendezVous();
    });

    // 6. Configurer les modals
    setupModalEventListeners();

    // 7. Configurer les options d'heures
    populateTimeOptions();

    // 8. Initialiser la recherche de patients
    initPatientSearch('addPatientSearch', 'addPatientOptions', 'addPatient', 'addPatientClear');
    initPatientSearch('editPatientSearch', 'editPatientOptions', 'editPatient', 'editPatientClear');

    // 9. Charger les données
    await loadPatients();
    updateWeekView();
    await loadRendezVous();

    console.log('✅ Initialisation terminée');
});

function setupModalEventListeners() {
    // Modal ajouter rendez-vous
    const addAppointmentBtn = document.getElementById('addAppointmentBtn');
    const addAppointmentModal = document.getElementById('addAppointmentModal');
    const closeAddBtn = document.getElementById('closeAddBtn');
    const cancelAddBtn = document.getElementById('cancelAddBtn');
    const submitAddBtn = document.getElementById('submitAddBtn');

    if (addAppointmentBtn) {
        addAppointmentBtn.addEventListener('click', openAddModal);
    }

    if (closeAddBtn) {
        closeAddBtn.addEventListener('click', function() {
            addAppointmentModal.classList.add('hidden');
        });
    }

    if (cancelAddBtn) {
        cancelAddBtn.addEventListener('click', function() {
            addAppointmentModal.classList.add('hidden');
        });
    }

    if (submitAddBtn) {
        submitAddBtn.addEventListener('click', saveNewRendezVous);
    }

    // Modal modifier rendez-vous
    const editAppointmentModal = document.getElementById('editAppointmentModal');
    const editAppointmentBtn = document.getElementById('editAppointmentBtn');
    const closeEditBtn = document.getElementById('closeEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const submitEditBtn = document.getElementById('submitEditBtn');

    if (editAppointmentBtn) {
        editAppointmentBtn.addEventListener('click', openEditModal);
    }

    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', function() {
            editAppointmentModal.classList.add('hidden');
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            editAppointmentModal.classList.add('hidden');
        });
    }

    if (submitEditBtn) {
        submitEditBtn.addEventListener('click', saveEditedRendezVous);
    }

    // Modal détails rendez-vous
    const appointmentDetailsModal = document.getElementById('appointmentDetailsModal');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');

    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', function() {
            appointmentDetailsModal.classList.add('hidden');
        });
    }

    // Modal suppression
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteAppointmentBtn = document.getElementById('deleteAppointmentBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (deleteAppointmentBtn) {
        deleteAppointmentBtn.addEventListener('click', function() {
            appointmentDetailsModal.classList.add('hidden');
            deleteConfirmModal.classList.remove('hidden');
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmModal.classList.add('hidden');
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteRendezVous);
    }

    // Modal ajout séances
    const addSessionsModal = document.getElementById('addSessionsModal');
    const closeAddSessionsBtn = document.getElementById('closeAddSessionsBtn');
    const cancelAddSessionsBtn = document.getElementById('cancelAddSessionsBtn');
    const submitAddSessionsBtn = document.getElementById('submitAddSessionsBtn');
    const additionalSessions = document.getElementById('additionalSessions');

    if (closeAddSessionsBtn && addSessionsModal) {
        closeAddSessionsBtn.addEventListener('click', function() {
            addSessionsModal.classList.add('hidden');
        });
    }

    if (cancelAddSessionsBtn && addSessionsModal) {
        cancelAddSessionsBtn.addEventListener('click', function() {
            addSessionsModal.classList.add('hidden');
        });
    }

    if (submitAddSessionsBtn) {
        submitAddSessionsBtn.addEventListener('click', function() {
            const patientId = document.getElementById('addPatient').value || document.getElementById('editPatient').value;
            addSessionToPatient(patientId);
        });
    }

    if (additionalSessions) {
        additionalSessions.addEventListener('input', function() {
            const current = parseInt(document.getElementById('currentSessionsDisplay').value) || 0;
            const additional = parseInt(this.value) || 0;
            const totalDisplay = document.getElementById('totalSessionsDisplay');
            if (totalDisplay) {
                totalDisplay.value = current + additional;
            }
        });
    }

    // Boutons d'ajout de séances
    const addMoreSeancesBtn = document.getElementById('addMoreSeancesBtn');
    const editMoreSeancesBtn = document.getElementById('editMoreSeancesBtn');

    if (addMoreSeancesBtn) {
        addMoreSeancesBtn.addEventListener('click', function() {
            const patientId = document.getElementById('addPatient').value;
            if (patientId) {
                const patient = allPatients.find(p => p.id == patientId);
                if (patient) {
                    document.getElementById('currentSessionsDisplay').value = patient.seancesPrevues || 0;
                    document.getElementById('additionalSessions').value = 1;
                    const totalDisplay = document.getElementById('totalSessionsDisplay');
                    if (totalDisplay) {
                        totalDisplay.value = (patient.seancesPrevues || 0) + 1;
                    }
                    addSessionsModal.classList.remove('hidden');
                } else {
                    showNotification('error', 'Patient introuvable');
                }
            } else {
                showNotification('error', 'Veuillez sélectionner un patient d\'abord');
            }
        });
    }

    if (editMoreSeancesBtn) {
        editMoreSeancesBtn.addEventListener('click', function() {
            const patientId = document.getElementById('editPatient').value;
            if (patientId) {
                const patient = allPatients.find(p => p.id == patientId);
                if (patient) {
                    document.getElementById('currentSessionsDisplay').value = patient.seancesPrevues || 0;
                    document.getElementById('additionalSessions').value = 1;
                    const totalDisplay = document.getElementById('totalSessionsDisplay');
                    if (totalDisplay) {
                        totalDisplay.value = (patient.seancesPrevues || 0) + 1;
                    }
                    addSessionsModal.classList.remove('hidden');
                } else {
                    showNotification('error', 'Patient introuvable');
                }
            } else {
                showNotification('error', 'Veuillez sélectionner un patient d\'abord');
            }
        });
    }

    // Event listeners pour les changements d'heure
    document.getElementById('addStartTime').addEventListener('change', function() {
        updateEndTimeOptions('addStartTime', 'addEndTime');
    });

    document.getElementById('editStartTime').addEventListener('change', function() {
        updateEndTimeOptions('editStartTime', 'editEndTime');
    });

    // Custom checkbox toggle
    const checkboxes = document.querySelectorAll('.custom-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            this.classList.toggle('checked');
        });
    });
}

console.log('🧪 TEST de getMonday:');
const today = new Date();
console.log(`Aujourd'hui: ${today.toDateString()}`);
const monday = getMonday(today);
console.log(`Lundi de cette semaine: ${monday.toDateString()}`);
const saturday = new Date(monday);
saturday.setDate(monday.getDate() + 5);
console.log(`Samedi de cette semaine: ${saturday.toDateString()}`);
console.log(`Plage API attendue: ${formatDateForAPI(monday)} à ${formatDateForAPI(saturday)}`);
console.log('🧪 TEST formatDateForAPI:');
const testMonday = new Date(2025, 5, 2); // 2 juin 2025 (mois 0-indexé)
console.log(`Test date: ${testMonday.toDateString()}`);
console.log(`Format résultat: ${formatDateForAPI(testMonday)}`);

const testSaturday = new Date(2025, 5, 7); // 7 juin 2025
console.log(`Test date: ${testSaturday.toDateString()}`);
console.log(`Format résultat: ${formatDateForAPI(testSaturday)}`);