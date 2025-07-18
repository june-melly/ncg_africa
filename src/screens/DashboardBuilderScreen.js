// Dashboard Builder Screen - Widget creation and editing interface
export class DashboardBuilderScreen {
    constructor(app) {
        this.app = app;
        this.isPublished = false;
        this.lastSaved = new Date();
        this.autoSaveInterval = null;
        this.isInitialized = false;
    }
    
    init() {
        if (this.isInitialized) return;
        
        try {
            this.setupEventListeners();
            this.setupAutoSave();
            this.updateLastSavedTime();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize DashboardBuilderScreen:', error);
        }
    }
    
    setupEventListeners() {
        // Back to home button
        const backToHomeBtn = document.getElementById('backToHomeBtn');
        if (backToHomeBtn) {
            
            backToHomeBtn.replaceWith(backToHomeBtn.cloneNode(true));
            const newBackBtn = document.getElementById('backToHomeBtn');
            newBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.app && typeof this.app.showScreen === 'function') {
                    this.app.showScreen('dashboard');
                }
            });
        }
        
        // Widget options
        this.setupWidgetOptions();
        
        // Publish toggle
        const publishToggle = document.querySelector('#builderScreen .toggle-switch input');
        if (publishToggle) {
            publishToggle.addEventListener('change', (e) => {
                this.togglePublishState(e.target.checked);
            });
        }
        
        // Run once button
        const runOnceBtn = document.querySelector('.run-once-btn');
        if (runOnceBtn) {
            runOnceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.runOnce();
            });
        }
        
        // Publish button
        const publishBtn = document.querySelector('.publish-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.publishDashboard();
            });
        }
        
        // Dashboard name input
        this.setupDashboardNameInput();
        
        // Settings and history buttons
        this.setupToolbarButtons();
    }
    
    setupWidgetOptions() {
        // Remove existing listeners and re-add to prevent duplicates
        const widgetOptions = document.querySelectorAll('.widget-option');
        widgetOptions.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = e.currentTarget.dataset.type;
                if (this.app && typeof this.app.addWidget === 'function') {
                    this.app.addWidget(type);
                }
            });
        });
    }
    
    setupDashboardNameInput() {
        const nameInput = document.getElementById('dashboardNameInput');
        const editBtn = document.getElementById('editDashboardNameBtn');
        
        if (nameInput) {
            // Auto-save name on blur
            nameInput.addEventListener('blur', () => {
                if (this.app && this.app.currentDashboard) {
                    this.app.currentDashboard.name = nameInput.value.trim() || 'Untitled Dashboard';
                    if (typeof this.app.saveDashboard === 'function') {
                        this.app.saveDashboard();
                    }
                }
            });
            
            // Save on Enter key
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nameInput.blur();
                }
            });
        }
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            });
        }
    }
    
    setupToolbarButtons() {
        const settingsBtn = document.querySelector('#builderScreen button[title="Settings"]');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDashboardSettings();
            });
        }
        
        const historyBtn = document.querySelector('#builderScreen button[title="History"]');
        if (historyBtn) {
            historyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDashboardHistory();
            });
        }
    }
    
    setupAutoSave() {
        // Clear existing interval to prevent duplicates
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000);
    }
    
    autoSave() {
        try {
            if (this.app && this.app.currentDashboard && typeof this.app.saveDashboard === 'function') {
                this.app.saveDashboard();
                this.lastSaved = new Date();
                this.updateLastSavedTime();
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    updateLastSavedTime() {
        const timeElement = document.querySelector('#builderScreen .text-xs.text-gray-400');
        if (timeElement) {
            try {
                const timeString = this.lastSaved.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                timeElement.textContent = `last saved today ${timeString}`;
            } catch (error) {
                console.error('Failed to update last saved time:', error);
                timeElement.textContent = 'last saved recently';
            }
        }
    }
    
    togglePublishState(isPublished) {
        try {
            if (this.app && this.app.currentDashboard) {
                this.app.currentDashboard.isPublished = isPublished;
                this.app.currentDashboard.lastModified = new Date();
                
                if (typeof this.app.saveDashboard === 'function') {
                    this.app.saveDashboard();
                }
            }
            
            this.isPublished = isPublished;
            const statusElement = document.querySelector('#builderScreen .text-sm.text-gray-500');
            if (statusElement) {
                statusElement.textContent = isPublished ? 'Published' : 'Draft';
                statusElement.className = isPublished ? 
                    'text-sm text-green-600' : 
                    'text-sm text-gray-500';
            }
            
            if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                const message = isPublished ? 
                    'Dashboard published successfully' : 
                    'Dashboard saved as draft';
                window.navigationManager.showNotification(message, 'success');
            }
        } catch (error) {
            console.error('Failed to toggle publish state:', error);
        }
    }
    
    runOnce() {
        try {
            // Check if we have widgets to refresh
            if (!this.app || !this.app.widgets || !Array.isArray(this.app.widgets)) {
                if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                    window.navigationManager.showNotification('No widgets found to refresh', 'warning');
                }
                return;
            }

            // Refresh all widgets with data
            const widgetsWithData = this.app.widgets.filter(w => 
                w && w.apiEndpoint && typeof w.apiEndpoint === 'string' && w.apiEndpoint.trim()
            );
            
            if (widgetsWithData.length === 0) {
                if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                    window.navigationManager.showNotification('No widgets with API endpoints to refresh', 'warning');
                }
                return;
            }
            
            let refreshCount = 0;
            const totalWidgets = widgetsWithData.length;
            let hasErrors = false;
            
            // Show loading state
            const runOnceBtn = document.querySelector('.run-once-btn');
            if (runOnceBtn) {
                runOnceBtn.disabled = true;
                runOnceBtn.innerHTML = '<i class="fas fa-spinner fa-spin w-4 mr-2"></i>Refreshing...';
            }
            
            widgetsWithData.forEach(async (widget) => {
                try {
                    if (window.dataManager && typeof window.dataManager.fetchData === 'function') {
                        const data = await window.dataManager.fetchData(widget.apiEndpoint);
                        
                        if (typeof window.dataManager.processData === 'function') {
                            const processedData = window.dataManager.processData(
                                data, 
                                widget.type === 'table' ? 'table' : 'chart'
                            );
                            
                            widget.data = processedData;
                            widget.hasData = true;
                            widget.lastUpdated = new Date();
                            widget.error = undefined;
                        }
                    }
                } catch (error) {
                    console.error(`Failed to refresh widget ${widget.id}:`, error);
                    widget.error = error.message || 'Failed to fetch data';
                    widget.hasData = false;
                    hasErrors = true;
                } finally {
                    refreshCount++;
                    
                    if (refreshCount === totalWidgets) {
                        // All widgets processed, update UI
                        if (this.app && typeof this.app.renderWidgets === 'function') {
                            this.app.renderWidgets();
                        }
                        
                        // Reset button state
                        if (runOnceBtn) {
                            runOnceBtn.disabled = false;
                            runOnceBtn.innerHTML = '<i class="fas fa-play w-4 mr-2"></i>Run Once';
                        }
                        
                        // Show completion message
                        if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                            const successCount = totalWidgets - (hasErrors ? 1 : 0);
                            const message = hasErrors ? 
                                `Refreshed ${successCount}/${totalWidgets} widgets (some failed)` :
                                `Refreshed ${totalWidgets} widget${totalWidgets > 1 ? 's' : ''}`;
                            const type = hasErrors ? 'warning' : 'success';
                            window.navigationManager.showNotification(message, type);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Run once failed:', error);
            
            // Reset button state
            const runOnceBtn = document.querySelector('.run-once-btn');
            if (runOnceBtn) {
                runOnceBtn.disabled = false;
                runOnceBtn.innerHTML = '<i class="fas fa-play w-4 mr-2"></i>Run Once';
            }
            
            if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                window.navigationManager.showNotification('Failed to refresh widgets', 'error');
            }
        }
    }
    
    publishDashboard() {
        try {
            if (!this.app || !this.app.widgets || this.app.widgets.length === 0) {
                if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                    window.navigationManager.showNotification('Add widgets before publishing', 'warning');
                }
                return;
            }
            
            // Show loading state
            const publishBtn = document.querySelector('.publish-btn');
            if (publishBtn) {
                publishBtn.disabled = true;
                publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin w-4 mr-2"></i>Publishing...';
                
                // Simulate publishing process
                setTimeout(() => {
                    try {
                        this.isPublished = true;
                        this.togglePublishState(true);
                        
                        // Update toggle switch
                        const toggle = document.querySelector('#builderScreen .toggle-switch input');
                        if (toggle) {
                            toggle.checked = true;
                        }
                        
                        publishBtn.disabled = false;
                        publishBtn.innerHTML = 'Published';
                        
                        setTimeout(() => {
                            if (publishBtn) {
                                publishBtn.innerHTML = 'Publish';
                            }
                        }, 2000);
                    } catch (error) {
                        console.error('Failed to complete publish:', error);
                        if (publishBtn) {
                            publishBtn.disabled = false;
                            publishBtn.innerHTML = 'Publish';
                        }
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('Publish dashboard failed:', error);
            
            const publishBtn = document.querySelector('.publish-btn');
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.innerHTML = 'Publish';
            }
            
            if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                window.navigationManager.showNotification('Failed to publish dashboard', 'error');
            }
        }
    }
    
    showDashboardSettings() {
        if (!window.navigationManager || typeof window.navigationManager.showModal !== 'function') {
            console.warn('NavigationManager not available');
            return;
        }

        if (!this.app || !this.app.currentDashboard) {
            window.navigationManager.showNotification('No dashboard selected', 'warning');
            return;
        }

        const dashboard = this.app.currentDashboard;
        const settingsContent = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                    <input type="text" id="settingsDashboardName" value="${dashboard.name || ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea id="settingsDashboardDesc" rows="3" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">${dashboard.description || ''}</textarea>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">Auto-refresh enabled</span>
                    <label class="toggle-switch">
                        <input type="checkbox" ${dashboard.autoRefresh ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                    <input type="number" id="settingsRefreshInterval" value="${dashboard.refreshInterval || 300}" min="30" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                </div>
            </div>
        `;
        
        window.navigationManager.showModal(
            'Dashboard Settings',
            settingsContent,
            [
                { label: 'Cancel', action: 'cancel' },
                { label: 'Save', action: 'save', primary: true, handler: () => {
                    try {
                        const nameInput = document.getElementById('settingsDashboardName');
                        const descInput = document.getElementById('settingsDashboardDesc');
                        const autoRefreshInput = document.querySelector('#settingsDashboardDesc + div input[type="checkbox"]');
                        const intervalInput = document.getElementById('settingsRefreshInterval');
                        
                        if (nameInput && this.app.currentDashboard) {
                            this.app.currentDashboard.name = nameInput.value.trim() || 'Untitled Dashboard';
                            this.app.currentDashboard.description = descInput ? descInput.value.trim() : '';
                            this.app.currentDashboard.autoRefresh = autoRefreshInput ? autoRefreshInput.checked : false;
                            this.app.currentDashboard.refreshInterval = intervalInput ? parseInt(intervalInput.value) || 300 : 300;
                            this.app.currentDashboard.lastModified = new Date();
                            
                            if (typeof this.app.updateBuilderTitle === 'function') {
                                this.app.updateBuilderTitle();
                            }
                            
                            if (typeof this.app.saveDashboard === 'function') {
                                this.app.saveDashboard();
                            }
                        }
                        
                        if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                            window.navigationManager.showNotification('Settings saved', 'success');
                        }
                        return true;
                    } catch (error) {
                        console.error('Failed to save settings:', error);
                        if (window.navigationManager && typeof window.navigationManager.showNotification === 'function') {
                            window.navigationManager.showNotification('Failed to save settings', 'error');
                        }
                        return false;
                    }
                }}
            ]
        );
    }
    
    showDashboardHistory() {
        if (!window.navigationManager || typeof window.navigationManager.showModal !== 'function') {
            console.warn('NavigationManager not available');
            return;
        }

        const dashboard = this.app?.currentDashboard;
        const createdDate = dashboard?.createdAt ? new Date(dashboard.createdAt) : new Date();
        
        const historyContent = `
            <div class="space-y-3">
                <div class="text-sm text-gray-500 mb-4">Recent changes to this dashboard</div>
                <div class="space-y-2">
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div class="flex-1">
                            <div class="text-sm font-medium">Auto-saved</div>
                            <div class="text-xs text-gray-500">${this.lastSaved.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div class="flex-1">
                            <div class="text-sm font-medium">Dashboard created</div>
                            <div class="text-xs text-gray-500">${createdDate.toLocaleString()}</div>
                        </div>
                    </div>
                    ${dashboard?.lastModified ? `
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                        <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div class="flex-1">
                            <div class="text-sm font-medium">Last modified</div>
                            <div class="text-xs text-gray-500">${new Date(dashboard.lastModified).toLocaleString()}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        window.navigationManager.showModal(
            'Dashboard History',
            historyContent,
            [
                { label: 'Close', action: 'close', primary: true, handler: () => true }
            ]
        );
    }
    
    updateSelectedWidgetTitle(widget) {
        const titleElement = document.getElementById('selectedWidgetTitle');
        if (titleElement) {
            if (widget && widget.title) {
                titleElement.classList.remove('hidden');
                const titleSpan = titleElement.querySelector('span:last-child');
                if (titleSpan) {
                    titleSpan.textContent = widget.title;
                }
            } else {
                titleElement.classList.add('hidden');
            }
        }
    }
    
    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const canvas = document.getElementById('widgetCanvas');
        
        if (emptyState) emptyState.classList.remove('hidden');
        if (canvas) canvas.classList.add('hidden');
    }
    
    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const canvas = document.getElementById('widgetCanvas');
        
        if (emptyState) emptyState.classList.add('hidden');
        if (canvas) canvas.classList.remove('hidden');
    }
    
    updateBuilderTitle(title) {
        const nameInput = document.getElementById('dashboardNameInput');
        if (nameInput && title) {
            nameInput.value = title;
        }
    }
    
    show() {
        const screen = document.getElementById('builderScreen');
        if (screen) {
            screen.classList.remove('hidden');
        }
        
        // Show widget options in sidebar
        const widgetOptions = document.getElementById('widgetOptions');
        if (widgetOptions) {
            widgetOptions.classList.remove('hidden');
        }
        
        // Initialize if not already done
        this.init();
        
        // Update display based on widgets
        if (!this.app || !this.app.widgets || this.app.widgets.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
        }
        
        // Update dashboard title and publish state
        if (this.app && typeof this.app.updateBuilderTitle === 'function') {
            this.app.updateBuilderTitle();
        }
        
        if (this.app && this.app.currentDashboard) {
            const dashboard = this.app.currentDashboard;
            this.isPublished = dashboard.isPublished || false;
            
            // Update toggle switch
            const toggle = document.querySelector('#builderScreen .toggle-switch input');
            if (toggle) {
                toggle.checked = this.isPublished;
            }
            
            // Update dashboard name input
            const nameInput = document.getElementById('dashboardNameInput');
            if (nameInput && dashboard.name) {
                nameInput.value = dashboard.name;
            }
            
            this.togglePublishState(this.isPublished);
        }
        
        // Update last saved time
        this.updateLastSavedTime();
    }
    
    hide() {
        const screen = document.getElementById('builderScreen');
        if (screen) {
            screen.classList.add('hidden');
        }
        
        // Hide widget options in sidebar
        const widgetOptions = document.getElementById('widgetOptions');
        if (widgetOptions) {
            widgetOptions.classList.add('hidden');
        }
        
        // Clear selected widget title
        this.updateSelectedWidgetTitle(null);
    }
    
    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        this.isInitialized = false;
    }
    
    // Utility method to safely get dashboard data
    getDashboardData() {
        if (!this.app || !this.app.currentDashboard) {
            return null;
        }
        
        return {
            id: this.app.currentDashboard.id,
            name: this.app.currentDashboard.name || 'Untitled Dashboard',
            description: this.app.currentDashboard.description || '',
            widgets: this.app.widgets || [],
            isPublished: this.app.currentDashboard.isPublished || false,
            createdAt: this.app.currentDashboard.createdAt || new Date(),
            lastModified: this.app.currentDashboard.lastModified || new Date(),
            autoRefresh: this.app.currentDashboard.autoRefresh || false,
            refreshInterval: this.app.currentDashboard.refreshInterval || 300
        };
    }
    
    //  validate dashboard before publishing
    validateDashboard() {
        const errors = [];
        
        if (!this.app || !this.app.currentDashboard) {
            errors.push('No dashboard selected');
            return errors;
        }
        
        if (!this.app.currentDashboard.name || this.app.currentDashboard.name.trim() === '') {
            errors.push('Dashboard name is required');
        }
        
        if (!this.app.widgets || this.app.widgets.length === 0) {
            errors.push('Dashboard must have at least one widget');
        }
        
        // Check for widgets with configuration issues
        if (this.app.widgets) {
            const incompleteWidgets = this.app.widgets.filter(w => 
                !w.title || w.title.trim() === '' || 
                (w.apiEndpoint && w.apiEndpoint.trim() === '')
            );
            
            if (incompleteWidgets.length > 0) {
                errors.push(`${incompleteWidgets.length} widget(s) have incomplete configuration`);
            }
        }
        
        return errors;
    }
    
    // handle validation errors
    handleValidationErrors(errors) {
        if (errors.length === 0) return true;
        
        if (window.navigationManager && typeof window.navigationManager.showModal === 'function') {
            const errorContent = `
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        <div>
                            <h4 class="font-medium text-red-900">Validation Errors</h4>
                            <p class="text-sm text-red-700">Please fix the following issues before publishing:</p>
                        </div>
                    </div>
                    <ul class="space-y-2">
                        ${errors.map(error => `<li class="flex items-center gap-2 text-sm text-gray-700"><i class="fas fa-times text-red-500 w-4"></i>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            window.navigationManager.showModal(
                'Cannot Publish Dashboard',
                errorContent,
                [
                    { label: 'OK', action: 'close', primary: true, handler: () => true }
                ]
            );
        }
        
        return false;
    }
}