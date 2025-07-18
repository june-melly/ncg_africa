// Settings management without mock data
export class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.activeTab = 'general';
        this.loadSettings();
    }
    
    getDefaultSettings() {
        return {
            dashboardName: '',
            description: '',
            timezone: 'UTC',
            language: 'en',
            notifications: {
                email: false,
                push: false,
                slack: false
            },
            theme: 'light',
            autoRefresh: false,
            refreshInterval: 30
        };
    }
    
    init() {
        this.renderSettings();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.showTab(tabName);
            });
        });
        
        // Save changes button
        const saveBtn = document.querySelector('.save-changes-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }
    
    showTab(tabName) {
        this.activeTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('bg-teal-50', 'text-teal-700', 'border', 'border-teal-200');
            tab.classList.add('text-gray-600', 'hover:bg-gray-50');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('bg-teal-50', 'text-teal-700', 'border', 'border-teal-200');
            activeTab.classList.remove('text-gray-600', 'hover:bg-gray-50');
        }
        
        this.renderTabContent();
    }
    
    renderSettings() {
        this.renderTabContent();
    }
    
    renderTabContent() {
        const container = document.getElementById('settingsContent');
        if (!container) return;
        
        switch (this.activeTab) {
            case 'general':
                container.innerHTML = this.renderGeneralSettings();
                break;
            case 'notifications':
                container.innerHTML = this.renderNotificationSettings();
                break;
            case 'security':
                container.innerHTML = this.renderSecuritySettings();
                break;
            case 'appearance':
                container.innerHTML = this.renderAppearanceSettings();
                break;
            default:
                container.innerHTML = '<p class="text-gray-500">Settings content coming soon</p>';
        }
        
        this.setupTabEventListeners();
    }
    
    renderGeneralSettings() {
        return `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                    <input type="text" value="${this.settings.dashboardName}" 
                           placeholder="Enter dashboard name"
                           class="dashboard-name w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea rows="3" placeholder="Describe your dashboard"
                              class="description w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">${this.settings.description}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select class="timezone w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="UTC" ${this.settings.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                            <option value="EST" ${this.settings.timezone === 'EST' ? 'selected' : ''}>Eastern Time</option>
                            <option value="PST" ${this.settings.timezone === 'PST' ? 'selected' : ''}>Pacific Time</option>
                            <option value="GMT" ${this.settings.timezone === 'GMT' ? 'selected' : ''}>Greenwich Mean Time</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select class="language w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="es" ${this.settings.language === 'es' ? 'selected' : ''}>Spanish</option>
                            <option value="fr" ${this.settings.language === 'fr' ? 'selected' : ''}>French</option>
                            <option value="de" ${this.settings.language === 'de' ? 'selected' : ''}>German</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderNotificationSettings() {
        return `
            <div class="space-y-6">
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-sm font-medium text-gray-900">Email Notifications</h4>
                            <p class="text-sm text-gray-500">Receive updates via email</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="email-notifications" ${this.settings.notifications.email ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-sm font-medium text-gray-900">Push Notifications</h4>
                            <p class="text-sm text-gray-500">Receive browser notifications</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="push-notifications" ${this.settings.notifications.push ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-sm font-medium text-gray-900">Slack Integration</h4>
                            <p class="text-sm text-gray-500">Send alerts to Slack channels</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="slack-notifications" ${this.settings.notifications.slack ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSecuritySettings() {
        return `
            <div class="space-y-6">
                <div class="text-center py-12">
                    <i class="fas fa-shield-alt text-gray-400 text-6xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
                    <p class="text-gray-500 mb-4">Configure authentication and access controls</p>
                    <p class="text-sm text-gray-400">Security features will be available in a future update</p>
                </div>
            </div>
        `;
    }
    
    renderAppearanceSettings() {
        return `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                    <div class="grid grid-cols-3 gap-3">
                        ${['light', 'dark', 'auto'].map(theme => `
                            <button class="theme-option p-4 border rounded-lg text-center capitalize transition-colors ${
                                this.settings.theme === theme
                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                    : 'border-gray-300 hover:border-gray-400'
                            }" data-theme="${theme}">
                                ${theme}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-medium text-gray-900">Auto Refresh</h4>
                        <p class="text-sm text-gray-500">Automatically refresh dashboard data</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" class="auto-refresh" ${this.settings.autoRefresh ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                ${this.settings.autoRefresh ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                        <select class="refresh-interval w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                            <option value="10" ${this.settings.refreshInterval === 10 ? 'selected' : ''}>10 seconds</option>
                            <option value="30" ${this.settings.refreshInterval === 30 ? 'selected' : ''}>30 seconds</option>
                            <option value="60" ${this.settings.refreshInterval === 60 ? 'selected' : ''}>1 minute</option>
                            <option value="300" ${this.settings.refreshInterval === 300 ? 'selected' : ''}>5 minutes</option>
                        </select>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    setupTabEventListeners() {
        const container = document.getElementById('settingsContent');
        
        // General settings
        const dashboardName = container.querySelector('.dashboard-name');
        if (dashboardName) {
            dashboardName.addEventListener('change', (e) => {
                this.settings.dashboardName = e.target.value;
            });
        }
        
        const description = container.querySelector('.description');
        if (description) {
            description.addEventListener('change', (e) => {
                this.settings.description = e.target.value;
            });
        }
        
        // Theme selection
        container.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.settings.theme = e.target.dataset.theme;
                this.renderTabContent();
            });
        });
        
        // Notification toggles
        const emailToggle = container.querySelector('.email-notifications');
        if (emailToggle) {
            emailToggle.addEventListener('change', (e) => {
                this.settings.notifications.email = e.target.checked;
            });
        }
        
        const pushToggle = container.querySelector('.push-notifications');
        if (pushToggle) {
            pushToggle.addEventListener('change', (e) => {
                this.settings.notifications.push = e.target.checked;
            });
        }
        
        const slackToggle = container.querySelector('.slack-notifications');
        if (slackToggle) {
            slackToggle.addEventListener('change', (e) => {
                this.settings.notifications.slack = e.target.checked;
            });
        }
        
        // Auto refresh
        const autoRefreshToggle = container.querySelector('.auto-refresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                this.settings.autoRefresh = e.target.checked;
                this.renderTabContent();
            });
        }
    }
    
    saveSettings() {
        // API TODO: Save settings to backend instead of localStorage
        // API Endpoint: PUT /api/user/settings
        // Payload: { settings object }
        // Should validate settings, handle conflicts, sync across devices
        
        try {
            localStorage.setItem('dashboardSettings', JSON.stringify(this.settings));
            if (window.navigationManager) {
                window.navigationManager.showNotification('Settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to save settings', 'error');
            }
        }
    }
    
    loadSettings() {
        // API TODO: Load settings from backend
        // API Endpoint: GET /api/user/settings
        // Should handle defaults, migration from old settings format
        
        try {
            const saved = localStorage.getItem('dashboardSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    resetSettings() {
        // API TODO: Reset settings to defaults
        // API Endpoint: DELETE /api/user/settings
        // Should confirm with user before resetting
        
        this.settings = this.getDefaultSettings();
        this.renderTabContent();
        
        if (window.navigationManager) {
            window.navigationManager.showNotification('Settings reset to defaults', 'success');
        }
    }
    
    exportSettings() {
        // API TODO: Export settings for backup/migration
        // Could generate downloadable JSON file or provide shareable link
        
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dashboard-settings.json';
        link.click();
        
        URL.revokeObjectURL(url);
        
        if (window.navigationManager) {
            window.navigationManager.showNotification('Settings exported successfully', 'success');
        }
    }
    
    importSettings(settingsData) {
        // API TODO: Import settings from backup
        // Should validate imported data, merge with existing settings
        
        try {
            const importedSettings = JSON.parse(settingsData);
            this.settings = { ...this.getDefaultSettings(), ...importedSettings };
            this.renderTabContent();
            
            if (window.navigationManager) {
                window.navigationManager.showNotification('Settings imported successfully', 'success');
            }
        } catch (error) {
            console.error('Error importing settings:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to import settings', 'error');
            }
        }
    }
}