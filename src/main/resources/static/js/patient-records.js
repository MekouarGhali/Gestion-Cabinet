// Module pour la gestion des dossiers patients - Version avec modal ajout séances
// Configuration API
const PATIENT_RECORDS_API_BASE_URL = '/api';

// Variables globales pour stocker les IDs actuels
let currentAnamneseId = null;
let currentCompteRenduId = null;
let currentPatientForSessions = null; // Nouvelle variable pour le patient sélectionné

// Classes API pour anamnèses et comptes rendus
class PatientRecordsAnamneseAPI {
    static async getByPatient(patientId) {
        try {
            const response = await fetch(`${PATIENT_RECORDS_API_BASE_URL}/anamneses/patient/${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des anamnèses');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByPatient anamneses:', error);
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${PATIENT_RECORDS_API_BASE_URL}/anamneses/${id}`);
            if (!response.ok) throw new Error('Anamnèse introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById anamnese:', error);
            return null;
        }
    }
}

class PatientRecordsCompteRenduAPI {
    static async getByPatient(patientId) {
        try {
            const response = await fetch(`${PATIENT_RECORDS_API_BASE_URL}/comptes-rendus/patient/${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des comptes rendus');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByPatient comptes rendus:', error);
            return [];
        }
    }

    static async getById(id) {
        try {
            const response = await fetch(`${PATIENT_RECORDS_API_BASE_URL}/comptes-rendus/${id}`);
            if (!response.ok) throw new Error('Compte rendu introuvable');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getById compte rendu:', error);
            return null;
        }
    }
}

// API pour les séances
class PatientRecordsSeanceAPI {
    static async getByPatient(patientId) {
        try {
            const response = await fetch(`${PATIENT_RECORDS_API_BASE_URL}/seances/patient/${patientId}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des séances');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getByPatient seances:', error);
            return [];
        }
    }
}

async function loadPatientSeances(patientId) {
    try {
        console.log('📋 Chargement des séances pour patient ID:', patientId);
        const seances = await PatientRecordsSeanceAPI.getByPatient(patientId);
        const sessionHistoryContainer = document.getElementById('patientSessionHistory');

        if (!sessionHistoryContainer) return;

        if (seances.length === 0) {
            sessionHistoryContainer.innerHTML = `<div class="p-4 text-center text-gray-500">Aucune séance enregistrée.</div>`;
        } else {
            sessionHistoryContainer.innerHTML = seances.map(seance => `
                <div class="p-4 hover:bg-gray-50 transition">
                    <div class="flex justify-between mb-2">
                        <div class="font-medium text-gray-900">Séance du ${new Date(seance.dateSeance).toLocaleDateString('fr-FR')}</div>
                        <div class="text-sm text-gray-500">${seance.createdBy || 'Thérapeute'}</div>
                    </div>
                    <div class="text-sm text-gray-600 mb-3">
                        <p>${seance.observations || 'Aucune observation'}</p>
                    </div>
                    <div class="text-xs text-gray-500">
                        ${seance.heureDebut} - ${seance.heureFin}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Erreur chargement séances:', error);
    }
}

// Utilitaires spécifiques aux dossiers
function formatDateSafe(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return 'Date invalide';
    }
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

function getAnamneseStatusClass(statut) {
    switch(statut) {
        case 'COMPLETE': return 'status-complete';
        case 'EN_COURS': return 'status-en-cours';
        case 'EN_ATTENTE': return 'status-non-commence';
        default: return 'status-non-commence';
    }
}

function getAnamneseStatusLabel(statut) {
    switch(statut) {
        case 'COMPLETE': return 'Complète';
        case 'EN_COURS': return 'En cours';
        case 'EN_ATTENTE': return 'En attente';
        default: return 'En attente';
    }
}

function getCompteRenduStatusClass(statut) {
    switch(statut) {
        case 'TERMINE': return 'status-termine';
        case 'EN_COURS': return 'status-en-cours';
        default: return 'status-en-cours';
    }
}

function getCompteRenduStatusLabel(statut) {
    switch(statut) {
        case 'TERMINE': return 'Terminé';
        case 'EN_COURS': return 'En cours';
        default: return 'En cours';
    }
}

// Fonctions pour gérer les modals
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.style.display = 'flex';

        // Assurer un z-index élevé pour les modals d'ajout de séances
        if (modalId === 'addSessionsModal') {
            modal.style.zIndex = '10000'; // Plus élevé que le modal des dossiers patients
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
        }
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function showLoadingModal() {
    if (!document.getElementById('loadingModal')) {
        createLoadingModal();
    }
    showModal('loadingModal');
}

function hideLoadingModal() {
    hideModal('loadingModal');
}

// Fonction principale d'ouverture des dossiers patient
async function openPatientRecords(patient) {
    console.log('📂 Ouverture des dossiers pour le patient:', patient.prenom, patient.nom);

    try {
        // Stocker le patient pour les modals d'ajout de séances
        currentPatientForSessions = patient;

        // Mise à jour des informations d'en-tête
        const patientModalName = document.getElementById('patientModalName');
        const patientModalId = document.getElementById('patientModalId');
        const patientModalAvatar = document.getElementById('patientModalAvatar');

        if (patientModalName) patientModalName.textContent = `${patient.prenom || ''} ${patient.nom || ''}`;
        if (patientModalId) patientModalId.textContent = `ID: ${patient.id}`;
        if (patientModalAvatar) patientModalAvatar.textContent = patient.avatar || '';

        // Utiliser la fonction getAvatarColor alignée
        const avatarColor = getAvatarColor(0);
        if (patientModalAvatar) {
            patientModalAvatar.className = `w-10 h-10 rounded-full ${avatarColor.bg} flex items-center justify-center ${avatarColor.text} mr-3`;
        }

        // Mise à jour des informations de séances
        const total = patient.seancesPrevues || 1;
        const done = patient.seancesEffectuees || 0;
        const progressPercent = Math.round((done / total) * 100);

        const progressBar = document.getElementById('patientRecordSessionsProgress');
        const progressText = document.getElementById('patientRecordSessionsText');
        const sessionsText = document.getElementById('patientRecordSessions');

        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        if (progressText) progressText.textContent = `${done}/${total} séances`;
        if (sessionsText) sessionsText.textContent = `${total} séances`;

        // Charger l'historique des séances
        await loadPatientSeances(patient.id);

        // Charger les anamnèses
        await loadPatientAnamneses(patient.id);

        // Charger les comptes rendus
        await loadPatientComptesRendus(patient.id);

        // Initialiser les onglets
        document.querySelectorAll('.records-tab-button').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        document.querySelectorAll('.records-tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Activer l'onglet séances par défaut
        const sessionsTabBtn = document.querySelector('.records-tab-button[data-tab="sessions"]');
        const sessionsTab = document.getElementById('sessionsTab');

        if (sessionsTabBtn) {
            sessionsTabBtn.classList.add('active', 'border-primary', 'text-primary');
            sessionsTabBtn.classList.remove('border-transparent', 'text-gray-500');
        }

        if (sessionsTab) {
            sessionsTab.classList.remove('hidden');
        }

        // Configurer les boutons nouvelles anamnèse et compte rendu
        setupPatientRecordButtons(patient);

        // Ouvrir le modal
        showModal('patientRecordsModal');
        console.log('✅ Modal dossiers patient ouvert');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture des dossiers patient:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors de l\'ouverture du dossier patient');
        }
    }
}

// ===== NOUVELLES FONCTIONS POUR LE MODAL D'AJOUT DE SÉANCES =====

function openAddSessionsModal(patient) {
    console.log('➕ Ouverture modal ajout séances pour:', patient.prenom, patient.nom);

    if (!patient) {
        console.error('❌ Patient non défini pour l\'ajout de séances');
        return;
    }

    currentPatientForSessions = patient;

    // Remplir les champs du modal
    document.getElementById('currentSessionsDisplay').value = patient.seancesPrevues || 0;
    document.getElementById('additionalSessions').value = 1;
    document.getElementById('totalSessionsDisplay').value = (patient.seancesPrevues || 0) + 1;

    showModal('addSessionsModal');
}

async function addSessionToPatient() {
    if (!currentPatientForSessions) {
        console.error('❌ Aucun patient sélectionné pour l\'ajout de séances');
        return;
    }

    const additionalSessions = parseInt(document.getElementById('additionalSessions').value) || 0;
    if (additionalSessions <= 0) {
        if (typeof showNotification === 'function') {
            showNotification('error', 'Veuillez entrer un nombre valide de séances à ajouter');
        }
        return;
    }

    const newTotalSessions = (currentPatientForSessions.seancesPrevues || 0) + additionalSessions;

    const patientData = {
        ...currentPatientForSessions,
        seancesPrevues: newTotalSessions
    };

    try {
        // Utiliser l'API PatientAPI si disponible, sinon utiliser fetch direct
        let updatedPatient;
        if (typeof window.PatientAPI !== 'undefined') {
            updatedPatient = await window.PatientAPI.update(currentPatientForSessions.id, patientData);
        } else {
            const response = await fetch(`${PATIENT_RECORDS_API_BASE_URL}/patients/${currentPatientForSessions.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour');
            updatedPatient = await response.json();
        }

        currentPatientForSessions = updatedPatient;

        hideModal('addSessionsModal');

        if (typeof showNotification === 'function') {
            showNotification('success', `${additionalSessions} séance(s) ajoutée(s) au total avec succès.`);
        }

        // Recharger les patients si la fonction est disponible
        if (typeof loadPatients === 'function') {
            await loadPatients();
        }

        // Rouvrir le dossier patient avec les données mises à jour
        await openPatientRecords(updatedPatient);

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de séances:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors de l\'ajout de séances');
        }
    }
}

// ===== FIN DES NOUVELLES FONCTIONS POUR LE MODAL D'AJOUT DE SÉANCES =====

// Fonctions de chargement des données
async function loadPatientAnamneses(patientId) {
    try {
        console.log('📋 Chargement des anamnèses pour patient ID:', patientId);
        const anamneses = await PatientRecordsAnamneseAPI.getByPatient(patientId);
        const anamneseList = document.getElementById('anamneseList');

        if (!anamneseList) {
            console.error('❌ Element anamneseList introuvable');
            return;
        }

        if (anamneses.length === 0) {
            anamneseList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    Aucune anamnèse enregistrée.
                </div>
            `;
        } else {
            anamneseList.innerHTML = anamneses.map(anamnese => `
                <div class="p-4 flex justify-between items-center hover:bg-gray-50 border-b border-gray-100">
                    <div>
                        <div class="font-medium text-gray-900">Anamnèse ${anamnese.numAnamnese}</div>
                        <div class="text-sm text-gray-500">Date: ${formatDateSafe(anamnese.dateEntretien)}</div>
                        <div class="mt-1">
                            <span class="status-badge ${getAnamneseStatusClass(anamnese.statut)}">
                                ${getAnamneseStatusLabel(anamnese.statut)}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 view-anamnese-btn" data-id="${anamnese.id}" title="Voir">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="w-8 h-8 flex items-center justify-center text-purple-500 hover:text-purple-700 save-anamnese-btn" data-id="${anamnese.id}" title="Enregistrer PDF">
                            <i class="ri-save-line"></i>
                        </button>
                        <button class="w-8 h-8 flex items-center justify-center text-green-500 hover:text-green-700 print-anamnese-btn" data-id="${anamnese.id}" title="Imprimer">
                            <i class="ri-printer-line"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Ajouter les event listeners pour les anamnèses
            addAnamneseEventListeners();
            console.log(`✅ ${anamneses.length} anamnèse(s) chargée(s)`);
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des anamnèses:', error);
        const anamneseList = document.getElementById('anamneseList');
        if (anamneseList) {
            anamneseList.innerHTML = `
                <div class="p-4 text-center text-red-500">
                    Erreur lors du chargement des anamnèses.
                </div>
            `;
        }
    }
}

async function loadPatientComptesRendus(patientId) {
    try {
        console.log('📊 Chargement des comptes rendus pour patient ID:', patientId);
        const comptesRendus = await PatientRecordsCompteRenduAPI.getByPatient(patientId);
        const compteRenduList = document.getElementById('compteRenduList');

        if (!compteRenduList) {
            console.error('❌ Element compteRenduList introuvable');
            return;
        }

        if (comptesRendus.length === 0) {
            compteRenduList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    Aucun compte rendu enregistré.
                </div>
            `;
        } else {
            compteRenduList.innerHTML = comptesRendus.map(compteRendu => `
                <div class="p-4 flex justify-between items-center hover:bg-gray-50 border-b border-gray-100">
                    <div>
                        <div class="font-medium text-gray-900">Compte rendu ${compteRendu.numCompteRendu}</div>
                        <div class="text-sm text-gray-500">Date: ${formatDateSafe(compteRendu.dateBilan)}</div>
                        <div class="mt-1">
                            <span class="status-badge ${getCompteRenduStatusClass(compteRendu.statut)}">
                                ${getCompteRenduStatusLabel(compteRendu.statut)}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 view-compte-rendu-btn" data-id="${compteRendu.id}" title="Voir">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="w-8 h-8 flex items-center justify-center text-purple-500 hover:text-purple-700 save-compte-rendu-btn" data-id="${compteRendu.id}" title="Enregistrer PDF">
                            <i class="ri-save-line"></i>
                        </button>
                        <button class="w-8 h-8 flex items-center justify-center text-green-500 hover:text-green-700 print-compte-rendu-btn" data-id="${compteRendu.id}" title="Imprimer">
                            <i class="ri-printer-line"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Ajouter les event listeners pour les comptes rendus
            addCompteRenduEventListeners();
            console.log(`✅ ${comptesRendus.length} compte(s) rendu(s) chargé(s)`);
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des comptes rendus:', error);
        const compteRenduList = document.getElementById('compteRenduList');
        if (compteRenduList) {
            compteRenduList.innerHTML = `
                <div class="p-4 text-center text-red-500">
                    Erreur lors du chargement des comptes rendus.
                </div>
            `;
        }
    }
}

// Event listeners pour les anamnèses
function addAnamneseEventListeners() {
    document.querySelectorAll('.view-anamnese-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const anamneseId = this.dataset.id;
            await viewAnamnese(anamneseId);
        });
    });

    document.querySelectorAll('.save-anamnese-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const anamneseId = this.dataset.id;
            await saveAnamnesePDF(anamneseId);
        });
    });

    document.querySelectorAll('.print-anamnese-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const anamneseId = this.dataset.id;
            await printAnamnese(anamneseId);
        });
    });
}

// Event listeners pour les comptes rendus
function addCompteRenduEventListeners() {
    document.querySelectorAll('.view-compte-rendu-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            await viewCompteRendu(compteRenduId);
        });
    });

    document.querySelectorAll('.save-compte-rendu-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            await saveCompteRenduPDF(compteRenduId);
        });
    });

    document.querySelectorAll('.print-compte-rendu-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const compteRenduId = this.dataset.id;
            await printCompteRendu(compteRenduId);
        });
    });
}

// Fonctions de visualisation et traitement des anamnèses
async function viewAnamnese(anamneseId) {
    try {
        currentAnamneseId = anamneseId;
        showLoadingModal();
        const anamnese = await PatientRecordsAnamneseAPI.getById(anamneseId);

        if (anamnese) {
            let anamnesePreview = document.getElementById('anamnesePreview');
            if (!anamnesePreview) {
                createAnamneseModal();
                anamnesePreview = document.getElementById('anamnesePreview');
            }

            if (anamnesePreview) {
                anamnesePreview.innerHTML = generateAnamneseHTML(anamnese);
                hideLoadingModal();
                showModal('anamneseModal');
            }
        }
    } catch (error) {
        hideLoadingModal();
        console.error('❌ Erreur lors de la visualisation de l\'anamnèse:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors du chargement de l\'anamnèse');
        }
    }
}

async function saveAnamnesePDF(anamneseId) {
    try {
        showLoadingModal();
        const anamnese = await PatientRecordsAnamneseAPI.getById(anamneseId);

        if (anamnese) {
            // Créer un élément temporaire pour le rendu PDF
            const tempElement = document.createElement('div');
            tempElement.innerHTML = generateAnamneseHTML(anamnese);
            tempElement.style.width = '800px';
            tempElement.style.padding = '20px';
            tempElement.style.fontFamily = 'Times New Roman, serif';
            tempElement.style.position = 'fixed';
            tempElement.style.top = '-10000px';
            document.body.appendChild(tempElement);

            // Utiliser html2canvas pour capturer le contenu
            const canvas = await html2canvas(tempElement, {
                scale: 2,
                logging: false,
                useCORS: true,
                width: 800,
                height: tempElement.scrollHeight
            });

            // Supprimer l'élément temporaire
            document.body.removeChild(tempElement);

            // Créer le PDF avec jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Ajouter des pages supplémentaires si nécessaire
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Télécharger le PDF
            const fileName = `Anamnese-${anamnese.numAnamnese}-${anamnese.nomPrenom.replace(/\s+/g, '-')}.pdf`;
            pdf.save(fileName);
            hideLoadingModal();
            if (typeof showNotification === 'function') {
                showNotification('success', 'PDF généré avec succès');
            }
        }
    } catch (error) {
        hideLoadingModal();
        console.error('❌ Erreur lors de la génération du PDF:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors de la génération du PDF');
        }
    }
}

async function printAnamnese(anamneseId) {
    try {
        showLoadingModal();
        const anamnese = await PatientRecordsAnamneseAPI.getById(anamneseId);

        if (anamnese) {
            const printContent = generatePrintableAnamneseContent(anamnese);

            // Créer une iframe pour l'impression
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'fixed';
            printFrame.style.top = '-10000px';
            printFrame.style.left = '-10000px';
            printFrame.style.width = '1px';
            printFrame.style.height = '1px';
            printFrame.style.opacity = '0';
            document.body.appendChild(printFrame);

            const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
            frameDoc.open();
            frameDoc.write(printContent);
            frameDoc.close();

            // Attendre le chargement puis imprimer
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                hideLoadingModal();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        }
    } catch (error) {
        hideLoadingModal();
        console.error('❌ Erreur lors de l\'impression:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors de l\'impression');
        }
    }
}

// Fonctions de visualisation et traitement des comptes rendus
async function viewCompteRendu(compteRenduId) {
    try {
        currentCompteRenduId = compteRenduId;
        showLoadingModal();
        const compteRendu = await PatientRecordsCompteRenduAPI.getById(compteRenduId);

        if (compteRendu) {
            let compteRenduPreview = document.getElementById('compteRenduPreview');
            if (!compteRenduPreview) {
                createCompteRenduModal();
                compteRenduPreview = document.getElementById('compteRenduPreview');
            }

            if (compteRenduPreview) {
                compteRenduPreview.innerHTML = generateCompteRenduHTML(compteRendu);
                hideLoadingModal();
                showModal('compteRenduModal');
            }
        }
    } catch (error) {
        hideLoadingModal();
        console.error('❌ Erreur lors de la visualisation du compte rendu:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors du chargement du compte rendu');
        }
    }
}

async function saveCompteRenduPDF(compteRenduId) {
    try {
        showLoadingModal();
        const compteRendu = await PatientRecordsCompteRenduAPI.getById(compteRenduId);

        if (compteRendu) {
            // Créer un élément temporaire pour le rendu PDF
            const tempElement = document.createElement('div');
            tempElement.innerHTML = generateCompteRenduHTML(compteRendu);
            tempElement.style.width = '800px';
            tempElement.style.padding = '20px';
            tempElement.style.fontFamily = 'Times New Roman, serif';
            tempElement.style.position = 'fixed';
            tempElement.style.top = '-10000px';
            document.body.appendChild(tempElement);

            // Utiliser html2canvas pour capturer le contenu
            const canvas = await html2canvas(tempElement, {
                scale: 2,
                logging: false,
                useCORS: true,
                width: 800,
                height: tempElement.scrollHeight
            });

            // Supprimer l'élément temporaire
            document.body.removeChild(tempElement);

            // Créer le PDF avec jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Ajouter des pages supplémentaires si nécessaire
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Télécharger le PDF
            const fileName = `Compte-rendu-${compteRendu.numCompteRendu}-${compteRendu.nomPatient.replace(/\s+/g, '-')}.pdf`;
            pdf.save(fileName);
            hideLoadingModal();
            if (typeof showNotification === 'function') {
                showNotification('success', 'PDF généré avec succès');
            }
        }
    } catch (error) {
        hideLoadingModal();
        console.error('❌ Erreur lors de la génération du PDF:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors de la génération du PDF');
        }
    }
}

async function printCompteRendu(compteRenduId) {
    try {
        showLoadingModal();
        const compteRendu = await PatientRecordsCompteRenduAPI.getById(compteRenduId);

        if (compteRendu) {
            const printContent = generatePrintableCompteRenduContent(compteRendu);

            // Créer une iframe pour l'impression
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'fixed';
            printFrame.style.top = '-10000px';
            printFrame.style.left = '-10000px';
            printFrame.style.width = '1px';
            printFrame.style.height = '1px';
            printFrame.style.opacity = '0';
            document.body.appendChild(printFrame);

            const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
            frameDoc.open();
            frameDoc.write(printContent);
            frameDoc.close();

            // Attendre le chargement puis imprimer
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                hideLoadingModal();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        }
    } catch (error) {
        hideLoadingModal();
        console.error('❌ Erreur lors de l\'impression:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Erreur lors de l\'impression');
        }
    }
}

// Fonctions pour générer le contenu HTML
function generateAnamneseHTML(anamnese) {
    const formatValue = (value) => value || 'Non renseigné';
    const formatBooleanValue = (value) => {
        if (value === null || value === undefined) return 'Non renseigné';
        return value ? 'Oui' : 'Non';
    };

    return `
        <div class="preview-content">
            <div class="cr-header">
                <h1>ANAMNÈSE</h1>
                <p><strong>Numéro :</strong> ${anamnese.numAnamnese}</p>
            </div>
            
            <div class="section">
                <div class="section-title">INFORMATIONS GÉNÉRALES</div>
                <div class="two-columns">
                    <div class="column">
                        <p><strong>Nom et prénom :</strong> ${anamnese.nomPrenom}</p>
                        <p><strong>Date de naissance :</strong> ${formatDateSafe(anamnese.dateNaissance)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Date d'entretien :</strong> ${formatDateSafe(anamnese.dateEntretien)}</p>
                        <p><strong>Statut :</strong> ${getAnamneseStatusLabel(anamnese.statut)}</p>
                    </div>
                </div>
                <p><strong>Adressé par :</strong> ${formatValue(anamnese.adressePar)}</p>
                <p><strong>Motif de consultation :</strong> ${formatValue(anamnese.motifConsultation)}</p>
                <p><strong>Rééducation antérieure :</strong> ${formatValue(anamnese.reeducationAnterieure)}</p>
            </div>

            ${anamnese.parents ? `
            <div class="section">
                <div class="section-title">INFORMATIONS SUR LES PARENTS</div>
                <div class="two-columns">
                    <div class="column">
                        <p><strong>Père :</strong></p>
                        <p>Nom : ${formatValue(anamnese.parents.nomPere)}</p>
                        <p>Âge : ${formatValue(anamnese.parents.agePere)}</p>
                        <p>Profession : ${formatValue(anamnese.parents.professionPere)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Mère :</strong></p>
                        <p>Nom : ${formatValue(anamnese.parents.nomMere)}</p>
                        <p>Âge : ${formatValue(anamnese.parents.ageMere)}</p>
                        <p>Profession : ${formatValue(anamnese.parents.professionMere)}</p>
                    </div>
                </div>
                <p><strong>Consanguinité :</strong> ${formatBooleanValue(anamnese.consanguinite)}</p>
                <p><strong>Fraterie :</strong> ${formatValue(anamnese.fraterie)}</p>
            </div>
            ` : ''}

            ${anamnese.grossesse ? `
            <div class="section">
                <div class="section-title">GROSSESSE</div>
                <div class="two-columns">
                    <div class="column">
                        <p><strong>Désirée :</strong> ${formatBooleanValue(anamnese.grossesse.desire)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Compliquée :</strong> ${formatBooleanValue(anamnese.grossesse.compliquee)}</p>
                    </div>
                </div>
                <p><strong>Autres informations :</strong> ${formatValue(anamnese.grossesse.autres)}</p>
            </div>
            ` : ''}

            ${anamnese.accouchement ? `
            <div class="section">
                <div class="section-title">ACCOUCHEMENT</div>
                <div class="two-columns">
                    <div class="column">
                        <p><strong>À terme :</strong> ${formatBooleanValue(anamnese.accouchement.terme)}</p>
                        <p><strong>Prématuré :</strong> ${formatBooleanValue(anamnese.accouchement.premature)}</p>
                        <p><strong>Post-maturé :</strong> ${formatBooleanValue(anamnese.accouchement.postMature)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Voie basse :</strong> ${formatBooleanValue(anamnese.accouchement.voieBasse)}</p>
                        <p><strong>Césarienne :</strong> ${formatBooleanValue(anamnese.accouchement.cesarienne)}</p>
                        <p><strong>Cris :</strong> ${formatBooleanValue(anamnese.accouchement.cris)}</p>
                    </div>
                </div>
                <p><strong>Autres informations :</strong> ${formatValue(anamnese.accouchement.autres)}</p>
            </div>
            ` : ''}

            ${anamnese.allaitement ? `
            <div class="section">
                <div class="section-title">ALLAITEMENT</div>
                <div class="two-columns">
                    <div class="column">
                        <p><strong>Type :</strong> ${formatValue(anamnese.allaitement.type)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Durée :</strong> ${anamnese.allaitement.duree ? anamnese.allaitement.duree + ' mois' : 'Non renseigné'}</p>
                    </div>
                </div>
            </div>
            ` : ''}

            ${anamnese.observations ? `
            <div class="section">
                <div class="section-title">OBSERVATIONS</div>
                <p class="whitespace-pre-wrap">${anamnese.observations}</p>
            </div>
            ` : ''}
        </div>
    `;
}

function generateCompteRenduHTML(compteRendu) {
    const formatValue = (value) => value || 'Non renseigné';

    // Formater les tests utilisés
    const testsHtml = compteRendu.testsUtilises && compteRendu.testsUtilises.length > 0
        ? compteRendu.testsUtilises.map(test => `<div class="test-item">${test}</div>`).join('')
        : '<div class="text-muted">Aucun test spécifié</div>';

    return `
        <div class="preview-content">
            <div class="cr-header">
                <h1>Compte rendu du bilan psychomoteur</h1>
                <p>N° ${compteRendu.numCompteRendu} - ${getCompteRenduStatusLabel(compteRendu.statut)}</p>
            </div>
            
            <div class="patient-info">
                <div class="two-columns">
                    <div class="column">
                        <p><strong>Nom et prénom:</strong> ${compteRendu.nomPatient}</p>
                        <p><strong>Date de naissance:</strong> ${formatDateSafe(compteRendu.dateNaissance)}</p>
                    </div>
                    <div class="column">
                        <p><strong>Date du bilan:</strong> ${formatDateSafe(compteRendu.dateBilan)}</p>
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
                <p class="whitespace-pre-line">${compteRendu.contenu.presentation}</p>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.anamnese ? `
            <div class="section">
                <div class="section-title">ANAMNÈSE</div>
                <p class="whitespace-pre-line">${compteRendu.contenu.anamnese}</p>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.comportement ? `
            <div class="section">
                <div class="section-title">COMPORTEMENT</div>
                <p class="whitespace-pre-line">${compteRendu.contenu.comportement}</p>
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
                <p class="whitespace-pre-line">${compteRendu.contenu.conclusion}</p>
            </div>
            ` : ''}
            
            ${compteRendu.contenu?.projetTherapeutique ? `
            <div class="section">
                <div class="section-title">PROJET THÉRAPEUTIQUE</div>
                <p class="whitespace-pre-line">${compteRendu.contenu.projetTherapeutique}</p>
            </div>
            ` : ''}
            
            ${compteRendu.observations ? `
            <div class="section">
                <div class="section-title">OBSERVATIONS</div>
                <p class="whitespace-pre-line">${compteRendu.observations}</p>
            </div>
            ` : ''}
        </div>
    `;
}

function generatePrintableAnamneseContent(anamnese) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Anamnèse ${anamnese.numAnamnese}</title>
            <style>
                .preview-content,
                .preview-content * {
                    white-space: normal !important;
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                }
                body { 
                    font-family: 'Times New Roman', serif; 
                    font-size: 12pt; 
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .cr-header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .cr-header h1 {
                    font-size: 18pt;
                    font-weight: bold;
                    margin-bottom: 10px;
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
                .whitespace-pre-wrap {
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            ${generateAnamneseHTML(anamnese)}
        </body>
        </html>
    `;
}

function generatePrintableCompteRenduContent(compteRendu) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Compte Rendu ${compteRendu.numCompteRendu}</title>
            <style>
                .preview-content,
                .preview-content * {
                    white-space: normal !important;
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                }
                body { 
                    font-family: 'Times New Roman', serif; 
                    font-size: 12pt; 
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .cr-header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .cr-header h1 {
                    font-size: 18pt;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .patient-info {
                    margin-bottom: 20px;
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
                .whitespace-pre-line {
                    white-space: pre-line;
                }
                
            </style>
        </head>
        <body>
            ${generateCompteRenduHTML(compteRendu)}
        </body>
        </html>
    `;
}

// Créer les modals dynamiquement
function createLoadingModal() {
    const modal = document.createElement('div');
    modal.id = 'loadingModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 flex flex-col items-center">
            <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 class="text-lg font-medium text-gray-900">Chargement en cours...</h3>
            <p class="text-sm text-gray-500 mt-2">Veuillez patienter pendant que nous générons votre document.</p>
        </div>
    `;
    document.body.appendChild(modal);
}

function createAnamneseModal() {
    const modal = document.createElement('div');
    modal.id = 'anamneseModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="text-xl font-semibold text-gray-800">Anamnèse</h2>
                <button id="closeAnamneseModal" class="text-gray-400 hover:text-gray-500">
                    <i class="ri-close-line text-xl"></i>
                </button>
            </div>
            <div class="modal-body">
                <div id="anamnesePreview" class="preview-content">
                    <!-- Le contenu de l'anamnèse sera chargé ici -->
                </div>
            </div>
            <div class="modal-footer">
                <button id="printAnamnesePreviewBtn" class="px-4 py-2 bg-primary text-white rounded-button hover:bg-primary/90 flex items-center mr-2">
                    <i class="ri-printer-line mr-2"></i> Imprimer
                </button>
                <button id="saveAnamnesePreviewBtn" class="px-4 py-2 bg-purple-600 text-white rounded-button hover:bg-purple-700 flex items-center">
                    <i class="ri-save-line mr-2"></i> Enregistrer PDF
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Ajouter les event listeners
    document.getElementById('closeAnamneseModal').addEventListener('click', () => hideModal('anamneseModal'));
    document.getElementById('printAnamnesePreviewBtn').addEventListener('click', () => {
        printAnamnese(currentAnamneseId);
    });
    document.getElementById('saveAnamnesePreviewBtn').addEventListener('click', () => {
        saveAnamnesePDF(currentAnamneseId);
    });
}

function createCompteRenduModal() {
    const modal = document.createElement('div');
    modal.id = 'compteRenduModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="text-xl font-semibold text-gray-800">Compte Rendu</h2>
                <button id="closeCompteRenduModal" class="text-gray-400 hover:text-gray-500">
                    <i class="ri-close-line text-xl"></i>
                </button>
            </div>
            <div class="modal-body">
                <div id="compteRenduPreview" class="preview-content">
                    <!-- Le contenu du compte rendu sera chargé ici -->
                </div>
            </div>
            <div class="modal-footer">
                <button id="printCompteRenduPreviewBtn" class="px-4 py-2 bg-primary text-white rounded-button hover:bg-primary/90 flex items-center mr-2">
                    <i class="ri-printer-line mr-2"></i> Imprimer
                </button>
                <button id="saveCompteRenduPreviewBtn" class="px-4 py-2 bg-purple-600 text-white rounded-button hover:bg-purple-700 flex items-center">
                    <i class="ri-save-line mr-2"></i> Enregistrer PDF
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Ajouter les event listeners
    document.getElementById('closeCompteRenduModal').addEventListener('click', () => hideModal('compteRenduModal'));
    document.getElementById('printCompteRenduPreviewBtn').addEventListener('click', () => {
        printCompteRendu(currentCompteRenduId);
    });
    document.getElementById('saveCompteRenduPreviewBtn').addEventListener('click', () => {
        saveCompteRenduPDF(currentCompteRenduId);
    });
}

// Configuration des boutons pour les nouvelles anamnèse et compte rendu
function setupPatientRecordButtons(patient) {
    const newAnamneseBtn = document.getElementById('newAnamneseForPatientBtn');
    const newCompteRenduBtn = document.getElementById('newCompteRenduForPatientBtn');

    if (newAnamneseBtn) {
        // Supprimer les anciens event listeners
        newAnamneseBtn.replaceWith(newAnamneseBtn.cloneNode(true));
        const refreshedAnamneseBtn = document.getElementById('newAnamneseForPatientBtn');

        refreshedAnamneseBtn.addEventListener('click', function() {
            console.log('🔗 Redirection vers anamnèse (formulaire vide)');
            // ✅ SIMPLE: Redirection avec paramètre pour ouvrir automatiquement le modal
            window.location.href = '/anamnese.html?openModal=new';
        });
    }

    if (newCompteRenduBtn) {
        // Supprimer les anciens event listeners
        newCompteRenduBtn.replaceWith(newCompteRenduBtn.cloneNode(true));
        const refreshedCompteRenduBtn = document.getElementById('newCompteRenduForPatientBtn');

        refreshedCompteRenduBtn.addEventListener('click', function() {
            console.log('🔗 Redirection vers compte rendu (formulaire vide)');
            // ✅ SIMPLE: Redirection avec paramètre pour ouvrir automatiquement le modal
            window.location.href = '/compte-rendu.html?openModal=new';
        });
    }

    // ===== CONFIGURATION DU BOUTON AJOUTER SÉANCE (inchangé) =====
    const addSessionBtn = document.getElementById('addSessionBtn');
    if (addSessionBtn) {
        // Supprimer les anciens event listeners
        addSessionBtn.replaceWith(addSessionBtn.cloneNode(true));
        const refreshedAddSessionBtn = document.getElementById('addSessionBtn');

        refreshedAddSessionBtn.addEventListener('click', function() {
            console.log('➕ Clic sur ajouter séance pour patient:', patient.prenom, patient.nom);
            openAddSessionsModal(patient);
        });
    }

    // Configurer les onglets des dossiers (inchangé)
    document.querySelectorAll('.records-tab-button').forEach(button => {
        // Supprimer les anciens event listeners
        button.replaceWith(button.cloneNode(true));
    });

    // Réattacher les event listeners pour les onglets (inchangé)
    document.querySelectorAll('.records-tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            console.log('📋 Changement d\'onglet vers:', tabName);

            // Réinitialiser tous les onglets
            document.querySelectorAll('.records-tab-button').forEach(btn => {
                btn.classList.remove('active', 'border-primary', 'text-primary');
                btn.classList.add('border-transparent', 'text-gray-500');
            });

            document.querySelectorAll('.records-tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // Activer l'onglet sélectionné
            this.classList.add('active', 'border-primary', 'text-primary');
            this.classList.remove('border-transparent', 'text-gray-500');

            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                tabContent.classList.remove('hidden');
            }
        });
    });

    // Configurer la fermeture du modal (inchangé)
    const closeRecordsModalBtn = document.getElementById('closeRecordsModalBtn');
    if (closeRecordsModalBtn) {
        closeRecordsModalBtn.replaceWith(closeRecordsModalBtn.cloneNode(true));
        const refreshedCloseBtn = document.getElementById('closeRecordsModalBtn');

        refreshedCloseBtn.addEventListener('click', function() {
            console.log('❌ Fermeture du modal dossiers patient');
            hideModal('patientRecordsModal');
        });
    }
}

// ===== CONFIGURATION DES EVENT LISTENERS POUR LE MODAL D'AJOUT DE SÉANCES =====
function setupAddSessionsModalEventListeners() {
    const addSessionsModal = document.getElementById('addSessionsModal');
    const closeAddSessionsBtn = document.getElementById('closeAddSessionsBtn');
    const cancelAddSessionsBtn = document.getElementById('cancelAddSessionsBtn');
    const submitAddSessionsBtn = document.getElementById('submitAddSessionsBtn');
    const additionalSessions = document.getElementById('additionalSessions');

    if (closeAddSessionsBtn && addSessionsModal) {
        closeAddSessionsBtn.addEventListener('click', function() {
            console.log('❌ Fermeture modal ajout séances');
            hideModal('addSessionsModal');
        });
    }

    if (cancelAddSessionsBtn && addSessionsModal) {
        cancelAddSessionsBtn.addEventListener('click', function() {
            console.log('🚫 Annulation ajout séances');
            hideModal('addSessionsModal');
        });
    }

    if (submitAddSessionsBtn) {
        submitAddSessionsBtn.addEventListener('click', function() {
            console.log('✅ Soumission ajout séances');
            addSessionToPatient();
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
}

// Initialisation du module lors du chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Module patient-records initialisé');

    // 1. Charger les bibliothèques nécessaires
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script2);

    // 2. Ajouter les styles nécessaires
    if (!document.getElementById('patientRecordsStyles')) {
        const style = document.createElement('style');
        style.id = 'patientRecordsStyles';
        style.textContent = `
            .modal.hidden {
                opacity: 0 !important;
                display: none !important;
                z-index: -1 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            #patientRecordsModal.hidden,
            #addSessionsModal.hidden {
                visibility: hidden !important;
                pointer-events: none !important;
            }
            .preview-content,
            .preview-content * {
                white-space: normal !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
            }
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .modal.show {
                opacity: 1;
                display: flex !important;
            }
            /* Z-index spécifique pour le modal d'ajout de séances */
            #addSessionsModal {
                z-index: 10000 !important;
            }
            #addSessionsModal .modal-content {
                z-index: 10001 !important;
            }
            .modal-content {
                background-color: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                width: 90%;
                max-width: 900px;
                max-height: 90vh;
                overflow-y: auto;
            }
            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-body {
                padding: 1.5rem;
            }
            .modal-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }
            .preview-content {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                font-size: 12pt;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .cr-header {
                text-align: center;
                margin-bottom: 40px;
            }
            .cr-header h1 {
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
            .bilan-items {
                margin-top: 5px;
            }
            .bilan-item {
                margin-bottom: 8px;
            }
            .bilan-item-title {
                font-weight: bold;
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
            }
            .whitespace-pre-line {
                white-space: pre-line;
            }
            .whitespace-pre-wrap {
                white-space: pre-wrap;
            }
            .status-badge {
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 500;
            }
            .status-termine {
                background-color: rgba(16, 185, 129, 0.1);
                color: rgb(16, 185, 129);
            }
            .status-en-cours {
                background-color: rgba(245, 158, 11, 0.1);
                color: rgb(245, 158, 11);
            }
            .status-non-commence {
                background-color: rgba(239, 68, 68, 0.1);
                color: rgb(239, 68, 68);
            }
            .status-complete {
                background-color: rgba(16, 185, 129, 0.1);
                color: rgb(16, 185, 129);
            }
            .text-muted {
                color: #6b7280;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
            .rounded-button {
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    // 3. Configurer les event listeners pour le modal d'ajout de séances
    setupAddSessionsModalEventListeners();

    console.log('🎨 Styles patient-records ajoutés');
    console.log('⚙️ Event listeners modal ajout séances configurés');
});

// Exporter les fonctions principales pour utilisation externe
window.openPatientRecords = openPatientRecords;
window.loadPatientSeances = loadPatientSeances;
window.openAddSessionsModal = openAddSessionsModal;
window.addSessionToPatient = addSessionToPatient;

console.log('📄 Module patient-records chargé avec succès');