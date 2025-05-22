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
        document.getElementById('sidebar').innerHTML = html;

        // Activate current tab
        activateCurrentTab();
        setupSidebarEventListeners();
    } catch (error) {
        console.error('Error loading sidebar:', error);
        renderDefaultSidebar();
    }
}

function renderDefaultSidebar() {
    document.getElementById('sidebar').innerHTML = `
        <div class="p-5 border-b border-gray-200">
            <h1 class="text-2xl font-pacifico text-blue-600">Cabinet Médical</h1>
        </div>
        <nav class="flex-1 overflow-y-auto py-4">
            <ul>
                <li class="mb-1">
                    <a href="/patient.html" class="flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-l-4 border-blue-600">
                        <i class="ri-user-line mr-3"></i>
                        <span>Patients</span>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="p-4 border-t border-gray-200">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 mr-3">
                    <span class="font-medium">MZ</span>
                </div>
                <div>
                    <p class="text-sm font-medium">Mekouar Zineb</p>
                    <p class="text-xs text-gray-500">psychomotricienne</p>
                </div>
            </div>
        </div>
    `;
}

async function loadDoctorInfo() {
    try {
        const response = await fetch('/api/utilisateur/me');
        if (!response.ok) throw new Error('User info not found');

        const user = await response.json();
        renderDoctorInfo(user);
    } catch (error) {
        console.error('Error loading doctor info:', error);
        // Use default info if API fails
        renderDoctorInfo({
            initials: 'MZ',
            nom: 'Mekouar Zineb',
            profession: 'psychomotricienne'
        });
    }
}

function renderDoctorInfo(user) {
    const doctorInfoContainer = document.querySelector('#sidebar > div:last-child') || document.createElement('div');
    doctorInfoContainer.className = 'p-4 border-t border-gray-200';
    doctorInfoContainer.innerHTML = `
        <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 mr-3">
                <span class="font-medium">${user.initials || 'MZ'}</span>
            </div>
            <div>
                <p class="text-sm font-medium">${user.nom || 'Mekouar Zineb'}</p>
                <p class="text-xs text-gray-500">${user.profession || 'psychomotricienne'}</p>
            </div>
        </div>
    `;

    if (!document.querySelector('#sidebar > div:last-child')) {
        document.getElementById('sidebar').appendChild(doctorInfoContainer);
    }
}

function activateCurrentTab() {
    const currentPath = window.location.pathname.split('/').pop() || 'patient.html';
    const tabMap = {
        'patient.html': 'patients',
        'rendezvous.html': 'appointments',
        'dashboard.html': 'dashboard'
    };

    const activeTab = tabMap[currentPath] || 'patients';

    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === activeTab) {
            link.classList.add('active');
        }
    });
}

function setupSidebarEventListeners() {
    // Toggle sidebar on mobile
    document.getElementById('openSidebarBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebarBtn')?.addEventListener('click', toggleSidebar);

    // Handle documents dropdown
    const documentsDropdown = document.getElementById('documentsDropdown');
    if (documentsDropdown) {
        documentsDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = document.getElementById('documentsSubmenu');
            const icon = this.querySelector('i:last-child');

            submenu.classList.toggle('hidden');
            icon.classList.toggle('ri-arrow-down-s-line');
            icon.classList.toggle('ri-arrow-up-s-line');
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('ml-0');
    mainContent.classList.toggle('ml-64');
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
}document.addEventListener('DOMContentLoaded', function() {
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
        document.getElementById('sidebar').innerHTML = html;

        // Activate current tab
        activateCurrentTab();
        setupSidebarEventListeners();
    } catch (error) {
        console.error('Error loading sidebar:', error);
        renderDefaultSidebar();
    }
}

function renderDefaultSidebar() {
    document.getElementById('sidebar').innerHTML = `
        <div class="p-5 border-b border-gray-200">
            <h1 class="text-2xl font-pacifico text-blue-600">Cabinet Médical</h1>
        </div>
        <nav class="flex-1 overflow-y-auto py-4">
            <ul>
                <li class="mb-1">
                    <a href="/patient.html" class="flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-l-4 border-blue-600">
                        <i class="ri-user-line mr-3"></i>
                        <span>Patients</span>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="p-4 border-t border-gray-200">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 mr-3">
                    <span class="font-medium">MZ</span>
                </div>
                <div>
                    <p class="text-sm font-medium">Mekouar Zineb</p>
                    <p class="text-xs text-gray-500">psychomotricienne</p>
                </div>
            </div>
        </div>
    `;
}

async function loadDoctorInfo() {
    try {
        const response = await fetch('/api/utilisateur/me');
        if (!response.ok) throw new Error('User info not found');

        const user = await response.json();
        renderDoctorInfo(user);
    } catch (error) {
        console.error('Error loading doctor info:', error);
        // Use default info if API fails
        renderDoctorInfo({
            initials: 'MZ',
            nom: 'Mekouar Zineb',
            profession: 'psychomotricienne'
        });
    }
}

function renderDoctorInfo(user) {
    const doctorInfoContainer = document.querySelector('#sidebar > div:last-child') || document.createElement('div');
    doctorInfoContainer.className = 'p-4 border-t border-gray-200';
    doctorInfoContainer.innerHTML = `
        <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 mr-3">
                <span class="font-medium">${user.initials || 'MZ'}</span>
            </div>
            <div>
                <p class="text-sm font-medium">${user.nom || 'Mekouar Zineb'}</p>
                <p class="text-xs text-gray-500">${user.profession || 'psychomotricienne'}</p>
            </div>
        </div>
    `;

    if (!document.querySelector('#sidebar > div:last-child')) {
        document.getElementById('sidebar').appendChild(doctorInfoContainer);
    }
}

function activateCurrentTab() {
    const currentPath = window.location.pathname.split('/').pop() || 'patient.html';
    const tabMap = {
        'patient.html': 'patients',
        'rendezvous.html': 'appointments',
        'dashboard.html': 'dashboard'
    };

    const activeTab = tabMap[currentPath] || 'patients';

    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === activeTab) {
            link.classList.add('active');
        }
    });
}

function setupSidebarEventListeners() {
    // Toggle sidebar on mobile
    document.getElementById('openSidebarBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebarBtn')?.addEventListener('click', toggleSidebar);

    // Handle documents dropdown
    const documentsDropdown = document.getElementById('documentsDropdown');
    if (documentsDropdown) {
        documentsDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = document.getElementById('documentsSubmenu');
            const icon = this.querySelector('i:last-child');

            submenu.classList.toggle('hidden');
            icon.classList.toggle('ri-arrow-down-s-line');
            icon.classList.toggle('ri-arrow-up-s-line');
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('ml-0');
    mainContent.classList.toggle('ml-64');
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