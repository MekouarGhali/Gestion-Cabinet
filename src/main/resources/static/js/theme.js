// Theme Management System - Cabinet Médical
class ThemeManager {
    constructor() {
        // Ne pas charger depuis localStorage au démarrage
        this.currentTheme = 'light'; // Valeur temporaire
        this.systemPreference = this.getSystemPreference();
        this.timeInterval = null;
        this.loadThemeFromProfile(); // Nouvelle fonction
    }

    async loadThemeFromProfile() {
        try {
            // Charger le thème depuis la base de données
            const response = await fetch('/api/profil/me');
            if (response.ok) {
                const profil = await response.json();
                const themeFromDB = profil.theme || 'light';
                console.log('🎨 Thème chargé depuis la DB:', themeFromDB);

                this.currentTheme = themeFromDB;
                this.setStoredTheme(themeFromDB); // Synchroniser localStorage
                this.init();
            } else {
                // Fallback sur localStorage si l'API échoue
                this.currentTheme = this.getStoredTheme() || 'light';
                this.init();
            }
        } catch (error) {
            console.error('Erreur chargement thème depuis DB:', error);
            // Fallback sur localStorage
            this.currentTheme = this.getStoredTheme() || 'light';
            this.init();
        }
    }

    async saveThemeToProfile(theme) {
        try {
            // Récupérer l'ID du profil actuel
            const profilResponse = await fetch('/api/profil/me');
            if (profilResponse.ok) {
                const profil = await profilResponse.json();

                // Sauvegarder le thème
                await fetch(`/api/profil/${profil.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...profil,
                        theme: theme
                    })
                });
                console.log('🎨 Thème sauvegardé automatiquement en DB:', theme);
            }
        } catch (error) {
            console.error('Erreur sauvegarde automatique du thème:', error);
        }
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupAutoMode();
        this.setupThemeToggles();
    }

    getStoredTheme() {
        return localStorage.getItem('cabinet-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('cabinet-theme', theme);
    }

    getSystemPreference() {
        // Mode auto basé sur l'heure : jour (6h-18h) = clair, soir/nuit (18h-6h) = sombre
        const currentHour = new Date().getHours();
        return (currentHour >= 6 && currentHour < 18) ? 'light' : 'dark';
    }

    setupAutoMode() {
        // Vérifier l'heure toutes les minutes pour le mode auto
        this.timeInterval = setInterval(() => {
            const newPreference = this.getSystemPreference();
            if (newPreference !== this.systemPreference) {
                this.systemPreference = newPreference;
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                    const timeString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    console.log(`🌅 Changement automatique de thème: ${newPreference} (${timeString})`);

                    // Notification optionnelle
                    if (typeof showNotification === 'function') {
                        const themeLabel = newPreference === 'light' ? 'clair' : 'sombre';
                        const icon = newPreference === 'light' ? '☀️' : '🌙';
                        showNotification('info', `${icon} Passage automatique au thème ${themeLabel}`, 'Thème automatique');
                    }
                }
            }
        }, 60000); // Vérifier toutes les minutes
    }

    setupThemeToggles() {
        // Délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
            document.querySelectorAll('.theme-option').forEach(option => {
                option.addEventListener('click', () => {
                    const theme = option.dataset.theme;
                    this.setTheme(theme);
                });
            });
        }, 100);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        this.applyTheme(theme);
        this.updateThemeUI(theme);

        // Sauvegarder automatiquement en base de données
        this.saveThemeToProfile(theme);

        // Log pour debug
        const timeString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        console.log(`🎨 Thème sélectionné: ${theme} (${timeString})`);
    }

    applyTheme(theme) {
        const html = document.documentElement;

        // Supprimer les classes de thème existantes
        html.classList.remove('theme-light', 'theme-dark');

        let effectiveTheme = theme;

        // Si auto, utiliser la préférence basée sur l'heure
        if (theme === 'auto') {
            effectiveTheme = this.systemPreference;
        }

        // Appliquer la classe de thème
        html.classList.add(`theme-${effectiveTheme}`);

        // Mettre à jour la couleur de la meta theme-color
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.content = effectiveTheme === 'dark' ? '#1f2937' : '#ffffff';
        }

        // Ajouter une classe sur le body pour les animations
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);

        const timeString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        console.log(`🎨 Thème appliqué: ${theme} (effectif: ${effectiveTheme}) - ${timeString}`);
    }

    updateThemeUI(selectedTheme) {
        // Mettre à jour les boutons de sélection de thème
        document.querySelectorAll('.theme-option').forEach(option => {
            const indicator = option.querySelector('.theme-indicator');
            const isSelected = option.dataset.theme === selectedTheme;

            if (isSelected) {
                option.classList.add('selected');
                if (indicator) indicator.classList.remove('hidden');
            } else {
                option.classList.remove('selected');
                if (indicator) indicator.classList.add('hidden');
            }
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getEffectiveTheme() {
        return this.currentTheme === 'auto' ? this.systemPreference : this.currentTheme;
    }

    // Obtenir le statut détaillé pour debug
    getStatus() {
        const currentHour = new Date().getHours();
        const timeString = new Date().toLocaleTimeString('fr-FR');

        return {
            currentTheme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            systemPreference: this.systemPreference,
            currentHour: currentHour,
            currentTime: timeString,
            isDayTime: currentHour >= 6 && currentHour < 18
        };
    }

    // Nettoyer l'intervalle quand nécessaire
    destroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }
}

// Variables CSS pour les thèmes
const themeStyles = `
:root {
    /* Thème Clair */
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-tertiary: #f3f4f6;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;
    /* ✅ BORDURES MISES À JOUR - Plus sombres */
    --border-primary: #d1d5db;   /* Plus sombre que #e5e7eb */
    --border-secondary: #9ca3af; /* Plus sombre que #d1d5db */
    --border-light: #e5e7eb;     /* Nouvelle variable pour bordures très légères */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --primary: #5b67e0;
    --primary-hover: rgba(91, 103, 224, 0.9);
    --primary-light: rgba(91, 103, 224, 0.1);
}

.theme-dark {
    /* Thème Sombre */
    --bg-primary: #1f2937;
    --bg-secondary: #111827;
    --bg-tertiary: #374151;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-tertiary: #9ca3af;
    /* ✅ BORDURES MISES À JOUR - Plus visibles en mode sombre */
    --border-primary: #4b5563;   /* Plus clair que #374151 */
    --border-secondary: #6b7280; /* Plus clair que #4b5563 */
    --border-light: #374151;     /* Bordures légères */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    --primary: #6366f1;
    --primary-hover: rgba(99, 102, 241, 0.9);
    --primary-light: rgba(99, 102, 241, 0.2);
}

/* Transition pour changement de thème */
.theme-transition {
    transition: background-color 0.3s ease, color 0.3s ease !important;
}

.theme-transition * {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}

/* Application des variables CSS */
body {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Containers principaux */
.bg-white {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary);
}

.bg-gray-50 {
    background-color: var(--bg-secondary) !important;
}

.bg-gray-100 {
    background-color: var(--bg-tertiary) !important;
}

/* Textes */
.text-gray-900 {
    color: var(--text-primary) !important;
}

.text-gray-800 {
    color: var(--text-primary) !important;
}

.text-gray-700 {
    color: var(--text-secondary) !important;
}

.text-gray-600 {
    color: var(--text-secondary) !important;
}

.text-gray-500 {
    color: var(--text-tertiary) !important;
}

.text-gray-400 {
    color: var(--text-tertiary) !important;
}

/* ✅ BORDURES MISES À JOUR */
.border-gray-200 {
    border-color: var(--border-primary) !important;
}

.border-gray-300 {
    border-color: var(--border-secondary) !important;
}

.border-gray-100 {
    border-color: var(--border-light) !important;
}

/* ✅ NOUVELLES CLASSES POUR BORDURES SPÉCIFIQUES */
.border-primary {
    border-color: var(--border-primary) !important;
}

.border-secondary {
    border-color: var(--border-secondary) !important;
}

/* ✅ CARTES ET CONTAINERS - Bordures plus visibles */
.divide-gray-200 > :not([hidden]) ~ :not([hidden]) {
    border-color: var(--border-primary) !important;
}

.divide-gray-100 > :not([hidden]) ~ :not([hidden]) {
    border-color: var(--border-primary) !important;
}

/* ✅ TABLES - Bordures plus visibles */
table {
    border-color: var(--border-primary) !important;
}

thead th {
    border-bottom-color: var(--border-secondary) !important;
}

tbody tr {
    border-bottom-color: var(--border-primary) !important;
}

/* Inputs et formulaires */
input, select, textarea {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-secondary) !important; /* ✅ Plus sombre */
}

input:focus, select:focus, textarea:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px var(--primary-light) !important;
}

/* Boutons */
.bg-primary {
    background-color: var(--primary) !important;
}

.bg-primary:hover {
    background-color: var(--primary-hover) !important;
}

.text-primary {
    color: var(--primary) !important;
}

/* ✅ BOUTONS AVEC BORDURES */
button {
    border-color: var(--border-secondary) !important;
}

.btn-outline {
    border-color: var(--border-secondary) !important;
}

/* Sidebar */
aside {
    background-color: var(--bg-primary) !important;
    border-color: var(--border-primary) !important;
}

/* Headers */
header {
    background-color: var(--bg-primary) !important;
    border-color: var(--border-primary) !important;
}

/* ✅ CARDS - Bordures plus visibles */
.rounded-lg, .rounded-md, .card {
    border: 1px solid var(--border-primary) !important;
}

.shadow-sm {
    box-shadow: var(--shadow-sm) !important;
    border: 1px solid var(--border-primary) !important;
}

.shadow-md {
    box-shadow: var(--shadow-md) !important;
    border: 1px solid var(--border-primary) !important;
}

.shadow-lg {
    box-shadow: var(--shadow-lg) !important;
}

.shadow-xl {
    box-shadow: var(--shadow-lg) !important;
}

/* Hover effects */
.hover\\:bg-gray-50:hover {
    background-color: var(--bg-tertiary) !important;
}

.hover\\:bg-gray-100:hover {
    background-color: var(--bg-tertiary) !important;
}

/* ✅ APPLIQUER LE MÊME HOVER AUX BOUTONS BURGER */
.burger-btn:hover {
    background-color: var(--bg-tertiary) !important;
}

#openSidebarBtn:hover,
#closeSidebarBtn:hover {
    background-color: var(--bg-tertiary) !important;
}

/* ✅ PAGE ACTIVE SIDEBAR */
.sidebar-fixed a.active,
aside a.active,
.text-primary.bg-blue-50{
    background-color: var(--primary-light) !important;
    color: var(--primary) !important;
    border-left: 3px solid var(--primary) !important;
}

.theme-dark .sidebar-fixed a.active,
.theme-dark aside a.active,
.theme-dark .text-primary.bg-blue-50 {
    background-color: rgba(99, 102, 241, 0.15) !important;
    color: #818cf8 !important;
}

.sidebar-fixed a.active:hover,
aside a.active:hover {
    background-color: var(--primary-light) !important;
}

.theme-dark .sidebar-fixed a.active:hover,
.theme-dark aside a.active:hover {
    background-color: rgba(99, 102, 241, 0.2) !important;
}

/* ✅ MODALS - Bordures plus visibles */
.modal {
    border: 1px solid var(--border-primary) !important;
}

.bg-black {
    background-color: rgba(0, 0, 0, 0.5) !important;
}

.theme-dark .bg-black {
    background-color: rgba(0, 0, 0, 0.7) !important;
}

/* Notifications */
.notification {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    box-shadow: var(--shadow-lg) !important;
    border: 1px solid var(--border-primary) !important;
}

/* Status badges - garder les couleurs originales */
.status-actif {
    background-color: rgba(16, 185, 129, 0.1) !important;
    color: rgb(16, 185, 129) !important;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
}

.status-inactif {
    background-color: rgba(107, 114, 128, 0.1) !important;
    color: rgb(107, 114, 128) !important;
    border: 1px solid rgba(107, 114, 128, 0.3) !important;
}

.status-nouveau {
    background-color: rgba(245, 158, 11, 0.1) !important;
    color: rgb(245, 158, 11) !important;
    border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

/* Transitions pour tous les éléments */
* {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* Scrollbar pour le thème sombre */
.theme-dark ::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
}

.theme-dark ::-webkit-scrollbar-thumb {
    background: var(--text-tertiary);
}

.theme-dark ::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Images et avatars - ajuster l'opacité en mode sombre */
.theme-dark img {
    opacity: 0.9;
}

.theme-dark .avatar {
    filter: brightness(0.95);
}

/* ✅ DROPDOWN MENUS - Bordures plus visibles */
.dropdown-menu {
    background-color: var(--bg-primary) !important;
    border: 1px solid var(--border-primary) !important;
    box-shadow: var(--shadow-md) !important;
}

.dropdown-item {
    border-bottom: 1px solid var(--border-light) !important;
}

.dropdown-item:hover {
    background-color: var(--bg-tertiary) !important;
}

/* ✅ TAB BUTTONS - Bordures plus visibles */
.tab-button {
    background-color: var(--bg-tertiary) !important;
    color: var(--text-secondary) !important;
    border: 1px solid var(--border-primary) !important;
}

.tab-button.active {
    background-color: var(--primary) !important;
    color: white !important;
    border-color: var(--primary) !important;
}

/* ✅ GRID VIEW CARDS - Bordures plus visibles */
.grid-view-card {
    background-color: var(--bg-primary) !important;
    border: 1px solid var(--border-primary) !important;
}

.grid-view-card:hover {
    border-color: var(--border-secondary) !important;
}

/* ✅ PAGINATION */
.pagination button {
    border: 1px solid var(--border-secondary) !important;
}

/* ✅ SEARCH INPUT */
.search-input {
    border: 1px solid var(--border-secondary) !important;
}

/* ✅ FORM GROUPS */
.form-group {
    border: 1px solid var(--border-primary) !important;
}

/* ✅ SECTIONS ET CONTAINERS */
.section {
    border: 1px solid var(--border-primary) !important;
}

.container {
    border-color: var(--border-primary) !important;
}

/* ✅ SPÉCIFIQUE AUX ÉLÉMENTS AVEC BORDER-GRAY */
.border-gray-50 {
    border-color: var(--border-light) !important;
}

.border-gray-400 {
    border-color: var(--border-secondary) !important;
}

.border-gray-500 {
    border-color: var(--border-secondary) !important;
}

/* ✅ FORCE L'APPLICATION DES BORDURES */
[class*="border-"] {
    border-color: var(--border-primary) !important;
}

/* ✅ OVERRIDE POUR LES BORDURES IMPORTANTES */
.border {
    border: 1px solid var(--border-primary) !important;
}

.border-t {
    border-top: 1px solid var(--border-primary) !important;
}

.border-b {
    border-bottom: 1px solid var(--border-primary) !important;
}

.border-l {
    border-left: 1px solid var(--border-primary) !important;
}

.border-r {
    border-right: 1px solid var(--border-primary) !important;
}
`;

// Injection des styles CSS
function injectThemeStyles() {
    const styleId = 'theme-styles';
    let existingStyle = document.getElementById(styleId);

    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = themeStyles;
    document.head.appendChild(style);
}

// Auto-initialisation du système de thèmes
let themeManager;

// Prévenir le flash de thème en appliquant immédiatement
(function initThemeSystem() {
    // Injecter les styles immédiatement
    injectThemeStyles();

    // Appliquer le thème sauvegardé IMMÉDIATEMENT
    const savedTheme = localStorage.getItem('cabinet-theme') || 'light';
    const currentHour = new Date().getHours();
    const autoTheme = (currentHour >= 6 && currentHour < 18) ? 'light' : 'dark';
    const effectiveTheme = savedTheme === 'auto' ? autoTheme : savedTheme;

    document.documentElement.classList.add(`theme-${effectiveTheme}`);
    console.log('🎨 Thème appliqué immédiatement:', effectiveTheme);

    // Initialiser le gestionnaire de thèmes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            themeManager = new ThemeManager();
            window.themeManager = themeManager;
            console.log('🎨 Système de thèmes initialisé (DOMContentLoaded)');
        });
    } else {
        themeManager = new ThemeManager();
        window.themeManager = themeManager;
        console.log('🎨 Système de thèmes initialisé (immédiat)');
    }
})();

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, injectThemeStyles };
}

