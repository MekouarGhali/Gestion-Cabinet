// Configuration API
const API_BASE_URL = '/api';

// Variables globales
let currentProfil = null;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let minX = 0, maxX = 0, minY = 0, maxY = 0;
let stream = null;
let pendingPhotoData = null;

// Classe pour gérer les appels API
class ProfilAPI {
    static async getCurrentProfil() {
        try {
            const response = await fetch(`${API_BASE_URL}/profil/me`);
            if (!response.ok) throw new Error('Erreur lors du chargement du profil');
            return await response.json();
        } catch (error) {
            console.error('Erreur API getCurrentProfil:', error);
            showNotification('error', 'Erreur lors du chargement du profil');
            return null;
        }
    }

    static async updateProfil(profilId, profilData) {
        try {
            const response = await fetch(`${API_BASE_URL}/profil/${profilId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profilData)
            });
            if (!response.ok) throw new Error('Erreur lors de la mise à jour');
            return await response.json();
        } catch (error) {
            console.error('Erreur API updateProfil:', error);
            throw error;
        }
    }

    static async changePassword(profilId, passwords) {
        try {
            const response = await fetch(`${API_BASE_URL}/profil/${profilId}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwords)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du changement de mot de passe');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API changePassword:', error);
            throw error;
        }
    }

    static async uploadPhoto(profilId, photoBase64) {
        try {
            console.log('📸 Début upload photo pour profil:', profilId);

            const response = await fetch(`${API_BASE_URL}/profil/${profilId}/upload-photo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ photo: photoBase64 })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erreur upload photo:', errorText);
                throw new Error('Erreur lors de l\'upload de la photo');
            }

            const result = await response.json();
            console.log('✅ Photo uploadée avec succès');
            return result;
        } catch (error) {
            console.error('❌ Erreur API uploadPhoto:', error);
            throw error;
        }
    }
}

// Utilitaires et notifications
function showNotification(type, message, title = null) {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationIcon = notification.querySelector('.notification-icon svg');

    notification.classList.remove('success', 'error', 'info');

    switch(type) {
        case 'success':
            notification.classList.add('success');
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />';
            notificationTitle.textContent = title || 'Succès';
            break;
        case 'error':
            notification.classList.add('error');
            notificationIcon.innerHTML = '<path fill-rule="evenodd" d="M10 20a10 10 0 100-20 10 10 0 000 20zM8.45 4.3c.765-1.36 2.722-1.36 3.486 0l5.14 9.14c.75 1.334-.213 2.98-1.742 2.98H5.07c-1.53 0-2.493-1.646-1.743-2.98l5.14-9.14zM11 12a1 1 0 11-2 0 1 1 0 012 0zm-1-7a1 1 0 00-1 1v2.8a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>';
            notificationTitle.textContent = title || 'Erreur';
            break;
        case 'info':
            notification.classList.add('info');
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

// Validation des formulaires
function validateForm() {
    const fields = [
        { id: 'prenom', message: 'Le prénom est requis' },
        { id: 'nom', message: 'Le nom est requis' },
        { id: 'email', message: 'Email valide requis', validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
        { id: 'telephone', message: 'Le téléphone est requis' },
        { id: 'specialite', message: 'La spécialité est requise' }
    ];

    let isValid = true;
    const errors = [];

    fields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element.value.trim();

        if (!value || (field.validator && !field.validator(value))) {
            element.classList.add('form-error');
            errors.push(field.message);
            isValid = false;
        } else {
            element.classList.remove('form-error');
        }
    });

    if (!isValid) {
        showNotification('error', errors.join(', '), 'Erreurs de validation');
    }

    return isValid;
}

function validatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const validations = [
        { field: 'currentPassword', value: currentPassword, message: 'Mot de passe actuel requis' },
        { field: 'newPassword', value: newPassword, message: 'Le nouveau mot de passe doit faire au moins 6 caractères', validator: (val) => val.length >= 6 },
        { field: 'confirmPassword', value: confirmPassword, message: 'Les mots de passe ne correspondent pas', validator: () => newPassword === confirmPassword }
    ];

    let isValid = true;
    const errors = [];

    validations.forEach(validation => {
        const element = document.getElementById(validation.field);
        const isFieldValid = validation.value && (!validation.validator || validation.validator(validation.value));

        if (!isFieldValid) {
            element.classList.add('form-error');
            errors.push(validation.message);
            isValid = false;
        } else {
            element.classList.remove('form-error');
        }
    });

    if (!isValid) {
        showNotification('error', errors.join(', '), 'Erreurs de validation');
    }

    return isValid;
}

// Chargement et mise à jour des données profil
async function loadProfilData() {
    try {
        currentProfil = await ProfilAPI.getCurrentProfil();
        if (!currentProfil) return;

        console.log('📋 Profil chargé:', currentProfil);

        // Remplir les champs du formulaire
        const fields = ['prenom', 'nom', 'email', 'telephone', 'specialite'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = currentProfil[field] || '';
        });

        // Mettre à jour l'affichage
        updateProfilDisplay();
        await loadProfilePhoto();

        // Configurer le thème
        const savedTheme = currentProfil.theme || 'light';
        console.log('🎨 Thème chargé:', savedTheme);

        if (window.themeManager) {
            window.themeManager.setTheme(savedTheme);
        }
        selectTheme(savedTheme);

        // Configurer la double authentification
        const twoFactorSwitch = document.getElementById('twoFactorSwitch');
        if (currentProfil.twoFactorEnabled) {
            twoFactorSwitch.classList.add('checked');
        }

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showNotification('error', 'Erreur lors du chargement du profil');
    }
}

async function loadProfilePhoto() {
    if (!currentProfil) return;

    try {
        const timestamp = new Date().getTime();
        const url = `${API_BASE_URL}/profil/photo/${currentProfil.id}?t=${timestamp}`;

        const response = await fetch(url, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            updateProfilPhoto(imageUrl);
            console.log('✅ Photo profil chargée');
        } else {
            console.log('ℹ️ Aucune photo trouvée');
            updateProfilPhoto(null);
        }
    } catch (error) {
        console.log('⚠️ Erreur chargement photo:', error);
        updateProfilPhoto(null);
    }
}

function updateProfilDisplay() {
    if (!currentProfil) return;

    console.log('🔄 Mise à jour affichage profil');

    // Nom complet sur la page
    const profileDisplayName = document.getElementById('profileDisplayName');
    if (profileDisplayName) {
        const fullName = `Dr. ${currentProfil.prenom || ''} ${currentProfil.nom || ''}`.trim();
        profileDisplayName.textContent = fullName;
    }

    // Spécialité
    const profileDisplaySpecialty = document.getElementById('profileDisplaySpecialty');
    if (profileDisplaySpecialty) {
        profileDisplaySpecialty.textContent = currentProfil.specialite || 'Spécialité';
    }

    // Mettre à jour la sidebar
    updateSidebarInfo();
}

function updateProfilPhoto(photoData) {
    const profileContainer = document.getElementById('profilePhotoContainer');
    if (!profileContainer) return;

    if (photoData && Array.isArray(photoData)) {
        // Données backend (array de bytes)
        const base64String = btoa(String.fromCharCode(...photoData));
        const dataUrl = `data:image/jpeg;base64,${base64String}`;
        profileContainer.innerHTML = `<img src="${dataUrl}" alt="Photo de profil" class="w-full h-full object-cover">`;
    } else if (photoData && typeof photoData === 'string' && (photoData.startsWith('data:image') || photoData.startsWith('blob:'))) {
        // Base64 ou Blob URL
        profileContainer.innerHTML = `<img src="${photoData}" alt="Photo de profil" class="w-full h-full object-cover">`;
    } else {
        // Pas de photo - afficher initiales ou icône
        if (currentProfil && currentProfil.initiales) {
            profileContainer.innerHTML = `<span class="text-xl font-medium text-gray-600">${currentProfil.initiales}</span>`;
        } else {
            profileContainer.innerHTML = `<i class="ri-user-line text-gray-400 text-4xl" id="profilePhotoIcon"></i>`;
        }
    }

    updateSidebarPhoto(photoData);
}

function updateSidebarPhoto(photoData) {
    const sidebarAvatar = document.getElementById('userAvatar');
    if (!sidebarAvatar) return;

    if (photoData && typeof photoData === 'string' && (photoData.startsWith('blob:') || photoData.startsWith('data:image'))) {
        sidebarAvatar.innerHTML = `<img src="${photoData}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
        console.log('✅ Avatar sidebar mis à jour');
    } else if (currentProfil && currentProfil.initiales) {
        sidebarAvatar.innerHTML = `<span class="font-medium">${currentProfil.initiales}</span>`;
        console.log('✅ Initiales sidebar mises à jour');
    }
}

function updateSidebarInfo() {
    if (!currentProfil) return;

    const updateElements = () => {
        const sidebarName = document.getElementById('userName');
        const sidebarSpecialty = document.getElementById('userProfession');

        if (sidebarName) {
            const fullName = `${currentProfil.prenom || ''} ${currentProfil.nom || ''}`.trim();
            sidebarName.textContent = fullName;
        }

        if (sidebarSpecialty) {
            sidebarSpecialty.textContent = currentProfil.specialite || 'Spécialité';
        }
    };

    // Mise à jour immédiate et différée pour s'assurer que la sidebar est chargée
    updateElements();
    setTimeout(updateElements, 100);
    setTimeout(updateElements, 500);
}

// Gestion du thème
function selectTheme(theme) {
    if (window.themeManager) {
        window.themeManager.setTheme(theme);
    } else {
        // Fallback si ThemeManager n'est pas chargé
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('selected');
            const indicator = option.querySelector('.theme-indicator');
            if (indicator) indicator.classList.add('hidden');
        });

        const selectedOption = document.querySelector(`.theme-option[data-theme="${theme}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            const indicator = selectedOption.querySelector('.theme-indicator');
            if (indicator) indicator.classList.remove('hidden');
        }
    }
}

function getSelectedTheme() {
    if (window.themeManager) {
        return window.themeManager.getCurrentTheme();
    }
    const selectedTheme = document.querySelector('.theme-option.selected');
    return selectedTheme ? selectedTheme.dataset.theme : 'light';
}

// Gestion des images
function setupImageHandling() {
    const photoUpload = document.getElementById('photoUpload');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const dropArea = document.getElementById('dropArea');

    if (photoUpload) photoUpload.addEventListener('change', handleFileUpload);
    if (zoomSlider) {
        zoomSlider.addEventListener('input', function() {
            updateZoom();
            if (zoomValue) zoomValue.textContent = `${zoomSlider.value}%`;
        });
    }

    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'), false);
        });

        dropArea.addEventListener('drop', handleDrop, false);
    }

    // Options d'avatar
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const avatarType = this.dataset.avatar;
            createAvatarImage(avatarType);
        });
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFileUpload(e) {
    if (e.target.files && e.target.files[0]) {
        processImageFile(e.target.files[0]);
    }
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files && files[0]) {
        processImageFile(files[0]);
    }
}

function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('error', 'Veuillez sélectionner un fichier image valide');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'La taille du fichier ne doit pas dépasser 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        createImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
}

function createImagePreview(imageSrc) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.className = 'w-full h-full object-contain absolute';
    img.style.transform = 'translate(0, 0) scale(1)';
    img.draggable = false;

    img.onload = function() {
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);

        currentImage = img;
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider) zoomSlider.value = 100;
        if (zoomValue) zoomValue.textContent = '100%';

        translateX = 0;
        translateY = 0;
        updateZoom();
        calculateBoundaries();
        setupImageDrag();
    };
}

function createAvatarImage(avatarType) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const avatarColors = {
        avatar1: { bg: '#dbeafe', text: '#1d4ed8' },
        avatar2: { bg: '#dcfce7', text: '#16a34a' },
        avatar3: { bg: '#f3e8ff', text: '#9333ea' },
        avatar4: { bg: '#fee2e2', text: '#dc2626' }
    };

    const colors = avatarColors[avatarType] || avatarColors.avatar1;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, 200, 200);

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 60px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const initials = currentProfil ? currentProfil.initiales || 'XX' : 'XX';
    ctx.fillText(initials, 100, 100);

    const dataURL = canvas.toDataURL('image/png');
    createImagePreview(dataURL);
}

function setupImageDrag() {
    if (!currentImage) return;

    currentImage.addEventListener('mousedown', startDrag);
    currentImage.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', dragImage);
    document.addEventListener('touchmove', dragImage);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}

function updateZoom() {
    if (currentImage) {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = zoomSlider ? zoomSlider.value / 100 : 1;
        currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomValue})`;
        calculateBoundaries();
    }
}

function calculateBoundaries() {
    if (!currentImage) return;

    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = zoomSlider ? zoomSlider.value / 100 : 1;
    const cropSize = 192;

    const imgWidth = currentImage.naturalWidth || currentImage.width;
    const imgHeight = currentImage.naturalHeight || currentImage.height;

    const scaledWidth = imgWidth * zoomValue;
    const scaledHeight = imgHeight * zoomValue;

    maxX = Math.max(0, (scaledWidth - cropSize) / 2);
    minX = -maxX;
    maxY = Math.max(0, (scaledHeight - cropSize) / 2);
    minY = -maxY;

    translateX = Math.max(minX, Math.min(maxX, translateX));
    translateY = Math.max(minY, Math.min(maxY, translateY));

    currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomValue})`;
}

function startDrag(e) {
    isDragging = true;
    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    e.preventDefault();
}

function dragImage(e) {
    if (!isDragging || !currentImage) return;

    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;

    const dx = x - startX;
    const dy = y - startY;

    const newX = translateX + dx;
    const newY = translateY + dy;

    translateX = Math.max(minX, Math.min(maxX, newX));
    translateY = Math.max(minY, Math.min(maxY, newY));

    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = zoomSlider ? zoomSlider.value / 100 : 1;
    currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomValue})`;

    startX = x;
    startY = y;
}

function endDrag() {
    isDragging = false;
}

// Gestion de la caméra
function setupCamera() {
    const cameraButton = document.getElementById('cameraButton');
    const cameraModal = document.getElementById('cameraModal');
    const closeCameraModal = document.getElementById('closeCameraModal');
    const cameraFeed = document.getElementById('cameraFeed');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const takePictureButton = document.getElementById('takePictureButton');

    if (cameraButton) {
        cameraButton.addEventListener('click', function() {
            const profilePhotoModal = document.getElementById('profilePhotoModal');
            if (profilePhotoModal) profilePhotoModal.classList.add('hidden');
            if (cameraModal) cameraModal.classList.remove('hidden');

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(function(mediaStream) {
                        stream = mediaStream;
                        if (cameraFeed) {
                            cameraFeed.srcObject = mediaStream;
                            cameraFeed.classList.remove('hidden');
                            cameraFeed.play();
                        }
                        if (cameraPlaceholder) cameraPlaceholder.classList.add('hidden');
                    })
                    .catch(function(err) {
                        console.log("Erreur caméra: " + err);
                        if (cameraFeed) cameraFeed.classList.add('hidden');
                        if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
                    });
            } else {
                if (cameraFeed) cameraFeed.classList.add('hidden');
                if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
            }
        });
    }

    if (closeCameraModal) {
        closeCameraModal.addEventListener('click', function() {
            if (cameraModal) cameraModal.classList.add('hidden');
            const profilePhotoModal = document.getElementById('profilePhotoModal');
            if (profilePhotoModal) profilePhotoModal.classList.remove('hidden');

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
        });
    }

    if (takePictureButton) {
        takePictureButton.addEventListener('click', function() {
            if (cameraFeed && cameraFeed.srcObject) {
                const canvas = document.createElement('canvas');
                canvas.width = cameraFeed.videoWidth;
                canvas.height = cameraFeed.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL('image/png');

                createImagePreview(dataURL);

                if (cameraModal) cameraModal.classList.add('hidden');
                const profilePhotoModal = document.getElementById('profilePhotoModal');
                if (profilePhotoModal) profilePhotoModal.classList.remove('hidden');

                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                }
            }
        });
    }
}

// Sauvegarde et actions principales
async function saveProfil() {
    if (!validateForm()) return;
    if (!currentProfil) {
        showNotification('error', 'Aucun profil connecté');
        return;
    }

    const saveButton = document.getElementById('saveButton');
    saveButton.classList.add('loading');
    saveButton.disabled = true;

    try {
        // 1. Sauvegarder les données du profil
        const profilData = {
            prenom: document.getElementById('prenom').value.trim(),
            nom: document.getElementById('nom').value.trim(),
            email: document.getElementById('email').value.trim(),
            telephone: document.getElementById('telephone').value.trim(),
            specialite: document.getElementById('specialite').value.trim(),
            theme: getSelectedTheme(),
            twoFactorEnabled: document.getElementById('twoFactorSwitch').classList.contains('checked')
        };

        console.log('💾 Sauvegarde du profil:', profilData);
        const updatedProfil = await ProfilAPI.updateProfil(currentProfil.id, profilData);
        currentProfil = updatedProfil;

        // Forcer l'application du thème après sauvegarde
        if (window.themeManager && updatedProfil.theme) {
            window.themeManager.setTheme(updatedProfil.theme);
        }

        // 2. Sauvegarder la photo en attente si elle existe
        if (pendingPhotoData) {
            console.log('📸 Sauvegarde de la photo en attente...');

            try {
                await ProfilAPI.uploadPhoto(currentProfil.id, pendingPhotoData);

                // Attendre un peu pour la synchronisation
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Recharger la photo depuis la base de données
                await loadProfilePhoto();

                pendingPhotoData = null;
                console.log('✅ Photo sauvegardée');
            } catch (photoError) {
                console.error('❌ Erreur upload photo:', photoError);
                showNotification('error', 'Erreur lors de la sauvegarde de la photo');
                return;
            }
        }

        updateProfilDisplay();
        showNotification('success', 'Profil mis à jour avec succès !');

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('error', 'Erreur lors de la sauvegarde du profil');
    } finally {
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
    }
}

async function changePassword() {
    if (!validatePassword()) return;
    if (!currentProfil) {
        showNotification('error', 'Aucun profil connecté');
        return;
    }

    const changePasswordBtn = document.getElementById('changePasswordBtn');
    changePasswordBtn.classList.add('loading');
    changePasswordBtn.disabled = true;

    try {
        const passwords = {
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: document.getElementById('newPassword').value
        };

        await ProfilAPI.changePassword(currentProfil.id, passwords);

        // Réinitialiser le formulaire
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) passwordForm.reset();

        document.querySelectorAll('#passwordForm input').forEach(input => {
            input.classList.remove('form-error');
        });

        showNotification('success', 'Mot de passe modifié avec succès !');

    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        showNotification('error', error.message || 'Erreur lors du changement de mot de passe');
    } finally {
        changePasswordBtn.classList.remove('loading');
        changePasswordBtn.disabled = false;
    }
}

async function saveProfilPhoto() {
    if (!currentImage || !currentProfil) {
        showNotification('error', 'Aucune image sélectionnée');
        return;
    }

    const savePhotoBtn = document.getElementById('saveProfilePhoto');
    savePhotoBtn.classList.add('loading');
    savePhotoBtn.disabled = true;

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const cropSize = 200;
        canvas.width = cropSize;
        canvas.height = cropSize;

        // Créer un cercle de découpe
        ctx.beginPath();
        ctx.arc(cropSize/2, cropSize/2, cropSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calculer les dimensions pour le recadrage
        const container = document.getElementById('imagePreviewContainer');
        const overlay = document.getElementById('cropOverlay');
        const containerRect = container.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();
        const imageRect = currentImage.getBoundingClientRect();

        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = zoomSlider ? zoomSlider.value / 100 : 1;

        const displayedWidth = currentImage.offsetWidth;
        const displayedHeight = currentImage.offsetHeight;
        const naturalWidth = currentImage.naturalWidth;
        const naturalHeight = currentImage.naturalHeight;

        const widthRatio = naturalWidth / displayedWidth;
        const heightRatio = naturalHeight / displayedHeight;

        const circleLeft = overlayRect.left - imageRect.left;
        const circleTop = overlayRect.top - imageRect.top;

        const sourceX = (circleLeft * widthRatio) / zoomValue;
        const sourceY = (circleTop * heightRatio) / zoomValue;
        const sourceSize = (cropSize * widthRatio) / zoomValue;

        ctx.drawImage(
            currentImage,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, cropSize, cropSize
        );

        const croppedImageData = canvas.toDataURL('image/png');

        // Stocker la photo pour la sauvegarde avec le profil
        console.log('👁️ Aperçu de la photo (pas encore sauvegardée)');
        pendingPhotoData = croppedImageData;
        updateProfilPhoto(croppedImageData);

        const profilePhotoModal = document.getElementById('profilePhotoModal');
        if (profilePhotoModal) profilePhotoModal.classList.add('hidden');

        showNotification('info', 'Aperçu appliqué ! Cliquez sur "Enregistrer les modifications" pour sauvegarder définitivement.');

    } catch (error) {
        console.error('Erreur lors de l\'aperçu de la photo:', error);
        showNotification('error', 'Erreur lors de l\'aperçu de la photo');
    } finally {
        savePhotoBtn.classList.remove('loading');
        savePhotoBtn.disabled = false;
    }
}

// Configuration des event listeners
function setupEventListeners() {
    // Boutons principaux
    const saveButton = document.getElementById('saveButton');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const cancelButton = document.getElementById('cancelButton');

    if (saveButton) saveButton.addEventListener('click', saveProfil);
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', changePassword);
    if (cancelButton) cancelButton.addEventListener('click', () => location.reload());

    // Switch double authentification
    const twoFactorSwitch = document.getElementById('twoFactorSwitch');
    if (twoFactorSwitch) {
        twoFactorSwitch.addEventListener('click', function() {
            this.classList.toggle('checked');
        });
    }

    // Thèmes
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            selectTheme(theme);
        });
    });

    // Modals photo de profil
    const profilePhotoButton = document.getElementById('profilePhotoButton');
    const profilePhotoModal = document.getElementById('profilePhotoModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const cancelProfilePhoto = document.getElementById('cancelProfilePhoto');
    const saveProfilePhoto = document.getElementById('saveProfilePhoto');

    if (profilePhotoButton && profilePhotoModal) {
        profilePhotoButton.addEventListener('click', function() {
            profilePhotoModal.classList.remove('hidden');
        });
    }

    if (closeProfileModal && profilePhotoModal) {
        closeProfileModal.addEventListener('click', function() {
            profilePhotoModal.classList.add('hidden');
        });
    }

    if (cancelProfilePhoto && profilePhotoModal) {
        cancelProfilePhoto.addEventListener('click', function() {
            profilePhotoModal.classList.add('hidden');
        });
    }

    if (saveProfilePhoto) {
        saveProfilePhoto.addEventListener('click', saveProfilPhoto);
    }

    // Configuration des fonctionnalités d'images et caméra
    setupImageHandling();
    setupCamera();
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation de la page profil...');

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

    // 4. Configurer les event listeners et charger les données
    setupEventListeners();
    await loadProfilData();

    console.log('✅ Initialisation profil terminée');
});