// Widget rendering and management
export class WidgetRenderer {
    constructor(app) {
        this.app = app;
        this.dragState = {
            isDragging: false,
            isResizing: false,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            element: null,
            widget: null
        };
        this.bottomSheetClickHandler = null;
        this.setupGlobalEventListeners();
    }

    setupGlobalEventListeners() {
        // Global mouse move and up handlers for drag and resize
        document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleGlobalMouseUp(e));
    }

    createWidget(widget, selectedWidget) {
        const div = document.createElement('div');

        if (widget.type === 'text-header') {
            div.className = `text-header-box ${selectedWidget?.id === widget.id ? 'selected' : ''}`;
            div.style.position = 'absolute';
            div.style.left = `${widget.position.x}px`;
            div.style.top = `${widget.position.y}px`;
            div.style.width = `${widget.size.width}px`;
            div.style.height = `${widget.size.height}px`;
            div.style.zIndex = selectedWidget?.id === widget.id ? '10' : '1';
            div.dataset.widgetId = widget.id;

            div.innerHTML = this.createTextHeaderHTML(widget);
        } else {
            const isExpanded = widget.isExpanded;
            const expandedWidth = isExpanded ? widget.size.width * 1.5 : widget.size.width;
            const expandedHeight = isExpanded ? widget.size.height * 1.3 : widget.size.height;

            div.className = `widget-card ${selectedWidget?.id === widget.id ? 'selected' : ''} ${widget.isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : ''}`;
            div.style.position = 'absolute';
            div.style.left = `${widget.position.x}px`;
            div.style.top = `${widget.position.y}px`;
            div.style.width = `${expandedWidth}px`;
            div.style.height = widget.isMinimized ? 'auto' : `${expandedHeight}px`;
            div.style.zIndex = selectedWidget?.id === widget.id ? '10' : '1';
            div.dataset.widgetId = widget.id;

            if (widget.type === 'table') {
                div.innerHTML = this.createTableWidgetHTML(widget);
            } else {
                div.innerHTML = this.createChartWidgetHTML(widget);
            }
        }

        this.addWidgetEventListeners(div, widget);

        return div;
    }

     createBottomSheetEditor(widgetElement, widget) {
    // Remove any existing bottom sheet
    const existingSheet = document.querySelector('.bottom-sheet-editor');
    if (existingSheet) {
        existingSheet.remove();
    }

    // Remove existing click handler
    if (this.bottomSheetClickHandler) {
        document.removeEventListener('click', this.bottomSheetClickHandler);
        this.bottomSheetClickHandler = null;
    }

    const bottomSheet = document.createElement('div');
    bottomSheet.className = 'bottom-sheet-editor';

    const widgetRect = widgetElement.getBoundingClientRect();
    const canvasRect = widgetElement.parentElement.getBoundingClientRect();

    const leftPosition = widgetRect.left - canvasRect.left;
    const topPosition = widgetRect.bottom - canvasRect.top + 10;

    bottomSheet.style.position = 'absolute';
    bottomSheet.style.left = `${leftPosition}px`;
    bottomSheet.style.top = `${topPosition}px`;
    bottomSheet.style.zIndex = '1000';

    // ✅ Wait until HTML is generated, THEN attach and bind events
    this.createBottomSheetHTML(widget).then(html => {
        bottomSheet.innerHTML = html;

        // ✅ Append and bind only after innerHTML is set
        widgetElement.parentElement.appendChild(bottomSheet);

        this.setupBottomSheetEvents(bottomSheet, widget);

        // Animate in
        setTimeout(() => {
            bottomSheet.classList.add('visible');
        }, 10);
    });
}



async loadStoredQuery() {
  try {
    const response = await fetch(`http://localhost:5000/loadStoredQuery`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load Stored Query');
    }

    const result = await response.json();
     
    return result || [];
    
  } catch (error) {
    console.error('Error loading Stored Query:', error);
    return [];
  }
}





    async createBottomSheetHTML(widget) {
          const data = await this.loadStoredQuery()
       
         const queryOptions = data.map(item => `
    <option value="${item.Title}" >${item.Title}</option>
  `).join('');
        return `
            <div class="bottom-sheet-content">
                <div class="bottom-sheet-header">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-edit text-teal-600"></i>
                        <h4 class="text-sm font-medium text-gray-900">Configure ${widget.title}</h4>
                    </div>
                    <button class="close-bottom-sheet-btn text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times w-4 h-4"></i>
                    </button>
                </div>
                <div class="bottom-sheet-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${widget.type === 'text-header' ? `
                            <div class="md:col-span-2">
                                <label class="block text-xs font-medium text-gray-700 mb-1">Text Content</label>
                                <input type="text" value="${widget.content || ''}" placeholder="Enter header text..." class="text-content-input w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                                <select class="font-size-input w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                                    <option value="16" ${widget.fontSize === 16 ? 'selected' : ''}>Small (16px)</option>
                                    <option value="20" ${widget.fontSize === 20 ? 'selected' : ''}>Medium (20px)</option>
                                    <option value="24" ${!widget.fontSize || widget.fontSize === 24 ? 'selected' : ''}>Large (24px)</option>
                                    <option value="32" ${widget.fontSize === 32 ? 'selected' : ''}>Extra Large (32px)</option>
                                </select>
                            </div>
                        ` : `
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Widget Title</label>
                                <input type="text" value="${widget.title}" class="widget-title-input w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                            </div>
                            <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Choose an existing query</label>
        <select name="apiEndpoint" class="api-endpoint-input w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
          <option value="">-- Existing queries --</option>
          ${queryOptions}
        </select>
      </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Refresh Interval</label>
                                <select class="refresh-interval-input w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                                    <option value="0" ${widget.refreshInterval === 0 ? 'selected' : ''}>Manual</option>
                                    <option value="30" ${widget.refreshInterval === 30000 ? 'selected' : ''}>30 seconds</option>
                                    <option value="60" ${widget.refreshInterval === 60000 ? 'selected' : ''}>1 minute</option>
                                    <option value="300" ${widget.refreshInterval === 300000 ? 'selected' : ''}>5 minutes</option>
                                </select>
                            </div>
                            <div class="md:col-span-2">
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">Sample Data</div>
                                        <div class="text-xs text-gray-500">Load sample data <br/>to test your widget</div>
                                    </div>
                                    <button class="load-sample-btn px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
                                        Load Sample Data
                                    </button>
                                </div>
                            </div>
                        `}
                    </div>
                    ${widget.hasData ? `
                        <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-check-circle text-green-600"></i>
                                <span class="text-sm text-green-800">Data loaded successfully</span>
                                <span class="text-xs text-green-600 ml-auto">Last updated: ${new Date(widget.lastUpdated).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="bottom-sheet-footer">
                    <button class="cancel-changes-btn px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button class="apply-changes-btn px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors ml-3">
                        Apply Changes
                    </button>
                </div>
            </div>
        `;
    }

    setupBottomSheetEvents(bottomSheet, widget) {
        // Apply changes button
        const applyBtn = bottomSheet.querySelector('.apply-changes-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyWidgetChanges(bottomSheet, widget);
            });
        }

        // Cancel changes button
        const cancelBtn = bottomSheet.querySelector('.cancel-changes-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeBottomSheet();
            });
        }

        // Close button
        const closeBtn = bottomSheet.querySelector('.close-bottom-sheet-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeBottomSheet();
            });
        }

        // Load sample data button
        const loadSampleBtn = bottomSheet.querySelector('.load-sample-btn');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadSampleData(widget.id, widget.type);
            });
        }

        // Prevent bottom sheet from closing when clicking inside it
        bottomSheet.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Click outside to close - use a delayed handler to avoid immediate closure
        setTimeout(() => {
            this.bottomSheetClickHandler = (e) => {
                const widgetElement = document.querySelector(`[data-widget-id="${widget.id}"]`);
                if (!bottomSheet.contains(e.target) &&
                    !widgetElement?.contains(e.target) &&
                    !e.target.closest('.bottom-sheet-editor')) {
                    this.closeBottomSheet();
                }
            };
            document.addEventListener('click', this.bottomSheetClickHandler);
        }, 100);
    }

    closeBottomSheet() {
        const bottomSheet = document.querySelector('.bottom-sheet-editor');
        if (bottomSheet) {
            bottomSheet.classList.remove('visible');
            setTimeout(() => {
                bottomSheet.remove();
            }, 200);
        }

        // Remove click handler
        if (this.bottomSheetClickHandler) {
            document.removeEventListener('click', this.bottomSheetClickHandler);
            this.bottomSheetClickHandler = null;
        }

        this.app.selectWidget(null);
    }

     
    createTextHeaderHTML(widget) {
      
        const fontSize = widget.fontSize || Math.min(24, widget.size.height * 0.4);
        return `
            <div class="text-header-input" 
                 contenteditable="true" 
                 data-placeholder="Enter header text..."
                 style="font-size: ${fontSize}px; line-height: 1.2;"
            >${widget.content || ''}</div>
            
            <div class="text-header-actions">
                <button class="text-header-action-btn edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-header-action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="text-header-resize-handle" title="Resize">
                <div class="resize-handle-icon"></div>
            </div>
        `;
    }

    createTableWidgetHTML(widget) {
        if (!widget.hasData) {
            return `
                <div class="widget-header">
                    <div class="dot-controls">
                        <div class="dot red" data-action="delete" title="Delete"></div>
                        <div class="dot yellow" data-action="minimize" title="Minimize"></div>
                        <div class="dot green" data-action="expand" title="Expand"></div>
                    </div>
                    <h3 class="widget-title">${widget.title}</h3>
                    <div class="widget-actions">
                        <button class="p-1 text-gray-400 hover:text-gray-600 config-btn" title="Configure">
                            <i class="fas fa-cog w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <div class="text-center text-gray-500 py-8">
                        <i class="fas fa-table text-4xl text-gray-300 mb-4"></i>
                        <p class="mb-3">No data source configured</p>
                        <p class="text-sm text-gray-400">Configure an API endpoint or upload data to get started</p>
                    </div>
                </div>
                <div class="resize-handle" title="Resize">
                    <div class="resize-handle-icon"></div>
                </div>
            `;
        }

        // If widget has data, render the actual table
        return this.renderTableWithData(widget);
    }

    createChartWidgetHTML(widget) {
        if (!widget.hasData) {
            return `
                <div class="widget-header">
                    <div class="dot-controls">
                        <div class="dot red" data-action="delete" title="Delete"></div>
                        <div class="dot yellow" data-action="minimize" title="Minimize"></div>
                        <div class="dot green" data-action="expand" title="Expand"></div>
                    </div>
                    <h3 class="widget-title">${widget.title}</h3>
                    <div class="widget-actions">
                        <button class="p-1 text-gray-400 hover:text-gray-600 config-btn" title="Configure">
                            <i class="fas fa-cog w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="chart-container">
                    <div class="text-center text-gray-500">
                        <i class="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
                        <p class="mb-3">No data source configured</p>
                        <p class="text-sm text-gray-400">Configure an API endpoint to display chart data</p>
                    </div>
                </div>
                <div class="resize-handle" title="Resize">
                    <div class="resize-handle-icon"></div>
                </div>
            `;
        }

        return `
            <div class="widget-header">
                <div class="dot-controls">
                    <div class="dot red" data-action="delete" title="Delete"></div>
                    <div class="dot yellow" data-action="minimize" title="Minimize"></div>
                    <div class="dot green" data-action="expand" title="Expand"></div>
                </div>
                <h3 class="widget-title">${widget.title}</h3>
                <div class="widget-actions">
                    <button class="p-1 text-gray-400 hover:text-gray-600 config-btn" title="Configure">
                        <i class="fas fa-cog w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="chart-container" id="chart-${widget.id}">
                <!-- Chart will be rendered here -->
            </div>
            <div class="resize-handle" title="Resize">
                <div class="resize-handle-icon"></div>
            </div>
        `;
    }

    renderTableWithData(widget) {
        if (!widget.data || !Array.isArray(widget.data) || widget.data.length === 0) {
            return this.createTableWidgetHTML({ ...widget, hasData: false });
        }

        const columns = Object.keys(widget.data[0]);

        return `
            <div class="widget-header">
                <div class="dot-controls">
                    <div class="dot red" data-action="delete" title="Delete"></div>
                    <div class="dot yellow" data-action="minimize" title="Minimize"></div>
                    <div class="dot green" data-action="expand" title="Expand"></div>
                </div>
                <h3 class="widget-title">${widget.title}</h3>
                <div class="widget-actions">
                    <button class="p-1 text-gray-400 hover:text-gray-600 config-btn" title="Configure">
                        <i class="fas fa-cog w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="table-container">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col.charAt(0).toUpperCase() + col.slice(1)}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${widget.data.map(row => `
                                <tr>
                                    ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="resize-handle" title="Resize">
                <div class="resize-handle-icon"></div>
            </div>
        `;
    }

    addWidgetEventListeners(element, widget) {
        // Widget selection - clicking anywhere on the widget shows configuration
        element.addEventListener('click', (e) => {
            // Don't trigger selection if clicking on specific action elements
            if (e.target.closest('.dot-controls') ||
                e.target.closest('.text-header-actions') ||
                e.target.closest('.resize-handle') ||
                e.target.closest('.text-header-resize-handle') ||
                (widget.type === 'text-header' && e.target.closest('.text-header-input'))) {
                return;
            }

            e.stopPropagation();
            this.app.selectWidget(widget.id);
        });

        // Dot controls
        const dotControls = element.querySelector('.dot-controls');
        if (dotControls) {
            dotControls.addEventListener('click', (e) => {
                e.stopPropagation();

                const dot = e.target.closest('.dot');
                if (!dot) return;

                const action = dot.dataset.action;

                switch (action) {
                    case 'delete':
                        this.app.deleteWidget(widget.id);
                        break;
                    case 'minimize':
                        this.toggleWidgetMinimize(widget.id);
                        break;
                    case 'expand':
                        this.toggleWidgetExpansion(widget.id);
                        break;
                }
            });
        }

        // Text header specific events
        if (widget.type === 'text-header') {
            this.setupTextHeaderEvents(element, widget);
        }

        // Configuration button 
        const configBtn = element.querySelector('.config-btn');
        if (configBtn) {
            configBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.selectWidget(widget.id);
            });
        }

        // Setup dragging and resizing
        this.setupWidgetDragAndResize(element, widget);
    }


 
async applyWidgetChanges(bottomSheet, widget) {

    const titleInput = bottomSheet.querySelector('.widget-title-input');
    const apiInput = bottomSheet.querySelector('.api-endpoint-input');
    const intervalInput = bottomSheet.querySelector('.refresh-interval-input');
    const fontSizeInput = bottomSheet.querySelector('.font-size-input');
    const textContentInput = bottomSheet.querySelector('.text-content-input');

    // Update widget locally
    if (widget.type === 'text-header') {
        if (textContentInput) {
            widget.content = textContentInput.value;
            widget.title = textContentInput.value || 'Text Header';
        }

        if (fontSizeInput) {
            widget.fontSize = parseInt(fontSizeInput.value);
        }
    } else {
        if (titleInput) {
            widget.title = titleInput.value;
        }

        if (apiInput) {
            widget.apiEndpoint = apiInput.value;
        }

        if (intervalInput) {
            widget.refreshInterval = parseInt(intervalInput.value) * 1000;
        }

        // Fetch data if API endpoint is provided
        if (widget.apiEndpoint && widget.apiEndpoint.trim()) {
            try {
            await this.fetchWidgetData(widget);
            } catch (error) {
                console.error('Error fetching widget data:', error);
            }
        }
    }
       // Update the widget in the dashboard app's widgets array
        const widgetIndex = this.app.widgets.findIndex(w => w.id === widget.id);
        if (widgetIndex >= 0) {
            this.app.widgets[widgetIndex] = { ...widget };
            console.log(" Updated widget in app.widgets array");
        }
    
        // Update last modified timestamp
        widget.lastUpdated = new Date();
        if (this.app.currentDashboard) {
            this.app.currentDashboard.lastModified = new Date();
        }

    // Send to backend (only expected fields)
    try {
        const payload = {
            title: widget.title || 'null',
            selectedQuery: widget.apiEndpoint || 'null',
            refreshInterval: widget.refreshInterval || 0,
            fontSizeInput: widget.fontSizeInput || 12,
            textContentInput: widget.textContentInput || 'null'
        };
        console.log(payload)
        const response = await fetch('http://localhost:5000/save-widget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({payload})
        });
       const result = await response.json();
        console.log('Backend response:', result.savedQuery);
        if (!result.message=='Data inserted successfully') {
           window.navigationManager.showNotification(result.message, 'error');
        } 
        else {
            window.navigationManager.showNotification(result.message, 'success');
        }
         //  Saving dashboard to sync with backend
          if (this.app && typeof this.app.saveDashboard === 'function') {
                    console.log("Saving dashboard to sync changes...");
                    await this.app.saveDashboard();
            }

     
    } catch (error) {
        //console.error('Error sending widget to backend:', error);
        //if (window.navigationManager) {
          //  window.navigationManager.showNotification('Error saving widget', 'error');
       // }
        
         // Still save locally even if backend fails
                if (this.app && typeof this.app.saveDashboard === 'function') {
                    console.log("Save to Backend failed, saving locally...");
                    await this.app.saveDashboard();
                }
        
                if (window.navigationManager) {
                    window.navigationManager.showNotification(
                        error.message || 'Widget saved locally. Backend sync failed.', 
                        'warning'
                    );
                }
    }

    this.closeBottomSheet();
    this.app.renderWidgets();

    if (window.navigationManager) {
        window.navigationManager.showNotification('Widget updated successfully', 'success');
    }
} 

    async fetchWidgetData(widget) {
        try {
           
            const response = await fetch(widget.apiEndpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (window.dataManager) {
                const processedData = window.dataManager.processData(data, widget.type === 'table' ? 'table' : 'chart');
                widget.data = processedData;
                widget.hasData = true;
                widget.lastUpdated = new Date();

                // Setup auto-refresh if interval is set
                if (widget.refreshInterval > 0) {
                    window.dataManager.setupAutoRefresh(widget.id, widget.apiEndpoint, widget.refreshInterval, (newData) => {
                        widget.data = window.dataManager.processData(newData, widget.type === 'table' ? 'table' : 'chart');
                        widget.lastUpdated = new Date();
                        this.app.renderWidgets();
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching widget data:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to fetch data from API', 'error');
            }
        }
    }

    loadSampleData(widgetId, widgetType) {
        const widget = this.app.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        // Generate sample data based on widget type
        let sampleData;

        if (widgetType === 'table') {
            sampleData = [
                { name: 'John Doe', age: 30, department: 'Engineering', salary: 75000 },
                { name: 'Jane Smith', age: 28, department: 'Marketing', salary: 65000 },
                { name: 'Bob Johnson', age: 35, department: 'Sales', salary: 70000 },
                { name: 'Alice Brown', age: 32, department: 'HR', salary: 60000 },
                { name: 'Charlie Wilson', age: 29, department: 'Engineering', salary: 80000 }
            ];
        } else if (widgetType === 'single-value') {
            sampleData = { value: 1234, label: 'Total Users' };
        } else {
            // Chart data
            sampleData = [
                { name: 'Product A', value: 30 },
                { name: 'Product B', value: 45 },
                { name: 'Product C', value: 25 },
                { name: 'Product D', value: 60 },
                { name: 'Product E', value: 35 }
            ];
        }

        widget.data = sampleData;
        widget.hasData = true;
        widget.lastUpdated = new Date();

        this.closeBottomSheet();
        this.app.renderWidgets();

        if (window.navigationManager) {
            window.navigationManager.showNotification('Sample data loaded successfully', 'success');
        }
    }

    setupTextHeaderEvents(element, widget) {
        const textInput = element.querySelector('.text-header-input');
        const editBtn = element.querySelector('.edit-btn');
        const deleteBtn = element.querySelector('.delete-btn');

        if (textInput) {
            textInput.addEventListener('input', (e) => {
                const newContent = e.target.textContent || '';
                widget.content = newContent;
                widget.title = newContent || 'Text Header';
            });

            textInput.addEventListener('blur', () => {
                this.app.renderWidgets();
            });

            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    textInput.blur();
                }
            });

            // Prevent text input from triggering widget selection
            textInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Open configuration panel instead of just focusing text
                this.app.selectWidget(widget.id);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.deleteWidget(widget.id);
            });
        }
    }

    setupWidgetDragAndResize(element, widget) {
        // Dragging
        const header = element.querySelector('.widget-header') || element;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.widget-actions') ||
                e.target.closest('.dot-controls') ||
                e.target.closest('.text-header-actions') ||
                e.target.closest('.resize-handle') ||
                (widget.type === 'text-header' && e.target.closest('.text-header-input'))) {
                return;
            }

            e.preventDefault();
            this.startDrag(e, element, widget);
        });

        // Resizing
        const resizeHandle = element.querySelector('.resize-handle') || element.querySelector('.text-header-resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startResize(e, element, widget);
            });
        }
    }

    startDrag(e, element, widget) {
        this.dragState.isDragging = true;
        this.dragState.element = element;
        this.dragState.widget = widget;

        const rect = element.getBoundingClientRect();
        const canvas = element.parentElement.getBoundingClientRect();

        this.dragState.startX = e.clientX - rect.left;
        this.dragState.startY = e.clientY - rect.top;

        element.style.cursor = 'grabbing';
        element.classList.add('dragging');
    }

    startResize(e, element, widget) {
        this.dragState.isResizing = true;
        this.dragState.element = element;
        this.dragState.widget = widget;

        const rect = element.getBoundingClientRect();

        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        this.dragState.startWidth = rect.width;
        this.dragState.startHeight = rect.height;

        element.classList.add('resizing');
        document.body.style.cursor = 'nw-resize';
    }

    handleGlobalMouseMove(e) {
        if (this.dragState.isDragging) {
            this.handleDrag(e);
        } else if (this.dragState.isResizing) {
            this.handleResize(e);
        }
    }

    handleDrag(e) {
        if (!this.dragState.element || !this.dragState.widget) return;

        const canvas = this.dragState.element.parentElement;
        const canvasRect = canvas.getBoundingClientRect();

        const newX = Math.max(0, e.clientX - canvasRect.left - this.dragState.startX);
        const newY = Math.max(0, e.clientY - canvasRect.top - this.dragState.startY);

        this.dragState.element.style.left = `${newX}px`;
        this.dragState.element.style.top = `${newY}px`;

        this.dragState.widget.position = { x: newX, y: newY };

        // Update bottom sheet position if it exists
        const bottomSheet = document.querySelector('.bottom-sheet-editor');
        if (bottomSheet && this.dragState.widget.id === this.app.selectedWidget?.id) {
            const widgetRect = this.dragState.element.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            bottomSheet.style.left = `${widgetRect.left - canvasRect.left}px`;
            bottomSheet.style.top = `${widgetRect.bottom - canvasRect.top + 10}px`;
        }
    }

    handleResize(e) {
        if (!this.dragState.element || !this.dragState.widget) return;

        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;

        const minWidth = this.dragState.widget.type === 'text-header' ? 150 : 250;
        const minHeight = this.dragState.widget.type === 'text-header' ? 40 : 200;

        const newWidth = Math.max(minWidth, this.dragState.startWidth + deltaX);
        const newHeight = Math.max(minHeight, this.dragState.startHeight + deltaY);

        this.dragState.element.style.width = `${newWidth}px`;
        this.dragState.element.style.height = `${newHeight}px`;

        this.dragState.widget.size = { width: newWidth, height: newHeight };

        // Update text header font size based on new height
        if (this.dragState.widget.type === 'text-header') {
            const textInput = this.dragState.element.querySelector('.text-header-input');
            if (textInput) {
                const fontSize = this.dragState.widget.fontSize || Math.min(24, newHeight * 0.4);
                textInput.style.fontSize = `${fontSize}px`;
            }
        }

        // Re-render charts if needed
        if (this.dragState.widget.type !== 'text-header' && this.dragState.widget.type !== 'table' && window.chartRenderer) {
            const widgetToRender = this.dragState.widget;
            setTimeout(() => {
                if (widgetToRender && window.chartRenderer) {
                    window.chartRenderer.renderChart(widgetToRender);
                }
            }, 100);
        }
    }

    handleGlobalMouseUp(e) {
        if (this.dragState.isDragging || this.dragState.isResizing) {
            if (this.dragState.element) {
                this.dragState.element.style.cursor = '';
                this.dragState.element.classList.remove('dragging', 'resizing');
            }

            document.body.style.cursor = '';

            // Reset drag state
            this.dragState = {
                isDragging: false,
                isResizing: false,
                startX: 0,
                startY: 0,
                startWidth: 0,
                startHeight: 0,
                element: null,
                widget: null
            };
        }
    }

    toggleWidgetExpansion(widgetId) {
        const widget = this.app.widgets.find(w => w.id === widgetId);
        if (widget) {
            widget.isExpanded = !widget.isExpanded;
            if (widget.isExpanded) {
                widget.isMinimized = false;
            }
            this.app.renderWidgets();
        }
    }

    toggleWidgetMinimize(widgetId) {
        const widget = this.app.widgets.find(w => w.id === widgetId);
        if (widget) {
            widget.isMinimized = !widget.isMinimized;
            if (widget.isMinimized) {
                widget.isExpanded = false;
            }
            this.app.renderWidgets();
        }
    }
}