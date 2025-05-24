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
            console.log('🌐 API Call - Upload photo pour profil:', profilId);
            console.log('🌐 URL appelée:', `${API_BASE_URL}/profil/${profilId}/upload-photo`);

            const response = await fetch(`${API_BASE_URL}/profil/${profilId}/upload-photo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ photo: photoBase64 })
            });

            console.log('🌐 Statut réponse:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('🌐 Erreur réponse:', errorText);
                throw new Error('Erreur lors de l\'upload de la photo');
            }

            const result = await response.json();
            console.log('🌐 Réponse succès:', result);
            return result;
        } catch (error) {
            console.error('🌐 Erreur API uploadPhoto:', error);
            throw error;
        }
    }
}

// Utilitaires
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

function validateForm() {
    const prenom = document.getElementById('prenom').value.trim();
    const nom = document.getElementById('nom').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const specialite = document.getElementById('specialite').value.trim();

    let isValid = true;
    const errors = [];

    if (!prenom) {
        document.getElementById('prenom').classList.add('form-error');
        errors.push('Le prénom est requis');
        isValid = false;
    } else {
        document.getElementById('prenom').classList.remove('form-error');
    }

    if (!nom) {
        document.getElementById('nom').classList.add('form-error');
        errors.push('Le nom est requis');
        isValid = false;
    } else {
        document.getElementById('nom').classList.remove('form-error');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('email').classList.add('form-error');
        errors.push('Email valide requis');
        isValid = false;
    } else {
        document.getElementById('email').classList.remove('form-error');
    }

    if (!telephone) {
        document.getElementById('telephone').classList.add('form-error');
        errors.push('Le téléphone est requis');
        isValid = false;
    } else {
        document.getElementById('telephone').classList.remove('form-error');
    }

    if (!specialite) {
        document.getElementById('specialite').classList.add('form-error');
        errors.push('La spécialité est requise');
        isValid = false;
    } else {
        document.getElementById('specialite').classList.remove('form-error');
    }

    if (!isValid) {
        showNotification('error', errors.join(', '), 'Erreurs de validation');
    }

    return isValid;
}

function validatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;
    const errors = [];

    if (!currentPassword) {
        document.getElementById('currentPassword').classList.add('form-error');
        errors.push('Mot de passe actuel requis');
        isValid = false;
    } else {
        document.getElementById('currentPassword').classList.remove('form-error');
    }

    if (!newPassword || newPassword.length < 6) {
        document.getElementById('newPassword').classList.add('form-error');
        errors.push('Le nouveau mot de passe doit faire au moins 6 caractères');
        isValid = false;
    } else {
        document.getElementById('newPassword').classList.remove('form-error');
    }

    if (newPassword !== confirmPassword) {
        document.getElementById('confirmPassword').classList.add('form-error');
        errors.push('Les mots de passe ne correspondent pas');
        isValid = false;
    } else {
        document.getElementById('confirmPassword').classList.remove('form-error');
    }

    if (!isValid) {
        showNotification('error', errors.join(', '), 'Erreurs de validation');
    }

    return isValid;
}

// Chargement des données profil
async function loadProfilData() {
    try {
        currentProfil = await ProfilAPI.getCurrentProfil();
        if (!currentProfil) return;

        console.log('📋 Profil chargé:', currentProfil);

        // Remplir les champs du formulaire
        document.getElementById('prenom').value = currentProfil.prenom || '';
        document.getElementById('nom').value = currentProfil.nom || '';
        document.getElementById('email').value = currentProfil.email || '';
        document.getElementById('telephone').value = currentProfil.telephone || '';
        document.getElementById('specialite').value = currentProfil.specialite || '';

        // Mettre à jour l'affichage du nom
        updateProfilDisplay();

        // ✅ CORRECTION : Charger la photo via l'endpoint
        await loadProfilePhoto();

        // Mettre à jour le thème sélectionné
        if (currentProfil.theme) {
            selectTheme(currentProfil.theme);
        }

        // Mettre à jour le switch de double authentification
        const twoFactorSwitch = document.getElementById('twoFactorSwitch');
        if (currentProfil.twoFactorEnabled) {
            twoFactorSwitch.classList.add('checked');
        }

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showNotification('error', 'Erreur lors du chargement du profil');
    }
}

//Charger la photo depuis l'endpoint
async function loadProfilePhoto() {
    if (!currentProfil) return;

    try {
        const timestamp = new Date().getTime();
        const url = `${API_BASE_URL}/profil/photo/${currentProfil.id}?t=${timestamp}`;

        console.log('🔍 loadProfilePhoto - URL:', url);
        console.log('🔍 loadProfilePhoto - currentProfil.id:', currentProfil.id);

        const response = await fetch(url, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log('🔍 loadProfilePhoto - Response status:', response.status);
        console.log('🔍 loadProfilePhoto - Response headers:', [...response.headers.entries()]);

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            console.log('🔍 loadProfilePhoto - Blob size:', blob.size);
            console.log('🔍 loadProfilePhoto - Blob type:', blob.type);
            console.log('🔍 loadProfilePhoto - Generated URL:', imageUrl);

            // ✅ VÉRIFIER : Créer un hash du blob pour voir si l'image a vraiment changé
            const arrayBuffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            console.log('🔍 loadProfilePhoto - Image hash:', hashHex);

            updateProfilPhoto(imageUrl);
        } else {
            console.log('🔍 loadProfilePhoto - Pas de photo trouvée');
            updateProfilPhoto(null);
        }
    } catch (error) {
        console.log('🔍 loadProfilePhoto - Erreur:', error);
        updateProfilPhoto(null);
    }
}

function updateSidebarInfo() {
    if (!currentProfil) return;

    console.log('🔍 updateSidebarInfo - DÉBUT');
    console.log('🔍 updateSidebarInfo - currentProfil:', currentProfil);

    const updateElements = () => {
        const sidebarName = document.getElementById('userName');
        const sidebarSpecialty = document.getElementById('userProfession');
        const sidebarAvatar = document.getElementById('userAvatar');

        console.log('🔍 updateSidebarInfo - Éléments trouvés:', { sidebarName, sidebarSpecialty, sidebarAvatar });

        if (sidebarName) {
            const fullName = `${currentProfil.prenom || ''} ${currentProfil.nom || ''}`.trim();
            sidebarName.textContent = fullName;
            console.log('🔍 updateSidebarInfo - Nom mis à jour:', fullName);
        }

        if (sidebarSpecialty) {
            sidebarSpecialty.textContent = currentProfil.specialite || 'Spécialité';
            console.log('🔍 updateSidebarInfo - Spécialité mise à jour:', currentProfil.specialite);
        }

        if (sidebarAvatar) {
            const existingImage = sidebarAvatar.querySelector('img');
            console.log('🔍 updateSidebarInfo - Image existante:', existingImage ? 'OUI' : 'NON');

            if (existingImage) {
                console.log('🔍 updateSidebarInfo - URL image existante:', existingImage.src);
            }

            if (!existingImage) {
                console.log('🔍 updateSidebarInfo - Pas d\'image, traitement avatar backend...');
                if (currentProfil.avatar && Array.isArray(currentProfil.avatar)) {
                    console.log('🔍 updateSidebarInfo - Avatar backend trouvé, taille:', currentProfil.avatar.length);
                    try {
                        const base64String = btoa(String.fromCharCode(...currentProfil.avatar));
                        const dataUrl = `data:image/jpeg;base64,${base64String}`;
                        sidebarAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
                        console.log('🔍 updateSidebarInfo - Avatar backend appliqué');
                    } catch (e) {
                        console.error('🔍 updateSidebarInfo - Erreur conversion:', e);
                        sidebarAvatar.innerHTML = `<span class="font-medium">${currentProfil.initiales}</span>`;
                    }
                } else if (currentProfil.initiales) {
                    console.log('🔍 updateSidebarInfo - Affichage initiales:', currentProfil.initiales);
                    sidebarAvatar.innerHTML = `<span class="font-medium">${currentProfil.initiales}</span>`;
                }
            } else {
                console.log('🔍 updateSidebarInfo - Image existante, on ne touche pas');
            }
        }
    };

    console.log('🔍 updateSidebarInfo - Exécution immédiate');
    updateElements();

    console.log('🔍 updateSidebarInfo - Programmation timeouts');
    setTimeout(() => {
        console.log('🔍 updateSidebarInfo - Timeout 100ms');
        updateElements();
    }, 100);
    setTimeout(() => {
        console.log('🔍 updateSidebarInfo - Timeout 500ms');
        updateElements();
    }, 500);
    setTimeout(() => {
        console.log('🔍 updateSidebarInfo - Timeout 1000ms');
        updateElements();
    }, 1000);
}

function updateProfilDisplay() {
    if (!currentProfil) return;

    console.log('🔄 Mise à jour de l\'affichage du profil');

    // Mettre à jour le nom complet affiché sur la page
    const profileDisplayName = document.getElementById('profileDisplayName');
    if (profileDisplayName) {
        const fullName = `Dr. ${currentProfil.prenom || ''} ${currentProfil.nom || ''}`.trim();
        profileDisplayName.textContent = fullName;
        console.log('✅ Nom affiché mis à jour:', fullName);
    }

    // Mettre à jour la spécialité affichée
    const profileDisplaySpecialty = document.getElementById('profileDisplaySpecialty');
    if (profileDisplaySpecialty) {
        profileDisplaySpecialty.textContent = currentProfil.specialite || 'Spécialité';
        console.log('✅ Spécialité affichée mise à jour:', currentProfil.specialite);
    }
}

function updateProfilPhoto(photoData) {
    const profileContainer = document.getElementById('profilePhotoContainer');

    if (photoData && Array.isArray(photoData)) {
        // Données backend (array de bytes)
        const base64String = btoa(String.fromCharCode(...photoData));
        const dataUrl = `data:image/jpeg;base64,${base64String}`;
        profileContainer.innerHTML = `<img src="${dataUrl}" alt="Photo de profil" class="w-full h-full object-cover">`;
    } else if (photoData && typeof photoData === 'string' && photoData.startsWith('data:image')) {
        // Base64 (upload)
        profileContainer.innerHTML = `<img src="${photoData}" alt="Photo de profil" class="w-full h-full object-cover">`;
    } else if (photoData && typeof photoData === 'string' && photoData.startsWith('blob:')) {
        // Blob URL (endpoint)
        profileContainer.innerHTML = `<img src="${photoData}" alt="Photo de profil" class="w-full h-full object-cover">`;
    } else {
        // Pas de photo
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

// Gestion du thème
function selectTheme(theme) {
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

// Gestion des images
function setupImageHandling() {
    const photoUpload = document.getElementById('photoUpload');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const dropArea = document.getElementById('dropArea');

    photoUpload.addEventListener('change', handleFileUpload);

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

    zoomSlider.addEventListener('input', function() {
        updateZoom();
        zoomValue.textContent = `${zoomSlider.value}%`;
    });

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

    const img = document.createElement('img');
    img.src = imageSrc;
    img.className = 'w-full h-full object-contain absolute';
    img.style.transform = 'translate(0, 0) scale(1)';
    img.draggable = false;

    img.onload = function() {
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);

        currentImage = img;
        document.getElementById('zoomSlider').value = 100;
        document.getElementById('zoomValue').textContent = '100%';
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
        const zoomValue = document.getElementById('zoomSlider').value / 100;
        currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomValue})`;
        calculateBoundaries();
    }
}

function calculateBoundaries() {
    if (!currentImage) return;

    const zoomValue = document.getElementById('zoomSlider').value / 100;
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

    const zoomValue = document.getElementById('zoomSlider').value / 100;
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

    cameraButton.addEventListener('click', function() {
        document.getElementById('profilePhotoModal').classList.add('hidden');
        cameraModal.classList.remove('hidden');

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(mediaStream) {
                    stream = mediaStream;
                    cameraFeed.srcObject = mediaStream;
                    cameraFeed.classList.remove('hidden');
                    cameraPlaceholder.classList.add('hidden');
                    cameraFeed.play();
                })
                .catch(function(err) {
                    console.log("Erreur caméra: " + err);
                    cameraFeed.classList.add('hidden');
                    cameraPlaceholder.classList.remove('hidden');
                });
        } else {
            cameraFeed.classList.add('hidden');
            cameraPlaceholder.classList.remove('hidden');
        }
    });

    closeCameraModal.addEventListener('click', function() {
        cameraModal.classList.add('hidden');
        document.getElementById('profilePhotoModal').classList.remove('hidden');
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    });

    takePictureButton.addEventListener('click', function() {
        if (cameraFeed.srcObject) {
            const canvas = document.createElement('canvas');
            canvas.width = cameraFeed.videoWidth;
            canvas.height = cameraFeed.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/png');

            createImagePreview(dataURL);

            cameraModal.classList.add('hidden');
            document.getElementById('profilePhotoModal').classList.remove('hidden');

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
        }
    });
}

// Sauvegarde du profil
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

        // 2. ✅ Sauvegarder la photo en attente si elle existe
        if (pendingPhotoData) {
            console.log('📸 DÉBUT - Sauvegarde de la photo en attente dans la BD...');

            try {
                const response = await ProfilAPI.uploadPhoto(currentProfil.id, pendingPhotoData);
                console.log('📸 SUCCÈS - Photo uploadée');

                // ✅ Attendre pour la synchronisation BD
                console.log('⏱️ Attente de 2 secondes...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                console.log('🔄 Rechargement photo depuis BD...');
                await loadProfilePhoto();

                pendingPhotoData = null;
                console.log('✅ Photo sauvegardée dans la BD');

            } catch (photoError) {
                console.error('❌ ERREUR upload photo:', photoError);
                showNotification('error', 'Erreur lors de la sauvegarde de la photo');
                return;
            }
        }

        updateProfilDisplay();
        updateSidebarInfo();

        showNotification('success', 'Profil mis à jour avec succès !');

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('error', 'Erreur lors de la sauvegarde du profil');
    } finally {
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
    }
}

// Changement de mot de passe
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

        document.getElementById('passwordForm').reset();
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

// Sauvegarde de la photo de profil
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

        ctx.beginPath();
        ctx.arc(cropSize/2, cropSize/2, cropSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const container = document.getElementById('imagePreviewContainer');
        const overlay = document.getElementById('cropOverlay');
        const containerRect = container.getBoundingClientRect();
        const overlayRect = overlay.getBoundingClientRect();
        const imageRect = currentImage.getBoundingClientRect();

        const zoomValue = document.getElementById('zoomSlider').value / 100;

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

        // ✅ APERÇU SEULEMENT : Stocker la photo et l'afficher (pas de sauvegarde BD)
        console.log('👁️ Aperçu de la photo (pas encore sauvegardée)');
        pendingPhotoData = croppedImageData;
        updateProfilPhoto(croppedImageData);

        document.getElementById('profilePhotoModal').classList.add('hidden');

        showNotification('info', 'Aperçu appliqué ! Cliquez sur "Enregistrer les modifications" pour sauvegarder définitivement.');

    } catch (error) {
        console.error('Erreur lors de l\'aperçu de la photo:', error);
        showNotification('error', 'Erreur lors de l\'aperçu de la photo');
    } finally {
        savePhotoBtn.classList.remove('loading');
        savePhotoBtn.disabled = false;
    }
}

// Utilitaires pour le thème
function getSelectedTheme() {
    const selectedTheme = document.querySelector('.theme-option.selected');
    return selectedTheme ? selectedTheme.dataset.theme : 'light';
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Charger sidebar
    try {
        const response = await fetch('/partials/sidebar.html');
        const sidebarHTML = await response.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;
        console.log('✅ Sidebar chargée');
    } catch (error) {
        console.error("Erreur lors du chargement de la sidebar :", error);
    }

    // 2. Récupérer les éléments
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    function toggleSidebar() {
        console.log('🔄 toggleSidebar appelé');
        const isOpen = !sidebar.classList.contains('sidebar-hidden');
        console.log('📍 Sidebar actuellement ouverte:', isOpen);

        if (isOpen) {
            // Fermer
            console.log('🔒 Fermeture de la sidebar...');
            sidebar.classList.add('sidebar-hidden');
            mainContent.classList.remove('ml-64');

            // ✅ FORCE l'affichage du bouton d'ouverture
            openSidebarBtn.classList.remove('hidden');
            openSidebarBtn.style.display = 'flex';

            // ✅ REMETTRE l'event listener après avoir rendu visible
            openSidebarBtn.onclick = function(e) {
                console.log('🖱️ CLICK via onclick sur openSidebarBtn !');
                toggleSidebar();
            };

            closeSidebarBtn.classList.add('hidden');
            console.log('✅ Bouton ouverture forcé visible + event listener remis');
        } else {
            // Ouvrir
            console.log('🔓 Ouverture de la sidebar...');
            sidebar.classList.remove('sidebar-hidden');
            mainContent.classList.add('ml-64');

            // ✅ FORCE le masquage du bouton d'ouverture
            openSidebarBtn.classList.add('hidden');
            openSidebarBtn.style.display = 'none';

            closeSidebarBtn.classList.remove('hidden');
            console.log('✅ Bouton ouverture forcé caché');
        }
    }

    // 3. Event listeners
    openSidebarBtn.addEventListener('click', function(e) {
        console.log('🖱️ CLICK sur openSidebarBtn détecté !');
        toggleSidebar();
    });

    closeSidebarBtn.addEventListener('click', function(e) {
        console.log('🖱️ CLICK sur closeSidebarBtn détecté !');
        toggleSidebar();
    });

    // 4. ✅ État initial corrigé
    sidebar.classList.remove('sidebar-hidden');
    mainContent.classList.add('ml-64');
    // ✅ FORCER le bouton d'ouverture caché au chargement
    openSidebarBtn.classList.add('hidden');
    openSidebarBtn.style.display = 'none';
    closeSidebarBtn.classList.remove('hidden');
    console.log('✅ État initial défini - bouton ouverture caché');

    // 5. Date actuelle
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

    // 6. Le reste
    setupEventListeners();
    await loadProfilData();
});

function setupEventListeners() {
    // Boutons principaux
    document.getElementById('saveButton').addEventListener('click', saveProfil);
    document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
    document.getElementById('cancelButton').addEventListener('click', () => location.reload());

    // Switch double authentification
    document.getElementById('twoFactorSwitch').addEventListener('click', function() {
        this.classList.toggle('checked');
    });

    // Thèmes
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            selectTheme(this.dataset.theme);
        });
    });

    // Photo de profil modal
    document.getElementById('profilePhotoButton').addEventListener('click', function() {
        document.getElementById('profilePhotoModal').classList.remove('hidden');
    });

    document.getElementById('closeProfileModal').addEventListener('click', function() {
        document.getElementById('profilePhotoModal').classList.add('hidden');
    });

    document.getElementById('cancelProfilePhoto').addEventListener('click', function() {
        document.getElementById('profilePhotoModal').classList.add('hidden');
    });

    document.getElementById('saveProfilePhoto').addEventListener('click', saveProfilPhoto);

    // Setup des fonctionnalités d'images
    setupImageHandling();
    setupCamera();
}