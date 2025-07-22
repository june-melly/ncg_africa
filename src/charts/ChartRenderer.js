// Chart rendering with Chart.js
export class ChartRenderer {
    constructor() {
        this.charts = new Map();
        this.renderTimeout = null;
    }
    
    renderAllCharts() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderTimeout = setTimeout(() => {
            if (window.dashboardApp && window.dashboardApp.widgets) {
                const allChartElements = document.querySelectorAll('[id^="chart-"]');
                allChartElements.forEach(container => {
                    const widgetId = container.id.replace('chart-', '');
                    const widget = window.dashboardApp.widgets.find(w => w.id === widgetId);
                    if (widget && widget.type !== 'header' && widget.type !== 'table' && widget.hasData) {
                        this.renderChart(widget);
                    }
                });
            }
        }, 100);
    }
    
    renderChart(widget) {
        const container = document.getElementById(`chart-${widget.id}`);
        if (!container || !widget.hasData || !widget.data) {
            console.log(`❌ Chart render failed for ${widget.id}:`, {
                container: !!container,
                hasData: widget.hasData,
                data: widget.data
            });
            return;
        }
        
        console.log(`📊 Rendering ${widget.type} chart for ${widget.id}:`, widget.data);
        
        if (this.charts.has(widget.id)) {
            this.charts.get(widget.id).destroy();
            this.charts.delete(widget.id);
        }
        
        container.innerHTML = '';
        
        if (widget.type === 'single-value') {
            this.renderSingleValue(container, widget);
        } else {
            this.renderChartJS(container, widget);
        }
    }
    
    renderSingleValue(container, widget) {
        const data = widget.data;
        const value = data?.value || data?.formatted || 0;
        const label = data?.label || 'Value';
        const formatted = data?.formatted || value.toLocaleString();
        
        container.innerHTML = `
            <div class="text-center">
                <div class="text-4xl font-bold text-teal-600 mb-2">${formatted}</div>
                <div class="text-sm text-gray-600">${label}</div>
            </div>
        `;
    }
    
    renderChartJS(container, widget) {
        const canvas = document.createElement('canvas');
        // Set explicit dimensions
        const containerWidth = container.clientWidth || 300;
        const containerHeight = container.clientHeight || 200;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = containerHeight + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const config = this.getChartConfig(widget);
        
        console.log(`🎨 Creating chart with config:`, config);
        
        try {
            const chart = new Chart(ctx, config);
            this.charts.set(widget.id, chart);
            console.log(`✅ Chart created successfully for ${widget.id}`);
        } catch (error) {
            console.error('Error creating chart:', error);
            container.innerHTML = '<div class="text-center text-gray-500">Error loading chart</div>';
        }
    }
    
    getChartConfig(widget) {
        const data = widget.data;
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            console.log(`⚠️ No data for chart ${widget.id}, using empty config`);
            return this.getEmptyChartConfig();
        }
        
        console.log(`🔧 Creating config for ${widget.type} with data:`, data);
        
        const baseConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: widget.type === 'pie' || widget.type === 'donut',
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 11 },
                        color: '#374151'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 6
                }
            },
            animation: { duration: 300 },
            layout: { padding: 10 }
        };
        
        return this.getTypeSpecificConfig(widget.type, data, baseConfig);
    }
    
    getTypeSpecificConfig(type, data, baseConfig) {
        // Ensure data is in the correct format
        const chartData = Array.isArray(data) ? data : [data];
        
        // Validate that we have proper chart data
        const validData = chartData.filter(item => 
            item && typeof item === 'object' && 
            (item.name !== undefined || item.label !== undefined) && 
            (item.value !== undefined && !isNaN(item.value))
        );
        
        if (validData.length === 0) {
            console.warn('No valid data points found, using empty chart config');
            return this.getEmptyChartConfig();
        }
        
        console.log(`🎯 Processing ${type} chart with ${chartData.length} data points:`, chartData);
        
        switch (type) {
            case 'bar':
            case 'histogram':
                return {
                    type: 'bar',
                    data: {
                        labels: validData.map(item => item.name || item.label || 'Unknown'),
                        datasets: [{
                            label: 'Values',
                            data: validData.map(item => Number(item.value) || 0),
                            backgroundColor: 'rgba(13, 148, 136, 0.8)',
                            borderColor: '#0f766e',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        ...baseConfig,
                        scales: {
                            x: { display: true, grid: { color: 'rgba(156, 163, 175, 0.3)' } },
                            y: { display: true, beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.3)' } }
                        },
                        plugins: { ...baseConfig.plugins, legend: { display: false } }
                    }
                };
                
            case 'line':
                return {
                    type: 'line',
                    data: {
                        labels: validData.map(item => item.name || item.label || 'Unknown'),
                        datasets: [{
                            label: 'Values',
                            data: validData.map(item => Number(item.value) || 0),
                            borderColor: '#0d9488',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        ...baseConfig,
                        scales: {
                            x: { display: true, grid: { color: 'rgba(156, 163, 175, 0.3)' } },
                            y: { display: true, beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.3)' } }
                        },
                        plugins: { ...baseConfig.plugins, legend: { display: false } }
                    }
                };
                
            case 'pie':
                return {
                    type: 'pie',
                    data: {
                        labels: validData.map(item => item.name || item.label || 'Unknown'),
                        datasets: [{
                            data: validData.map(item => Number(item.value) || 0),
                            backgroundColor: validData.map((item, i) => item.color || this.getDefaultColor(i)),
                            borderColor: '#ffffff',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        ...baseConfig,
                        plugins: {
                            ...baseConfig.plugins,
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    usePointStyle: true,
                                    font: { size: 11 },
                                    color: '#374151'
                                }
                            }
                        }
                    }
                };
                
            case 'donut':
                return {
                    type: 'doughnut',
                    data: {
                        labels: validData.map(item => item.name || item.label || 'Unknown'),
                        datasets: [{
                            data: validData.map(item => Number(item.value) || 0),
                            backgroundColor: validData.map((item, i) => item.color || this.getDefaultColor(i)),
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            cutout: '60%'
                        }]
                    },
                    options: {
                        ...baseConfig,
                        plugins: {
                            ...baseConfig.plugins,
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    usePointStyle: true,
                                    font: { size: 11 },
                                    color: '#374151'
                                }
                            }
                        }
                    }
                };
                
            default:
                console.warn(`Unknown chart type: ${type}, defaulting to bar chart`);
                return this.getEmptyChartConfig();
        }
    }
    
    getEmptyChartConfig() {
        return {
            type: 'bar',
            data: { 
                labels: ['No Data'], 
                datasets: [{
                    label: 'No Data Available',
                    data: [0],
                    backgroundColor: 'rgba(156, 163, 175, 0.5)',
                    borderColor: '#9ca3af',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        };
    }
    
    getDefaultColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[index % colors.length];
    }
    
    destroyChart(widgetId) {
        if (this.charts.has(widgetId)) {
            this.charts.get(widgetId).destroy();
            this.charts.delete(widgetId);
        }
    }
    
    destroyAllCharts() {
        this.charts.forEach((chart) => chart.destroy());
        this.charts.clear();
    }
}