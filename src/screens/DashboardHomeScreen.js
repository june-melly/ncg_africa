// Dashboard Home Screen - Landing page with templates and recent dashboards
export class DashboardHomeScreen {
    constructor(app) {
        this.app = app;
        this.resourcesCollapsed = false;
        this.templates = [
            {
                id: 'customer',
                name: 'Customer Template',
                color: 'red',
                description: 'Customer analytics and insights'
            },
            {
                id: 'support',
                name: 'Support Template',
                color: 'green',
                description: 'Support ticket tracking'
            },
            {
                id: 'more',
                name: 'View More Templates',
                color: 'gray',
                description: 'Browse additional templates'
            }
        ];
        this.savedDashboards = [];
        this.filteredDashboards = [];
        this.hiddenDashboards = new Set(); // Track hidden dashboards
        this.favoriteDashboards = new Set(); // Track favorite dashboards
        this.currentView = 'list'; // 'list' or 'grid'
        this.filters = {
            search: '',
            status: 'all',
            owner: 'all',
            date: 'all',
            sort: 'modified',
            showHidden: false
        };
    }
    
    init() {
        this.setupEventListeners();
        this.renderTemplates();
        this.loadSavedDashboards();
        this.loadUserPreferences();
        this.setupFilterListeners();
    }
    
    setupEventListeners() {
        // Create dashboard button
        const createDashboardBtn = document.getElementById('createDashboardBtn');
        if (createDashboardBtn) {
            createDashboardBtn.addEventListener('click', () => {
                this.app.createNewDashboard();
            });
        }
        
        // Import dashboard button
        const importDashboardBtn = document.getElementById('importDashboardBtn');
        if (importDashboardBtn) {
            importDashboardBtn.addEventListener('click', () => {
                this.showImportDashboard();
            });
        }
        
        // Hidden file input for import
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                this.handleFileImport(e);
            });
        }
        
        // Collapse resources functionality
        const collapseResourcesBtn = document.getElementById('collapseResourcesBtn');
        if (collapseResourcesBtn) {
            collapseResourcesBtn.addEventListener('click', () => {
                this.toggleResourcesCollapse();
            });
        }
        
        // Template selection
        this.setupTemplateListeners();
        
        // Global click handler to close menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dashboard-menu')) {
                this.closeAllMenus();
            }
        });
    }
    
    setupFilterListeners() {
        // Search filter
        const searchFilter = document.getElementById('dashboardSearchFilter');
        if (searchFilter) {
            searchFilter.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }
        
        // Owner filter
        const ownerFilter = document.getElementById('ownerFilter');
        if (ownerFilter) {
            ownerFilter.addEventListener('change', (e) => {
                this.filters.owner = e.target.value;
                this.applyFilters();
            });
        }
        
        // Date filter
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
                this.applyFilters();
            });
        }
        
        // Sort filter
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }
        
        // Toggle hidden dashboards switch
        const showHiddenToggle = document.getElementById('showHiddenToggle');
        if (showHiddenToggle) {
            showHiddenToggle.addEventListener('change', (e) => {
                this.filters.showHidden = e.target.checked;
                this.applyFilters();
            });
        }
        
        // Clear all filters button (now in filter summary)
        const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
        if (clearAllFiltersBtn) {
            clearAllFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }
    
    setView(viewType) {
        this.currentView = viewType;
        
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (viewType === 'list' && listViewBtn) {
            listViewBtn.classList.add('bg-teal-50', 'text-teal-700');
            listViewBtn.classList.remove('text-gray-600');
        } else if (listViewBtn) {
            listViewBtn.classList.remove('bg-teal-50', 'text-teal-700');
            listViewBtn.classList.add('text-gray-600');
        }
        
        this.renderFilteredDashboards();
    }
    
    clearFilters() {
        this.filters = {
            search: '',
            status: 'all',
            owner: 'all',
            date: 'all',
            sort: 'modified',
            showHidden: false
        };
        
        // Reset form elements
        const searchFilter = document.getElementById('dashboardSearchFilter');
        const statusFilter = document.getElementById('statusFilter');
        const ownerFilter = document.getElementById('ownerFilter');
        const dateFilter = document.getElementById('dateFilter');
        const sortFilter = document.getElementById('sortFilter');
        const showHiddenToggle = document.getElementById('showHiddenToggle');
        
        if (searchFilter) searchFilter.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (ownerFilter) ownerFilter.value = 'all';
        if (dateFilter) dateFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'modified';
        if (showHiddenToggle) showHiddenToggle.checked = false;
        
        this.applyFilters();
    }
    
    applyFilters() {
        let filtered = [...this.savedDashboards];
        
        // Filter out hidden dashboards unless showHidden is true
        if (!this.filters.showHidden) {
            filtered = filtered.filter(dashboard => 
                !this.hiddenDashboards.has(dashboard.id)
            );
        }
        
        // Apply search filter
        if (this.filters.search) {
            filtered = filtered.filter(dashboard =>
                dashboard.name.toLowerCase().includes(this.filters.search) ||
                (dashboard.description && dashboard.description.toLowerCase().includes(this.filters.search)) ||
                (dashboard.owner && dashboard.owner.toLowerCase().includes(this.filters.search))
            );
        }
        
        // Apply status filter
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(dashboard => {
                if (this.filters.status === 'published') {
                    return dashboard.isPublished === true;
                } else if (this.filters.status === 'draft') {
                    return dashboard.isPublished !== true;
                }
                return true;
            });
        }
        
        // Apply owner filter
        if (this.filters.owner !== 'all') {
            filtered = filtered.filter(dashboard => {
                const owner = dashboard.owner || 'You';
                if (this.filters.owner === 'you') {
                    return owner === 'You';
                } else if (this.filters.owner === 'shared') {
                    return owner !== 'You';
                }
                return true;
            });
        }
        
        // Apply date filter
        if (this.filters.date !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(dashboard => {
                const dashboardDate = new Date(dashboard.lastModified || dashboard.createdAt);
                
                switch (this.filters.date) {
                    case 'today':
                        return dashboardDate >= today;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return dashboardDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                        return dashboardDate >= monthAgo;
                    case 'quarter':
                        const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                        return dashboardDate >= quarterAgo;
                    default:
                        return true;
                }
            });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            // Always prioritize favorites first
            const aIsFavorite = this.favoriteDashboards.has(a.id);
            const bIsFavorite = this.favoriteDashboards.has(b.id);
            
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // Then apply the selected sort
            switch (this.filters.sort) {
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'widgets':
                    const aWidgets = a.widgets ? a.widgets.length : 0;
                    const bWidgets = b.widgets ? b.widgets.length : 0;
                    return bWidgets - aWidgets;
                case 'modified':
                default:
                    return new Date(b.lastModified || b.createdAt) - new Date(a.lastModified || a.createdAt);
            }
        });
        
        this.filteredDashboards = filtered;
        this.updateFilterSummary();
        this.updateResultsCount();
        this.renderFilteredDashboards();
    }

    updateFilterSummary() {
        const filterSummary = document.getElementById('filterSummary');
        const activeFilters = document.getElementById('activeFilters');
        
        if (!filterSummary || !activeFilters) return;
        
        const activeFiltersList = [];
        
        if (this.filters.search) {
            activeFiltersList.push(`Search: "${this.filters.search}"`);
        }
        if (this.filters.status !== 'all') {
            activeFiltersList.push(`Status: ${this.filters.status}`);
        }
        if (this.filters.owner !== 'all') {
            activeFiltersList.push(`Owner: ${this.filters.owner}`);
        }
        if (this.filters.date !== 'all') {
            activeFiltersList.push(`Date: ${this.filters.date}`);
        }
        if (this.filters.sort !== 'modified') {
            activeFiltersList.push(`Sort: ${this.filters.sort}`);
        }
        
        if (activeFiltersList.length > 0) {
            filterSummary.classList.remove('hidden');
            activeFilters.innerHTML = activeFiltersList.map(filter => 
                `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${filter}</span>`
            ).join('');
        } else {
            filterSummary.classList.add('hidden');
        }
    }
    
    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (!resultsCount) return;
        
        const total = this.savedDashboards.length;
        const filtered = this.filteredDashboards.length;
        
        if (filtered === total) {
            resultsCount.textContent = `Showing ${total} dashboard${total !== 1 ? 's' : ''}`;
        } else {
            resultsCount.textContent = `Showing ${filtered} of ${total} dashboard${total !== 1 ? 's' : ''}`;
        }
    }
    
    renderFilteredDashboards() {
        const container = document.getElementById('dashboardsList');
        if (!container) return;
        
        if (this.filteredDashboards.length === 0) {
            const showHiddenText = this.filters.showHidden ? ' (including hidden)' : '';
            container.innerHTML = `
                <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                    <div class="text-center py-12">
                        <p class="text-gray-500 mb-4">No dashboards found matching criteria${showHiddenText}</p>
                    </div>
                </div>
            `;
        } else {
            // Force list view
            this.currentView = 'list';
            container.className = 'space-y-4';
            container.innerHTML = this.filteredDashboards.map(dashboard => this.createSavedDashboardCard(dashboard)).join('');
            
            // Add event listeners for dashboard actions
            this.setupDashboardCardListeners();
        }
    }

    createGridDashboardCard(dashboard) {
        const lastModified = new Date(dashboard.lastModified || dashboard.createdAt).toLocaleDateString();
        const widgetCount = dashboard.widgets ? dashboard.widgets.length : 0;
        const isFavorite = this.favoriteDashboards.has(dashboard.id);
        const owner = dashboard.owner || 'You';
        
        return `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow dashboard-card" 
                 data-dashboard-id="${dashboard.id}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-2">
                        ${isFavorite ? '<i class="fas fa-star text-yellow-500 text-sm"></i>' : ''}
                        ${dashboard.isPublished ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>' : '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Draft</span>'}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <!-- Favorite Star -->
                        <button class="favorite-btn p-1 text-gray-400 hover:text-yellow-500 rounded transition-colors" 
                                data-dashboard-id="${dashboard.id}" 
                                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-star w-4 h-4 ${isFavorite ? 'text-yellow-500' : ''}"></i>
                        </button>
                        
                        <!-- Three Dots Menu -->
                        <div class="relative dashboard-menu">
                            <button class="menu-trigger p-1 text-gray-400 hover:text-gray-600 rounded transition-colors" 
                                    data-dashboard-id="${dashboard.id}" 
                                    title="More actions">
                                <i class="fas fa-ellipsis-v w-4 h-4"></i>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div class="menu-dropdown hidden absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div class="py-1">
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="edit" data-dashboard-id="${dashboard.id}">
                                        <i class="fas fa-edit w-4 h-4 text-blue-500"></i>
                                        Edit Dashboard
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="configure" data-dashboard-id="${dashboard.id}">
                                        <i class="fas fa-cog w-4 h-4 text-gray-500"></i>
                                        Configure
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="clone" data-dashboard-id="${dashboard.id}">
                                        <i class="fas fa-copy w-4 h-4 text-green-500"></i>
                                        Clone Dashboard
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="export" data-dashboard-id="${dashboard.id}">
                                        <i class="fas fa-download w-4 h-4 text-purple-500"></i>
                                        Export Dashboard
                                    </button>
                                    
                                    <hr class="my-1 border-gray-200">
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="hide" data-dashboard-id="${dashboard.id}">
                                        <i class="fas fa-eye-slash w-4 h-4 text-orange-500"></i>
                                        Hide Dashboard
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors" 
                                            data-action="delete" data-dashboard-id="${dashboard.id}">
                                        <i class="fas fa-trash w-4 h-4 text-red-500"></i>
                                        Delete Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="cursor-pointer" onclick="window.dashboardApp.loadDashboard('${dashboard.id}')">
                    <h3 class="font-medium text-gray-900 mb-2">${dashboard.name}</h3>
                    <p class="text-sm text-gray-500 mb-4 line-clamp-2">${dashboard.description || 'No description'}</p>
                    
                    <div class="flex items-center justify-between text-xs text-gray-400">
                        <span>${widgetCount} widget${widgetCount !== 1 ? 's' : ''}</span>
                        <span>${lastModified}</span>
                    </div>
                    
                    <div class="flex items-center gap-1 mt-2">
                        <i class="fas fa-user w-3 h-3"></i>
                        <span class="text-xs text-gray-500">${owner}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    showImportDashboard() {
        console.log("Opening file import dialog...");
        const fileInput = document.getElementById('importFileInput');
        if (fileInput) {
            // Reset the input
            fileInput.value = '';
            fileInput.click();
            console.log(" File dialog opened");
        } else {
            console.error("Import file input element not found");
            if (window.navigationManager) {
                window.navigationManager.showNotification('Import functionality not available', 'error');
            }
        }
    }
    
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Reset the file input
        event.target.value = '';
        
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            // Validate the import data structure
            if (!this.validateImportData(importData)) {
                if (window.navigationManager) {
                    window.navigationManager.showNotification('Invalid dashboard file format', 'error');
                }
                return;
            }
            
            // Show import confirmation modal
            this.showImportConfirmation(importData);
            
        } catch (error) {
            console.error('Import error:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to read dashboard file', 'error');
            }
        }
    }
    
    validateImportData(data) {
        // Check if it's a valid dashboard export
        if (!data || typeof data !== 'object') return false;
        
        // Check for dashboard object
        if (!data.dashboard || typeof data.dashboard !== 'object') return false;
        
        const dashboard = data.dashboard;
        
        // Check required fields
        if (!dashboard.name || !dashboard.id) return false;
        
        // Check widgets array
        if (dashboard.widgets && !Array.isArray(dashboard.widgets)) return false;
        
        return true;
    }
    
    showImportConfirmation(importData) {
        const dashboard = importData.dashboard;
        const exportDate = importData.exportedAt ? new Date(importData.exportedAt).toLocaleDateString() : 'Unknown';
        const widgetCount = dashboard.widgets ? dashboard.widgets.length : 0;
        
        if (window.navigationManager) {
            const modalContent = `
                <div class="space-y-4">
                    <div class="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <i class="fas fa-info-circle text-blue-600 text-xl"></i>
                        <div>
                            <h4 class="font-medium text-blue-900">Dashboard Import Preview</h4>
                            <p class="text-sm text-blue-700">Review the dashboard details before importing</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-700">Dashboard Name:</span>
                            <span class="text-sm text-gray-900">${dashboard.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-700">Description:</span>
                            <span class="text-sm text-gray-900">${dashboard.description || 'No description'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-700">Widgets:</span>
                            <span class="text-sm text-gray-900">${widgetCount} widget${widgetCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-700">Exported:</span>
                            <span class="text-sm text-gray-900">${exportDate}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium text-gray-700">Version:</span>
                            <span class="text-sm text-gray-900">${importData.version || '1.0.0'}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-700">Import Options</label>
                        <div class="space-y-2">
                            <label class="flex items-center gap-3">
                                <input type="radio" name="importOption" value="new" checked class="text-teal-600">
                                <span class="text-sm">Create as new dashboard</span>
                            </label>
                            <label class="flex items-center gap-3">
                                <input type="radio" name="importOption" value="replace" class="text-teal-600">
                                <span class="text-sm">Replace existing dashboard (if name matches)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Name (optional rename)</label>
                        <input type="text" id="importDashboardName" value="${dashboard.name}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                    </div>
                </div>
            `;
            
            window.navigationManager.showModal(
                'Import Dashboard',
                modalContent,
                [
                    { label: 'Cancel', action: 'cancel' },
                    { label: 'Import Dashboard', action: 'import', primary: true, handler: () => {
                        const importOption = document.querySelector('input[name="importOption"]:checked')?.value;
                        const newName = document.getElementById('importDashboardName')?.value.trim();
                        
                        if (!newName) {
                            window.navigationManager.showNotification('Please enter a dashboard name', 'warning');
                            return false;
                        }
                        
                        this.importDashboard(importData, importOption, newName);
                        return true;
                    }}
                ]
            );
        }
    }
    
    async importDashboard(importData, importOption, newName) {
        try {
        const dashboard = { ...(importData.dashboard || importData) };
            
            // Update dashboard properties
            dashboard.name = newName;
            dashboard.lastModified = new Date();
            dashboard.owner = 'You';
            
        // Process widgets to ensure they have proper IDs
        if (dashboard.widgets && Array.isArray(dashboard.widgets)) {
            dashboard.widgets = dashboard.widgets.map((widget, index) => ({
                ...widget,
                id: widget.id || `widget-${Date.now()}-${index}`,
                lastUpdated: new Date(),
                // Reset any runtime-specific properties
                hasData: false,
                error: undefined
            }));
            
            console.log("Processed", dashboard.widgets.length, "widgets");
        }
        
            if (importOption === 'new') {
                // Create as new dashboard with new ID
                dashboard.id = Date.now().toString();
                dashboard.createdAt = new Date();
                dashboard.isPublished = false; // Reset publish status for imported dashboards
     
                console.log(" Creating new dashboard with ID:", dashboard.id);
            } else if (importOption === 'replace') {
                // Check if dashboard with same name exists
            const existingDashboards = await this.app.getSavedDashboards();
            const existingIndex = existingDashboards.findIndex(d => d.name.toLowerCase() === newName.toLowerCase());
                
                if (existingIndex >= 0) {
                    // Replace existing dashboard
                    dashboard.id = existingDashboards[existingIndex].id;
                    dashboard.createdAt = existingDashboards[existingIndex].createdAt;
                    console.log("Replacing existing dashboard with ID:", dashboard.id);
                } else {
                    // Create new if no match found
                    dashboard.id = Date.now().toString();
                    dashboard.createdAt = new Date();
                    dashboard.isPublished = false;
                    console.log("No existing dashboard found, creating new with ID:", dashboard.id);
                }
            }
            
        console.log("Final dashboard object:", dashboard);
        
        // Try to save to API first
        try {
            const apiResponse = await fetch('https://edge.ncgafrica.com:5000/create-dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: dashboard.name,
                    description: dashboard.description,
                    widgets: dashboard.widgets,
                    importedAt: new Date().toISOString(),
                    importedFrom: importData.exportedAt || 'unknown'
                })
            });
            
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                if (apiData.id) {
                    dashboard.id = apiData.id; // Use server-generated ID
                }
                console.log("Dashboard imported to API successfully");
            } else {
                console.warn("Failed to import to API, saving locally only");
            }
        } catch (apiError) {
            console.error("Error importing to API:", apiError);
            }
            
            // Save to localStorage
          const savedDashboards = await this.app.getSavedDashboards();
            
            if (importOption === 'replace') {
                const existingIndex = savedDashboards.findIndex(d => d.id === dashboard.id);
                if (existingIndex >= 0) {
                    savedDashboards[existingIndex] = dashboard;
                    console.log("Replaced existing dashboard in localStorage");
                } else {
                    savedDashboards.unshift(dashboard);
                    console.log("Added new dashboard to localStorage");
                }
            } else {
                savedDashboards.unshift(dashboard);
            console.log("Added new dashboard to localStorage");
            }
            
            localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));
            console.log("Saved to localStorage. Total dashboards:", savedDashboards.length);
            
            // Refresh the dashboard list
            await this.loadSavedDashboards();
            
            // Show success message
            if (window.navigationManager) {
                const action = importOption === 'replace' ? 'updated' : 'imported';
                window.navigationManager.showNotification(`Dashboard "${newName}" ${action} successfully`, 'success');
            }
            
            console.log("Dashboard import completed successfully");
        
        } catch (error) {
            console.error('Import dashboard error:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to import dashboard', 'error');
            }
        }
    }
    
    setupTemplateListeners() {
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const templateId = e.currentTarget.dataset.templateId;
                this.selectTemplate(templateId);
            });
        });
    }
    
    toggleResourcesCollapse() {
        const content = document.getElementById('resourcesContent');
        const icon = document.querySelector('.collapse-icon');
        const text = document.querySelector('.collapse-text');
        
        this.resourcesCollapsed = !this.resourcesCollapsed;
        
        if (this.resourcesCollapsed) {
            if (content) {
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                content.style.overflow = 'hidden';
            }
            if (icon) icon.style.transform = 'rotate(180deg)';
            if (text) text.textContent = 'Expand';
        } else {
            if (content) {
                content.style.maxHeight = 'none';
                content.style.opacity = '1';
                content.style.overflow = 'visible';
            }
            if (icon) icon.style.transform = 'rotate(0deg)';
            if (text) text.textContent = 'Collapse';
        }
    }
    
    renderTemplates() {
        const container = document.querySelector('#resourcesContent .grid');
        if (!container) return;
        
        // Clear existing templates except the edge promo card
        const existingCards = container.querySelectorAll('.template-card');
        existingCards.forEach(card => card.remove());
        
        // Add template cards before the edge promo card
        const promoCard = container.querySelector('.bg-gradient-to-br');
        
        this.templates.forEach(template => {
            const templateCard = this.createTemplateCard(template);
            container.insertBefore(templateCard, promoCard);
        });
        
        this.setupTemplateListeners();
    }
    
    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer';
        card.dataset.templateId = template.id;
        
        const colorClasses = {
            red: 'bg-red-50',
            green: 'bg-green-50',
            gray: 'bg-gray-50'
        };
        
        const barColors = {
            red: ['bg-red-300', 'bg-red-400'],
            green: ['bg-green-300', 'bg-green-400', 'bg-green-300'],
            gray: ['border-2 border-dashed border-gray-300']
        };
        
        card.innerHTML = `
            <div class="mb-4">
                <div class="w-full h-24 ${colorClasses[template.color]} rounded-lg flex items-center justify-center mb-4">
                    ${template.color === 'gray' ? 
                        '<div class="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>' :
                        `<div class="space-y-2">
                            ${barColors[template.color].map(color => 
                                `<div class="h-2 ${color} rounded w-${template.color === 'green' ? '14' : '16'}"></div>`
                            ).join('')}
                        </div>`
                    }
                </div>
            </div>
            <h3 class="font-medium text-gray-900 mb-1">${template.name}</h3>
        `;
        
        return card;
    }
    
    selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        if (templateId === 'more') {
            this.showMoreTemplates();
        } else {
            this.createDashboardFromTemplate(template);
        }
    }
    
    createDashboardFromTemplate(template) {
        // Prompt for dashboard name first
        if (window.navigationManager) {
            const modalContent = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                        <input type="text" id="templateDashboardNameInput" placeholder="Enter dashboard name..." 
                               value="${template.name}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea id="templateDashboardDescInput" rows="3" placeholder="Describe your dashboard..." 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">${template.description}</textarea>
                    </div>
                </div>
            `;
            
            window.navigationManager.showModal(
                `Create Dashboard from ${template.name}`,
                modalContent,
                [
                    { label: 'Cancel', action: 'cancel' },
                    { label: 'Create Dashboard', action: 'create', primary: true, handler: () => {
                        const nameInput = document.getElementById('templateDashboardNameInput');
                        const descInput = document.getElementById('templateDashboardDescInput');
                        
                        const name = nameInput?.value.trim();
                        const description = descInput?.value.trim();
                        
                        if (!name) {
                            window.navigationManager.showNotification('Please enter a dashboard name', 'warning');
                            return false;
                        }
                        
                        this.app.startNewDashboard(name, description);
                        
                        // Add template-specific widgets after a short delay
                        setTimeout(() => {
                            this.addTemplateWidgets(template.id);
                        }, 100);
                        
                        return true;
                    }}
                ]
            );
        }
    }
    
    addTemplateWidgets(templateId) {
        switch (templateId) {
            case 'customer':
                this.app.addWidget('bar');
                this.app.addWidget('pie');
                this.app.addWidget('single-value');
                break;
            case 'support':
                this.app.addWidget('line');
                this.app.addWidget('table');
                this.app.addWidget('donut');
                break;
        }
    }
    
    showMoreTemplates() {
        if (window.navigationManager) {
            window.navigationManager.showModal(
                'More Templates',
                '<p class="text-gray-600">Additional templates will be available in a future update.</p>',
                [
                    { label: 'OK', action: 'close', primary: true, handler: () => {} }
                ]
            );
        }
    }
    
    async loadSavedDashboards() {
        this.savedDashboards = await this.app.getSavedDashboards();
        
        this.applyFilters();
    }
    
    loadUserPreferences() {
        try {
            const hiddenDashboards = localStorage.getItem('hiddenDashboards');
            if (hiddenDashboards) {
                this.hiddenDashboards = new Set(JSON.parse(hiddenDashboards));
            }
            
            const favoriteDashboards = localStorage.getItem('favoriteDashboards');
            if (favoriteDashboards) {
                this.favoriteDashboards = new Set(JSON.parse(favoriteDashboards));
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }
    
    saveUserPreferences() {
        try {
            localStorage.setItem('hiddenDashboards', JSON.stringify([...this.hiddenDashboards]));
            localStorage.setItem('favoriteDashboards', JSON.stringify([...this.favoriteDashboards]));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }
    
    renderSavedDashboards() {
        // This method is now replaced by renderFilteredDashboards
        this.applyFilters();
    }
    
    createSavedDashboardCard(dashboard) {
        const lastModified = new Date(dashboard.lastModified || dashboard.createdAt).toLocaleDateString();
        const widgetCount = dashboard.widgets ? dashboard.widgets.length : 0;
        const isFavorite = this.favoriteDashboards.has(dashboard.id);
        const owner = dashboard.owner || 'You';
        const isHidden = this.hiddenDashboards.has(dashboard.id);

        return `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow dashboard-card ${isHidden ? 'opacity-50 grayscale' : ''}" 
                 data-dashboard-id="${dashboard.id}">
                <div class="flex items-start justify-between">
                    <div class="flex-1 cursor-pointer" onclick="window.dashboardApp.loadDashboard('${dashboard.id}')">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-medium text-gray-900">${dashboard.name}</h3>
                            ${isFavorite ? '<i class="fas fa-star text-yellow-500 text-sm"></i>' : ''}
                            ${dashboard.isPublished ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>' : '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Draft</span>'}
                        </div>
                        <p class="text-sm text-gray-500 mb-3">${dashboard.description || 'No description'}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-400">
                            <span>Last modified: ${lastModified}</span>
                            <span>${widgetCount} widget${widgetCount !== 1 ? 's' : ''}</span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-user w-3 h-3"></i>
                                ${owner}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <!-- Favorite Star -->
                        <button class="favorite-btn p-2 text-gray-400 hover:text-yellow-500 rounded-md hover:bg-gray-50 transition-colors" 
                                data-dashboard-id="${dashboard.id}" 
                                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-star w-4 h-4 ${isFavorite ? 'text-yellow-500' : ''}"></i>
                        </button>
                        
                        <!-- DashboardList Config Menu - 3 dots -->
                        <div class="relative dashboard-menu">
                            <button class="menu-trigger p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors" 
                                    data-dashboard-id="${dashboard.id}" 
                                    title="More actions">
                                <i class="fas fa-ellipsis-v w-4 h-4"></i>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div class="menu-dropdown hidden absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div class="py-1">
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="edit" data-dashboard-id="${dashboard.id}">
                                        Edit Dashboard
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="configure" data-dashboard-id="${dashboard.id}">
                                        Configure
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="clone" data-dashboard-id="${dashboard.id}">
                                        Clone Dashboard
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="export" data-dashboard-id="${dashboard.id}">
                                        Export Dashboard
                                    </button>
                                    
                                    <hr class="my-1 border-gray-200">
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                                            data-action="${isHidden ? 'unhide' : 'hide'}" data-dashboard-id="${dashboard.id}">
                                        ${isHidden ? 'Unhide Dashboard' : 'Hide Dashboard'}
                                    </button>
                                    <button class="menu-item w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors" 
                                            data-action="delete" data-dashboard-id="${dashboard.id}">
                                        Delete Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupDashboardCardListeners() {
        // Favorite button listeners
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dashboardId = e.currentTarget.dataset.dashboardId;
                this.toggleFavorite(dashboardId);
            });
        });
        
        // Menu trigger listeners
        document.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dashboardId = e.currentTarget.dataset.dashboardId;
                this.toggleMenu(dashboardId);
            });
        });
        
        // Menu item listeners
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                const dashboardId = e.currentTarget.dataset.dashboardId;
                this.handleMenuAction(action, dashboardId);
            });
        });
    }
    
    toggleFavorite(dashboardId) {
        if (this.favoriteDashboards.has(dashboardId)) {
            this.favoriteDashboards.delete(dashboardId);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Removed from favorites', 'info');
            }
        } else {
            this.favoriteDashboards.add(dashboardId);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Added to favorites', 'success');
            }
        }
        
        this.saveUserPreferences();
        this.applyFilters(); // Re-apply filters to update sorting
    }
    
    toggleMenu(dashboardId) {
        // Close all other menus first
        this.closeAllMenus();
        
        // Toggle the clicked menu
        const menuTrigger = document.querySelector(`[data-dashboard-id="${dashboardId}"].menu-trigger`);
        const menu = menuTrigger?.parentElement.querySelector('.menu-dropdown');
        
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    closeAllMenus() {
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
    
    async handleMenuAction(action, dashboardId) {
        this.closeAllMenus();
        
    const savedDashboards = await this.app.getSavedDashboards();
    const dashboard = savedDashboards.find(d => d.id == dashboardId);
    
        if (!dashboard) return;
        
        switch (action) {
            case 'edit':
                await this.app.loadDashboard(dashboardId);
                break;
                
            case 'configure':
                this.showDashboardConfiguration(dashboard);
                break;
                
            case 'clone':
                this.cloneDashboard(dashboard);
                break;
                
            case 'export':
                this.exportDashboard(dashboard);
                break;
                
                
            case 'hide':
                this.hideDashboard(dashboardId);
                break;
                
            case 'unhide':
                this.unhideDashboard(dashboardId);
                break;
                
            case 'delete':
                this.confirmDeleteDashboard(dashboardId);
                break;
        }
    }
    
    async showDashboardConfiguration(dashboard) {
        if (!window.navigationManager || typeof window.navigationManager.showModal !== 'function') {
            console.warn('NavigationManager not available');
            return;
        }
    
        if (!dashboard) {
            const savedDashboards = await this.app.getSavedDashboards();
            dashboard = savedDashboards.find(d => d.id == this.currentDashboardId);
            
            if (!dashboard) {
                window.navigationManager.showNotification('Dashboard not found', 'warning');
                return;
            }
        }
    
                const modalContent = `
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                    <input type="text" id="configDashboardName" value="${dashboard.name || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea id="configDashboardDesc" rows="3" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">${dashboard.description || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                            <input type="text" id="configDashboardOwner" value="${dashboard.owner || 'You'}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700">Published</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="configDashboardPublished" ${dashboard.isPublished ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                <div class="grid grid-cols-2 gap-4">

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Created</label>
                        <input type="text" value="${new Date(dashboard.createdAt || Date.now()).toLocaleDateString()}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" readonly>
                    </div>
                    <div>

                        <label class="block text-sm font-medium text-gray-700 mb-2">Last Modified</label>
                        <input type="text" value="${new Date(dashboard.lastModified || Date.now()).toLocaleDateString()}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" readonly>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Widgets</label>
                    <input type="text" value="${dashboard.widgets ? dashboard.widgets.length : 0} widget(s)" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" readonly>
                </div>
                    </div>
                `;
                
                window.navigationManager.showModal(
                    'Configure Dashboard',
                    modalContent,
                    [
                        { label: 'Cancel', action: 'cancel' },
                { label: 'Save Changes', action: 'save', primary: true, handler: async () => {
                    try {
                            const nameInput = document.getElementById('configDashboardName');
                            const descInput = document.getElementById('configDashboardDesc');
                            const ownerInput = document.getElementById('configDashboardOwner');
                            const publishedInput = document.getElementById('configDashboardPublished');
                            
                        if (!nameInput?.value.trim()) {
                            window.navigationManager.showNotification('Dashboard name is required', 'warning');
                            return false;
                        }
                        
                        // Update dashboard object
                        dashboard.name = nameInput.value.trim();
                        dashboard.description = descInput.value.trim();
                        dashboard.owner = ownerInput.value.trim();
                            dashboard.isPublished = publishedInput.checked;
                            dashboard.lastModified = new Date();
                            
                        console.log("Updating dashboard configuration in DB:", dashboard);
                        
                        // Try to update via API first
                        try {
                            const response = await fetch(`https://edge.ncgafrica.com:5000/update-dashboard/${dashboard.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(dashboard)
                            });
                            
                            if (response.ok) {
                                console.log('Dashboard configuration updated in API successfully');
                            } else {
                                console.warn('Failed to update configuration in API');
                            }
                        } catch (apiError) {
                            console.error('Error updating configuration in API:', apiError);
                        }
                        
                        // Update localStorage
                        const savedDashboards = await this.app.getSavedDashboards();
                        const index = savedDashboards.findIndex(d => d.id == dashboard.id);
                        
                            if (index >= 0) {
                                savedDashboards[index] = dashboard;
                                localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));
                                console.log("Updated dashboard configuration in localStorage");
                        }
                        
                        // If this dashboard is currently loaded, update it
                        if (this.app.currentDashboard && this.app.currentDashboard.id == dashboard.id) {
                            this.app.currentDashboard = { ...dashboard };
                            this.app.updateBuilderTitle();
                            console.log("🔄 Updated current dashboard with new configuration");
                            }
                            
                        // Refresh the dashboard list
                            await this.loadSavedDashboards();
                        
                            window.navigationManager.showNotification('Dashboard configuration updated successfully', 'success');
                            return true;
                        
                    } catch (error) {
                        console.error('Error updating dashboard configuration:', error);
                        window.navigationManager.showNotification('Failed to update dashboard configuration', 'error');
                        return false;
                    }
                        }}
                    ]
                );
        
        // Focus the name input after modal opens
        setTimeout(() => {
            const nameInput = document.getElementById('configDashboardName');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }, 100);
    }
    
    async cloneDashboard(dashboard) {
        if (!window.navigationManager || typeof window.navigationManager.showModal !== 'function') {
            console.warn('NavigationManager not available');
            return;
        }
    
        if (!dashboard) {
            const savedDashboards = await this.app.getSavedDashboards();
            dashboard = savedDashboards.find(d => d.id == this.currentDashboardId);
            
            if (!dashboard) {
                window.navigationManager.showNotification('Dashboard not found', 'warning');
                return;
            }
        }
    
                const modalContent = `
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">New Dashboard Name</label>
                            <input type="text" id="cloneDashboardName" value="${dashboard.name} (Copy)" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea id="cloneDashboardDesc" rows="3" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">${dashboard.description || ''}</textarea>
                        </div>
                    </div>
                `;
                
                window.navigationManager.showModal(
                    'Clone Dashboard',
                    modalContent,
                    [
                        { label: 'Cancel', action: 'cancel' },
                { label: 'Clone Dashboard', action: 'clone', primary: true, handler: async () => {
                    try {
                            const nameInput = document.getElementById('cloneDashboardName');
                            const descInput = document.getElementById('cloneDashboardDesc');
                            
                        const newName = nameInput?.value.trim();
                        const newDescription = descInput?.value.trim();

                        
                        if (!newName) {
                            window.navigationManager.showNotification('Please enter a dashboard name', 'warning');
                            return false;
                        }
                        
                        // Check for duplicate names
                        const existingDashboards = await this.app.getSavedDashboards();
                        const nameExists = existingDashboards.some(d => d.name.toLowerCase() === newName.toLowerCase());
                        
                        if (nameExists) {
                            window.navigationManager.showNotification('A dashboard with this name already exists', 'warning');
                            return false;
                        }
                        
                        // console.log(" Cloning dashboard:", dashboard.name, "→", newName);

                        
                        // Create cloned dashboard object
                            const clonedDashboard = {
                            ...dashboard, // Copy all properties
                            id: Date.now().toString(), // Generate new ID
                            name: newName,
                            description: newDescription,
                                createdAt: new Date(),
                                lastModified: new Date(),
                            isPublished: false, // Always start as draft
                            owner: 'You',
                            // Deep copy widgets to avoid reference issues

                             widgets: Array.isArray(dashboard.widgets)
    ? dashboard.widgets.map(widget => ({
        ...widget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: new Date()
    }))
    : typeof dashboard.widgets === 'string'
    ? JSON.parse(dashboard.widgets).map(widget => ({
        ...widget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: new Date()
    }))
    : []


                            };
                            
                        console.log("Created cloned dashboard:", clonedDashboard);
                        
                        // Try to save to API first
                        try {
                            const response = await fetch('https://edge.ncgafrica.com:5000/create-dashboard', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    name: clonedDashboard.name,
                                    description: clonedDashboard.description,
                                    widgets: clonedDashboard.widgets,
                                    clonedFrom: dashboard.id
                                })
                            });
                            
                            if (response.ok) {
                                const apiData = await response.json();
                                if (apiData.id) {
                                    clonedDashboard.id = apiData.id; // Use server-generated ID
                                }
                                console.log('Dashboard cloned in API successfully');
                            } else {
                                console.warn('Failed to clone dashboard in API, saving locally only');
                            }
                        } catch (apiError) {
                            console.error('Error cloning dashboard in API:', apiError);
                        }
                        
                        // Save to localStorage
                        const savedDashboards = await this.app.getSavedDashboards();
                            savedDashboards.unshift(clonedDashboard);
                            localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));
                            
                        console.log("Saved cloned dashboard to localStorage");
                        
                        // Refresh the dashboard list
                        await this.loadSavedDashboards();
                        
                        window.navigationManager.showNotification(`Dashboard "${newName}" cloned successfully`, 'success');
                            return true;
                        
                    } catch (error) {
                        console.error('Error cloning dashboard:', error);
                        window.navigationManager.showNotification('Failed to clone dashboard', 'error');
                        return false;
                    }
                        }}
                    ]
                );
        
        setTimeout(() => {
            const nameInput = document.getElementById('cloneDashboardName');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }, 100);
    }
    
    exportDashboard(dashboard) {
        try {
            const exportData = {
                dashboard: dashboard,
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${dashboard.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dashboard.json`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            if (window.navigationManager) {
                window.navigationManager.showNotification('Dashboard exported successfully', 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to export dashboard', 'error');
            }
        }
    }
    
    
    hideDashboard(dashboardId) {
        this.hiddenDashboards.add(dashboardId);
        this.saveUserPreferences();
        this.applyFilters(); // Re-apply filters to update the list
        
        if (window.navigationManager) {
            window.navigationManager.showNotification('Dashboard hidden', 'info');
        }
    }
    
    unhideDashboard(dashboardId) {
        if (this.hiddenDashboards.has(dashboardId)) {
            this.hiddenDashboards.delete(dashboardId);
            this.saveUserPreferences();
            this.applyFilters(); // Re-apply filters to update the list
            
            if (window.navigationManager) {
                window.navigationManager.showNotification('Dashboard unhidden', 'success');
            }
        }
    }

    async confirmDeleteDashboard(dashboardId) {
        const savedDashboards = await this.app.getSavedDashboards();
        const dashboard = savedDashboards.find(d => d.id == dashboardId);
        
            if (!dashboard) return;
    
            if (window.navigationManager) {
                const modalContent = `
                    <div class="text-center">
                        <div class="w-12 h-12 bg-red-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                            <i class="fas fa-trash text-red-600 text-xl"></i>
                        </div>
                        <p class="text-gray-900 mb-2">Delete "${dashboard.name}"?</p>
                        <p class="text-sm text-gray-500">This action cannot be undone. All widgets and data will be permanently deleted.</p>
                    </div>
                `;
    
                window.navigationManager.showModal(
                    'Confirm Delete',
                    modalContent,
                    [
                        { label: 'Cancel', action: 'cancel' },
                    { label: 'Delete Dashboard', action: 'delete', primary: true, handler: async () => {
                        await this.app.deleteDashboard(dashboardId);
                            return true;
                        }}
                    ]
                );
            }
        }
    
    
    async show() {
        const screen = document.getElementById('dashboardScreen');
        if (screen) {
            screen.classList.remove('hidden');
        }
        this.renderTemplates();
        await this.loadSavedDashboards();
    }
    
    hide() {
        const screen = document.getElementById('dashboardScreen');
        if (screen) {
            screen.classList.add('hidden');
        }
        this.closeAllMenus();
    }
}