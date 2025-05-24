document.addEventListener('DOMContentLoaded', function() {
    // Load sidebar content
    loadSidebar();

    // Load doctor info
    loadDoctorInfo();

    // Set current date
    updateCurrentDate();
});

async function loadSidebar() {
    try {
        const response = await fetch('/partials/sidebar.html');
        if (!response.ok) throw new Error('Sidebar not found');

        const html = await response.text();
        const sidebarContainer = document.getElementById('sidebar-container') || document.getElementById('sidebar');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = html;
        }

        // Activate current tab
        activateCurrentTab();
        setupSidebarEventListeners();
    } catch (error) {
        console.error('Error loading sidebar:', error);
        renderDefaultSidebar();
    }
}

function renderDefaultSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container') || document.getElementById('sidebar');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = `
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col sidebar-fixed">
            <div class="p-5 border-b border-gray-200">
                <h1 class="text-2xl font-['Pacifico'] text-primary">Cabinet Médical</h1>
            </div>
            <nav class="flex-1 overflow-y-auto py-4">
                <ul>
                    <li class="mb-1">
                        <a href="/patients/page" class="flex items-center px-4 py-3 text-primary bg-blue-50 border-l-4 border-primary">
                            <i class="ri-user-line mr-3"></i>
                            <span>Patients</span>
                        </a>
                    </li>
                    <li class="mb-1">
                        <a href="/profil" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                            <i class="ri-settings-line mr-3"></i>
                            <span>Profil</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="p-4 border-t border-gray-200">
                <div class="flex items-center">
                    <div id="userAvatar" class="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 mr-3">
                        <span class="font-medium">MZ</span>
                    </div>
                    <div>
                        <p id="userName" class="text-sm font-medium">Mekouar Zineb</p>
                        <p id="userProfession" class="text-xs text-gray-500">psychomotricienne</p>
                    </div>
                </div>
            </div>
        </aside>
    `;
}

async function loadDoctorInfo() {
    try {
        // ✅ CORRIGÉ : Utiliser la nouvelle API profil
        const response = await fetch('/api/profil/me');
        if (!response.ok) throw new Error('Profil info not found');

        const profil = await response.json();
        renderDoctorInfo(profil);
    } catch (error) {
        console.error('Error loading doctor info:', error);
        // Use default info if API fails
        renderDoctorInfo({
            initiales: 'MZ',
            prenom: 'Mekouar',
            nom: 'Zineb',
            specialite: 'psychomotricienne'
        });
    }
}

function renderDoctorInfo(profil) {
    console.log('🔄 Mise à jour sidebar avec profil:', profil); // Debug

    // Attendre que la sidebar soit chargée
    setTimeout(() => {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userProfession = document.getElementById('userProfession');

        console.log('📍 Éléments sidebar trouvés:', { userAvatar, userName, userProfession }); // Debug

        if (userAvatar) {
            // ✅ CORRECTION : Charger l'image via l'endpoint si elle existe
            if (profil.id && profil.avatar) {
                loadSidebarAvatar(profil.id, userAvatar);
            } else {
                userAvatar.innerHTML = `<span class="font-medium">${profil.initiales || 'MZ'}</span>`;
            }
        }

        if (userName) {
            const fullName = `${profil.prenom || 'Mekouar'} ${profil.nom || 'Zineb'}`.trim();
            userName.textContent = fullName;
            console.log('✅ Nom mis à jour:', fullName); // Debug
        }

        if (userProfession) {
            userProfession.textContent = profil.specialite || 'psychomotricienne';
            console.log('✅ Spécialité mise à jour:', profil.specialite); // Debug
        }
    }, 100);
}

// ✅ NOUVELLE FONCTION : Charger l'avatar pour la sidebar
async function loadSidebarAvatar(profilId, avatarElement) {
    try {
        const timestamp = new Date().getTime();
        const url = `/api/profil/photo/${profilId}?t=${timestamp}`;

        console.log('🔍 loadSidebarAvatar - URL:', url);
        console.log('🔍 loadSidebarAvatar - profilId:', profilId);

        const response = await fetch(url, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log('🔍 loadSidebarAvatar - Response status:', response.status);
        console.log('🔍 loadSidebarAvatar - Response headers:', [...response.headers.entries()]);

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            console.log('🔍 loadSidebarAvatar - Blob size:', blob.size);
            console.log('🔍 loadSidebarAvatar - Blob type:', blob.type);
            console.log('🔍 loadSidebarAvatar - Generated URL:', imageUrl);

            // ✅ VÉRIFIER : Hash de l'image sidebar
            const arrayBuffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            console.log('🔍 loadSidebarAvatar - Image hash:', hashHex);

            avatarElement.innerHTML = `<img src="${imageUrl}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
            console.log('🔍 loadSidebarAvatar - Avatar updated');
        } else {
            console.log('🔍 loadSidebarAvatar - Pas d\'avatar trouvé');
        }
    } catch (error) {
        console.log('🔍 loadSidebarAvatar - Erreur:', error);
    }
}

function activateCurrentTab() {
    const currentPath = window.location.pathname;

    // Attendre que la sidebar soit chargée
    setTimeout(() => {
        const navLinks = document.querySelectorAll('aside a[href]');

        navLinks.forEach(link => {
            // Retirer les classes actives
            link.classList.remove('text-primary', 'bg-blue-50', 'border-l-4', 'border-primary');
            link.classList.add('text-gray-600', 'hover:bg-gray-50');

            // Vérifier si c'est le lien actuel
            const linkPath = link.getAttribute('href');
            if (currentPath.includes(linkPath) ||
                (linkPath === '/patients/page' && currentPath.includes('/patient')) ||
                (linkPath === '/profil' && currentPath.includes('/profil'))) {

                link.classList.remove('text-gray-600', 'hover:bg-gray-50');
                link.classList.add('text-primary', 'bg-blue-50', 'border-l-4', 'border-primary');
            }
        });
    }, 100);
}

function setupSidebarEventListeners() {
    // Toggle sidebar on mobile
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);

    // Handle documents dropdown
    const documentsDropdown = document.getElementById('documentsDropdown');
    if (documentsDropdown) {
        documentsDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = document.getElementById('documentsSubmenu');
            const icon = document.getElementById('dropdownArrow');

            if (submenu) {
                submenu.classList.toggle('show');
            }

            if (icon) {
                icon.classList.toggle('ri-arrow-down-s-line');
                icon.classList.toggle('ri-arrow-up-s-line');
            }
        });
    }
}

function toggleSidebar() {
    console.log('🔄 toggleSidebar appelé !');
    const isOpen = !sidebar.classList.contains('sidebar-hidden');
    console.log('📍 Sidebar ouverte:', isOpen);

    if (isOpen) {
        console.log('🔒 Fermeture...');
        sidebar.classList.add('sidebar-hidden');
        mainContent.classList.remove('ml-64');

        // ✅ FORCE l'affichage du bouton d'ouverture
        openSidebarBtn.classList.remove('hidden');
        openSidebarBtn.style.display = 'flex';

        closeSidebarBtn.classList.add('hidden');
        console.log('✅ Bouton ouverture forcé visible');
    } else {
        console.log('🔓 Ouverture...');
        sidebar.classList.remove('sidebar-hidden');
        mainContent.classList.add('ml-64');

        // ✅ FORCE le masquage du bouton d'ouverture
        openSidebarBtn.classList.add('hidden');
        openSidebarBtn.style.display = 'none';

        closeSidebarBtn.classList.remove('hidden');
        console.log('✅ Bouton ouverture forcé caché');
    }
}

function updateCurrentDate() {
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// ✅ CORRIGÉ : Fonction globale pour mettre à jour depuis d'autres pages
window.updateSidebarUserInfo = function(profilData) {
    console.log('🔄 Mise à jour sidebar via fonction globale:', profilData);
    renderDoctorInfo(profilData);
};

// ✅ NOUVEAU : Fonction pour forcer le rechargement
window.forceReloadSidebar = function() {
    console.log('🔄 Rechargement forcé de la sidebar');
    loadDoctorInfo();
};