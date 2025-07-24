// Transaction Monitoring Screen - Fixed Version
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
            this.isInitialized = true;
            console.log('TransactionMonitoringScreen initialized');
        } catch (error) {
            console.error('Failed to initialize TransactionMonitoringScreen:', error);
        }
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
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    // Load transaction data with date range
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
        }
    }

    // Mock data for fallback
    getMockData() {
        return [
            {
                id: 'txn-1',
                type: 'USSD',
                totalTransactions: 4000,
                success: { count: 3600, percentage: 90 },
                failure: { count: 400, percentage: 10 },
                lastError: '2025 - 07 - 10  10:43',
                failureBreakdown: {
                    internal: 50,
                    external: 35,
                    users: 15
                },
                errorStreak: 3
            },
            {
                id: 'txn-2',
                type: 'SMS',
                totalTransactions: 1500,
                success: { count: 1450, percentage: 97 },
                failure: { count: 50, percentage: 3 },
                lastError: '2025 - 07 - 09  14:20',
                failureBreakdown: {
                    internal: 10,
                    external: 20,
                    users: 70
                },
                errorStreak: 0
            },
            {
                id: 'txn-3',
                type: 'API',
                totalTransactions: 8000,
                success: { count: 7800, percentage: 97.5 },
                failure: { count: 200, percentage: 2.5 },
                lastError: '2025 - 07 - 10  09:00',
                failureBreakdown: {
                    internal: 80,
                    external: 10,
                    users: 10
                },
                errorStreak: 1
            }
        ];
    }

    // Update user header in the UI
    updateUserHeader() {
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');
        const userAvatarElement = document.querySelector('.user-avatar');

        if (userNameElement) {
            userNameElement.textContent = this.userData.name;
        }

        if (userRoleElement) {
            userRoleElement.textContent = this.userData.role;
        }

        if (userAvatarElement && this.userData.avatar) {
            userAvatarElement.innerHTML = `<img src="${this.userData.avatar}" alt="${this.userData.name}" class="w-8 h-8 rounded-full object-cover">`;
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

        this.showLoadingState();

        await Promise.all([
            this.loadUserData(),
            this.loadNotifications(),
            this.loadTransactionData(),
            this.loadAlerts()
        ]);

        this.cacheTransactionData();
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
            btn.classList.remove('active', 'bg-white', 'text-gray-900', 'shadow-sm');
            btn.classList.add('text-gray-600', 'hover:text-gray-900');
        });

        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-white', 'text-gray-900', 'shadow-sm');
            activeBtn.classList.remove('text-gray-600', 'hover:text-gray-900');
            console.log('Active button updated for view:', view);
        } else {
            console.error('Button not found for view:', view);
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                        <select id="filterTransactionType" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">All Types</option>
                            <option value="USSD">USSD</option>
                            <option value="SMS">SMS</option>
                            <option value="API">API</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select id="filterStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">All Status</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Error Threshold (%)</label>
                        <input type="number" id="filterErrorThreshold" placeholder="Enter percentage" min="0" max="100"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                </div>
            `;

            window.navigationManager.showModal(
                'Filter Transactions',
                filterContent,
                [
                    { label: 'Clear Filters', action: 'clear', handler: () => {
                        this.clearFilters();
                        return true;
                    }},
                    { label: 'Apply Filter', action: 'apply', primary: true, handler: () => {
                        const filters = {
                            type: document.getElementById('filterTransactionType')?.value || '',
                            status: document.getElementById('filterStatus')?.value || '',
                            errorThreshold: document.getElementById('filterErrorThreshold')?.value || ''
                        };
                        this.applyFilters(filters);
                        return true;
                    }}
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
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const formatDateInput = (date) => {
                return date.toISOString().split('T')[0];
            };

            const modalContent = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input type="date" id="startDateInput" value="${formatDateInput(thirtyDaysAgo)}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input type="date" id="endDateInput" value="${formatDateInput(today)}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" class="quick-range-btn px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50" data-days="7">
                                Last 7 days
                            </button>
                            <button type="button" class="quick-range-btn px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50" data-days="30">
                                Last 30 days
                            </button>
                            <button type="button" class="quick-range-btn px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50" data-days="90">
                                Last 90 days
                            </button>
                            <button type="button" class="quick-range-btn px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50" data-days="365">
                                Last year
                            </button>
                        </div>
                    </div>
                </div>
            `;

            window.navigationManager.showModal(
                'Select Date Range',
                modalContent,
                [
                    { label: 'Cancel', action: 'cancel' },
                    { label: 'Apply Range', action: 'apply', primary: true, handler: () => {
                        const startDateInput = document.getElementById('startDateInput');
                        const endDateInput = document.getElementById('endDateInput');

                        if (startDateInput && endDateInput) {
                            const startDate = startDateInput.value;
                            const endDate = endDateInput.value;

                            if (startDate && endDate) {
                                this.applyDateRange(startDate, endDate);
                                return true;
                            } else {
                                window.navigationManager.showNotification('Please select both start and end dates', 'warning');
                                return false;
                            }
                        }
                        return false;
                    }}
                ]
            );

            // Add event listeners for quick select buttons
            setTimeout(() => {
                document.querySelectorAll('.quick-range-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const days = parseInt(e.target.dataset.days);
                        const endDate = new Date();
                        const startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);

                        document.getElementById('startDateInput').value = formatDateInput(startDate);
                        document.getElementById('endDateInput').value = formatDateInput(endDate);
                    });
                });
            }, 100);
        }
    }

    // Apply selected date range
    async applyDateRange(startDate, endDate) {
        console.log('Applying date range:', startDate, 'to', endDate);

        const start = new Date(startDate);
        const end = new Date(endDate);

        const formatDisplayDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        };

        this.dateRange = `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;

        const dateRangeElement = document.querySelector('.date-range-display');
        if (dateRangeElement) {
            dateRangeElement.textContent = this.dateRange;
        }

        this.showLoadingState();
        await this.loadTransactionData(startDate, endDate);
        this.renderContent();

        if (window.navigationManager) {
            window.navigationManager.showNotification('Date range updated successfully', 'success');
        }
    }

    showNotifications() {
        if (window.navigationManager) {
            window.navigationManager.showNotification('Notifications panel coming soon', 'info');
        }
    }

    createTransactionCard(transaction) {
        const data = transaction;
        const successPercentage = (data.success.count / data.totalTransactions) * 100 || 0;
        const failurePercentage = (data.failure.count / data.totalTransactions) * 100 || 0;

        return `
            <div class="transaction-card bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${data.type}</h3>
                    <span class="text-sm text-gray-500">Last Error : ${data.lastError}</span>
                </div>

                <div class="mb-4">
                    <div class="text-sm text-gray-600 mb-1">Total Transactions</div>
                    <div class="text-3xl font-bold text-gray-900 mb-2">${data.totalTransactions.toLocaleString()}</div>

                    <div class="flex items-center gap-6 text-sm">
                        <div class="flex items-center gap-1">
                            <span class="text-gray-600">Success</span>
                            <span class="text-green-600 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                                ${successPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-gray-600">Failure</span>
                            <span class="text-red-600 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                ${failurePercentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-900 mb-3">Failure Break Down</h4>

                    <!-- Progress bar -->
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div class="h-2 rounded-full flex">
                            <div class="bg-yellow-400 rounded-l-full" style="width: ${data.failureBreakdown.internal}%"></div>
                            <div class="bg-green-400" style="width: ${data.failureBreakdown.external}%"></div>
                            <div class="bg-red-400 rounded-r-full" style="width: ${data.failureBreakdown.users}%"></div>
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="flex justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span class="text-gray-600">Internal</span>
                            <span class="font-semibold">${data.failureBreakdown.internal}%</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span class="text-gray-600">External</span>
                            <span class="font-semibold">${data.failureBreakdown.external}%</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                            <span class="text-gray-600">Users</span>
                            <span class="font-semibold">${data.failureBreakdown.users}%</span>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-gray-600">Error Streak</span>
                        <span class="text-red-600 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            ${data.errorStreak} continuous Error
                        </span>
                    </div>
                    <button class="view-details-btn text-blue-600 hover:text-blue-700 text-sm font-medium" data-card-id="${data.id}">
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
            <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Transactions
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Success Rate
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Failure Rate
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Error
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Error Streak
                            </th>
                             <th scope="col" class="relative px-6 py-3">
                                <span class="sr-only">Details</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${this.transactionData.map(transaction => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ${transaction.type}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${transaction.totalTransactions.toLocaleString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                    ${((transaction.success.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                     ${((transaction.failure.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${transaction.lastError}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                    ${transaction.errorStreak}
                                </td>
                                 <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button class="view-details-btn text-blue-600 hover:text-blue-900" data-card-id="${transaction.id}">
                                        Details
                                    </button>
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
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.transactionData.map(transaction => `
                    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">${transaction.type}</h3>
                        <div class="space-y-3 text-sm text-gray-700">
                            <p><strong>Total:</strong> ${transaction.totalTransactions.toLocaleString()}</p>
                            <p class="text-green-600"><strong>Success:</strong> ${((transaction.success.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%</p>
                            <p class="text-red-600"><strong>Failure:</strong> ${((transaction.failure.count / transaction.totalTransactions) * 100 || 0).toFixed(1)}%</p>
                            <p><strong>Last Error:</strong> ${transaction.lastError}</p>
                            <p class="text-red-600"><strong>Error Streak:</strong> ${transaction.errorStreak}</p>
                            <div class="pt-3 border-t border-gray-100">
                                <h4 class="font-semibold text-gray-900 mb-2">Breakdown:</h4>
                                <p class="text-yellow-600">Internal: ${transaction.failureBreakdown.internal}%</p>
                                <p class="text-green-600">External: ${transaction.failureBreakdown.external}%</p>
                                <p class="text-red-600">User: ${transaction.failureBreakdown.users}%</p>
                            </div>
                        </div>
                        <div class="mt-4 text-right">
                             <button class="view-details-btn text-blue-600 hover:text-blue-700 text-sm font-medium" data-card-id="${transaction.id}">
                                View Details
                            </button>
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

        console.log('Rendering content for view:', this.currentView);

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
                console.warn('Unknown view type:', this.currentView);
                contentHTML = this.renderGridView();
        }

        contentContainer.innerHTML = contentHTML;
        console.log('Content rendered successfully for view:', this.currentView);

        this.attachContentEventListeners();
    }

   attachContentEventListeners() {
    const detailButtons = document.querySelectorAll('.view-details-btn');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const cardId = e.currentTarget.dataset.cardId;
            console.log('Opening details for:', cardId);
            
            // This will now open the full-screen details
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

    // Get the transaction type (USSD, SMS, API)
    const transactionType = transaction.type;
    
    // Use the new TransactionDetailsScreen
    if (window.transactionDetailsScreen) {
        // Hide current monitoring screen
        this.hide();
        
        // Show detailed screen
        window.transactionDetailsScreen.show(transactionType);
    } else {
        // Fallback to modal if details screen not available
        this.showTransactionDetailsModal(transaction);
    }
}

// 3. ADD: Fallback modal method (keep your existing one as backup)
showTransactionDetailsModal(transaction) {
    if (window.navigationManager) {
        const detailsContent = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Transaction Type</label>
                        <div class="text-lg font-semibold">${transaction.type}</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Total Volume</label>
                        <div class="text-lg font-semibold">${transaction.totalTransactions.toLocaleString()}</div>
                    </div>
                </div>
                <!-- Add more details as needed -->
            </div>
        `;

        window.navigationManager.showModal(
            `Details for ${transaction.type}`,
            detailsContent,
            [
                { label: 'Close', action: 'close', primary: true, handler: () => true }
            ]
        );
    }
}


    render() {
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <div class="bg-white border-b border-gray-200">
                    <div class="px-6 py-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">Transaction Monitoring Dashboard</h1>
                                <p class="text-gray-600 mt-1">Your brief overview of your Transaction Monitoring</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="flex items-center gap-2 text-gray-600 cursor-pointer" title="View notifications">
                                    <i class="fas fa-bell"></i>
                                    <span class="notification-badge bg-red-500 text-white text-xs rounded-full px-2 py-1"
                                          style="display: ${this.notificationCount > 0 ? 'inline-block' : 'none'}">
                                        ${this.notificationCount > 99 ? '99+' : this.notificationCount}
                                    </span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="user-avatar w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                        ${this.userData.avatar ?
                                            `<img src="${this.userData.avatar}" alt="${this.userData.name}" class="w-8 h-8 rounded-full object-cover">` :
                                            `<i class="fas fa-user text-white"></i>`
                                        }
                                    </div>
                                    <div>
                                        <div class="user-name text-sm font-medium text-gray-900">${this.userData.name}</div>
                                        <div class="user-role text-xs text-gray-500">${this.userData.role}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="bg-white border-b border-gray-200 px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <!-- View Toggle -->
                            <div class="flex items-center bg-gray-100 rounded-lg p-1">
                                <button data-view="grid" class="view-toggle-btn active flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    <i class="fas fa-th"></i>
                                    Grid View
                                </button>
                                <button data-view="list" class="view-toggle-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    <i class="fas fa-list"></i>
                                    List View
                                </button>
                                <button data-view="column" class="view-toggle-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    <i class="fas fa-columns"></i>
                                    Column View
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <!-- Refresh button -->
                            <button class="refresh-btn flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                    title="Refresh Data">
                                <i class="fas fa-sync-alt"></i>
                                Refresh
                            </button>

                            <!-- Date Range Picker -->
                            <div class="date-range-picker flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-gray-50">
                                <i class="fas fa-calendar text-gray-500"></i>
                                <span class="date-range-display text-sm text-gray-700">${this.dateRange}</span>
                            </div>

                            <!-- Filter Button -->
                            <button class="filter-btn flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
                                <i class="fas fa-filter"></i>
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Critical Alert -->
                <div class="critical-alert mx-6 mt-4" style="display: ${this.showAlert ? 'block' : 'none'}">
                    <div class="bg-red-100 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-exclamation-triangle text-red-600"></i>
                            <div>
                                <span class="font-semibold text-red-800">Critical Alerts:</span>
                                <span class="alert-message text-red-700 ml-2">${this.alertMessage || 'Critical: Channel 5 failure rate is 40%*'}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-red-700 font-medium">Failure Alert</span>
                            <button class="alert-dismiss-btn text-red-600 hover:text-red-800">
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
                this.showLoadingState();

                const gridBtn = document.querySelector('[data-view="grid"]');
                if (gridBtn) {
                    gridBtn.classList.add('active', 'bg-white', 'text-gray-900', 'shadow-sm');
                    gridBtn.classList.remove('text-gray-600');
                }

                console.log('Transaction monitoring screen initialized - loading data...');
            }, 100);

            // Load mock data after brief delay
            setTimeout(async () => {
                console.log('Loading mock data after brief delay...');

                // Load mock user data
                this.userData = {
                    name: 'Nathan Claire',
                    role: 'Super Administrator',
                    avatar: null
                };
                this.updateUserHeader();

                // Load mock notification count
                this.notificationCount = 88;
                this.updateNotificationBadge();

                // Load mock alerts
                this.showAlert = true;
                this.alertMessage = 'Critical: Channel 5 failure rate is 40%';
                this.updateAlertDisplay();

                // Load mock transaction data
                this.transactionData = this.getMockData();
                this.isLoading = false;
                this.error = null;

                this.cacheTransactionData();
                this.renderContent();

                console.log('Mock data loaded successfully');

                if (window.navigationManager) {
                    window.navigationManager.showNotification('Mock data loaded for demo', 'info');
                }

            }, 500);
        }
    }
    

    hide() {
        const screen = document.getElementById('transactionScreen');
        if (screen) {
            screen.classList.add('hidden');
        }
    }

    cleanup() {
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