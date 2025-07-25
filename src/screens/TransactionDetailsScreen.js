
/**
 * TransactionDetailsScreen - Detailed view for transaction channel analysis
 * Features: Charts, metrics, insights, filtering, and data export
 */
export class TransactionDetailsScreen {
    constructor(app) {
        this.app = app;
        this.state = {
            currentTransactionType: null,
            currentTab: 'failure',
            currentFilters: null,
            currentDateRange: null,
            isVisible: false,
            isInitialized: false
        };
        
        this.cache = new Map();
        this.charts = [];
        this.realTimeInterval = null;
        
        // DOM references
        this.elements = {
            screen: null,
            backButton: null,
            tabButtons: [],
            exportButton: null,
            filterButton: null,
            dateRangePicker: null
        };
        
        // Dark mode integration
        this.darkMode = {
            manager: null,
            cleanup: null
        };

        this.init();
    }

    // =====================================
    // INITIALIZATION
    // =====================================

    init() {
        if (this.state.isInitialized) return;
        
        try {
            this.setupDarkMode();
            this.createScreenElement();
            this.bindEventListeners();
            this.state.isInitialized = true;
            console.log('TransactionDetailsScreen initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TransactionDetailsScreen:', error);
            throw error;
        }
    }

    setupDarkMode() {
        this.darkMode.manager = window.darkModeManager || this.createDarkModeFallback();
        this.darkMode.cleanup = this.darkMode.manager.onThemeChange((isDark) => {
            this.handleThemeChange(isDark);
        });
    }

    createDarkModeFallback() {
        return {
            isDarkMode: false,
            toggleDarkMode: () => {
                this.darkMode.manager.isDarkMode = !this.darkMode.manager.isDarkMode;
                document.documentElement.classList.toggle('dark', this.darkMode.manager.isDarkMode);
                if (this.themeChangeCallback) {
                    this.themeChangeCallback(this.darkMode.manager.isDarkMode);
                }
            },
            onThemeChange: (callback) => {
                this.themeChangeCallback = callback;
                return () => { this.themeChangeCallback = null; };
            }
        };
    }

    handleThemeChange(isDark) {
        console.log(`Theme changed to: ${isDark ? 'dark' : 'light'}`);
        this.refreshCharts();
    }

    // =====================================
    // SCREEN MANAGEMENT
    // =====================================

    createScreenElement() {
        this.elements.screen = document.createElement('div');
        this.elements.screen.id = 'transactionDetailsScreen';
        this.elements.screen.className = 'fixed inset-0 bg-gray-50 dark:bg-dark-900 z-50 hidden';
        this.elements.screen.innerHTML = this.generateHTML();
        document.body.appendChild(this.elements.screen);
    }

    generateHTML() {
        return `
            ${this.generateHeader()}
            ${this.generateTabsAndControls()}
            ${this.generateMainContent()}
        `;
    }

    generateHeader() {
        return `
            <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 transition-colors duration-300">
                <div class="px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <button id="backToMonitoring" class="flex items-center gap-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <i class="fas fa-arrow-left"></i>
                                <span>Back</span>
                            </button>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                                    Channel Details - <span id="channelType">USSD</span>
                                </h1>
                                <p class="text-gray-600 dark:text-dark-300 mt-1">Your brief overview of your Transaction Monitoring</p>
                            </div>
                        </div>
                        ${this.generateHeaderActions()}
                    </div>
                </div>
            </div>
        `;
    }

    generateHeaderActions() {
        return `
            <div class="flex items-center gap-4">
                <button id="darkModeToggleDetails" class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors duration-200" title="Toggle Dark Mode">
                    <i class="fas fa-sun text-yellow-500 dark:block hidden w-5 h-5"></i>
                    <i class="fas fa-moon text-gray-600 dark:hidden block w-5 h-5"></i>
                </button>
                <div class="flex items-center gap-2 text-gray-600 dark:text-dark-300">
                    <i class="fas fa-bell"></i>
                    <span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">88</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-white text-sm"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">Joshua Awori</div>
                        <div class="text-xs text-gray-500 dark:text-dark-400">Super Administrator</div>
                    </div>
                </div>
            </div>
        `;
    }
generateTabsAndControls() {
    const tabs = [
        { id: 'failure', label: 'Failure & Exception Analysis' },
        { id: 'performance', label: 'Performance Metrics' },
        { id: 'patterns', label: 'Transaction Patterns' },
        { id: 'insights', label: 'Transaction Insights' }
    ];

    return `
        <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 transition-colors duration-300">
            <div class="px-6 py-3">
                <div class="flex items-center justify-between">
                    <!-- Tabs on the left -->
                    <nav class="flex space-x-8" role="tablist">
                        ${tabs.map((tab, index) => `
                            <button class="tab-btn ${index === 0 ? 'active border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-b-2 border-transparent text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200'} py-4 px-1 text-sm font-medium" data-tab="${tab.id}">
                                ${tab.label}
                            </button>
                        `).join('')}
                    </nav>
                    
                    <!-- Controls on the right -->
                    <div class="flex items-center gap-3">
                        <div class="date-range-picker flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors">
                            <i class="fas fa-calendar text-gray-500 dark:text-dark-400"></i>
                            <span class="text-sm text-gray-700 dark:text-dark-200">July 25, 2024 - August 25, 2024</span>
                        </div>
                        <button id="filterBtn" class="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-dark-600 text-white rounded-md hover:bg-gray-800 dark:hover:bg-dark-500 transition-colors">
                            <i class="fas fa-filter"></i>
                            Filter
                        </button>
                        <button id="exportBtn" class="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors">
                            <img src="/assets/export.svg" alt="Export" class="w-4 h-4">
                            Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}


    generateMainContent() {
        return `
            <div class="bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
                <!-- Fixed Metrics Cards -->
                <div class="px-6 py-4">
                    <div id="metricsSection"></div>
                </div>

                <!-- Main Content Grid -->
                <div class="px-6 pb-6">
                    <div class="grid grid-cols-4 gap-4">
                        <!-- Scrollable Content Area -->
                        <div class="col-span-3">
                            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                                <div class="h-96 overflow-y-auto" id="scrollableContent">
                                    <div id="chartsAndTableContent"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Fixed Insight Feeds -->
                        <div class="col-span-1">
                            <div id="insightSection"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =====================================
    // EVENT HANDLING
    // =====================================

    bindEventListeners() {
        this.bindNavigationEvents();
        this.bindControlEvents();
        this.bindKeyboardEvents();
    }

    bindNavigationEvents() {
        // Back button
        this.elements.backButton = this.elements.screen.querySelector('#backToMonitoring');
        this.elements.backButton?.addEventListener('click', () => this.navigateBack());

        // Tab buttons
        this.elements.tabButtons = this.elements.screen.querySelectorAll('.tab-btn');
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Dark mode toggle
        const darkModeBtn = this.elements.screen.querySelector('#darkModeToggleDetails');
        darkModeBtn?.addEventListener('click', () => this.toggleDarkMode());
    }

    bindControlEvents() {
        // Export button
        this.elements.exportButton = this.elements.screen.querySelector('#exportBtn');
        this.elements.exportButton?.addEventListener('click', () => this.handleExport());

        // Filter button
        this.elements.filterButton = this.elements.screen.querySelector('#filterBtn');
        this.elements.filterButton?.addEventListener('click', () => this.showFilterModal());

        // Date range picker
        this.elements.dateRangePicker = this.elements.screen.querySelector('.date-range-picker');
        this.elements.dateRangePicker?.addEventListener('click', () => this.showDateRangePicker());
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // =====================================
    // NAVIGATION & ACTIONS
    // =====================================

    navigateBack() {
        this.hide();
        // Navigate to transaction monitoring screen
        if (window.transactionMonitoringScreen?.show) {
            window.transactionMonitoringScreen.show();
        } else if (window.navigationManager?.navigateToScreen) {
            window.navigationManager.navigateToScreen('transactionMonitoring');
        }
    }

    switchTab(tabType) {
        if (this.state.currentTab === tabType) return;

        this.state.currentTab = tabType;
        this.updateTabUI(tabType);
        this.loadTabContent(tabType);
    }

    updateTabUI(activeTab) {
        this.elements.tabButtons.forEach(btn => {
            const isActive = btn.dataset.tab === activeTab;
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('border-blue-600', isActive);
            btn.classList.toggle('text-blue-600', isActive);
            btn.classList.toggle('border-transparent', !isActive);
            btn.classList.toggle('text-gray-500', !isActive);
        });
    }

    toggleDarkMode() {
        if (this.darkMode.manager?.toggleDarkMode) {
            this.darkMode.manager.toggleDarkMode();
        }
    }

    handleKeyDown(e) {
        if (!this.isVisible()) return;

        switch (e.key) {
            case 'Escape':
                this.hide();
                break;
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.handleExport();
                }
                break;
        }
    }

    // =====================================
    // SCREEN VISIBILITY
    // =====================================

    show(transactionType = 'USSD') {
        this.state.currentTransactionType = transactionType;
        this.state.isVisible = true;
        
        this.updateChannelType(transactionType);
        this.elements.screen.classList.remove('hidden');
        this.loadTransactionDetails(transactionType);
        this.startRealTimeUpdates();

        console.log(`Showing transaction details for ${transactionType}`);
    }

    hide() {
        this.state.isVisible = false;
        this.elements.screen.classList.add('hidden');
        this.stopRealTimeUpdates();
        this.destroyCharts();
        
        console.log('Transaction details screen hidden');
    }

    isVisible() {
        return this.state.isVisible;
    }

    updateChannelType(type) {
        const channelElement = this.elements.screen.querySelector('#channelType');
        if (channelElement) {
            channelElement.textContent = type;
        }
    }

    // =====================================
    // DATA MANAGEMENT
    // =====================================

    async loadTransactionDetails(transactionType) {
        try {
            const cacheKey = `${transactionType}_${this.state.currentTab}`;
            let data = this.cache.get(cacheKey);

            if (!data) {
                data = await this.fetchTransactionDetails(transactionType);
                this.cache.set(cacheKey, data);
            }

            this.renderContent(data);
        } catch (error) {
            console.error('Error loading transaction details:', error);
            this.showErrorState(error.message);
        }
    }

    async fetchTransactionDetails(transactionType) {
        // Simulate API call
        return this.getMockData(transactionType);
    }

    getMockData(transactionType) {
        const mockData = {
            USSD: {
                metrics: {
                    totalTransactions: 56000,
                    totalFailures: 3400,
                    totalSuccess: 56000,
                    internalErrors: 20,
                    externalErrors: 30,
                    userErrors: 50,
                    timestamps: {
                    totalTransactions: 'last 7 days',
                    totalFailures: 'last 3 days', 
                    totalSuccess: 'last 7 days',
                    internalErrors: 'last 24 hours',
                    externalErrors: 'last 2 days',
                    userErrors: 'last 5 days'
                }
                },
                
                chartData: {
                    daily: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        success: [45, 52, 48, 61, 55, 67, 43],
                        failures: [12, 15, 18, 14, 16, 11, 19]
                    }
                },
                insights: [
                    {
                        type: 'alert',
                        title: 'Alert: Transactions dropped 32% between 2-4 PM',
                        description: 'Investigate possible service disruptions.',
                        timestamp: '2 hours ago'
                    },
                    {
                        type: 'warning',
                        title: 'Warning: External failures on POS channel spiked',
                        description: 'Check third-party system health and latency.',
                        timestamp: '4 hours ago'
                    },
                    {
                        type: 'info',
                        title: 'Info: Success rate stabilized at 94% over last 3 hours',
                        description: 'Continue monitoring trend consistency.',
                        timestamp: '6 hours ago'
                    }
                ]
            }
        };

        return mockData[transactionType] || mockData.USSD;
    }

    async loadTabContent(tabType) {
        const cacheKey = `${this.state.currentTransactionType}_${tabType}`;
        this.cache.delete(cacheKey);
        await this.loadTransactionDetails(this.state.currentTransactionType);
    }

    // =====================================
    // CONTENT RENDERING
    // =====================================

    renderContent(data) {
        this.renderMetrics(data.metrics);
        this.renderInsights(data.insights);
        this.renderScrollableContent(data);
        
        // Initialize charts after DOM update
        setTimeout(() => this.initializeCharts(data.chartData), 100);
    }

    renderMetrics(metrics) {
        const container = this.elements.screen.querySelector('#metricsSection');
        if (!container) return;

        
         const metricCards = [
            { title: 'Total Transactions', value: metrics.totalTransactions.toLocaleString(), timestamp: metrics.timestamps?.totalTransactions || 'last 7 days', icon: '/assets/total-transactions.svg', color: 'white' },
            { title: 'Total Failures', value: metrics.totalFailures.toLocaleString(),timestamp: metrics.timestamps?.totalFailures, icon: '/assets/total-failures.svg', color: 'red' },
            { title: 'Total Success Count', value: metrics.totalSuccess.toLocaleString(),timestamp: metrics.timestamps?.totalSuccess, icon: '/assets/success.svg', color: 'green' },
            { title: 'Internal Errors', value: metrics.internalErrors + '%',timestamp: metrics.timestamps?.internalErrors, icon: '/assets/errors.svg', color: 'yellow' },
            { title: 'External Errors', value: metrics.externalErrors + '%', icon: '/assets/errors.svg', timestamp: metrics.timestamps?.externalErrors,color: 'orange' },
            { title: 'User Errors', value: metrics.userErrors + '%', icon: '/assets/user-errors.svg',timestamp: metrics.timestamps?.userErrors, color: 'purple' }
        ];

        container.innerHTML = `
            <div class="grid grid-cols-6 gap-4">
                ${metricCards.map(card => this.createMetricCard(card)).join('')}
            </div>
        `;
    }

    createMetricCard({ title, value, timestamp, icon, color }) {
    const colorClasses = this.getColorClasses(color);
    
    return `
        <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 hover:shadow-sm transition-all duration-300">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-8 h-8 ${colorClasses.bg} rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src="${icon}" alt="${title} icon" class="w-4 h-4 ${colorClasses.text}" />
                </div>
            </div>
            <div class="min-w-0 flex-1">
                <div class="text-[15px] font-medium text-gray-600 dark:text-dark-400 truncate">${title}</div>
            </div>
            <div class="text-[10px] text-gray-500 dark:text-dark-500 mb-2">${timestamp}</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white mb-1">${value}</div>
            <div class="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-1">
                <div class="${colorClasses.progress} h-1 rounded-full" style="width: 100%"></div>
            </div>
        </div>
    `;
}

    renderInsights(insights) {
        const container = this.elements.screen.querySelector('#insightSection');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 h-96">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                        Insight Feeds <span class="text-xs text-gray-500 dark:text-dark-400">(3 unread)</span>
                    </h3>
                    <button class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        Mark all as read
                    </button>
                </div>
                <div class="space-y-3 h-80 overflow-y-auto">
                    ${insights.map(insight => this.createInsightItem(insight)).join('')}
                </div>
            </div>
        `;
    }

    createInsightItem(insight) {
        const iconMap = { 'alert': '⚠️', 'warning': '⚠️', 'info': 'ℹ️' };
        
        return `
            <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-100 dark:border-dark-600">
                <div class="text-lg flex-shrink-0">${iconMap[insight.type] || 'ℹ️'}</div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">${insight.title}</div>
                    <div class="text-xs text-gray-600 dark:text-dark-400 mb-2 line-clamp-2">${insight.description}</div>
                    <div class="text-xs text-gray-500 dark:text-dark-500">${insight.timestamp}</div>
                </div>
            </div>
        `;
    }

    renderScrollableContent(data) {
        const container = this.elements.screen.querySelector('#chartsAndTableContent');
        if (!container) return;

        container.innerHTML = `
            ${this.generateChartsSection()}
            ${this.generateDataTable()}
        `;
    }

    generateChartsSection() {
        return `
            <div class="p-6 border-b border-gray-200 dark:border-dark-700">
                <div class="grid grid-cols-2 gap-6 mb-8">
                    ${this.generateChartCard('detailChart1', 'Success vs Failures')}
                    ${this.generateChartCard('detailChart2', 'Success vs Failures')}
                </div>
                <div class="grid grid-cols-2 gap-6">
                    ${this.generateChartCard('detailChart3', 'Success vs Failures')}
                    ${this.generateChartCard('detailChart4', 'Success vs Failures')}
                </div>
            </div>
        `;
    }

    generateChartCard(chartId, title) {
        return `
            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">${title}</h3>
                    <i class="fas fa-ellipsis-v text-gray-400 text-xs"></i>
                </div>
                <div class="relative h-48">
                    <canvas id="${chartId}"></canvas>
                </div>
            </div>
        `;
    }

    generateDataTable() {
        return `
            <div class="border-t border-gray-200 dark:border-dark-700">
                <div class="px-6 py-4 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Heading</h3>
                            <p class="text-sm text-gray-600 dark:text-dark-400 mt-1">A descriptive body text comes here</p>
                        </div>
                        ${this.generateTableControls()}
                    </div>
                </div>
                ${this.generateTableSearch()}
                ${this.generateTable()}
                ${this.generateTablePagination()}
            </div>
        `;
    }

    generateTableControls() {
        return `
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <button class="px-3 py-1 text-xs bg-blue-600 text-white rounded-full">Active Tab 1</button>
                    <button class="px-3 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 rounded-full hover:bg-gray-200 dark:hover:bg-dark-600">Tab 2</button>
                    <button class="px-3 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 rounded-full hover:bg-gray-200 dark:hover:bg-dark-600">Tab 3</button>
                </div>
                <div class="flex items-center gap-2">
                    <button class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white">
                        <i class="fas fa-filter text-xs"></i> Filters
                    </button>
                    <button class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white">
                        <img src="/assets/export.svg" alt="Export" class="w-4 h-4">
                    </button>
                </div>
            </div>
        `;
    }

    generateTableSearch() {
        return `
            <div class="px-6 py-3 bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700">
                <div class="flex items-center justify-between">
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="text" placeholder="Search" class="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="text-sm text-gray-600 dark:text-dark-400">Showing 97 results</div>
                </div>
            </div>
        `;
    }

    generateTable() {
        const headers = Array(8).fill('Column heading');
        const rows = this.generateTableRows();
        
        return `
            <div class="bg-white dark:bg-dark-800">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-dark-900">
                        <tr>
                            <th class="px-6 py-3 text-left w-12">
                                <input type="checkbox" class="rounded border-gray-300">
                            </th>
                            ${headers.map(header => `
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase">
                                    <div class="flex items-center gap-1">
                                        ${header}
                                        <i class="fas fa-sort text-xs"></i>
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateTableRows() {
        const sampleData = Array(8).fill({
            col1: 'Bold text column',
            cols: Array(6).fill('Regular text column'),
            status: Math.random() > 0.5 ? 'Active' : 'Inactive'
        });

        return sampleData.map(row => {
            const statusClass = row.status === 'Active' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td class="px-6 py-4"><input type="checkbox" class="rounded border-gray-300"></td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${row.col1}</td>
                    ${row.cols.map(col => `<td class="px-6 py-4 text-sm text-gray-600 dark:text-dark-400">${col}</td>`).join('')}
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                            ${row.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    generateTablePagination() {
        return `
            <div class="px-6 py-4 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600 dark:text-dark-400">
                        Showing 1 to 10 of 97 results
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="px-3 py-1 text-sm text-gray-400 cursor-not-allowed">Previous</button>
                        <div class="flex space-x-1">
                            <button class="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                            <button class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">2</button>
                            <button class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">3</button>
                            <span class="px-2 text-gray-400">...</span>
                            <button class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">10</button>
                        </div>
                        <button class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    // =====================================
    // CHART MANAGEMENT
    // =====================================

    initializeCharts(chartData) {
        this.destroyCharts();
        
        const chartIds = ['detailChart1', 'detailChart2', 'detailChart3', 'detailChart4'];
        
        chartIds.forEach(chartId => {
            const canvas = this.elements.screen.querySelector(`#${chartId}`);
            if (canvas) {
                const chart = new Chart(canvas.getContext('2d'), {
                    type: 'bar',
                    data: this.getChartData(chartData),
                    options: this.getChartOptions()
                });
                this.charts.push(chart);
            }
        });
    }

    getChartData(chartData) {
        return {
            labels: chartData.daily.labels,
            datasets: [
                {
                    label: 'Success',
                    data: chartData.daily.success,
                    backgroundColor: '#10B981',
                    borderRadius: 2,
                    maxBarThickness: 16
                },
                {
                    label: 'Failures',
                    data: chartData.daily.failures,
                    backgroundColor: '#EF4444',
                    borderRadius: 2,
                    maxBarThickness: 16
                }
            ]
        };
    }

    getChartOptions() {
        const isDark = this.darkMode.manager?.isDarkMode || false;
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: isDark ? '#e2e8f0' : 'white',
                    bodyColor: isDark ? '#e2e8f0' : 'white',
                    borderColor: isDark ? '#475569' : 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: isDark ? '#94a3b8' : '#6b7280',
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: isDark ? '#374151' : 'rgba(0, 0, 0, 0.1)',
                        borderDash: [2, 2]
                    },
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#94a3b8' : '#6b7280',
                        font: { size: 11 }
                    }
                }
            },
            animation: { duration: 500 }
        };
    }

    refreshCharts() {
        this.charts.forEach(chart => {
            if (chart && chart.update) {
                chart.update('none');
            }
        });
    }

    destroyCharts() {
        this.charts.forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = [];
    }

    // =====================================
    // MODAL DIALOGS
    // =====================================

    showFilterModal() {
        if (!window.navigationManager) {
            this.showFallbackModal('Filter not available', 'Navigation manager not found');
            return;
        }

        const filterContent = this.generateFilterModalContent();
        
        window.navigationManager.showModal(
            `Filter ${this.state.currentTransactionType} Channel Data`,
            filterContent,
            [
                { 
                    label: 'Reset Filters', 
                    action: 'reset',
                    handler: () => {
                        this.resetFilters();
                        return false;
                    }
                },
                { 
                    label: 'Apply Filters', 
                    action: 'apply', 
                    primary: true,
                    handler: () => {
                        this.applyFilters(this.collectFilterValues());
                        return true;
                    }
                }
            ]
        );
    }

    generateFilterModalContent() {
        return `
            <div class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <i class="fas fa-info-circle"></i>
                        <span class="text-sm font-medium">Filtering ${this.state.currentTransactionType} Channel Data</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                        <select id="filterDateRange" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Period</label>
                        <select id="filterTimePeriod" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Hours</option>
                            <option value="business">Business Hours (9-17)</option>
                            <option value="peak">Peak Hours (8-10, 17-19)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Error Types</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="internalErrors" checked class="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-gray-700 dark:text-gray-300">Internal Errors</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="externalErrors" checked class="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-gray-700 dark:text-gray-300">External Errors</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="userErrors" checked class="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-gray-700 dark:text-gray-300">User Errors</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    showDateRangePicker() {
        if (!window.navigationManager) {
            this.showFallbackModal('Date Picker', 'Navigation manager not found');
            return;
        }

        const dateContent = this.generateDatePickerContent();
        
        window.navigationManager.showModal(
            'Select Date Range',
            dateContent,
            [
                { label: 'Cancel', action: 'cancel' },
                { 
                    label: 'Apply Range', 
                    action: 'apply', 
                    primary: true,
                    handler: () => {
                        const startDate = document.getElementById('startDateInput')?.value;
                        const endDate = document.getElementById('endDateInput')?.value;
                        
                        if (startDate && endDate) {
                            this.applyDateRange(startDate, endDate);
                            return true;
                        }
                        return false;
                    }
                }
            ]
        );
    }

    generateDatePickerContent() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        return `
            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                        <input type="date" id="startDateInput" value="${thirtyDaysAgo.toISOString().split('T')[0]}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                        <input type="date" id="endDateInput" value="${today.toISOString().split('T')[0]}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Select</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button type="button" class="quick-range-btn px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" data-days="7">
                            Last 7 days
                        </button>
                        <button type="button" class="quick-range-btn px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" data-days="30">
                            Last 30 days
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showFallbackModal(title, message) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium">${title}</h3>
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="text-sm text-gray-600 mb-4">${message}</p>
                <button onclick="this.closest('.fixed').remove()" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // =====================================
    // FILTER & DATE OPERATIONS
    // =====================================

    collectFilterValues() {
        return {
            dateRange: document.getElementById('filterDateRange')?.value || '7d',
            timePeriod: document.getElementById('filterTimePeriod')?.value || 'all',
            errorTypes: {
                internal: document.getElementById('internalErrors')?.checked || true,
                external: document.getElementById('externalErrors')?.checked || true,
                user: document.getElementById('userErrors')?.checked || true
            }
        };
    }

    applyFilters(filters) {
        console.log('Applying filters:', filters);
        this.state.currentFilters = filters;
        this.cache.clear();
        this.loadTransactionDetails(this.state.currentTransactionType);
        
        // Update filter button appearance
        this.updateFilterButtonState(true);
        this.showNotification('Filters applied successfully', 'success');
    }

    resetFilters() {
        this.state.currentFilters = null;
        this.updateFilterButtonState(false);
        this.showNotification('Filters reset', 'info');
    }

    applyDateRange(startDate, endDate) {
        console.log('Applying date range:', startDate, 'to', endDate);
        this.state.currentDateRange = { startDate, endDate };
        
        // Update display
        const dateDisplay = this.elements.screen.querySelector('.date-range-picker span');
        if (dateDisplay) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            dateDisplay.textContent = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        }
        
        this.cache.clear();
        this.loadTransactionDetails(this.state.currentTransactionType);
        this.showNotification('Date range updated', 'success');
    }

    updateFilterButtonState(isActive) {
        const filterBtn = this.elements.filterButton;
        if (!filterBtn) return;
        
        if (isActive) {
            filterBtn.classList.add('bg-blue-600', 'dark:bg-blue-500');
            filterBtn.classList.remove('bg-gray-900', 'dark:bg-dark-600');
            filterBtn.innerHTML = '<i class="fas fa-filter-circle-xmark"></i> Filtered';
        } else {
            filterBtn.classList.remove('bg-blue-600', 'dark:bg-blue-500');
            filterBtn.classList.add('bg-gray-900', 'dark:bg-dark-600');
            filterBtn.innerHTML = '<i class="fas fa-filter"></i> Filter';
        }
    }

    // =====================================
    // EXPORT FUNCTIONALITY
    // =====================================

    handleExport() {
        const data = this.getMockData(this.state.currentTransactionType);
        const csvContent = this.generateCSV(data);
        this.downloadCSV(csvContent, `${this.state.currentTransactionType}_analysis.csv`);
        this.showNotification('Data exported successfully', 'success');
    }

    generateCSV(data) {
        const headers = ['Date', 'Success_Count', 'Failure_Count', 'Total_Transactions'];
        const rows = [headers.join(',')];
        
        data.chartData.daily.labels.forEach((label, index) => {
            const success = data.chartData.daily.success[index];
            const failure = data.chartData.daily.failures[index];
            rows.push([label, success, failure, success + failure].join(','));
        });
        
        return rows.join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // =====================================
    // REAL-TIME UPDATES
    // =====================================

    startRealTimeUpdates() {
        this.stopRealTimeUpdates();
        this.realTimeInterval = setInterval(() => {
            if (this.isVisible()) {
                this.cache.clear();
                this.loadTransactionDetails(this.state.currentTransactionType);
            }
        }, 30000);
    }

    stopRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
        }
    }

    // =====================================
    // UTILITY METHODS
    // =====================================

    getColorClasses(color) {
        const colorMap = {
            blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', progress: 'bg-blue-200 dark:bg-blue-400' },
            red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', progress: 'bg-red-200 dark:bg-red-400' },
            green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', progress: 'bg-green-200 dark:bg-green-400' },
            yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', progress: 'bg-yellow-200 dark:bg-yellow-400' },
            orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', progress: 'bg-orange-200 dark:bg-orange-400' },
            purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', progress: 'bg-purple-200 dark:bg-purple-400' }
        };
        return colorMap[color] || colorMap.blue;
    }

    showNotification(message, type = 'info') {
        if (window.navigationManager?.showNotification) {
            window.navigationManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showErrorState(error) {
        const container = this.elements.screen.querySelector('#chartsAndTableContent');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
                    <p class="text-gray-600 mb-4">${error}</p>
                    <button onclick="window.transactionDetailsScreen.loadTransactionDetails('${this.state.currentTransactionType}')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-refresh mr-2"></i>
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    // =====================================
    // CLEANUP
    // =====================================

    cleanup() {
        this.stopRealTimeUpdates();
        this.destroyCharts();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Cleanup dark mode
        if (this.darkMode.cleanup) {
            this.darkMode.cleanup();
        }
        
        // Remove DOM element
        if (this.elements.screen?.parentNode) {
            this.elements.screen.parentNode.removeChild(this.elements.screen);
        }
        
        // Clear cache and reset state
        this.cache.clear();
        this.state.isInitialized = false;
        
        console.log('TransactionDetailsScreen cleaned up');
    }

    // =====================================
    // STATIC METHODS
    // =====================================

    static showDetails(transactionType) {
        if (!window.transactionDetailsScreen) {
            window.transactionDetailsScreen = new TransactionDetailsScreen(window.dashboardApp);
        }
        window.transactionDetailsScreen.show(transactionType);
    }

    static hideDetails() {
        if (window.transactionDetailsScreen) {
            window.transactionDetailsScreen.hide();
        }
    }
}

// Global availability
window.TransactionDetailsScreen = TransactionDetailsScreen;