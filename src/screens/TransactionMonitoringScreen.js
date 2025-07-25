// Transaction Monitoring Screen - Design Match Version
export class TransactionMonitoringScreen {
    constructor(app) {
        this.app = app;
        this.currentView = 'grid';
        this.showAlert = true;
        this.dateRange = this.getDefaultDateRange();
        this.isInitialized = false;
        this.transactionData = [];
        this.isLoading = false;
        this.error = null;
        this.alertMessage = '';
        this.darkModeManager = null;
        this.darkModeCleanup = null;

        // Fixed channel names (5 channels constant)
        this.channelNames = ['USSD', 'SMS', 'API', 'POS', 'Mobile'];

        // User and notification data
        this.userData = {
            name: 'Loading...',
            role: 'Loading...',
            avatar: null
        };
        this.notificationCount = 0;

        // API endpoints
        this.apiEndpoints = {
            transactions: 'http://localhost:5000/api/transactions',
            alerts: 'http://localhost:5000/api/alerts',
            statistics: 'http://localhost:5000/api/transaction-stats',
            user: 'http://localhost:5000/api/user/profile',
            notifications: 'http://localhost:5000/api/notifications'
        };
    }

    init() {
        if (this.isInitialized) return;

        try {
            this.setupDarkModeIntegration();
            this.isInitialized = true;
            console.log('TransactionMonitoringScreen initialized');
        } catch (error) {
            console.error('Failed to initialize TransactionMonitoringScreen:', error);
        }
    }

    setupDarkModeIntegration() {
        this.darkModeManager = window.darkModeManager || {
            isDarkMode: false,
            toggleDarkMode: () => {
                this.darkModeManager.isDarkMode = !this.darkModeManager.isDarkMode;
                document.documentElement.classList.toggle('dark', this.darkModeManager.isDarkMode);
                if (this.themeChangeCallback) {
                    this.themeChangeCallback(this.darkModeManager.isDarkMode);
                }
            },
            onThemeChange: (callback) => {
                this.themeChangeCallback = callback;
                return () => { this.themeChangeCallback = null; };
            }
        };

        this.darkModeCleanup = this.darkModeManager.onThemeChange((isDark) => {
            this.handleThemeChange(isDark);
        });
    }

    handleThemeChange(isDark) {
        console.log(`Theme updated to ${isDark ? 'dark' : 'light'}`);
        // Force UI refresh to apply dark mode classes
        if (this.charts && this.charts.length > 0) {
            this.charts.forEach(chart => chart.update('none'));
        }
        // Re-render content to apply dark mode classes to cards
        this.renderContent();
    }

    // Get default date range (last 30 days)
    getDefaultDateRange() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        };

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    // Mock data for fallback - Updated to use fixed channel names
    getMockData() {
        return this.channelNames.map((channelName, index) => ({
            id: `txn-${index + 1}`,
            type: channelName,
            totalTransactions: 4000,
            success: { 
                count: 3600, 
                percentage: 90 
            },
            failure: { 
                count: 400, 
                percentage: 10 
            },
            lastError: '2025-07-10 10:43',
            failureBreakdown: {
                internal: 50,
                external: 35,
                users: 15
            },
            errorStreak: 3
        }));
    }

    // Load user profile data
      async loadUserData() {
        try {
            console.log('Loading user data from backend...');

            const response = await fetch(this.apiEndpoints.user, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication headers
                    // 'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('User data loaded:', userData);

                this.userData = {
                    name: userData.name || userData.firstName + ' ' + userData.lastName || 'User',
                    role: userData.role || userData.position || 'User',
                    avatar: userData.avatar || userData.profileImage || null,
                    email: userData.email || ''
                };

                this.updateUserHeader();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userData = {
                name: 'Joshua Awori',
                role: 'Super Administrator',
                avatar: null
            };
            this.updateUserHeader();
        } 
        
    }

    // Load notifications count
    async loadNotifications() {
        try {
            console.log('Loading notifications from backend...');

            const response = await fetch(this.apiEndpoints.notifications, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication headers
                    // 'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const notificationData = await response.json();
                console.log('Notifications loaded:', notificationData);

                // Handle different response formats
                if (typeof notificationData.unreadCount === 'number') {
                    this.notificationCount = notificationData.unreadCount;
                } else if (typeof notificationData.count === 'number') {
                    this.notificationCount = notificationData.count;
                } else if (Array.isArray(notificationData.notifications)) {
                    this.notificationCount = notificationData.notifications.filter(n => !n.read).length;
                } else if (Array.isArray(notificationData)) {
                    this.notificationCount = notificationData.filter(n => !n.read).length;
                } else {
                    this.notificationCount = 0;
                }

                this.updateNotificationBadge();
            }
            this.notificationCount = 0; // No notification badge shown in design
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notificationCount = 88; // Default fallback for demo
        }
    }

    // Load alerts from backend
     async loadAlerts() {
        try {
            console.log('Loading alerts from backend...');

            const response = await fetch(this.apiEndpoints.alerts, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const alertData = await response.json();
                console.log('Alerts loaded:', alertData);

                if (alertData.criticalAlerts && alertData.criticalAlerts.length > 0) {
                    this.showAlert = true;
                    this.alertMessage = alertData.criticalAlerts[0].message;
                } else if (alertData.message) {
                    this.showAlert = true;
                    this.alertMessage = alertData.message;
                } else {
                    this.showAlert = false;
                }

                this.updateAlertDisplay();
            }
            this.showAlert = true;
            this.alertMessage = 'Critical: Channel 5 failure rate is 40%';
            this.updateAlertDisplay();
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    // Load transaction data 
    async loadTransactionData(startDate = null, endDate = null) {
        this.isLoading = true;
        this.error = null;

        try {
            console.log('Loading transaction data from backend...');

            const url = new URL(this.apiEndpoints.transactions);
            if (startDate) {
                url.searchParams.append('startDate', startDate);
            }
            if (endDate) {
                url.searchParams.append('endDate', endDate);
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication headers if needed
                    // 'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Transaction data loaded:', data);

            if (data.success && Array.isArray(data.transactions)) {
                this.transactionData = data.transactions;
            } else if (Array.isArray(data)) {
                this.transactionData = data;
            } else {
                throw new Error('Invalid data format received from backend');
            }

            // Use mock data for demo
            this.transactionData = this.getMockData();
            this.isLoading = false;
            return this.transactionData;

        } catch (error) {
            console.error('Error loading transaction data:', error);
            this.error = error.message;
            this.isLoading = false;

            if (window.navigationManager) {
                window.navigationManager.showNotification(
                    'Failed to load transaction data. Using cached data if available.',
                    'error'
                );
            }

            this.loadCachedData();
            return this.transactionData;
        }
    }

    // Cache data to localStorage for offline support
    cacheTransactionData() {
        try {
            const cacheData = {
                data: this.transactionData,
                timestamp: new Date().toISOString(),
                dateRange: this.dateRange
            };
            localStorage.setItem('transactionData', JSON.stringify(cacheData));
            console.log('Transaction data cached successfully');
        } catch (error) {
            console.error('Error caching transaction data:', error);
        }
    }

    // Load cached data as fallback
    loadCachedData() {
        try {
            const cachedData = localStorage.getItem('transactionData');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                this.transactionData = parsed.data || [];
                console.log('Loaded cached transaction data:', this.transactionData.length, 'records');
            } else {
                this.transactionData = this.getMockData();
                console.log('Using mock data as fallback');
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
            this.transactionData = this.getMockData();
            return this.transactionData;
        }
    }

    // Update user header in the UI
    updateUserHeader() {
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');

        if (userNameElement) {
            userNameElement.textContent = this.userData.name;
        }

        if (userRoleElement) {
            userRoleElement.textContent = this.userData.role;
        }
    }

    // Update notification badge
    updateNotificationBadge() {
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            if (this.notificationCount > 0) {
                notificationBadge.textContent = this.notificationCount > 99 ? '99+' : this.notificationCount;
                notificationBadge.style.display = 'inline-block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    }

    // Update alert display
    updateAlertDisplay() {
        const alertElement = document.querySelector('.critical-alert');
        const alertMessageElement = document.querySelector('.alert-message');

        if (alertElement) {
            alertElement.style.display = this.showAlert ? 'block' : 'none';
        }

        if (alertMessageElement && this.alertMessage) {
            alertMessageElement.textContent = this.alertMessage;
        }
    }

    // Refresh data from backend
    async refreshData() {
        console.log('Refreshing transaction data...');

        await Promise.all([
            this.loadUserData(),
            this.loadNotifications(),
            this.loadTransactionData(),
            this.loadAlerts()
        ]);

        this.renderContent();

        if (window.navigationManager) {
            window.navigationManager.showNotification('Data refreshed successfully', 'success');
        }
    }

        // Show loading state in UI
    showLoadingState() {
        const contentContainer = document.getElementById('transactionContent');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading transaction data...</p>
                    </div>
                </div>
            `;
        }
    }

    // Show error state in UI
    showErrorState(error) {
        const contentContainer = document.getElementById('transactionContent');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-red-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
                        <p class="text-gray-600 mb-4">${error}</p>
                        <button onclick="window.transactionMonitoringScreen.refreshData()"
                                class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                            <i class="fas fa-refresh mr-2"></i>
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }


    setupEventListeners() {
        // View toggle buttons
        const viewButtons = document.querySelectorAll('.view-toggle-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const view = e.currentTarget.dataset.view;
                console.log('Switching to view:', view);
                this.switchView(view);
            });
        });

        // Alert dismiss button
        const alertDismiss = document.querySelector('.alert-dismiss-btn');
        if (alertDismiss) {
            alertDismiss.addEventListener('click', () => {
                this.dismissAlert();
            });
        }

        // Filter button
        const filterBtn = document.querySelector('.filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.showFilterModal();
            });
        }

        // Date range picker
        const dateRangePicker = document.querySelector('.date-range-picker');
        if (dateRangePicker) {
            dateRangePicker.addEventListener('click', () => {
                this.showDateRangePicker();
            });
        }

           // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.refreshData();
            });
        }

        // Notification badge click
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            notificationBadge.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        console.log('Event listeners attached for transaction monitoring');
    }

    switchView(view) {
        console.log('Switching view from', this.currentView, 'to', view);
        this.currentView = view;

        // Update button states
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-white', 'text-gray-900', 'shadow-sm', 'dark:bg-dark-700', 'dark:text-white');
            btn.classList.add('text-gray-600', 'hover:text-gray-900', 'dark:text-dark-300', 'dark:hover:text-white');
        });

        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-white', 'text-gray-900', 'shadow-sm', 'dark:bg-dark-700', 'dark:text-white');
            activeBtn.classList.remove('text-gray-600', 'hover:text-gray-900', 'dark:text-dark-300', 'dark:hover:text-white');
        }

        this.renderContent();
    }

    dismissAlert() {
        this.showAlert = false;
        const alertElement = document.querySelector('.critical-alert');
        if (alertElement) {
            alertElement.style.display = 'none';
        }
    }

    showFilterModal() {
        if (window.navigationManager) {
            const filterContent = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Type</label>
                        <select id="filterTransactionType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <option value="">All Types</option>
                            ${this.channelNames.map(name => `<option value="${name}">${name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;

            window.navigationManager.showModal(
                'Filter Transactions',
                filterContent,
                [
                    { label: 'Clear Filters', action: 'clear', handler: () => true },
                    { label: 'Apply Filter', action: 'apply', primary: true, handler: () => true }
                ]
            );
        }
    }

    async applyFilters(filters = {}) {
        try {
            console.log('Applying filters:', filters);

            const queryParams = new URLSearchParams();

            if (filters.type && filters.type !== '') {
                queryParams.append('type', filters.type);
            }
            if (filters.status && filters.status !== '') {
                queryParams.append('status', filters.status);
            }
            if (filters.errorThreshold && filters.errorThreshold !== '') {
                queryParams.append('errorThreshold', filters.errorThreshold);
            }

            const url = `${this.apiEndpoints.transactions}?${queryParams.toString()}`;

            this.showLoadingState();

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.transactionData = data.transactions || data;
                this.renderContent();

                if (window.navigationManager) {
                    window.navigationManager.showNotification('Filters applied successfully', 'success');
                }
            } else {
                throw new Error('Failed to apply filters');
            }
        } catch (error) {
            console.error('Error applying filters:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to apply filters', 'error');
            }
            this.renderContent();
        }
    }

    async clearFilters() {
        console.log('Clearing filters...');
        await this.loadTransactionData();
        this.renderContent();

        if (window.navigationManager) {
            window.navigationManager.showNotification('Filters cleared', 'info');
        }
    }


    showDateRangePicker() {
        if (window.navigationManager) {
            window.navigationManager.showNotification('Date range picker coming soon', 'info');
        }
    }

    // Updated createTransactionCard to match the exact design
    createTransactionCard(transaction) {
        const data = transaction;
        const successPercentage = (data.success.count / data.totalTransactions) * 100 || 0;
        const failurePercentage = (data.failure.count / data.totalTransactions) * 100 || 0;

        return `
            <div class="transaction-card bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300">
                <!-- Header with channel name and last error -->
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${data.type}</h3>
                </div>

                <!-- Total transactions -->
                <div class="mb-4">
                <div class="flex justify-between items-start mb-4">
                    <div class="text-sm text-gray-600 dark:text-dark-400 mb-1">Total Transactions</div>
                    <span class="text-sm text-gray-500 dark:text-dark-400">Last Error: ${data.lastError}</span>
                </div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white mb-3">${data.totalTransactions.toLocaleString()}</div>

                    <!-- Success and Failure rates -->
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-600 dark:text-dark-400">Success</span>
                            <span class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                                ${successPercentage.toFixed(0)}%
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-600 dark:text-dark-400">Failure</span>
                            <span class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                ${failurePercentage.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Failure Breakdown Section -->
                <div class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Failure Break Down</h4>

                    <!-- Progress bar -->
                    <div class="w-full bg-gray-100 dark:bg-dark-600 rounded-full h-2 mb-3">
                        <div class="h-2 rounded-full flex">
                            <div class="bg-yellow-400 dark:bg-yellow-500 rounded-l-full" style="width: ${data.failureBreakdown.internal}%"></div>
                            <div class="bg-green-400 dark:bg-green-500" style="width: ${data.failureBreakdown.external}%"></div>
                            <div class="bg-red-400 dark:bg-red-500 rounded-r-full" style="width: ${data.failureBreakdown.users}%"></div>
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="flex justify-between items-center text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-yellow-400 dark:bg-yellow-500 rounded-full"></div>
                            <span class="text-gray-600 dark:text-dark-400">Internal</span>
                            <span class="font-semibold text-gray-900 dark:text-white">${data.failureBreakdown.internal}%</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-green-400 dark:bg-green-500 rounded-full"></div>
                            <span class="text-gray-600 dark:text-dark-400">External</span>
                            <span class="font-semibold text-gray-900 dark:text-white">${data.failureBreakdown.external}%</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-red-400 dark:bg-red-500 rounded-full"></div>
                            <span class="text-gray-600 dark:text-dark-400">Users</span>
                            <span class="font-semibold text-gray-900 dark:text-white">${data.failureBreakdown.users}%</span>
                        </div>
                    </div>
                </div>

                <!-- Footer with error streak and details button -->
                <div class="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-dark-700">
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600 dark:text-dark-400">Error Streak</span>
                        <span class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            ${data.errorStreak} continuous Error
                        </span>
                    </div>
                    <button class="view-details-btn text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors" data-card-id="${data.id}">
                        View More Details
                    </button>
                </div>
            </div>
        `;
    }



    renderGridView() {
        return `
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                ${this.transactionData.map(transaction => this.createTransactionCard(transaction)).join('')}
            </div>
        `;
    }

    renderListView() {
        return `
            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                    <thead class="bg-gray-50 dark:bg-dark-900">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Type</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Total Transactions</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Success Rate</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Failure Rate</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Error Streak</th>
                            <th scope="col" class="relative px-6 py-3"><span class="sr-only">Details</span></th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                        ${this.transactionData.map(transaction => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${transaction.type}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-400">${transaction.totalTransactions.toLocaleString()}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">${((transaction.success.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">${((transaction.failure.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">${transaction.errorStreak}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button class="view-details-btn text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors" data-card-id="${transaction.id}">Details</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderColumnView() {
        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                ${this.transactionData.map(transaction => `
                    <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 shadow-sm">
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">${transaction.type}</h3>
                        <div class="space-y-2 text-sm">
                            <p class="text-gray-700 dark:text-dark-300"><strong>Total:</strong> ${transaction.totalTransactions.toLocaleString()}</p>
                            <p class="text-green-600 dark:text-green-400"><strong>Success:</strong> ${((transaction.success.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%</p>
                            <p class="text-red-600 dark:text-red-400"><strong>Failure:</strong> ${((transaction.failure.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%</p>
                            <p class="text-red-600 dark:text-red-400"><strong>Error Streak:</strong> ${transaction.errorStreak}</p>
                        </div>
                        <div class="mt-3 text-right">
                            <button class="view-details-btn text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium" data-card-id="${transaction.id}">View Details</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderContent() {
        const contentContainer = document.getElementById('transactionContent');
        if (!contentContainer) {
            console.error('transactionContent container not found');
            return;
        }

        let contentHTML = '';

        switch (this.currentView) {
            case 'grid':
                contentHTML = this.renderGridView();
                break;
            case 'list':
                contentHTML = this.renderListView();
                break;
            case 'column':
                contentHTML = this.renderColumnView();
                break;
            default:
                contentHTML = this.renderGridView();
        }

        contentContainer.innerHTML = contentHTML;
        this.attachContentEventListeners();
    }

    attachContentEventListeners() {
        const detailButtons = document.querySelectorAll('.view-details-btn');
        detailButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const cardId = e.currentTarget.dataset.cardId;
                this.showTransactionDetails(cardId);
            });
        });
    }

    showTransactionDetails(cardId) {
        const transaction = this.transactionData.find(t => t.id === cardId);
        if (!transaction) {
            console.error('Transaction not found:', cardId);
            return;
        }

        const transactionType = transaction.type;
        
        if (window.transactionDetailsScreen) {
            this.hide();
            window.transactionDetailsScreen.show(transactionType);
        } else {
            this.showTransactionDetailsModal(transaction);
        }
    }

    showTransactionDetailsModal(transaction) {
        if (window.navigationManager) {
            const detailsContent = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Type</label>
                            <div class="text-lg font-semibold text-gray-900 dark:text-white">${transaction.type}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Volume</label>
                            <div class="text-lg font-semibold text-gray-900 dark:text-white">${transaction.totalTransactions.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            `;

            window.navigationManager.showModal(
                `Details for ${transaction.type}`,
                detailsContent,
                [{ label: 'Close', action: 'close', primary: true, handler: () => true }]
            );
        }
    }

    render() {
        return `
            <div class="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
                <!-- Header -->
                <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 transition-colors duration-300">
                    <div class="px-6 py-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Transaction Monitoring Dashboard</h1>
                                <p class="text-gray-600 dark:text-dark-300 mt-1">Your brief overview of your Transaction Monitoring</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <!-- Dark Mode Toggle -->
                                <button id="darkModeToggle" class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors duration-200" title="Toggle Dark Mode">
                                    <i class="fas fa-sun text-yellow-500 dark:block hidden w-5 h-5"></i>
                                    <i class="fas fa-moon text-gray-600 dark:hidden block w-5 h-5"></i>
                                </button>

                                <!-- Notification Icon -->
                                <div class="flex items-center gap-2 text-gray-600 dark:text-dark-300 cursor-pointer" title="View notifications">
                                    <i class="fas fa-bell"></i>
                                    <span class="notification-badge bg-red-500 text-white text-xs rounded-full px-2 py-1" style="display: none;"></span>
                                </div>

                                <!-- User Profile -->
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                        <i class="fas fa-user text-white text-sm"></i>
                                    </div>
                                    <div>
                                        <div class="user-name text-sm font-medium text-gray-900 dark:text-white">Joshua Awori</div>
                                        <div class="user-role text-xs text-gray-500 dark:text-dark-400">Super Administrator</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4 transition-colors duration-300">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <!-- View Toggle -->
                            <div class="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                                <button data-view="grid" class="view-toggle-btn active bg-white dark:bg-dark-600 text-gray-900 dark:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                                    <i class="fas fa-th"></i>
                                    Grid View
                                </button>
                                <button data-view="list" class="view-toggle-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white">
                                    <i class="fas fa-list"></i>
                                    List View
                                </button>
                                <button data-view="column" class="view-toggle-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white">
                                    <i class="fas fa-columns"></i>
                                    Column View
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <!-- Date Range Picker -->
                            <div class="date-range-picker flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                                <i class="fas fa-calendar text-gray-500 dark:text-dark-400"></i>
                                <span class="text-sm text-gray-700 dark:text-dark-300">July 25, 2026 - August 25, 2026</span>
                            </div>

                            <!-- Filter Button -->
                            <button class="filter-btn flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-dark-600 text-white rounded-md hover:bg-gray-800 dark:hover:bg-dark-500 transition-colors">
                                <i class="fas fa-filter"></i>
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Critical Alert -->
                <div class="critical-alert mx-6 mt-4" style="display: ${this.showAlert ? 'block' : 'none'}">
                    <div class="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                            <div>
                                <span class="font-semibold text-red-800 dark:text-red-300">Critical Alerts:</span>
                                <span class="alert-message text-red-700 dark:text-red-300 ml-2">Critical: Channel 5 failure rate is 40%</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-red-700 dark:text-red-300 font-medium">Failure Alert</span>
                            <button class="alert-dismiss-btn text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="p-6">
                    <div id="transactionContent">
                        <!-- Content will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    show() {
        const screen = document.getElementById('transactionScreen');
        if (screen) {
            screen.classList.remove('hidden');
            screen.innerHTML = this.render();

            setTimeout(() => {
                this.setupEventListeners();

                // Load mock data immediately
                this.loadUserData();
                this.loadNotifications();
                this.loadAlerts();
                this.transactionData = this.getMockData();
                this.renderContent();

                // Set up dark mode toggle
                const darkModeToggleBtn = document.querySelector('#darkModeToggle');
                if (darkModeToggleBtn) {
                    darkModeToggleBtn.addEventListener('click', () => {
                        if (this.darkModeManager) {
                            this.darkModeManager.toggleDarkMode();
                        }
                    });
                }

                console.log('Transaction monitoring screen loaded with channels:', this.channelNames);
            }, 100);
        }
    }

    hide() {
        const screen = document.getElementById('transactionScreen');
        if (screen) {
            screen.classList.add('hidden');
        }
    }

    cleanup() {
        if (this.darkModeCleanup) {
            this.darkModeCleanup();
            this.darkModeCleanup = null;
        }
        this.isInitialized = false;
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    // Auto-refresh functionality
    startAutoRefresh(intervalMinutes = 5) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.autoRefreshInterval = setInterval(() => {
            console.log('Auto-refreshing transaction data...');
            this.refreshData();
        }, intervalMinutes * 60 * 1000);

        console.log(`Auto-refresh started: every ${intervalMinutes} minutes`);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('Auto-refresh stopped');
        }
    }


    // Export transaction data
    exportTransactionData(format = 'csv') {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            let content = '';
            let filename = '';
            let mimeType = '';

            if (format === 'csv') {
                const headers = ['Type', 'Total Transactions', 'Success Count', 'Success %', 'Failure Count', 'Failure %', 'Last Error', 'Error Streak'];
                const csvRows = [headers.join(',')];

                this.transactionData.forEach(transaction => {
                    const row = [
                        transaction.type,
                        transaction.totalTransactions,
                        transaction.success.count,
                        ((transaction.success.count / transaction.totalTransactions) * 100).toFixed(1),
                        transaction.failure.count,
                        ((transaction.failure.count / transaction.totalTransactions) * 100).toFixed(1),
                        `"${transaction.lastError}"`,
                        transaction.errorStreak
                    ];
                    csvRows.push(row.join(','));
                });

                content = csvRows.join('\n');
                filename = `transaction_data_${timestamp}.csv`;
                mimeType = 'text/csv';

            } else if (format === 'json') {
                content = JSON.stringify({
                    exportDate: new Date().toISOString(),
                    dateRange: this.dateRange,
                    totalRecords: this.transactionData.length,
                    channels: this.channelNames,
                    data: this.transactionData
                }, null, 2);
                filename = `transaction_data_${timestamp}.json`;
                mimeType = 'application/json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (window.navigationManager) {
                window.navigationManager.showNotification(`Transaction data exported as ${format.toUpperCase()}`, 'success');
            }

        } catch (error) {
            console.error('Error exporting data:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to export data', 'error');
            }
        }
    }

    // Get transaction statistics
    getTransactionStats() {
        if (!this.transactionData.length) return null;

        const totalTransactions = this.transactionData.reduce((sum, t) => sum + t.totalTransactions, 0);
        const totalSuccess = this.transactionData.reduce((sum, t) => sum + t.success.count, 0);
        const totalFailures = this.transactionData.reduce((sum, t) => sum + t.failure.count, 0);
        const avgErrorStreak = this.transactionData.reduce((sum, t) => sum + t.errorStreak, 0) / this.transactionData.length;

        return {
            totalTransactions,
            totalSuccess,
            totalFailures,
            overallSuccessRate: (totalSuccess / totalTransactions * 100).toFixed(1),
            overallFailureRate: (totalFailures / totalTransactions * 100).toFixed(1),
            averageErrorStreak: avgErrorStreak.toFixed(1),
            criticalTransactions: this.transactionData.filter(t => (t.failure.count / t.totalTransactions) > 0.1).length
        };
    }
}