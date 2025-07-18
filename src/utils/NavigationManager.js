// Navigation utilities
export class NavigationManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupKeyboardShortcuts();
        this.setupMobileNavigation();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="Search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to close modals/editors
            if (e.key === 'Escape') {
                if (window.dashboardApp && window.dashboardApp.selectedWidget) {
                    window.dashboardApp.selectedWidget = null;
                    window.dashboardApp.renderWidgets();
                }
            }
        });
    }
    
    setupMobileNavigation() {
        const sidebar = document.getElementById('sidebar');
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    showModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                </div>
                <div class="px-6 py-4">
                    ${content}
                </div>
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    ${actions.map(action => `
                        <button class="px-4 py-2 text-sm rounded-md ${action.primary ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                data-action="${action.action}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners for actions
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
            
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const actionConfig = actions.find(a => a.action === action);
                
                let shouldClose = true;
                if (actionConfig && actionConfig.handler) {
                    shouldClose = actionConfig.handler();
                    // If handler returns false, don't close the modal
                    if (shouldClose === false) {
                        return;
                    }
                }
                
                if (shouldClose !== false) {
                    document.body.removeChild(modal);
                }
            }
        });
        
        document.body.appendChild(modal);
        return modal;
    }
}