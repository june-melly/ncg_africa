// src/screens/TransactionDetailsScreen.js
export class TransactionDetailsScreen {
    constructor(app) {
        this.app = app;
        this.currentTransactionType = null;
        this.currentTab = 'failure';
        this.charts = [];
        this.isInitialized = false;
        this.realTimeInterval = null;
        this.detailsCache = new Map();
        
        // DOM elements
        this.screenElement = null;
        this.backButton = null;
        this.tabButtons = [];
        this.exportButton = null;
        this.filterButton = null;
        
    
        //Dark mode manager
        this.darkModeManager = null;
        this.darkModeCleanup = null;

        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        try {
             this.setupDarkModeIntegration();
            this.createScreenElement();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('TransactionDetailsScreen initialized');
        } catch (error) {
            console.error('Failed to initialize TransactionDetailsScreen:', error);
        }
    }
    setupDarkModeIntegration() {
    // Get dark mode manager
    this.darkModeManager = window.darkModeManager;
    
    if (this.darkModeManager) {
        // Listen for theme changes
        this.darkModeCleanup = this.darkModeManager.onThemeChange((isDark) => {
            this.handleThemeChange(isDark);
        });
        
        console.log('Dark mode integration setup for transaction monitoring');
    }
}

handleThemeChange(isDark) {
    console.log(`Transaction monitoring theme changed to: ${isDark ? 'dark' : 'light'}`);
    
    // Update any charts if they exist
    if (this.charts && this.charts.length > 0) {
        this.charts.forEach(chart => {
            if (chart && chart.update) {
                chart.update('none');
            }
        });
    }
    
    // Trigger re-render if needed
    if (this.isVisible && this.isVisible()) {
        // Optional: trigger content refresh
        console.log('Refreshing content for theme change');
    }
}
 

    createScreenElement() {
        // Create the main screen container
        this.screenElement = document.createElement('div');
        this.screenElement.id = 'transactionDetailsScreen';
        this.screenElement.className = 'fixed inset-0 bg-gray-50 z-50 hidden';
        this.screenElement.innerHTML = this.getScreenHTML();
        
        // Append to body but keep hidden
        document.body.appendChild(this.screenElement);
    }

   getScreenHTML() {
    return `
        <!-- Header with Dark Mode -->
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
                    <div class="flex items-center gap-4">
                        <!-- Dark Mode Toggle in Details -->
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
                </div>
            </div>
        </div>

        <!-- Tab Navigation with Dark Mode -->
        <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 transition-colors duration-300">
            <div class="px-6">
                <nav class="flex space-x-8" role="tablist">
                    <button class="tab-btn active border-b-2 border-blue-600 dark:border-blue-400 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400" data-tab="failure">
                        Failure & Exception Analysis
                    </button>
                    <button class="tab-btn border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200" data-tab="performance">
                        Performance Metrics
                    </button>
                    <button class="tab-btn border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200" data-tab="patterns">
                        Transaction Patterns
                    </button>
                    <button class="tab-btn border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200" data-tab="insights">
                        Transaction Insights
                    </button>
                </nav>
            </div>
        </div>

        <!-- Controls Bar with Dark Mode -->
        <div class="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-3 transition-colors duration-300">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600 dark:text-dark-400">
                    Displaying data for the selected time period
                </div>
                <div class="flex items-center gap-3">
                    <div class="date-range-picker flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors">
                        <i class="fas fa-calendar text-gray-500 dark:text-dark-400"></i>
                        <span class="text-sm text-gray-700 dark:text-dark-200">July 25, 2026 - August 25, 2026</span>
                    </div>
                    <button id="filterBtn" class="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-dark-600 text-white rounded-md hover:bg-gray-800 dark:hover:bg-dark-500 transition-colors">
                        <i class="fas fa-filter"></i>
                        Filter
                    </button>
                    <button id="exportBtn" class="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="p-6 overflow-y-auto bg-gray-50 dark:bg-dark-900 transition-colors duration-300" style="height: calc(100vh - 200px);">
            <div id="detailsContent">
                <!-- Content will be dynamically generated -->
            </div>
        </div>
    `;
}

    setupEventListeners() {
        // Back button
        this.backButton = this.screenElement.querySelector('#backToMonitoring');
        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.hide());
        }

        // Tab buttons
        this.tabButtons = this.screenElement.querySelectorAll('.tab-btn');
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Export button
        this.exportButton = this.screenElement.querySelector('#exportBtn');
        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => this.exportData());
        }

        // Filter button
        this.filterButton = this.screenElement.querySelector('#filterBtn');
        if (this.filterButton) {
            this.filterButton.addEventListener('click', () => this.showFilterModal());
        }

        // Date range picker
        const dateRangePicker = this.screenElement.querySelector('.date-range-picker');
        if (dateRangePicker) {
            dateRangePicker.addEventListener('click', () => this.showDateRangePicker());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(e) {
        if (!this.isVisible()) return;

        if (e.key === 'Escape') {
            this.hide();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportData();
        }
    }

    show(transactionType = 'USSD') {
        this.currentTransactionType = transactionType;
        
        // Update channel type in header
        const channelTypeElement = this.screenElement.querySelector('#channelType');
        if (channelTypeElement) {
            channelTypeElement.textContent = transactionType;
        }

        // Show the screen
        this.screenElement.classList.remove('hidden');
        
        // Load and render content
        this.loadTransactionDetails(transactionType);
        
        // Start real-time updates if enabled
        this.startRealTimeUpdates();

        console.log(`Showing transaction details for ${transactionType}`);
    }

    hide() {
        this.screenElement.classList.add('hidden');
        this.stopRealTimeUpdates();
        this.destroyCharts();
        
        console.log('Transaction details screen hidden');
    }

    isVisible() {
        return !this.screenElement.classList.contains('hidden');
    }

    async loadTransactionDetails(transactionType) {
        try {
            // Check cache first
            const cacheKey = `${transactionType}_${this.currentTab}`;
            let data = this.detailsCache.get(cacheKey);

            if (!data) {
                // Load from API or use mock data
                data = await this.fetchTransactionDetails(transactionType);
                this.detailsCache.set(cacheKey, data);
            }

            this.renderContent(data);
        } catch (error) {
            console.error('Error loading transaction details:', error);
            this.showErrorState(error.message);
        }
    }

    async fetchTransactionDetails(transactionType) {
        // In a real implementation, this would call your API
        // For now, return mock data
        return this.getMockData(transactionType);
    }

    getMockData(transactionType) {
        const mockData = {
            USSD: {
                metrics: {
                    totalTransactions: 56000,
                    totalFailures: 3400,
                    totalSuccess: 52600,
                    internalErrors: 20,
                    externalErrors: 30,
                    userErrors: 50
                },
                chartData: {
                    daily: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        success: [45, 52, 48, 61, 55, 67, 43, 49, 42, 58, 50, 67, 43, 55],
                        failures: [12, 15, 18, 14, 16, 11, 19, 13, 17, 14, 16, 12, 18, 15]
                    },
                    hourly: {
                        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                        volume: [120, 80, 60, 150, 340, 520, 680, 590, 720, 650, 480, 280]
                    }
                },
                insights: [
                    {
                        type: 'alert',
                        title: 'Alert: Transactions dropped 32% between 2-4 PM',
                        description: 'Investigate possible service disruptions.',
                        icon: 'exclamation-triangle',
                        color: 'red',
                        timestamp: '2 hours ago'
                    },
                    {
                        type: 'warning',
                        title: 'Warning: External failures on POS channel spiked',
                        description: 'Check third-party system health and latency.',
                        icon: 'user-cog',
                        color: 'yellow',
                        timestamp: '4 hours ago'
                    },
                    {
                        type: 'info',
                        title: 'Info: Success rate stabilized at 94% over last 3 hours',
                        description: 'Continue monitoring trend consistency.',
                        icon: 'info-circle',
                        color: 'blue',
                        timestamp: '6 hours ago'
                    }
                ]
            },
            SMS: {
                metrics: {
                    totalTransactions: 32000,
                    totalFailures: 1600,
                    totalSuccess: 30400,
                    internalErrors: 15,
                    externalErrors: 25,
                    userErrors: 60
                },
                chartData: {
                    daily: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        success: [38, 42, 45, 48, 52, 55, 39, 44, 41, 49, 46, 53, 40, 47],
                        failures: [8, 6, 9, 7, 5, 8, 10, 6, 8, 7, 9, 6, 11, 8]
                    },
                    hourly: {
                        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                        volume: [80, 60, 40, 120, 280, 420, 520, 450, 480, 420, 320, 180]
                    }
                },
                insights: [
                    {
                        type: 'info',
                        title: 'Info: SMS delivery rate improved to 95%',
                        description: 'Carrier optimization showing positive results.',
                        icon: 'info-circle',
                        color: 'blue',
                        timestamp: '1 hour ago'
                    },
                    {
                        type: 'warning',
                        title: 'Warning: Peak hour congestion detected',
                        description: 'Consider load balancing during 8-10 AM.',
                        icon: 'clock',
                        color: 'yellow',
                        timestamp: '3 hours ago'
                    }
                ]
            },
            API: {
                metrics: {
                    totalTransactions: 128000,
                    totalFailures: 6400,
                    totalSuccess: 121600,
                    internalErrors: 35,
                    externalErrors: 40,
                    userErrors: 25
                },
                chartData: {
                    daily: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        success: [85, 92, 88, 95, 90, 98, 83, 89, 86, 94, 91, 97, 85, 92],
                        failures: [15, 12, 18, 10, 14, 8, 22, 16, 19, 11, 15, 9, 20, 13]
                    },
                    hourly: {
                        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                        volume: [200, 150, 120, 300, 680, 920, 1200, 1050, 1150, 980, 750, 450]
                    }
                },
                insights: [
                    {
                        type: 'alert',
                        title: 'Alert: API rate limits approaching',
                        description: 'Scale up infrastructure to handle increased load.',
                        icon: 'exclamation-triangle',
                        color: 'red',
                        timestamp: '30 minutes ago'
                    },
                    {
                        type: 'info',
                        title: 'Info: Response time optimization successful',
                        description: 'Average response time reduced by 15%.',
                        icon: 'tachometer-alt',
                        color: 'blue',
                        timestamp: '2 hours ago'
                    }
                ]
            }
        };

        return mockData[transactionType] || mockData.USSD;
    }

    renderContent(data) {
        const contentContainer = this.screenElement.querySelector('#detailsContent');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            ${this.renderMetricsCards(data.metrics)}
            ${this.renderChartsSection(data)}
            ${this.renderDataTable(data)}
        `;

        // Initialize charts after content is rendered
        setTimeout(() => {
            this.initializeCharts(data.chartData);
        }, 100);
    }
    

    renderMetricsCards(metrics) {
        return `
            <!-- Metrics Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                ${this.createMetricCard('Total Transactions', metrics.totalTransactions.toLocaleString(), 'exchange-alt', 'blue', 'last 7 days', 75)}
                ${this.createMetricCard('Total Failures', metrics.totalFailures.toLocaleString(), 'times-circle', 'red', 'last 7 days', (metrics.totalFailures / metrics.totalTransactions * 100))}
                ${this.createMetricCard('Total Success Count', metrics.totalSuccess.toLocaleString(), 'check-circle', 'green', 'last 7 days', 90)}
                ${this.createMetricCard('Internal Errors', metrics.internalErrors + '%', 'exclamation-triangle', 'yellow', 'last 7 days', metrics.internalErrors)}
                ${this.createMetricCard('External Errors', metrics.externalErrors + '%', 'external-link-alt', 'orange', 'last 7 days', metrics.externalErrors)}
                ${this.createMetricCard('User Errors', metrics.userErrors + '%', 'user-times', 'purple', 'last 7 days', metrics.userErrors)}
            </div>
        `;
    }

    
    createMetricCard(title, value, icon, color, subtitle, progressWidth) {
    const colorClasses = {
        blue: { 
            bg: 'bg-blue-100 dark:bg-blue-900/30', 
            text: 'text-blue-600 dark:text-blue-400', 
            progress: 'bg-blue-600 dark:bg-blue-400', 
            progressBg: 'bg-blue-200 dark:bg-blue-900/30' 
        },
        red: { 
            bg: 'bg-red-100 dark:bg-red-900/30', 
            text: 'text-red-600 dark:text-red-400', 
            progress: 'bg-red-600 dark:bg-red-400', 
            progressBg: 'bg-red-200 dark:bg-red-900/30' 
        },
        green: { 
            bg: 'bg-green-100 dark:bg-green-900/30', 
            text: 'text-green-600 dark:text-green-400', 
            progress: 'bg-green-600 dark:bg-green-400', 
            progressBg: 'bg-green-200 dark:bg-green-900/30' 
        },
        yellow: { 
            bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
            text: 'text-yellow-600 dark:text-yellow-400', 
            progress: 'bg-yellow-600 dark:bg-yellow-400', 
            progressBg: 'bg-yellow-200 dark:bg-yellow-900/30' 
        },
        orange: { 
            bg: 'bg-orange-100 dark:bg-orange-900/30', 
            text: 'text-orange-600 dark:text-orange-400', 
            progress: 'bg-orange-600 dark:bg-orange-400', 
            progressBg: 'bg-orange-200 dark:bg-orange-900/30' 
        },
        purple: { 
            bg: 'bg-purple-100 dark:bg-purple-900/30', 
            text: 'text-purple-600 dark:text-purple-400', 
            progress: 'bg-purple-600 dark:bg-purple-400', 
            progressBg: 'bg-purple-200 dark:bg-purple-900/30' 
        }
    };

    const colors = colorClasses[color];

    return `
        <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 metric-card hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center">
                    <i class="fas fa-${icon} ${colors.text}"></i>
                </div>
                <div>
                    <div class="text-sm font-medium text-gray-600 dark:text-dark-400">${title}</div>
                    <div class="text-xs text-gray-500 dark:text-dark-500">${subtitle}</div>
                </div>
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white mb-2">${value}</div>
            <div class="text-sm text-gray-600 dark:text-dark-400 mb-2">Quick View</div>
            <div class="w-full ${colors.progressBg} rounded-full h-2">
                <div class="${colors.progress} h-2 rounded-full transition-all duration-500" style="width: ${progressWidth}%"></div>
            </div>
        </div>
    `;
}

   renderDataTable(data) {
    return `
        <!-- Data Table Section -->
        <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden transition-colors duration-300">
            <!-- Table Header -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Transaction Details</h3>
                        <p class="text-sm text-gray-600 dark:text-dark-400 mt-1">Detailed breakdown of transaction data</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2">
                            <button class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                Active Tab 1
                            </button>
                            <button class="px-3 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 rounded-full hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors">
                                Tab 2
                            </button>
                            <button class="px-3 py-1 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 rounded-full hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors">
                                Tab 3
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <i class="fas fa-filter text-xs"></i>
                                Filters
                            </button>
                            <button class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <i class="fas fa-download text-xs"></i>
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Search and Controls -->
            <div class="px-6 py-3 bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700">
                <div class="flex items-center justify-between">
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-500 text-sm"></i>
                        <input type="text" placeholder="Search" 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors">
                    </div>
                    <div class="text-sm text-gray-600 dark:text-dark-400">
                        Showing ${this.getTableRowCount(data)} results
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-dark-900">
                        <tr>
                            <th class="px-6 py-3 text-left">
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" class="rounded border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800">
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">
                                <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-dark-200">
                                    <span>Column heading</span>
                                    <i class="fas fa-sort text-xs"></i>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                        ${this.generateTableRows(data)}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600 dark:text-dark-400">
                        Showing 1 to 10 of ${this.getTableRowCount(data)} results
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors" disabled>
                            Previous
                        </button>
                        <div class="flex items-center gap-1">
                            <button class="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded">1</button>
                            <button class="px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors">2</button>
                            <button class="px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors">3</button>
                            <span class="px-2 text-gray-400 dark:text-dark-500">...</span>
                            <button class="px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors">10</button>
                        </div>
                        <button class="px-3 py-1 text-sm text-gray-600 dark:text-dark-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add this helper method to generate table rows
generateTableRows(data) {
    const rows = [];
    const sampleData = [
        { id: 1, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Active', col7: 'Regular text column' },
        { id: 2, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Inactive', col7: 'Regular text column' },
        { id: 3, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Active', col7: 'Regular text column' },
        { id: 4, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Active', col7: 'Regular text column' },
        { id: 5, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Inactive', col7: 'Regular text column' },
        { id: 6, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Active', col7: 'Regular text column' },
        { id: 7, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Active', col7: 'Regular text column' },
        { id: 8, col1: 'Bold text column', col2: 'Regular text column', col3: 'Regular text column', col4: 'Regular text column', col5: 'Regular text column', col6: 'Inactive', col7: 'Regular text column' }
    ];

    sampleData.forEach(row => {
        const statusClass = row.col6 === 'Active' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';

        rows.push(`
            <tr class="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                <td class="px-6 py-4">
                    <input type="checkbox" class="rounded border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800">
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    ${row.col1}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-dark-400">
                    ${row.col2}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-dark-400">
                    ${row.col3}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-dark-400">
                    ${row.col4}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-dark-400">
                    ${row.col5}
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${row.col6}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-dark-400">
                    ${row.col7}
                </td>
            </tr>
        `);
    });

    return rows.join('');
}

// Add this helper method to get table row count
getTableRowCount(data) {
    return 97; // This matches the design showing "97 results"
}

// Updated renderChartsSection to fix dark mode styles
renderChartsSection(data) {
    return `
        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Chart 1: Success vs Failures -->
            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">Success vs Failures</h3>
                    <div class="flex items-center gap-2">
                        <button class="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors">
                            <i class="fas fa-question-circle"></i>
                        </button>
                        <button class="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="relative h-64">
                    <canvas id="detailChart1"></canvas>
                </div>
                <div class="flex items-center justify-center gap-4 mt-4 text-sm">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span class="text-gray-600 dark:text-dark-400">Success</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span class="text-gray-600 dark:text-dark-400">Failure</span>
                    </div>
                </div>
            </div>

            <!-- Chart 2: Hourly Volume -->
            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">Hourly Volume</h3>
                    <div class="flex items-center gap-2">
                        <button class="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors">
                            <i class="fas fa-question-circle"></i>
                        </button>
                        <button class="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="relative h-64">
                    <canvas id="detailChart2"></canvas>
                </div>
                <div class="flex items-center justify-center gap-4 mt-4 text-sm">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span class="text-gray-600 dark:text-dark-400">Volume</span>
                    </div>
                </div>
            </div>

            <!-- Insight Feeds -->
            <div class="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">Insight Feeds <span class="text-sm text-gray-500 dark:text-dark-400">(${data.insights.length} unread)</span></h3>
                    <button class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors">
                        <i class="fas fa-sliders-h mr-1"></i>
                        Mark all as read
                    </button>
                </div>
                <div class="space-y-4">
                    ${data.insights.map(insight => this.createInsightItem(insight)).join('')}
                </div>
            </div>
        </div>
    `;
}

    createInsightItem(insight) {
    return `
        <div class="flex items-start gap-3 p-3 bg-${insight.color}-50 dark:bg-${insight.color}-900/20 border border-${insight.color}-200 dark:border-${insight.color}-800 rounded-lg hover:shadow-sm transition-all duration-200">
            <div class="w-8 h-8 bg-${insight.color}-100 dark:bg-${insight.color}-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-${insight.icon} text-${insight.color}-600 dark:text-${insight.color}-400 text-sm"></i>
            </div>
            <div class="flex-1">
                <div class="text-sm font-medium text-${insight.color}-800 dark:text-${insight.color}-300">${insight.title}</div>
                <div class="text-sm text-${insight.color}-600 dark:text-${insight.color}-400 mt-1">${insight.description}</div>
                <div class="text-xs text-${insight.color}-500 dark:text-${insight.color}-500 mt-2">${insight.timestamp}</div>
            </div>
        </div>
    `;
}



    initializeCharts(chartData) {
        // Destroy existing charts
        this.destroyCharts();

        // Chart 1: Success vs Failures (Bar Chart)
        const ctx1 = this.screenElement.querySelector('#detailChart1');
        if (ctx1) {
            this.charts.push(new Chart(ctx1.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartData.daily.labels,
                    datasets: [
                        {
                            label: 'Success',
                            data: chartData.daily.success,
                            backgroundColor: '#10B981',
                            borderRadius: 4,
                            maxBarThickness: 20
                        },
                        {
                            label: 'Failures',
                            data: chartData.daily.failures,
                            backgroundColor: '#EF4444',
                            borderRadius: 4,
                            maxBarThickness: 20
                        }
                    ]
                },
                options: this.getChartOptions('bar')
            }));
        }

        // Chart 2: Hourly Volume (Line Chart)
        const ctx2 = this.screenElement.querySelector('#detailChart2');
        if (ctx2) {
            this.charts.push(new Chart(ctx2.getContext('2d'), {
                type: 'line',
                data: {
                    labels: chartData.hourly.labels,
                    datasets: [{
                        label: 'Transaction Volume',
                        data: chartData.hourly.volume,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: this.getChartOptions('line')
            }));
        }
    }


    getChartOptions(type) {
    const isDark = window.darkModeManager?.isDarkMode || false;
    
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: false 
            },
            tooltip: {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                titleColor: isDark ? '#e2e8f0' : 'white',
                bodyColor: isDark ? '#e2e8f0' : 'white',
                borderColor: isDark ? '#475569' : 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { 
                    display: false 
                },
                ticks: { 
                    color: isDark ? '#94a3b8' : '#6b7280',
                    font: { size: 11 }
                }
            },
            y: {
                grid: {
                    color: isDark ? '#374151' : 'rgba(0, 0, 0, 0.1)',
                    borderDash: [5, 5]
                },
                beginAtZero: true,
                ticks: {
                    color: isDark ? '#94a3b8' : '#6b7280',
                    font: { size: 11 }
                }
            }
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    };

    return baseOptions;
}

    destroyCharts() {
        this.charts.forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = [];
    }

    switchTab(tabType) {
        if (this.currentTab === tabType) return;

        this.currentTab = tabType;

        // Update tab UI
        this.tabButtons.forEach(btn => {
            btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeTab = this.screenElement.querySelector(`[data-tab="${tabType}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'border-blue-600', 'text-blue-600');
            activeTab.classList.remove('border-transparent', 'text-gray-500');
        }

        // Load tab-specific content
        this.loadTabContent(tabType);

        console.log(`Switched to ${tabType} tab`);
    }

    async loadTabContent(tabType) {
        // Clear cache for new tab data
        const cacheKey = `${this.currentTransactionType}_${tabType}`;
        this.detailsCache.delete(cacheKey);

        // Reload content for the new tab
        await this.loadTransactionDetails(this.currentTransactionType);
    }

    exportData() {
        if (!this.currentTransactionType) return;

        const data = this.getMockData(this.currentTransactionType);
        const csvContent = this.generateCSV(data);
        this.downloadCSV(csvContent, `${this.currentTransactionType}_detailed_analysis.csv`);

        if (window.navigationManager) {
            window.navigationManager.showNotification(
                `${this.currentTransactionType} transaction data exported successfully`,
                'success'
            );
        }
    }

    generateCSV(data) {
        const headers = [
            'Transaction_Type',
            'Date',
            'Success_Count',
            'Failure_Count',
            'Total_Transactions',
            'Success_Rate',
            'Failure_Rate',
            'Internal_Error_Rate',
            'External_Error_Rate',
            'User_Error_Rate'
        ];
        
        const rows = [headers.join(',')];
        
        // Add daily data
        data.chartData.daily.labels.forEach((label, index) => {
            const success = data.chartData.daily.success[index];
            const failure = data.chartData.daily.failures[index];
            const total = success + failure;
            const successRate = ((success / total) * 100).toFixed(2);
            const failureRate = ((failure / total) * 100).toFixed(2);
            
            rows.push([
                this.currentTransactionType,
                label,
                success,
                failure,
                total,
                successRate + '%',
                failureRate + '%',
                data.metrics.internalErrors + '%',
                data.metrics.externalErrors + '%',
                data.metrics.userErrors + '%'
            ].join(','));
        });
        
        // Add summary section
        rows.push(''); // Empty line
        rows.push('SUMMARY');
        rows.push(`Total Transactions,${data.metrics.totalTransactions}`);
        rows.push(`Total Success,${data.metrics.totalSuccess}`);
        rows.push(`Total Failures,${data.metrics.totalFailures}`);
        rows.push(`Overall Success Rate,${((data.metrics.totalSuccess / data.metrics.totalTransactions) * 100).toFixed(2)}%`);
        rows.push(`Internal Error Rate,${data.metrics.internalErrors}%`);
        rows.push(`External Error Rate,${data.metrics.externalErrors}%`);
        rows.push(`User Error Rate,${data.metrics.userErrors}%`);
        
        return rows.join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    showFilterModal() {
        if (!window.navigationManager) return;

        const filterContent = `
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div class="flex items-center gap-2 text-blue-700">
                        <i class="fas fa-info-circle"></i>
                        <span class="text-sm font-medium">Filtering ${this.currentTransactionType} Channel Data</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <select id="filterDateRange" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                        <select id="filterTimePeriod" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="all">All Hours</option>
                            <option value="business">Business Hours (9-17)</option>
                            <option value="peak">Peak Hours (8-10, 17-19)</option>
                            <option value="off-peak">Off-Peak Hours</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Error Type Filter</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" checked class="mr-2"> Internal Errors
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" checked class="mr-2"> External Errors
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" checked class="mr-2"> User Errors
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Success Rate Threshold</label>
                    <input type="range" id="successThreshold" min="0" max="100" value="90" 
                           class="w-full" oninput="document.getElementById('thresholdValue').textContent = this.value + '%'">
                    <div class="flex justify-between text-sm text-gray-500 mt-1">
                        <span>0%</span>
                        <span id="thresholdValue">90%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        `;

        window.navigationManager.showModal(
            `Filter ${this.currentTransactionType} Channel Data`,
            filterContent,
            [
                { label: 'Reset Filters', action: 'reset', handler: () => {
                    this.resetFilters();
                    return false; // Keep modal open
                }},
                { label: 'Apply Filters', action: 'apply', primary: true, handler: () => {
                    const filters = this.collectFilterValues();
                    this.applyFilters(filters);
                    return true; // Close modal
                }}
            ]
        );
    }

    collectFilterValues() {
        return {
            dateRange: document.getElementById('filterDateRange')?.value || '7d',
            timePeriod: document.getElementById('filterTimePeriod')?.value || 'all',
            successThreshold: document.getElementById('successThreshold')?.value || 90,
            errorTypes: {
                internal: document.querySelector('input[type="checkbox"]:nth-of-type(1)')?.checked || true,
                external: document.querySelector('input[type="checkbox"]:nth-of-type(2)')?.checked || true,
                user: document.querySelector('input[type="checkbox"]:nth-of-type(3)')?.checked || true
            }
        };
    }

    applyFilters(filters) {
        console.log('Applying filters:', filters);
        
        // Clear cache to force reload with filters
        this.detailsCache.clear();
        
        // Reload data with filters
        this.loadTransactionDetails(this.currentTransactionType);
        
        if (window.navigationManager) {
            window.navigationManager.showNotification(
                `Filters applied to ${this.currentTransactionType} channel data`,
                'success'
            );
        }
    }

    resetFilters() {
        console.log('Resetting filters...');
        
        // Reset form values
        const dateRange = document.getElementById('filterDateRange');
        const timePeriod = document.getElementById('filterTimePeriod');
        const threshold = document.getElementById('successThreshold');
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        if (dateRange) dateRange.value = '7d';
        if (timePeriod) timePeriod.value = 'all';
        if (threshold) {
            threshold.value = 90;
            document.getElementById('thresholdValue').textContent = '90%';
        }
        checkboxes.forEach(cb => cb.checked = true);
        
        if (window.navigationManager) {
            window.navigationManager.showNotification('Filters reset', 'info');
        }
    }

    showDateRangePicker() {
        if (!window.navigationManager) return;

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

    applyDateRange(startDate, endDate) {
        console.log('Applying date range:', startDate, 'to', endDate);

        // Update the date range display
        const dateRangeDisplay = this.screenElement.querySelector('.date-range-picker span');
        if (dateRangeDisplay) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const formatDisplayDate = (date) => {
                return date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            };
            dateRangeDisplay.textContent = `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
        }

        // Clear cache and reload data
        this.detailsCache.clear();
        this.loadTransactionDetails(this.currentTransactionType);

        if (window.navigationManager) {
            window.navigationManager.showNotification('Date range updated successfully', 'success');
        }
    }

    startRealTimeUpdates() {
        // Stop any existing interval
        this.stopRealTimeUpdates();

        // Start new interval for real-time updates
        this.realTimeInterval = setInterval(() => {
            if (this.isVisible()) {
                console.log('Updating real-time data...');
                // Clear cache to get fresh data
                this.detailsCache.clear();
                this.loadTransactionDetails(this.currentTransactionType);
            }
        }, 30000); // Update every 30 seconds

        console.log('Real-time updates started');
    }

    stopRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
            console.log('Real-time updates stopped');
        }
    }

    showErrorState(error) {
        const contentContainer = this.screenElement.querySelector('#detailsContent');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-red-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
                        <p class="text-gray-600 mb-4">${error}</p>
                        <button onclick="window.transactionDetailsScreen.loadTransactionDetails('${this.currentTransactionType}')"
                                class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                            <i class="fas fa-refresh mr-2"></i>
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    cleanup() {
        this.stopRealTimeUpdates();
        this.destroyCharts();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Remove screen element
        if (this.screenElement && this.screenElement.parentNode) {
            this.screenElement.parentNode.removeChild(this.screenElement);
        }
        
        // Clear cache
        this.detailsCache.clear();
        
        this.isInitialized = false;
        console.log('TransactionDetailsScreen cleaned up');
    }

    // Method to be called from transaction monitoring screen
    static showDetails(transactionType) {
        if (!window.transactionDetailsScreen) {
            // Create instance if it doesn't exist
            window.transactionDetailsScreen = new TransactionDetailsScreen(window.dashboardApp);
        }
        
        window.transactionDetailsScreen.show(transactionType);
    }

    // Method to hide from external calls
    static hideDetails() {
        if (window.transactionDetailsScreen) {
            window.transactionDetailsScreen.hide();
        }
    }
}

// Make the class globally available
window.TransactionDetailsScreen = TransactionDetailsScreen;