// src/utils/DarkModeManager.js
export class DarkModeManager {
    constructor() {
        this.isDarkMode = this.getInitialTheme();
        this.callbacks = new Set();
        this.toggleButtons = new Set();
        this.init();
    }

    getInitialTheme() {
        // Check localStorage first
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return saved === 'true';
        }
        
        // Check system preference
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    init() {
        // Apply initial theme
        this.applyTheme();
        
        // Set up toggle listeners
        this.setupToggleListeners();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (localStorage.getItem('darkMode') === null) {
                    this.isDarkMode = e.matches;
                    this.applyTheme();
                    this.notifyCallbacks();
                }
            });
        }

        // Make globally available
        window.darkModeManager = this;
        
        console.log('DarkModeManager initialized:', this.isDarkMode ? 'dark' : 'light');
    }

    setupToggleListeners() {
        // Watch for dynamically added toggle buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.attachToggleListeners(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Attach to existing buttons
        this.attachToggleListeners(document);
    }

    attachToggleListeners(container = document) {
        // Find all dark mode toggle buttons
        const toggleSelectors = [
            '#darkModeToggle',
            '#darkModeToggleDetails',
            '[data-dark-mode-toggle]',
            '.dark-mode-toggle'
        ];

        toggleSelectors.forEach(selector => {
            const toggles = container.querySelectorAll(selector);
            toggles.forEach(toggle => {
                if (!this.toggleButtons.has(toggle)) {
                    toggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggle();
                    });
                    this.toggleButtons.add(toggle);
                    
                    // Add visual feedback
                    this.addToggleAnimation(toggle);
                }
            });
        });
    }

    addToggleAnimation(button) {
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        
        button.addEventListener('mousedown', () => {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(59, 130, 246, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
                pointer-events: none;
            `;
            
            button.appendChild(ripple);
            
            // Animate ripple
            requestAnimationFrame(() => {
                ripple.style.width = '40px';
                ripple.style.height = '40px';
            });
            
            // Remove ripple
            setTimeout(() => {
                if (button.contains(ripple)) {
                    button.removeChild(ripple);
                }
            }, 300);
        });
    }

    toggle() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.savePreference();
        this.notifyCallbacks();
        this.showToggleNotification();
        
        console.log('Theme toggled to:', this.isDarkMode ? 'dark' : 'light');
    }

    applyTheme() {
        const html = document.documentElement;
        
        if (this.isDarkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        // Update CSS custom properties
        this.updateCSSProperties();
        
        // Update chart themes if they exist
        this.updateChartThemes();
        
        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor();
    }

    updateCSSProperties() {
        const root = document.documentElement;
        
        if (this.isDarkMode) {
            root.style.setProperty('--bg-primary', '#0f172a');
            root.style.setProperty('--bg-secondary', '#1e293b');
            root.style.setProperty('--bg-tertiary', '#334155');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#e2e8f0');
            root.style.setProperty('--text-tertiary', '#94a3b8');
            root.style.setProperty('--border-primary', '#475569');
            root.style.setProperty('--border-secondary', '#334155');
        } else {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8fafc');
            root.style.setProperty('--bg-tertiary', '#f1f5f9');
            root.style.setProperty('--text-primary', '#0f172a');
            root.style.setProperty('--text-secondary', '#334155');
            root.style.setProperty('--text-tertiary', '#64748b');
            root.style.setProperty('--border-primary', '#e2e8f0');
            root.style.setProperty('--border-secondary', '#cbd5e1');
        }
    }

    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = this.isDarkMode ? '#0f172a' : '#ffffff';
    }

    savePreference() {
        localStorage.setItem('darkMode', this.isDarkMode.toString());
    }

    // Callback system for components that need to react to theme changes
    onThemeChange(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback); // Return cleanup function
    }

    notifyCallbacks() {
        this.callbacks.forEach(callback => {
            try {
                callback(this.isDarkMode);
            } catch (error) {
                console.error('Error in dark mode callback:', error);
            }
        });
    }

    showToggleNotification() {
        // Remove existing notifications
        const existing = document.querySelectorAll('.dark-mode-notification');
        existing.forEach(el => el.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `dark-mode-notification fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
            this.isDarkMode ? 'bg-gray-800' : 'bg-gray-700'
        }`;
        notification.style.transform = 'translateX(100%)';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-${this.isDarkMode ? 'moon' : 'sun'} ${this.isDarkMode ? 'text-blue-400' : 'text-yellow-400'}"></i>
                <span class="text-sm font-medium">${this.isDarkMode ? 'Dark' : 'Light'} mode enabled</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove after 2.5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2500);
    }

    updateChartThemes() {
        // Update Chart.js default colors for dark mode
        if (window.Chart) {
            const isDark = this.isDarkMode;
            
            // Update Chart.js defaults
            Chart.defaults.color = isDark ? '#e2e8f0' : '#374151';
            Chart.defaults.borderColor = isDark ? '#374151' : '#e5e7eb';
            Chart.defaults.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            
            // Update existing chart instances
            if (Chart.instances) {
                Chart.instances.forEach(chart => {
                    try {
                        // Update legend colors
                        if (chart.options.plugins?.legend?.labels) {
                            chart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#374151';
                        }
                        
                        // Update scale colors
                        if (chart.options.scales) {
                            Object.keys(chart.options.scales).forEach(scaleKey => {
                                const scale = chart.options.scales[scaleKey];
                                if (scale.ticks) {
                                    scale.ticks.color = isDark ? '#94a3b8' : '#6b7280';
                                }
                                if (scale.grid) {
                                    scale.grid.color = isDark ? '#374151' : '#e5e7eb';
                                }
                            });
                        }
                        
                        // Update tooltip colors
                        if (chart.options.plugins?.tooltip) {
                            chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.8)';
                            chart.options.plugins.tooltip.titleColor = isDark ? '#e2e8f0' : 'white';
                            chart.options.plugins.tooltip.bodyColor = isDark ? '#e2e8f0' : 'white';
                            chart.options.plugins.tooltip.borderColor = isDark ? '#475569' : 'rgba(255, 255, 255, 0.1)';
                        }
                        
                        chart.update('none');
                    } catch (error) {
                        console.warn('Error updating chart theme:', error);
                    }
                });
            }
        }
    }

    // Utility methods
    getCurrentTheme() {
        return this.isDarkMode ? 'dark' : 'light';
    }

    setTheme(isDark) {
        this.isDarkMode = isDark;
        this.applyTheme();
        this.savePreference();
        this.notifyCallbacks();
    }

    // Get theme-appropriate colors for components
    getThemeColors() {
        return {
            isDark: this.isDarkMode,
            background: {
                primary: this.isDarkMode ? '#0f172a' : '#ffffff',
                secondary: this.isDarkMode ? '#1e293b' : '#f8fafc',
                tertiary: this.isDarkMode ? '#334155' : '#f1f5f9'
            },
            text: {
                primary: this.isDarkMode ? '#f8fafc' : '#0f172a',
                secondary: this.isDarkMode ? '#e2e8f0' : '#334155',
                tertiary: this.isDarkMode ? '#94a3b8' : '#64748b'
            },
            border: {
                primary: this.isDarkMode ? '#475569' : '#e2e8f0',
                secondary: this.isDarkMode ? '#334155' : '#cbd5e1'
            }
        };
    }

    // Create theme-aware chart options
    createChartOptions(baseOptions = {}) {
        const isDark = this.isDarkMode;
        
        const themeOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#e2e8f0' : '#374151'
                    }
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
                    ticks: {
                        color: isDark ? '#94a3b8' : '#6b7280'
                    },
                    grid: {
                        color: isDark ? '#374151' : '#e5e7eb'
                    }
                },
                y: {
                    ticks: {
                        color: isDark ? '#94a3b8' : '#6b7280'
                    },
                    grid: {
                        color: isDark ? '#374151' : '#e5e7eb'
                    }
                }
            }
        };

        // Deep merge with base options
        return this.deepMerge(baseOptions, themeOptions);
    }

    // Helper method for deep merging objects
    deepMerge(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // Cleanup method
    cleanup() {
        this.callbacks.clear();
        this.toggleButtons.clear();
        
        // Remove event listeners would require keeping references
        // For now, buttons will just not function after cleanup
        
        console.log('DarkModeManager cleaned up');
    }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && !window.darkModeManager) {
    window.darkModeManager = new DarkModeManager();
}

export default DarkModeManager;