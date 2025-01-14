// Updated sidebar.js
class SidebarMenu {
    constructor() {
        this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.isMobileVisible = false;
        this.currentTab = localStorage.getItem('currentTab') || 'prototype';
        this.initializeSidebar();
    }

    initializeSidebar() {
        // Create and append sidebar HTML
        const sidebarHTML = `
            <button class="mobile-toggle">
                <span>☰</span>
            </button>
            <div class="sidebar ${this.isCollapsed ? 'collapsed' : ''}">
                <div class="sidebar-header">
                    <img src="assets/logo.png" alt="VirtuBeauty" class="sidebar-logo">
                    <span class="sidebar-title">VirtuBeauty</span>                
                </div>
                <div class="sidebar-search">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="Search All Agents...">
                    </div>
                </div>
                <nav class="sidebar-nav">
                    <div class="nav-item" data-tab="prototype" data-title="Prototype">
                        <span class="nav-icon">🤖</span>
                        <span class="nav-text">Prototype</span>
                    </div>
                    <div class="nav-item" data-tab="latest" data-title="Latest">
                        <span class="nav-icon">🆕</span>
                        <span class="nav-text">Latest</span>
                    </div>
                    <div class="nav-item" data-tab="sentient" data-title="Sentient">
                        <span class="nav-icon">🧠</span>
                        <span class="nav-text">Sentient</span>
                    </div>
                    <div class="nav-item" data-tab="favorites" data-title="Favorites">
                        <span class="nav-icon">⭐</span>
                        <span class="nav-text">Favorites</span>
                        <span class="tab-count" id="favoritesCount">0</span>
                    </div>
                   <div class="external-links-section">
                    <a href="https://virtubeauty.gitbook.io/virtubeauty-whitepaper" target="_blank" class="nav-item-external" data-title="External Link">
                        <span class="nav-icon">🔗</span>
                        <span class="nav-text">Whitepaper</span>
                    </a>
                </div>
                </a>
                </nav>
            </div>
            <div class="sidebar-overlay"></div>
        `;

        // Insert sidebar into DOM
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

        // Wrap main content
        const mainContent = document.getElementById('content');
        mainContent.classList.add('main-content');
        if (this.isCollapsed) {
            mainContent.classList.add('expanded');
        }

        // Setup event listeners
        this.setupEventListeners();

        // Set initial active tab
        this.setActiveTab(this.currentTab);
    }

    setupEventListeners() {
        const sidebar = document.querySelector('.sidebar');
       // const toggleBtn = document.querySelector('.sidebar-toggle');
        const mobileToggle = document.querySelector('.mobile-toggle');
        const overlay = document.querySelector('.sidebar-overlay');
        const navItems = document.querySelectorAll('.nav-item');
        const searchInput = document.querySelector('.sidebar-search .search-input');

        //// Sidebar toggle
        //toggleBtn.addEventListener('click', () => {
        //    this.toggleSidebar();
        //});

        // Mobile toggle
        mobileToggle.addEventListener('click', () => {
            this.toggleMobileSidebar();
        });

        // Overlay click
        overlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        // Tab navigation
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.handleTabChange(tab);
                this.closeMobileSidebar();
                clearSearch();
            });
        });

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileSidebar();
            }
        });

        // Update counts when they change
        window.addEventListener('tabCountsUpdated', (e) => {
            this.updateTabCounts(e.detail);
        });
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const toggleIcon = document.querySelector('.toggle-icon');

        this.isCollapsed = !this.isCollapsed;
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');

        // Update toggle button icon
        toggleIcon.textContent = this.isCollapsed ? '>>' : '<<';

        localStorage.setItem('sidebarCollapsed', this.isCollapsed);
    }

    toggleMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        this.isMobileVisible = !this.isMobileVisible;
        sidebar.classList.toggle('mobile-visible');
        overlay.classList.toggle('active');

        // Prevent body scroll when sidebar is open
        document.body.style.overflow = this.isMobileVisible ? 'hidden' : '';
    }

    closeMobileSidebar() {
        if (!this.isMobileVisible) return;

        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        this.isMobileVisible = false;
        sidebar.classList.remove('mobile-visible');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleTabChange(tab) {
        if (tab === this.currentTab) return;

        this.setActiveTab(tab);
        this.currentTab = tab;
        localStorage.setItem('currentTab', tab);

        // Trigger existing tab change functionality
        if (typeof window.switchTab === 'function') {
            window.switchTab(tab);
        }
    }

    setActiveTab(tab) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
    }

    updateTabCounts(counts) {
        Object.entries(counts).forEach(([tab, count]) => {
            const countElement = document.getElementById(`${tab}Count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sidebarMenu = new SidebarMenu();
});