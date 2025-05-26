document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation du sidebar...');

    // Charger le contenu de la sidebar
    loadSidebar();

    // Charger les informations du docteur
    loadDoctorInfo();

    // Définir la date actuelle
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
            console.log('✅ Sidebar HTML injectée');
        }

        // Activer l'onglet current et configurer les event listeners
        activateCurrentTab();
        setupSidebarEventListeners();

    } catch (error) {
        console.error('❌ Erreur lors du chargement de la sidebar:', error);
        renderDefaultSidebar();
    }
}

function renderDefaultSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container') || document.getElementById('sidebar');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = `
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col sidebar-fixed">
            <div class="p-5 border-b border-gray-200 flex justify-between items-center">
                <h1 class="text-2xl font-['Pacifico'] text-primary">Cabinet Médical</h1>
                <button id="closeSidebarBtn" class="burger-btn text-gray-600">
                    <i class="ri-close-line text-xl"></i>
                </button>
            </div>
            <nav class="flex-1 overflow-y-auto py-4">
                <ul>
                    <li class="mb-1">
                        <a href="/menu" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                            <div class="w-6 h-6 flex items-center justify-center mr-3 text-gray-500">
                                <i class="ri-dashboard-line"></i>
                            </div>
                            <span>Tableau de Bord</span>
                        </a>
                    </li>
                    <li class="mb-1">
                        <a href="/patients/page" class="flex items-center px-4 py-3 text-primary bg-blue-50 border-l-4 border-primary">
                            <div class="w-6 h-6 flex items-center justify-center mr-3 text-gray-500">
                                <i class="ri-user-line"></i>
                            </div>
                            <span>Patients</span>
                        </a>
                    </li>
                    <li class="mb-1">
                        <a href="/rendezvous.html" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                            <div class="w-6 h-6 flex items-center justify-center mr-3 text-gray-500">
                                <i class="ri-calendar-2-line"></i>
                            </div>
                            <span>Rendez-Vous</span>
                        </a>
                    </li>
                    <li class="mb-1">
                        <a href="/profil" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                            <div class="w-6 h-6 flex items-center justify-center mr-3 text-gray-500">
                                <i class="ri-settings-line"></i>
                            </div>
                            <span>Profil</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div id="userInfo" class="p-4 border-t border-gray-200 hover:bg-gray-50 cursor-pointer">
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

    console.log('✅ Sidebar par défaut rendue');
}

async function loadDoctorInfo() {
    try {
        const response = await fetch('/api/profil/me');
        if (!response.ok) throw new Error('Profil info not found');

        const profil = await response.json();
        renderDoctorInfo(profil);

    } catch (error) {
        console.error('⚠️ Erreur lors du chargement du profil:', error);
        // Utiliser les informations par défaut en cas d'échec
        renderDoctorInfo({
            initiales: 'MZ',
            prenom: 'Mekouar',
            nom: 'Zineb',
            specialite: 'psychomotricienne'
        });
    }
}

function renderDoctorInfo(profil) {
    console.log('🔄 Mise à jour sidebar avec profil:', profil);

    // Attendre que la sidebar soit chargée
    setTimeout(() => {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userProfession = document.getElementById('userProfession');

        if (userAvatar) {
            // Charger l'image avatar si elle existe
            if (profil.id && profil.avatar) {
                loadSidebarAvatar(profil.id, userAvatar);
            } else {
                const initiales = profil.initiales || 'MZ';
                userAvatar.innerHTML = `<span class="font-medium">${initiales}</span>`;
            }
        }

        if (userName) {
            const fullName = `${profil.prenom || 'Mekouar'} ${profil.nom || 'Zineb'}`.trim();
            userName.textContent = fullName;
            console.log('✅ Nom mis à jour:', fullName);
        }

        if (userProfession) {
            const specialite = profil.specialite || 'psychomotricienne';
            userProfession.textContent = specialite;
            console.log('✅ Spécialité mise à jour:', specialite);
        }

        // Configurer le clic sur les informations utilisateur
        setupUserInfoClickHandler();

    }, 100);
}

async function loadSidebarAvatar(profilId, avatarElement) {
    try {
        const timestamp = new Date().getTime();
        const url = `/api/profil/photo/${profilId}?t=${timestamp}`;

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

            avatarElement.innerHTML = `<img src="${imageUrl}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
            console.log('✅ Avatar chargé depuis l\'API');
        } else {
            console.log('ℹ️ Aucun avatar trouvé dans l\'API');
        }
    } catch (error) {
        console.log('⚠️ Erreur lors du chargement de l\'avatar:', error);
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
            const isCurrentPage = currentPath.includes(linkPath) ||
                (linkPath === '/patients/page' && currentPath.includes('/patient')) ||
                (linkPath === '/profil' && currentPath.includes('/profil')) ||
                (linkPath === '/menu' && (currentPath === '/' || currentPath.includes('/menu')));

            if (isCurrentPage) {
                link.classList.remove('text-gray-600', 'hover:bg-gray-50');
                link.classList.add('text-primary', 'bg-blue-50', 'border-l-4', 'border-primary');
            }
        });

        console.log('✅ Onglet actif configuré pour:', currentPath);
    }, 100);
}

function setupSidebarEventListeners() {
    // Attendre que les éléments soient disponibles
    setTimeout(() => {
        // Toggle sidebar pour mobile
        const openSidebarBtn = document.getElementById('openSidebarBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');

        if (openSidebarBtn) {
            openSidebarBtn.addEventListener('click', toggleSidebar);
            console.log('✅ Event listener openSidebarBtn configuré');
        }

        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', toggleSidebar);
            console.log('✅ Event listener closeSidebarBtn configuré');
        }

        // Gérer le dropdown documents
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
            console.log('✅ Dropdown documents configuré');
        }
    }, 150);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (!sidebar || !mainContent) {
        console.log('⚠️ Éléments sidebar ou mainContent non trouvés');
        return;
    }

    const isOpen = !sidebar.classList.contains('sidebar-hidden');
    console.log('🔄 Toggle sidebar - État actuel:', isOpen ? 'ouvert' : 'fermé');

    if (isOpen) {
        // Fermer la sidebar
        sidebar.classList.add('sidebar-hidden');
        mainContent.classList.remove('ml-64');

        if (openSidebarBtn) {
            openSidebarBtn.classList.remove('hidden');
            openSidebarBtn.style.display = 'flex';
        }

        if (closeSidebarBtn) {
            closeSidebarBtn.classList.add('hidden');
        }

        console.log('🔒 Sidebar fermée');
    } else {
        // Ouvrir la sidebar
        sidebar.classList.remove('sidebar-hidden');
        mainContent.classList.add('ml-64');

        if (openSidebarBtn) {
            openSidebarBtn.classList.add('hidden');
            openSidebarBtn.style.display = 'none';
        }

        if (closeSidebarBtn) {
            closeSidebarBtn.classList.remove('hidden');
        }

        console.log('🔓 Sidebar ouverte');
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
        console.log('✅ Date actuelle mise à jour');
    }
}

function setupUserInfoClickHandler() {
    const userInfo = document.getElementById('userInfo');

    if (userInfo) {
        // Supprimer l'ancien event listener s'il existe
        userInfo.onclick = null;

        // Ajouter le nouvel event listener
        userInfo.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👤 Clic sur User Info - Redirection vers profil');

            // Redirection vers la page profil
            window.location.href = '/profil.html';
        });

        console.log('✅ Event listener User Info configuré');
    }
}

// Fonctions globales pour mise à jour depuis d'autres pages
window.updateSidebarUserInfo = function(profilData) {
    console.log('🔄 Mise à jour sidebar via fonction globale:', profilData);
    renderDoctorInfo(profilData);
};

window.forceReloadSidebar = function() {
    console.log('🔄 Rechargement forcé de la sidebar');
    loadDoctorInfo();
};