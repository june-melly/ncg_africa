// Analytics management without mock data
export class AnalyticsManager {
    constructor() {
        this.metrics = {
            totalViews: 0,
            uniqueUsers: 0,
            avgSessionTime: 0,
            bounceRate: 0
        };
        this.chartData = [];
        this.topWidgets = [];
    }
    
    init() {
        this.loadAnalytics();
        this.renderMetrics();
        this.renderChart();
        this.renderTopWidgets();
    }
    
    async loadAnalytics() {
        try {
            // This would typically fetch from an analytics API
            // const response = await fetch('/api/analytics');
            // const data = await response.json();
            
            // For now, start with empty data
            this.metrics = {
                totalViews: 0,
                uniqueUsers: 0,
                avgSessionTime: 0,
                bounceRate: 0
            };
            this.chartData = [];
            this.topWidgets = [];
            
            this.renderMetrics();
            this.renderChart();
            this.renderTopWidgets();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }
    
    renderMetrics() {
        const container = document.getElementById('metricsCards');
        if (!container) return;
        
        const metricsData = [
            {
                title: 'Total Views',
                value: this.metrics.totalViews.toLocaleString(),
                change: '+0%',
                icon: 'fas fa-eye',
                color: 'text-blue-600'
            },
            {
                title: 'Unique Users',
                value: this.metrics.uniqueUsers.toLocaleString(),
                change: '+0%',
                icon: 'fas fa-users',
                color: 'text-green-600'
            },
            {
                title: 'Avg. Session Time',
                value: this.formatTime(this.metrics.avgSessionTime),
                change: '+0%',
                icon: 'fas fa-clock',
                color: 'text-purple-600'
            },
            {
                title: 'Bounce Rate',
                value: `${this.metrics.bounceRate}%`,
                change: '+0%',
                icon: 'fas fa-chart-line',
                color: 'text-orange-600'
            }
        ];
        
        container.innerHTML = metricsData.map(metric => `
            <div class="bg-white rounded-lg border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">${metric.title}</p>
                        <p class="text-2xl font-bold text-gray-900">${metric.value}</p>
                    </div>
                    <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <i class="${metric.icon} ${metric.color} text-xl"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-center">
                    <span class="text-sm text-gray-500">${metric.change} from last period</span>
                </div>
            </div>
        `).join('');
    }
    
    renderChart() {
        const canvas = document.getElementById('analyticsChart');
        if (!canvas) return;
        
        // Clear any existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // Create empty chart if no data
        if (this.chartData.length === 0) {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['No Data'],
                    datasets: [
                        {
                            label: 'Views',
                            data: [0],
                            borderColor: '#0d9488',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Users',
                            data: [0],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(156, 163, 175, 0.3)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(156, 163, 175, 0.3)'
                            }
                        }
                    }
                }
            });
            return;
        }
        
        // Render chart with actual data
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.chartData.map(d => d.date),
                datasets: [
                    {
                        label: 'Views',
                        data: this.chartData.map(d => d.views),
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Users',
                        data: this.chartData.map(d => d.users),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(156, 163, 175, 0.3)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(156, 163, 175, 0.3)'
                        }
                    }
                }
            }
        });
    }
    
    renderTopWidgets() {
        const container = document.getElementById('topWidgets');
        if (!container) return;
        
        if (this.topWidgets.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-chart-bar text-gray-300 text-4xl mb-4"></i>
                    <p class="text-gray-500">No widget data available</p>
                    <p class="text-sm text-gray-400">Create and publish widgets to see performance metrics</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.topWidgets.map((widget, index) => `
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <span class="text-sm font-medium text-teal-600">${index + 1}</span>
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${widget.name}</div>
                        <div class="text-sm text-gray-500">${widget.type}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-medium text-gray-900">${widget.views.toLocaleString()}</div>
                    <div class="text-sm text-gray-500">views</div>
                </div>
            </div>
        `).join('');
    }
    
    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    trackWidgetView(widgetId, widgetType) {
        // This would typically send data to an analytics service
        console.log('Widget view tracked:', { widgetId, widgetType, timestamp: new Date() });
    }
    
    trackUserSession(sessionData) {
        // This would typically send session data to an analytics service
        console.log('User session tracked:', sessionData);
    }
}