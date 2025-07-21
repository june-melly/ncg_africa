// Dashboard Home Screen - Main dashboard overview and management
export class DashboardHomeScreen {
    constructor(app) {
        this.app = app;
        this.isInitialized = false;
        this.dashboards = [];
        this.filteredDashboards = [];
        this.currentFilters = {
            search: '',
            status: 'all',
            owner: 'all',
            date: 'all',
            sort: 'modified'
        };
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.loadSavedDashboards();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Create dashboard button
        const createBtn = document.getElementById('createDashboardBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (this.app && typeof this.app.createNewDashboard === 'function') {
                    this.app.createNewDashboard();
                }
            });
        }

        // Import dashboard button
        const importBtn = document.getElementById('importDashboardBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportModal();
            });
        }

        // Collapse resources button
        const collapseBtn = document.getElementById('collapseResourcesBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleResourcesSection();
            });
        }

        // Filter controls
        this.setupFilterControls();
    }

    setupFilterControls() {
        const searchInput = document.getElementById('dashboardSearchFilter');
        const statusFilter = document.getElementById('statusFilter');
        const ownerFilter = document.getElementById('ownerFilter');
        const dateFilter = document.getElementById('dateFilter');
        const sortFilter = document.getElementById('sortFilter');
        const showHiddenToggle = document.getElementById('showHiddenToggle');
        const clearFiltersBtn = document.getElementById('clearAllFiltersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (ownerFilter) {
            ownerFilter.addEventListener('change', (e) => {
                this.currentFilters.owner = e.target.value;
                this.applyFilters();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.currentFilters.date = e.target.value;
                this.applyFilters();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.applyFilters();
            });
        }

        if (showHiddenToggle) {
            showHiddenToggle.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    async loadSavedDashboards() {
        try {
            if (this.app && typeof this.app.getSavedDashboards === 'function') {
                this.dashboards = await this.app.getSavedDashboards();
            } else {
                this.dashboards = [];
            }
            
            this.applyFilters();
        } catch (error) {
            console.error('Error loading saved dashboards:', error);
            this.dashboards = [];
            this.renderDashboards();
        }
    }

    applyFilters() {
        let filtered = [...this.dashboards];

        // Search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(dashboard => 
                dashboard.name?.toLowerCase().includes(searchTerm) ||
                dashboard.description?.toLowerCase().includes(searchTerm)
            );
        }

        // Status filter
        if (this.currentFilters.status !== 'all') {
            filtered = filtered.filter(dashboard => {
                const status = dashboard.isPublished ? 'published' : 'draft';
                return status === this.currentFilters.status;
            });
        }

        // Date filter
        if (this.currentFilters.date !== 'all') {
            const now = new Date();
            filtered = filtered.filter(dashboard => {
                const dashboardDate = new Date(dashboard.lastModified || dashboard.createdAt);
                
                switch (this.currentFilters.date) {
                    case 'today':
                        return dashboardDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return dashboardDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return dashboardDate >= monthAgo;
                    case 'quarter':
                        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        return dashboardDate >= quarterAgo;
                    default:
                        return true;
                }
            });
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'created':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                case 'widgets':
                    return (b.widgets?.length || 0) - (a.widgets?.length || 0);
                case 'modified':
                default:
                    return new Date(b.lastModified || b.createdAt || 0) - new Date(a.lastModified || a.createdAt || 0);
            }
        });

        this.filteredDashboards = filtered;
        this.renderDashboards();
        this.updateFilterSummary();
    }

    renderDashboards() {
        const container = document.getElementById('dashboardsList');
        const resultsCount = document.getElementById('resultsCount');

        if (!container) return;

        // Update results count
        if (resultsCount) {
            const total = this.dashboards.length;
            const filtered = this.filteredDashboards.length;
            resultsCount.textContent = filtered === total ? 
                `${total} dashboard${total !== 1 ? 's' : ''}` :
                `${filtered} of ${total} dashboard${total !== 1 ? 's' : ''}`;
        }

        if (this.filteredDashboards.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <i class="fas fa-chart-bar w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 mb-4">No dashboards found</p>
                    <p class="text-sm text-gray-400">Create your first dashboard to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredDashboards.map(dashboard => `
            <div class="dashboard-card bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-medium text-gray-900 mb-2">${dashboard.name || 'Untitled Dashboard'}</h3>
                        <p class="text-sm text-gray-600 mb-3">${dashboard.description || 'No description'}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <span class="flex items-center gap-1">
                                <i class="fas fa-calendar w-3"></i>
                                ${new Date(dashboard.lastModified || dashboard.createdAt).toLocaleDateString()}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-cube w-3"></i>
                                ${dashboard.widgets?.length || 0} widgets
                            </span>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                dashboard.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }">
                                ${dashboard.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="p-2 text-gray-400 hover:text-gray-600 transition-colors" 
                                onclick="window.dashboardApp.loadDashboard('${dashboard.id}')" 
                                title="Edit Dashboard">
                            <i class="fas fa-edit w-4 h-4"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-red-600 transition-colors" 
                                onclick="window.dashboardHomeScreen.deleteDashboard('${dashboard.id}')" 
                                title="Delete Dashboard">
                            <i class="fas fa-trash w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <button class="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                            onclick="window.dashboardApp.loadDashboard('${dashboard.id}')">
                        Open Dashboard →
                    </button>
                    <div class="flex items-center gap-2">
                        <button class="text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Duplicate">
                            <i class="fas fa-copy w-3"></i>
                        </button>
                        <button class="text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Share">
                            <i class="fas fa-share w-3"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateFilterSummary() {
        const filterSummary = document.getElementById('filterSummary');
        const activeFilters = document.getElementById('activeFilters');

        if (!filterSummary || !activeFilters) return;

        const hasActiveFilters = this.currentFilters.search || 
                                this.currentFilters.status !== 'all' ||
                                this.currentFilters.owner !== 'all' ||
                                this.currentFilters.date !== 'all' ||
                                this.currentFilters.sort !== 'modified';

        if (hasActiveFilters) {
            filterSummary.classList.remove('hidden');
            
            const filterTags = [];
            if (this.currentFilters.search) {
                filterTags.push(`<span class="filter-tag">Search: "${this.currentFilters.search}"</span>`);
            }
            if (this.currentFilters.status !== 'all') {
                filterTags.push(`<span class="filter-tag">Status: ${this.currentFilters.status}</span>`);
            }
            if (this.currentFilters.owner !== 'all') {
                filterTags.push(`<span class="filter-tag">Owner: ${this.currentFilters.owner}</span>`);
            }
            if (this.currentFilters.date !== 'all') {
                filterTags.push(`<span class="filter-tag">Date: ${this.currentFilters.date}</span>`);
            }
            if (this.currentFilters.sort !== 'modified') {
                filterTags.push(`<span class="filter-tag">Sort: ${this.currentFilters.sort}</span>`);
            }
            
            activeFilters.innerHTML = filterTags.join('');
        } else {
            filterSummary.classList.add('hidden');
        }
    }

    clearAllFilters() {
        this.currentFilters = {
            search: '',
            status: 'all',
            owner: 'all',
            date: 'all',
            sort: 'modified'
        };

        // Reset form controls
        const searchInput = document.getElementById('dashboardSearchFilter');
        const statusFilter = document.getElementById('statusFilter');
        const ownerFilter = document.getElementById('ownerFilter');
        const dateFilter = document.getElementById('dateFilter');
        const sortFilter = document.getElementById('sortFilter');
        const showHiddenToggle = document.getElementById('showHiddenToggle');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (ownerFilter) ownerFilter.value = 'all';
        if (dateFilter) dateFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'modified';
        if (showHiddenToggle) showHiddenToggle.checked = false;

        this.applyFilters();
    }

    toggleResourcesSection() {
        const resourcesContent = document.getElementById('resourcesContent');
        const collapseIcon = document.querySelector('.collapse-icon');
        const collapseText = document.querySelector('.collapse-text');

        if (resourcesContent && collapseIcon && collapseText) {
            const isCollapsed = resourcesContent.style.display === 'none';
            
            if (isCollapsed) {
                resourcesContent.style.display = 'block';
                collapseIcon.style.transform = 'rotate(0deg)';
                collapseText.textContent = 'Collapse';
            } else {
                resourcesContent.style.display = 'none';
                collapseIcon.style.transform = 'rotate(-90deg)';
                collapseText.textContent = 'Expand';
            }
        }
    }

    showImportModal() {
        if (!window.navigationManager || typeof window.navigationManager.showModal !== 'function') {
            console.warn('NavigationManager not available');
            return;
        }

        const importContent = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Import Dashboard</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id="importFileInput" accept=".json" class="hidden">
                        <i class="fas fa-upload text-gray-400 text-3xl mb-4"></i>
                        <p class="text-gray-600 mb-2">Drop your dashboard JSON file here</p>
                        <p class="text-sm text-gray-500 mb-4">or</p>
                        <button type="button" onclick="document.getElementById('importFileInput').click()" 
                                class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
                            Choose File
                        </button>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    <p>Supported formats: JSON files exported from this dashboard application</p>
                </div>
            </div>
        `;

        window.navigationManager.showModal(
            'Import Dashboard',
            importContent,
            [
                { label: 'Cancel', action: 'cancel' },
                { label: 'Import', action: 'import', primary: true, handler: () => {
                    const fileInput = document.getElementById('importFileInput');
                    if (fileInput && fileInput.files.length > 0) {
                        this.handleImportFile(fileInput.files[0]);
                        return true;
                    } else {
                        if (window.navigationManager) {
                            window.navigationManager.showNotification('Please select a file to import', 'warning');
                        }
                        return false;
                    }
                }}
            ]
        );
    }

    handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dashboardData = JSON.parse(e.target.result);
                
                // Validate dashboard data
                if (!dashboardData.name || !Array.isArray(dashboardData.widgets)) {
                    throw new Error('Invalid dashboard format');
                }

                // Generate new ID and update timestamps
                dashboardData.id = Date.now().toString();
                dashboardData.createdAt = new Date();
                dashboardData.lastModified = new Date();
                dashboardData.name = `${dashboardData.name} (Imported)`;

                // Add to dashboards list
                this.dashboards.unshift(dashboardData);
                
                // Save to storage
                if (this.app && typeof this.app.saveDashboard === 'function') {
                    const originalDashboard = this.app.currentDashboard;
                    this.app.currentDashboard = dashboardData;
                    this.app.saveDashboard();
                    this.app.currentDashboard = originalDashboard;
                }

                this.applyFilters();

                if (window.navigationManager) {
                    window.navigationManager.showNotification('Dashboard imported successfully', 'success');
                }
            } catch (error) {
                console.error('Error importing dashboard:', error);
                if (window.navigationManager) {
                    window.navigationManager.showNotification('Failed to import dashboard. Please check the file format.', 'error');
                }
            }
        };
        reader.readAsText(file);
    }

    async deleteDashboard(dashboardId) {
        if (!window.navigationManager || typeof window.navigationManager.showModal !== 'function') {
            console.warn('NavigationManager not available');
            return;
        }

        const dashboard = this.dashboards.find(d => d.id == dashboardId);
        if (!dashboard) return;

        window.navigationManager.showModal(
            'Delete Dashboard',
            `
                <div class="space-y-4">
                    <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        <div>
                            <h4 class="font-medium text-red-900">Confirm Deletion</h4>
                            <p class="text-sm text-red-700">This action cannot be undone.</p>
                        </div>
                    </div>
                    <p class="text-gray-700">Are you sure you want to delete "<strong>${dashboard.name}</strong>"?</p>
                    <p class="text-sm text-gray-500">This dashboard contains ${dashboard.widgets?.length || 0} widget(s).</p>
                </div>
            `,
            [
                { label: 'Cancel', action: 'cancel' },
                { label: 'Delete Dashboard', action: 'delete', primary: true, handler: async () => {
                    try {
                        if (this.app && typeof this.app.deleteDashboard === 'function') {
                            await this.app.deleteDashboard(dashboardId);
                        }
                        return true;
                    } catch (error) {
                        console.error('Error deleting dashboard:', error);
                        if (window.navigationManager) {
                            window.navigationManager.showNotification('Failed to delete dashboard', 'error');
                        }
                        return false;
                    }
                }}
            ]
        );
    }

    show() {
        const screen = document.getElementById('dashboardScreen');
        if (screen) {
            screen.classList.remove('hidden');
        }

        // Initialize if not already done
        this.init();

        // Load fresh data when showing
        this.loadSavedDashboards();
    }

    hide() {
        const screen = document.getElementById('dashboardScreen');
        if (screen) {
            screen.classList.add('hidden');
        }
    }

    cleanup() {
        this.isInitialized = false;
        // Clean up any event listeners or resources if needed
    }
}