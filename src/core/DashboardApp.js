// Core application class - main entry point
export class DashboardApp {
    constructor() {
        this.currentScreen = 'dashboard';
        this.widgets = [];
        this.selectedWidget = null;
        this.widgetCounter = 0;
        this.currentDashboard = null;

        // Screen managers
        this.screens = {};

        // June: publish/draft state management
        this.publishState = {
            isPublishing: false,
            isUnpublishing: false,
            lastPublished: null,
            publishedVersion: null,
            draftVersion: null,
            autoSaveInterval: null
        };

        this.init();
    }

    async init() {
        // Import screen modules
        await this.loadScreenModules();

        this.setupEventListeners();
        this.showScreen('dashboard');
    }

    async loadScreenModules() {
        try {
            const { DashboardHomeScreen } = await import('../screens/DashboardHomeScreen.js');
            const { DashboardBuilderScreen } = await import('../screens/DashboardBuilderScreen.js');

            this.screens.dashboard = new DashboardHomeScreen(this);
            this.screens.builder = new DashboardBuilderScreen(this);

            // Make screens globally available for cross-screen communication
            window.dashboardHomeScreen = this.screens.dashboard;
            window.dashboardBuilderScreen = this.screens.builder;

            // Initialize screens
            this.screens.dashboard.init();
            this.screens.builder.init();
        } catch (error) {
            console.error('Failed to load screen modules:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Dashboard name editing
        this.setupDashboardNameEditing();
    }

    setupDashboardNameEditing() {
        const nameInput = document.getElementById('dashboardNameInput');
        const editBtn = document.getElementById('editDashboardNameBtn');

        if (nameInput && editBtn) {
            // Click edit button to focus input
            editBtn.addEventListener('click', () => {
                nameInput.focus();
                nameInput.select();
            });

            // Save on blur or enter
            nameInput.addEventListener('blur', () => {
                this.saveDashboardName();
            });

            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    nameInput.blur();
                }
                if (e.key === 'Escape') {
                    this.revertDashboardName();
                    nameInput.blur();
                }
            });

            // Auto-resize input based on content
            nameInput.addEventListener('input', () => {
                this.autoResizeNameInput(nameInput);
            });
        }
    }

    autoResizeNameInput(input) {
        // Create a temporary span to measure text width
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.fontSize = window.getComputedStyle(input).fontSize;
        span.style.fontFamily = window.getComputedStyle(input).fontFamily;
        span.style.fontWeight = window.getComputedStyle(input).fontWeight;
        span.textContent = input.value || input.placeholder;

        document.body.appendChild(span);
        const width = span.offsetWidth + 20; // Add some padding
        document.body.removeChild(span);

        input.style.width = Math.max(width, 150) + 'px';
    }

    async saveDashboardName() {
    const nameInput = document.getElementById('dashboardNameInput');

    if (nameInput && this.currentDashboard) {
        const newName = nameInput.value.trim();

        if (newName && newName !== this.currentDashboard.name) {
            const dashboardId = this.currentDashboard.id;
            this.currentDashboard.name = newName;
                this.currentDashboard.lastModified = new Date();

                // Mark as draft if name is changed
                if (this.currentDashboard.isPublished) {
                    this.currentDashboard.isDraft = true;
                    this.updatePublishState();
                }

                await this.saveDashboard({ skipNotification: true });

                    if (window.navigationManager) {
                    window.navigationManager.showNotification('Dashboard name updated', 'success');
                }
            }
        }
    }

    revertDashboardName() {
        const nameInput = document.getElementById('dashboardNameInput');
        if (nameInput && this.currentDashboard) {
            nameInput.value = this.currentDashboard.name;
            this.autoResizeNameInput(nameInput);
        }
    }

    showScreen(screenName) {
        // Show "coming soon" for specific screens
        if (['members', 'settings', 'analytics'].includes(screenName)) {
            if (window.navigationManager) {
                const screenNames = {
                    members: 'Members',
                    settings: 'Invite Others',
                    analytics: 'Trash'
                };
                window.navigationManager.showNotification(
                    `${screenNames[screenName]} feature coming soon`,
                    'info'
                );
            }
            return;
        }

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show selected screen
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-gray-100', 'text-gray-900');
            btn.classList.add('text-gray-600');
        });

        const activeBtn = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('bg-gray-100', 'text-gray-900');
            activeBtn.classList.remove('text-gray-600');
        }

        // Handle screen-specific logic
        if (this.screens[screenName]) {
            this.screens[screenName].show();
        }

        // Hide screens that are not active
        Object.keys(this.screens).forEach(key => {
            if (key !== screenName && this.screens[key]) {
                this.screens[key].hide();
            }
        });

        this.currentScreen = screenName;

        // Initialize screen-specific functionality for non-modular screens
        this.initializeScreen(screenName);
    }

    initializeScreen(screenName) {
        switch (screenName) {
            case 'members':
                if (window.membersManager) {
                    window.membersManager.init();
                }
                break;
            case 'settings':
                if (window.settingsManager) {
                    window.settingsManager.init();
                }
                break;
            case 'analytics':
                if (window.analyticsManager) {
                    window.analyticsManager.init();
                }
                break;
        }
    }

    createNewDashboard() {
        if (window.navigationManager) {
            const modalContent = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                        <input type="text" id="newDashboardNameInput" placeholder="Enter dashboard name..."
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                        <textarea id="newDashboardDescInput" rows="3" placeholder="Describe your dashboard..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"></textarea>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div class="flex items-center gap-2 text-blue-700">
                            <i class="fas fa-info-circle"></i>
                            <span class="text-sm font-medium">Draft Mode</span>
                        </div>
                        <p class="text-sm text-blue-600 mt-1">New dashboards are created as drafts. You can publish them once ready.</p>
                    </div>
                </div>
            `;

            window.navigationManager.showModal(
                'Create New Dashboard',
                modalContent,
                [
                    { label: 'Cancel', action: 'cancel' },
                    { label: 'Create Dashboard', action: 'create', primary: true, handler: () => {
                        const nameInput = document.getElementById('newDashboardNameInput');
                        const descInput = document.getElementById('newDashboardDescInput');

                        const name = nameInput?.value.trim();
                        const description = descInput?.value.trim();

                        if (!name) {
                            window.navigationManager.showNotification('Please enter a dashboard name', 'warning');
                            return false; // Prevent modal from closing
                        }

                        this.startNewDashboard(name, description);
                        return true; // Allow modal to close
                    }}
                ]
            );

            // Focus the name input after modal opens
            setTimeout(() => {
                const nameInput = document.getElementById('newDashboardNameInput');
                if (nameInput) {
                    nameInput.focus();
                }
            }, 100);
        }
    }

    ///This is for creating new dashboards
    async startNewDashboard(name, description = '') {
    // COMPLETELY CLEAR previous dashboard state
    this.clearCurrentDashboard();

    try {

        console.log("test",{ name, description })
        // API call to create dashboard on backend
        //https://edge.ncgafrica.com:5000
        const response = await fetch('https://edge.ncgafrica.com:5000/create-dashboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();


        if (response.ok && data) {
            // Create new dashboard object with server response data
            this.currentDashboard = {
                id: data.id || Date.now().toString(), // Use server ID if available
                name: data.name || name,
                description: data.description || description,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                lastModified: new Date(),
                widgets: [],

                    // June: publish/draft properties
                    isDraft: true,
                    isPublished: false,
                    publishedAt: null,
                    publishedBy: null,
                    version: 1,
                    publishedVersion: null,

                    // Draft-specific properties
                    draftChanges: [],
                    lastSavedAt: new Date(),
                    autoSaveEnabled: true,

                    // Collaboration properties
                    owner: this.getCurrentUser(),
                    collaborators: [],
                    permissions: {
                        canEdit: true,
                        canPublish: true,
                        canShare: true
                    }
            };

            // Update localStorage with the new dashboard
                const savedDashboards = await this.getSavedDashboards();
            savedDashboards.unshift(this.currentDashboard);
            localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));

            // Update builder screen title and state
            this.updateBuilderTitle();
            this.resetBuilderState();
                this.updatePublishState();

                // Start auto-save for draft
                this.startAutoSave();

            // Switch to builder screen
            this.showScreen('builder');

            // Show success notification
            if (response.ok) {
                window.navigationManager.showNotification(`Created dashboard "${name}"`, 'success');
            }

        }else{
                 window.navigationManager.showNotification(data.message, "error");
            }

    } catch (error) {
        console.error('Error creating dashboard:', error);

        // Fallback: Create dashboard locally if API fails
        this.currentDashboard = {
            id: `temp-${Date.now()}`, // Mark as temporary
            name: name,
            description: description,
            createdAt: new Date(),
            lastModified: new Date(),
            widgets: [],
                isDraft: true,
                isPublished: false,
                autoSaveEnabled: true,
                owner: this.getCurrentUser(),
                permissions: {
                    canEdit: true,
                    canPublish: true,
                    canShare: true
                }
        };

        // Update builder screen title and state
        this.updateBuilderTitle();
        this.resetBuilderState();
            this.updatePublishState();

            // Start auto-save for draft
            this.startAutoSave();

        // Switch to builder screen
        this.showScreen('builder');

        // Show error notification
        if (window.navigationManager) {
            window.navigationManager.showNotification(
                error.message || 'Failed to create dashboard on server. Created locally.',
                'warning'
            );
        }
    }
}

    clearCurrentDashboard() {
        // Stop auto-save
        this.stopAutoSave();

        // Clear all widget-related state
        this.widgets = [];
        this.selectedWidget = null;
        this.widgetCounter = 0;

        // Clear any existing charts
        if (window.chartRenderer) {
            window.chartRenderer.destroyAllCharts();
        }

        // Clear the widget canvas
        const canvas = document.getElementById('widgetCanvas');
        if (canvas) {
            canvas.innerHTML = '';
            canvas.classList.add('hidden');
        }

        // Show empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }

        // Clear any bottom sheet editors
        const bottomSheet = document.querySelector('.bottom-sheet-editor');
        if (bottomSheet) {
            bottomSheet.remove();
        }

        // Reset current dashboard
        this.currentDashboard = null;

        // Reset publish state
        this.publishState = {
            isPublishing: false,
            isUnpublishing: false,
            lastPublished: null,
            publishedVersion: null,
            draftVersion: null,
            autoSaveInterval: null
        };
    }

    resetBuilderState() {
        // Reset publish state
        const toggle = document.querySelector('#builderScreen .toggle-switch input');
        if (toggle) {
            toggle.checked = false;
        }

        const statusElement = document.querySelector('#builderScreen .text-sm.text-gray-500');
        if (statusElement) {
            statusElement.textContent = 'Draft';
            statusElement.className = 'text-sm text-gray-500';
        }

        // Reset publish button
        const publishBtn = document.querySelector('.publish-btn');
        if (publishBtn) {
            publishBtn.innerHTML = 'Publish';
            publishBtn.disabled = false;
        }

        // Hide selected widget title
        const selectedWidgetTitle = document.getElementById('selectedWidgetTitle');
        if (selectedWidgetTitle) {
            selectedWidgetTitle.classList.add('hidden');
        }

        // Update last saved time
        if (this.screens.builder) {
            this.screens.builder.lastSaved = new Date();
            this.screens.builder.updateLastSavedTime();
        }
    }

    updateBuilderTitle() {
        const nameInput = document.getElementById('dashboardNameInput');
        if (nameInput && this.currentDashboard) {
            nameInput.value = this.currentDashboard.name;
            this.autoResizeNameInput(nameInput);
        }
    }

    // June: updated the save function to track drafting
    async saveDashboard(options = {}) {
        if (!this.currentDashboard) return false;

        const {
            isDraft = this.currentDashboard.isDraft,
            skipNotification = false,
            saveToBackend = true
        } = options;

        try {
        // Joseph: Review this Update dashboard data
        this.currentDashboard.widgets = [...this.widgets];
        this.currentDashboard.lastModified = new Date();
            this.currentDashboard.lastSavedAt = new Date();
            this.currentDashboard.isDraft = isDraft;

            // Track changes if it's a draft
            if (isDraft) {
                this.trackDraftChanges();
            }

            // Save to backend if enabled
            if (saveToBackend) {
            
                try {
                    const response = await fetch(`https://edge.ncgafrica.com:5000/update-dashboard/${this.currentDashboard.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(this.currentDashboard)
                    });

                    if (response.ok) {
                        console.log('Dashboard saved  successfully');
        } else {
                        console.warn('Failed to save to backend, using localStorage only');
                    }
                } catch (error) {
                    console.error('Error saving to backend:', error);
                }
        }

        // Save to localStorage
            const savedDashboards = await this.getSavedDashboards();
            const existingIndex = savedDashboards.findIndex(d => d.id == this.currentDashboard.id);

        if (existingIndex >= 0) {
                savedDashboards[existingIndex] = { ...this.currentDashboard };
        } else {
                savedDashboards.unshift({ ...this.currentDashboard });
        }

            localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));

            // Update home screen
            if (this.screens.dashboard) {
                await this.screens.dashboard.loadSavedDashboards();
            }

            // Update last saved time display
            this.updateLastSavedTime();

            if (!skipNotification && window.navigationManager) {
                const message = isDraft ? 'Draft saved' : 'Dashboard saved';
                window.navigationManager.showNotification(message, 'success');
            }

            return true;
        } catch (error) {
            console.error('Error saving dashboard:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to save dashboard', 'error');
            }

            return false;
        }
    }

    // Publish dashboard function
    async publishDashboard() {
        if (!this.currentDashboard) {
            if (window.navigationManager) {
                window.navigationManager.showNotification('No dashboard to publish', 'warning');
            }
            return false;
        }

        // Check if user has publish permissions
        if (!this.currentDashboard.permissions.canPublish) {
            if (window.navigationManager) {
                window.navigationManager.showNotification('You do not have permission to publish', 'error');
            }
            return false;
        }

        try {
            this.publishState.isPublishing = true;
            this.updatePublishButton(true);

            // Validate dashboard before publishing
            const validationResult = this.validateDashboardForPublish();
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            // Save current state as published version
            const publishData = {
                ...this.currentDashboard,
                isDraft: false,
                isPublished: true,
                publishedAt: new Date(),
                publishedBy: this.getCurrentUser(),
                publishedVersion: this.currentDashboard.version,
                version: this.currentDashboard.version + 1
            };

            // Send to backend
            await this.publishDashboardToBackend(publishData);

            // Update local state
            this.currentDashboard = { ...publishData };
            this.publishState.lastPublished = new Date();
            this.publishState.publishedVersion = publishData.publishedVersion;

            // Save to localStorage
            await this.saveDashboard({
                isDraft: false,
                skipNotification: true
            });

            // Update UI
            this.updatePublishState();
            this.stopAutoSave(); // Stop auto-save for published dashboards

            if (window.navigationManager) {
                window.navigationManager.showNotification(
                    `Dashboard "${this.currentDashboard.name}" published successfully`,
                    'success'
                );
            }

            return true;

        } catch (error) {
            console.error('Error publishing dashboard:', error);

            if (window.navigationManager) {
                window.navigationManager.showNotification(
                    `Failed to publish: ${error.message}`,
                    'error'
                );
            }

            return false;

        } finally {
            this.publishState.isPublishing = false;
            this.updatePublishButton(false);
        }
    }

    // Unpublish dashboard (revert to draft)
    async unpublishDashboard() {
        if (!this.currentDashboard || !this.currentDashboard.isPublished) {
            if (window.navigationManager) {
                window.navigationManager.showNotification('Dashboard is not published', 'warning');
            }
            return false;
        }

        try {
            this.publishState.isUnpublishing = true;
            this.updatePublishButton(true);

            // Send unpublish request to backend
            await this.unpublishDashboardFromBackend();

            // Update local state
            this.currentDashboard.isDraft = true;
            this.currentDashboard.isPublished = false;
            this.currentDashboard.publishedAt = null;
            this.currentDashboard.publishedBy = null;
            this.currentDashboard.lastModified = new Date();

            // Save changes
            await this.saveDashboard({
                isDraft: true,
                skipNotification: true
            });

            // Update UI
            this.updatePublishState();
            this.startAutoSave(); // Resume auto-save for drafts

            if (window.navigationManager) {
                window.navigationManager.showNotification(
                    `Dashboard "${this.currentDashboard.name}" reverted to draft`,
                    'info'
                );
            }

            return true;

        } catch (error) {
            console.error('Error unpublishing dashboard:', error);

            if (window.navigationManager) {
                window.navigationManager.showNotification(
                    `Failed to unpublish: ${error.message}`,
                    'error'
                );
            }

            return false;
        } finally {
            this.publishState.isUnpublishing = false;
            this.updatePublishButton(false);
        }
    }

    // Toggle publish state (for UI toggle)
    async togglePublishState() {
        if (this.publishState.isPublishing || this.publishState.isUnpublishing) {
            return; // Prevent multiple simultaneous operations
        }

        if (this.currentDashboard.isPublished) {
            await this.unpublishDashboard();
        } else {
            await this.publishDashboard();
        }
    }

    // Validate dashboard before publishing
    validateDashboardForPublish() {
        const validationErrors = [];

        // Check dashboard name
        if (!this.currentDashboard.name || this.currentDashboard.name.trim() === '') {
            validationErrors.push('Dashboard name is required');
        }

        // Check if dashboard has at least one widget
        if (!this.widgets || this.widgets.length === 0) {
            validationErrors.push('Dashboard must have at least one widget');
        }

        // Check if widgets have data
        const widgetsWithoutData = this.widgets.filter(w => !w.hasData && w.type !== 'text-header');
        if (widgetsWithoutData.length > 0) {
            validationErrors.push(`${widgetsWithoutData.length} widget(s) have no data configured`);
        }

        // Check for broken widgets
        const brokenWidgets = this.widgets.filter(w => w.error);
        if (brokenWidgets.length > 0) {
            validationErrors.push(`${brokenWidgets.length} widget(s) have errors`);
        }

        return {
            isValid: validationErrors.length === 0,
            message: validationErrors.join(', '),
            errors: validationErrors
        };
    }

    // Joseph: Review this for Publish Dashboard
    async publishDashboardToBackend(publishData) {
        try {
            const response = await fetch('https://edge.ncgafrica.com:5000/api/dashboards/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    dashboardId: publishData.id,
                    publishData: publishData,
                    publishedBy: this.getCurrentUser()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Dashboard published to backend:', result);

            return result;

        } catch (error) {
            console.error('Error publishing to backend:', error);
            throw error;
        }
    }
// Joseph: Review this for UnPublish Dashboard
    async unpublishDashboardFromBackend() {
        try {
            const response = await fetch(`https://edge.ncgafrica.com:5000/api/dashboards/${this.currentDashboard.id}/unpublish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Dashboard unpublished from backend:', result);

            return result;

        } catch (error) {
            console.error('Error unpublishing from backend:', error);
            throw error;
        }
        }

    // Auto-save functionality for drafts
    startAutoSave() {
        if (this.publishState.autoSaveInterval) {
            clearInterval(this.publishState.autoSaveInterval);
        }

        if (this.currentDashboard && this.currentDashboard.autoSaveEnabled && this.currentDashboard.isDraft) {
            this.publishState.autoSaveInterval = setInterval(() => {
                this.saveDashboard({
                    isDraft: true,
                    skipNotification: true
                });
            }, 30000); // Auto-save every 30 seconds

            console.log('Auto-save enabled for draft dashboard');
        }
    }

    stopAutoSave() {
        if (this.publishState.autoSaveInterval) {
            clearInterval(this.publishState.autoSaveInterval);
            this.publishState.autoSaveInterval = null;
            console.log('Auto-save disabled');
        }
    }

    // Track changes for draft history
    trackDraftChanges() {
        if (!this.currentDashboard.draftChanges) {
            this.currentDashboard.draftChanges = [];
        }

        const change = {
            timestamp: new Date(),
            type: 'save',
            widgetCount: this.widgets.length,
            user: this.getCurrentUser(),
            changes: this.getChangeSummary()
        };

        this.currentDashboard.draftChanges.push(change);

        // Keep only last 50 changes
        if (this.currentDashboard.draftChanges.length > 50) {
            this.currentDashboard.draftChanges = this.currentDashboard.draftChanges.slice(-50);
    }
    }

    getChangeSummary() {
        //change detection
        return {
            widgetCount: this.widgets.length,
            lastModified: new Date(),
            hasData: this.widgets.filter(w => w.hasData).length
        };
    }

    // UI Update
    updatePublishState() {
        const toggle = document.querySelector('#builderScreen .toggle-switch input');
        const statusElement = document.querySelector('#builderScreen .text-sm.text-gray-500');
        const publishBtn = document.querySelector('.publish-btn');

        if (toggle) {
            toggle.checked = this.currentDashboard.isPublished;

            // Add change event listener if not already added
            if (!toggle.hasAttribute('data-listener-added')) {
                toggle.addEventListener('change', (e) => {
                    this.togglePublishState();
                });
                toggle.setAttribute('data-listener-added', 'true');
            }
    }

        if (statusElement) {
            if (this.currentDashboard.isPublished) {
                statusElement.textContent = 'Published';
                statusElement.className = 'text-sm text-green-600';
            } else {
                statusElement.textContent = 'Draft';
                statusElement.className = 'text-sm text-gray-500';
            }
        }

        if (publishBtn) {
            if (this.currentDashboard.isPublished) {
                publishBtn.textContent = 'Update';
                publishBtn.classList.remove('bg-teal-600', 'hover:bg-teal-700');
                publishBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            } else {
                publishBtn.textContent = 'Publish';
                publishBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                publishBtn.classList.add('bg-teal-600', 'hover:bg-teal-700');
            }
        }
    }

    updatePublishButton(isProcessing) {
        const publishBtn = document.querySelector('.publish-btn');
        if (publishBtn) {
            publishBtn.disabled = isProcessing;

            if (isProcessing) {
                if (this.publishState.isPublishing) {
                    publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Publishing...';
                } else if (this.publishState.isUnpublishing) {
                    publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Unpublishing...';
                }
            } else {
                publishBtn.innerHTML = this.currentDashboard.isPublished ? 'Update' : 'Publish';
            }
        }
    }

    updateLastSavedTime() {
        const lastSavedElement = document.querySelector('#builderScreen .text-xs.text-gray-400');
        if (lastSavedElement && this.currentDashboard.lastSavedAt) {
            const timeString = this.currentDashboard.lastSavedAt.toLocaleTimeString();
            lastSavedElement.textContent = `last saved today ${timeString}`;
        }
    }

    // June: Update this once we start getting user data
    getCurrentUser() {
        // Get current user from  system
        return {
            id: localStorage.getItem('userId') || 'user-1',
            name: localStorage.getItem('userName') || 'Current User',
            email: localStorage.getItem('userEmail') || 'user@example.com'
        };
    }
    // June: Update this once we start getting user data
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    // updated getSavedDashboards with API integration
    async getSavedDashboards() {
    try {
        // First, try to get from API
        const response = await fetch('https://edge.ncgafrica.com:5000/alldashboards', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const allData = await response.json();
                const data = allData.data;

            // Update localStorage with fresh data from API
            if (data && Array.isArray(data)) {
                localStorage.setItem('savedDashboards', JSON.stringify(data));

                return data;
            } else if (data && data.dashboards && Array.isArray(data.dashboards)) {
                localStorage.setItem('savedDashboards', JSON.stringify(data.dashboards));
                return data.dashboards;
            }
        }
    } catch (error) {
        console.error('Error fetching dashboards from API:', error);
        // Fall back to localStorage if API fails
    }

    // Fallback: get from localStorage
    try {
        const saved = localStorage.getItem('savedDashboards');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading saved dashboards from localStorage:', error);
        return [];
    }
}
    // getSavedDashboards() {
    //     // API TODO: Replace localStorage with API call
    //     // API Endpoint: GET /api/dashboards
    //     // Query params: ?user_id={id}&folder_id={id}&status={draft|published}
    //     // Response: { dashboards: [], total_count, pagination }
    //       fetch('http://localhost:5000/alldashboards', {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },

    // })
    // .then(res => res.json())
    // .then(data => {
    //     console.log("alldar",data)

    //     if (data.message=="Database error") {
    //         window.navigationManager.showNotification(data.message || 'Failed to load dashboard from DB', 'error');
    //     }
    //       try {
    //        const saved = localStorage.setItem('savedDashboards', (data));
    //         return saved ? data : [];
    //     } catch (error) {
    //          console.error('Error loading saved dashboards:', error);
    //         return [];
    //     }
    // })
    // .catch(err => {
    //     console.error(err);
    //     window.navigationManager.showNotification('An error occurred', 'error');
    // });




    //     try {
    //         const saved = localStorage.getItem('savedDashboards');
    //         return saved ? JSON.parse(saved) : [];
    //     } catch (error) {
    //         console.error('Error loading saved dashboards:', error);
    //         return [];
    //     }

    // }

    async loadDashboard(dashboardId) {
        console.log("Loading dashboardId:", dashboardId);

        try {
            // First, try to get specific dashboard from API
            const response = await fetch(`https://edge.ncgafrica.com:5000/render/${dashboardId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const allData = await response.json();
                const data = allData.data;
                console.log("Single dashboard from API:", data);

                // If API returns the specific dashboard, use it directly
                if (data && !Array.isArray(data)) {
                    // Single dashboard object
                    const dashboard = data;
                    this.loadDashboardData(dashboard);
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching specific dashboard from API:', error);
        }

        // Fallback: Get from saved dashboards
        const savedDashboards = await this.getSavedDashboards();
        console.log("savedDashboards:", savedDashboards);

        const dashboard = savedDashboards.find(d => d.id == dashboardId);
        console.log("Found dashboard:", dashboard);

            if (!dashboard) {
                if (window.navigationManager) {
                    window.navigationManager.showNotification('Dashboard not found', 'error');
                }
                return;
            }

        this.loadDashboardData(dashboard);
        }





loadDashboardData(dashboard) {
  // Clear current state first
  this.clearCurrentDashboard();

  // Load dashboard data
  this.currentDashboard = {
            ...dashboard,
            // Ensure all required properties exist
            isDraft: dashboard.isDraft !== undefined ? dashboard.isDraft : !dashboard.isPublished,
            isPublished: dashboard.isPublished || false,
            draftChanges: dashboard.draftChanges || [],
            autoSaveEnabled: dashboard.autoSaveEnabled !== undefined ? dashboard.autoSaveEnabled : true,
            permissions: dashboard.permissions || {
                canEdit: true,
                canPublish: true,
                canShare: true
            },
            owner: dashboard.owner || this.getCurrentUser(),
            version: dashboard.version || 1,
            publishedVersion: dashboard.publishedVersion || null,
            lastSavedAt: dashboard.lastSavedAt ? new Date(dashboard.lastSavedAt) : new Date()
        };
  // ✅ Safely prepare widgets
  const rawWidgets = Array.isArray(dashboard.widgets) ? dashboard.widgets : [];

  this.widgets = rawWidgets.map((w, index) => {
    // Ensure widget has an ID
    if (!w.id) {
      w.id = `widget-${index + 1}`;
    }

    // Ensure widget has a layout
    if (!w.layout) {
      w.layout = { width: 4, height: 3, x: 0, y: 0 };
    }

    return w;
  });

  // Set widget counter safely
  this.widgetCounter = Math.max(
    ...this.widgets.map(w => {
      if (w.id && typeof w.id === 'string' && w.id.includes('-')) {
        return parseInt(w.id.split('-')[1]) || 0;
      }
      return 0;
    }),
    0
  );
 //this.widgets = dashboard.widgets ? [...dashboard.widgets] : [];
  this.selectedWidget = null;
            this.widgetCounter = Math.max(...this.widgets.map(w => parseInt(w.id.split('-')[1]) || 0), 0);

  // Update builder screen
  this.updateBuilderTitle();
  this.resetBuilderState();
            this.updatePublishState();
              // Start auto-save for drafts
                    if (this.currentDashboard.isDraft) {
                        this.startAutoSave();
  }

  // Render widgets
  this.renderWidgets();

  // Switch to builder screen
  this.showScreen('builder');

  if (window.navigationManager) {
               const status = this.currentDashboard.isPublished ? 'published' : 'draft';
                window.navigationManager.showNotification(
                    `Loaded ${status} dashboard "${dashboard.name}"`,
                    'success'
                );
                //window.navigationManager.showNotification(`Loaded dashboard "${dashboard.name}"`, 'success');
  }
}


    async saveDashboard() {
            if (!this.currentDashboard) return;

            // Update dashboard data
            this.currentDashboard.widgets = [...this.widgets];
            this.currentDashboard.lastModified = new Date();

            try {
                // Try to save to API first
                const response = await fetch(`https://edge.ncgafrica.com:5000/update-dashboard/${this.currentDashboard.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.currentDashboard)
                });

                if (response.ok) {
                    console.log('Dashboard saved to API successfully');
                } else {
                    console.warn('Failed to save to API, using localStorage only');
                }
            } catch (error) {
                console.error('Error saving to API:', error);
            }

            // Get existing dashboards from localStorage
            const savedDashboards = await this.getSavedDashboards();

            // Find existing dashboard or add new one
            const existingIndex = savedDashboards.findIndex(d => d.id == this.currentDashboard.id);
            if (existingIndex >= 0) {
                savedDashboards[existingIndex] = this.currentDashboard;
                console.log("UPDATED existing dashboard in localStorage:", this.currentDashboard);
            } else {
                savedDashboards.unshift(this.currentDashboard);
                console.log("ADDED new dashboard to localStorage:", this.currentDashboard);
            }

            // Save to localStorage
            try {
                localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));
                console.log(" ALL DASHBOARDS in localStorage after save:", savedDashboards);

                // Update home screen to show the saved dashboard
                if (this.screens.dashboard) {
                    await this.screens.dashboard.loadSavedDashboards();
                }

                return true;
            } catch (error) {
                console.error(' Error saving dashboard to localStorage:', error);
                if (window.navigationManager) {
                    window.navigationManager.showNotification('Failed to save dashboard', 'error');
                }
                return false;
            }
    }

    //DELETE DASHBOARD
    async deleteDashboard(dashboardId) {
        console.log("Deleting dashboardId:", dashboardId);

    try {
        //  delete from API first
        const response = await fetch(`https://edge.ncgafrica.com:5000/delete-dashboard/${dashboardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('Dashboard deleted from API successfully');
        } else {
            console.warn('Failed to delete from API, removing from localStorage only');
        }
    } catch (error) {
        console.error('Error deleting from API:', error);
    }

    // Update localStorage
    const savedDashboards = await this.getSavedDashboards();
    const updatedDashboards = savedDashboards.filter(d => d.id != dashboardId);

    try {
        localStorage.setItem('savedDashboards', JSON.stringify(updatedDashboards));

        // If  editing the deleted dashboard, clear it
        if (this.currentDashboard && this.currentDashboard.id == dashboardId) {
            this.clearCurrentDashboard();
            this.showScreen('dashboard');
        }

        // Update home screen
        if (this.screens.dashboard) {
            await this.screens.dashboard.loadSavedDashboards();
        }

        if (window.navigationManager) {
            window.navigationManager.showNotification('Dashboard deleted', 'success');
        }
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        if (window.navigationManager) {
            window.navigationManager.showNotification('Failed to delete dashboard', 'error');
        }
    }
}

    // June: Updated the addWidget function to tack drafts and publishing
    addWidget(type) {
        this.widgetCounter++;
        const position = this.getNextPosition();

        const widget = {
            id: `widget-${this.widgetCounter}`,
            type: type,
            title: this.getDefaultTitle(type),
            content: type === 'text-header' ? 'New Header' : undefined,
            data: null,
            isExpanded: false,
            isMinimized: false,
            apiEndpoint: '',
            refreshInterval: 30000,
            lastUpdated: new Date(),
            hasData: false,
            position: position,
            size: this.getDefaultSize(type),
            selectedCategories: []
        };

        this.widgets.push(widget);
        this.renderWidgets();
        this.selectWidget(widget.id);

        // Mark dashboard as draft if widget is added
        if (this.currentDashboard && this.currentDashboard.isPublished) {
            this.currentDashboard.isDraft = true;
            this.updatePublishState();
        }

        // Auto-save dashboard: No need for notification banner
        this.saveDashboard({ skipNotification: true });

        // Update builder screen state
        if (this.screens.builder) {
            this.screens.builder.hideEmptyState();
        }
    }

    getNextPosition() {
        const spacing = 22;
        const startX = 20;
        const startY = 20;

        if (this.widgets.length === 0) {
            return { x: startX, y: startY };
        }

        // Find the rightmost widget edge
        let rightmostX = startX;
        this.widgets.forEach(widget => {
            const widgetRight = widget.position.x + widget.size.width;
            if (widgetRight > rightmostX) {
                rightmostX = widgetRight;
            }
        });

        // Position new widget to the right with spacing
        return { x: rightmostX + spacing, y: startY };
    }

    getDefaultSize(type) {
        switch (type) {
            case 'table':
                return { width: 400, height: 300 };
            case 'text-header':
                return { width: 300, height: 60 };
            default:
                return { width: 300, height: 250 };
        }
    }

    getDefaultTitle(type) {
        const titles = {
            'text-header': 'Text Header',
            table: 'Data Table',
            donut: 'Donut Chart',
            pie: 'Pie Chart',
            bar: 'Bar Chart',
            histogram: 'Histogram',
            line: 'Line Chart',
            'single-value': 'Single Value'
        };
        return titles[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`;
    }

    selectWidget(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        this.selectedWidget = this.selectedWidget?.id === widgetId ? null : widget;
        this.renderWidgets();

        // Update builder screen header
        if (this.screens.builder) {
            this.screens.builder.updateSelectedWidgetTitle(this.selectedWidget);
        }
    }

    // June: updated  deleteWidget function
    deleteWidget(widgetId) {
        this.widgets = this.widgets.filter(w => w.id !== widgetId);
        if (this.selectedWidget?.id === widgetId) {
            this.selectedWidget = null;
        }
        this.renderWidgets();

        // Mark dashboard as draft if widget is deleted
        if (this.currentDashboard && this.currentDashboard.isPublished) {
            this.currentDashboard.isDraft = true;
            this.updatePublishState();
        }

        // Auto-save dashboard
        this.saveDashboard({ skipNotification: true });

        // Update builder screen state
        if (this.widgets.length === 0 && this.screens.builder) {
            this.screens.builder.showEmptyState();
        }

        if (window.navigationManager) {
            window.navigationManager.showNotification('Widget deleted successfully', 'success');
        }
    }

    renderWidgets() {
        const canvas = document.getElementById('widgetCanvas');
        const emptyState = document.getElementById('emptyState');

        if (this.widgets.length === 0) {
            if (canvas) canvas.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (canvas) canvas.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        if (window.chartRenderer) {
            window.chartRenderer.destroyAllCharts();
        }

        if (canvas) {
            canvas.innerHTML = '';

            this.widgets.forEach(widget => {
                const widgetElement = this.createWidgetElement(widget);
                canvas.appendChild(widgetElement);

                // Add bottom sheet editor if widget is selected
                if (this.selectedWidget?.id === widget.id && window.widgetRenderer) {
                    window.widgetRenderer.createBottomSheetEditor(widgetElement, widget);
                }
            });
        }

        if (window.chartRenderer) {
            requestAnimationFrame(() => {
                window.chartRenderer.renderAllCharts();
            });
        }

        // Auto-save when widgets are modified (for drafts only)
        if (this.currentDashboard && this.currentDashboard.isDraft) {
            this.saveDashboard({ skipNotification: true });
        }
    }

    createWidgetElement(widget) {
        if (window.widgetRenderer) {
            return window.widgetRenderer.createWidget(widget, this.selectedWidget);
        }

        // Fallback widget creation
        const div = document.createElement('div');
        div.className = 'widget-card';
        div.dataset.widgetId = widget.id;
        div.innerHTML = `<div class="p-4">Widget: ${widget.title}</div>`;
        return div;
    }

    cleanup() {
        // Stop auto-save
        this.stopAutoSave();

        // Cleanup screen managers
        Object.values(this.screens).forEach(screen => {
            if (screen.cleanup) {
                screen.cleanup();
            }
        });

        // Clear any remaining intervals
        if (this.publishState.autoSaveInterval) {
            clearInterval(this.publishState.autoSaveInterval);
        }
    }
}