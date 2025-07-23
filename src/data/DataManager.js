// Data management and API integration
export class DataManager {
    constructor() {
        this.cache = new Map();
        this.refreshIntervals = new Map();
    }

    async fetchData(endpoint, options = {}) {
        // API TODO: This is the main data fetching method
        // Should handle authentication, rate limiting, retries
        // Support for different data sources (REST, GraphQL, WebSocket)
        // Implement request/response interceptors for logging, error handling

        try {
            const response = await fetch(endpoint, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // API TODO: Add authentication headers
                    // 'Authorization': `Bearer ${getAuthToken()}`,
                    // 'X-API-Key': getApiKey(),
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // API TODO: Implement response validation
            // Validate response schema, sanitize data
            // Log successful requests for analytics

            return this.processData(data, options.dataType);
        } catch (error) {
            console.error('Error fetching data:', error);

            // API TODO: Implement error reporting
            // Send error metrics to monitoring service
            // Implement fallback data sources

            throw error;
        }
    }

    processData(data, dataType) {
        // API TODO: Add data transformation pipeline
        // Support for custom data transformations
        // Data validation and sanitization
        // Format conversion (CSV, XML, etc.)

        if (!data) return null;

        switch (dataType) {
            case 'table':
                return Array.isArray(data) ? data : [data];
            case 'chart':
                return this.processChartData(data);
            case 'single-value':
                return typeof data === 'object' ? data : { value: data, label: 'Value' };
            default:
                return data;
        }
    }

    processChartData(data) {
        if (Array.isArray(data)) {
            return data.map((item, index) => ({
                name: item.name || item.label || `Item ${index + 1}`,
                value: item.value || item.count || 0,
                color: item.color || this.getDefaultColor(index)
            }));
        }

        if (typeof data === 'object') {
            return Object.entries(data).map(([key, value], index) => ({
                name: key,
                value: typeof value === 'number' ? value : 0,
                color: this.getDefaultColor(index)
            }));
        }

        return [];
    }

    getDefaultColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[index % colors.length];
    }

    setupAutoRefresh(widgetId, endpoint, interval, callback) {
        // API TODO: Implement intelligent auto-refresh
        // Respect API rate limits, implement exponential backoff
        // Pause refresh when tab is not visible
        // Handle authentication token refresh

        this.stopAutoRefresh(widgetId);

        if (interval > 0) {
            const intervalId = setInterval(async () => {
                try {
                    // API TODO: Check if tab is visible before refreshing
                    // if (document.hidden) return;

                    const data = await this.fetchData(endpoint);
                    callback(data);

                    // API TODO: Log successful refresh for analytics
                    // trackEvent('widget_refresh_success', { widget_id: widgetId });

                } catch (error) {
                    console.error('Auto-refresh failed:', error);

                    // API TODO: Implement retry logic with exponential backoff
                    // Consider stopping auto-refresh after multiple failures
                    // Notify user of persistent failures
                }
            }, interval);

            this.refreshIntervals.set(widgetId, intervalId);
        }
    }

    stopAutoRefresh(widgetId) {
        if (this.refreshIntervals.has(widgetId)) {
            clearInterval(this.refreshIntervals.get(widgetId));
            this.refreshIntervals.delete(widgetId);
        }
    }

    cacheData(key, data, ttl = 300000) { // 5 minutes default TTL
        // API TODO: Implement more sophisticated caching
        // Use IndexedDB for larger datasets
        // Implement cache invalidation strategies
        // Add cache size limits and LRU eviction

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    getCachedData(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clearCache() {
        this.cache.clear();
    }

    cleanup() {
        this.refreshIntervals.forEach(interval => clearInterval(interval));
        this.refreshIntervals.clear();
        this.clearCache();
    }
}