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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const sheetWidth = 400; // Approximate width of bottom sheet
    const sheetHeight = 500; // Approximate height of bottom sheet

    // Calculate optimal position
    let left = widgetRect.left;
    let top = widgetRect.bottom + 10;

    // Adjust horizontal position if sheet would go off-screen
    if (left + sheetWidth > viewportWidth) {
        left = Math.max(10, viewportWidth - sheetWidth - 10);
    }

    // Adjust vertical position if sheet would go off-screen
    if (top + sheetHeight > viewportHeight) {
        // Try positioning above the widget
        const topPosition = widgetRect.top - sheetHeight - 10;
        if (topPosition > 10) {
            top = topPosition;
        } else {
            // Center vertically if neither above nor below works
            top = Math.max(10, (viewportHeight - sheetHeight) / 2);
        }
    }

    bottomSheet.style.position = 'fixed';
    bottomSheet.style.left = `${left}px`;
    bottomSheet.style.top = `${top}px`;
    bottomSheet.style.zIndex = '1000';

    // Wait until HTML is generated, THEN attach and bind events
    this.createBottomSheetHTML(widget).then(html => {
        bottomSheet.innerHTML = html;

        // Append to document.body to avoid null parentElement issues
        document.body.appendChild(bottomSheet);

        this.setupBottomSheetEvents(bottomSheet, widget);

        // Animate in
        setTimeout(() => {
            bottomSheet.classList.add('visible');
        }, 10);
    });
}



async loadStoredQuery() {
  try {
    const response = await fetch(`https://edge.ncgafrica.com:5000/loadStoredQuery`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load Stored Query');
    }

    const result = await response.json();

    return result;

  } catch (error) {
    console.error('Error loading Stored Query:', error);
    return [];
  }
}






    async createBottomSheetHTML(widget) {
          const data = await this.loadStoredQuery();

         const queryOptions = (data || []).map(item => `
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
        }, 100);
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
        console.log('Creating table widget HTML for:', widget.id, 'isLoading:', widget.isLoading, 'hasData:', widget.hasData);
        
        // Show loading state
        if (widget.isLoading) {
            console.log('Rendering loading state for table widget');
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
                        <div class="loading-spinner" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                            <div style="width: 32px; height: 32px; border: 4px solid #e5e7eb; border-top: 4px solid #0d9488; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        </div>
                        <p class="mt-4 text-sm">Loading data...</p>
                    </div>
                </div>
                <div class="resize-handle" title="Resize">
                    <div class="resize-handle-icon"></div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;
        }

        // Show error state
        if (widget.error) {
            console.log('Rendering error state for table widget');
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
                    <div class="text-center text-red-500 py-8">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                        <p class="mb-3">Error loading data</p>
                        <p class="text-sm text-red-400">${widget.error}</p>
                        <button class="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors retry-btn">
                            Retry
                        </button>
                    </div>
                </div>
                <div class="resize-handle" title="Resize">
                    <div class="resize-handle-icon"></div>
                </div>
            `;
        }

        if (!widget.hasData) {
            console.log('Rendering no data state for table widget');
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

        console.log('Rendering data state for table widget');
        // If widget has data, render the actual table
        return this.renderTableWithData(widget);
    }

    
    createChartWidgetHTML(widget) {
        console.log('Creating chart widget HTML for:', widget.id, 'isLoading:', widget.isLoading, 'hasData:', widget.hasData);
        
        // Show loading state
        if (widget.isLoading) {
            console.log('Rendering loading state for chart widget');
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
                    <div class="text-center text-gray-500 py-8">
                        <div class="loading-spinner" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                            <div style="width: 32px; height: 32px; border: 4px solid #e5e7eb; border-top: 4px solid #0d9488; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        </div>
                        <p class="mt-4 text-sm">Loading chart data...</p>
                    </div>
                </div>
                <div class="resize-handle" title="Resize">
                    <div class="resize-handle-icon"></div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;
        }

        // Show error state
        if (widget.error) {
            console.log('Rendering error state for chart widget');
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
                    <div class="text-center text-red-500 py-8">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                        <p class="mb-3">Error loading chart data</p>
                        <p class="text-sm text-red-400">${widget.error}</p>
                        <button class="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors retry-btn">
                            Retry
                        </button>
                    </div>
                </div>
                <div class="resize-handle" title="Resize">
                    <div class="resize-handle-icon"></div>
                </div>
            `;
        }

        if (!widget.hasData) {
            console.log('Rendering no data state for chart widget');
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

        console.log('Rendering data state for chart widget');
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
    }

    // Update the widget in the dashboard app's widgets array
    const widgetIndex = this.app.widgets.findIndex(w => w.id === widget.id);
    if (widgetIndex >= 0) {
        this.app.widgets[widgetIndex] = { ...widget };
        console.log("Updated widget in app.widgets array");
    }

    // Update last modified timestamp
    widget.lastUpdated = new Date();
    if (this.app.currentDashboard) {
        this.app.currentDashboard.lastModified = new Date();
    }
    this.closeBottomSheet();
    this.showWidgetLoading(widget);
    
    // Close the bottom sheet IMMEDIATELY after starting loading
   

    // Send to backend and process returned data
    try {
        // Create the payload object with correct structure
        const payloadData = {
            Title: widget.title || '',
            ApiEndpoint: widget.apiEndpoint || '',
            RefreshInterval: widget.refreshInterval || 0,
            fontSizeInput: widget.fontSize || 0,
            textContentInput: widget.content || ''
        };

        // Wrap it in the expected structure
        const requestBody = {
            payload: payloadData
        };

        console.log('Sending request body:', requestBody);

        const response = await fetch('https://edge.ncgafrica.com:5000/save-widget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Check if response is ok first
        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorText = await response.text();
                console.log('Server error response:', errorText);

                // Try to parse as JSON first
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (parseError) {
                    // If not JSON, use the text response
                    errorMessage = errorText.substring(0, 200) || errorMessage;
                }
            } catch (textError) {
                console.log('Could not read error response:', textError);
            }

            throw new Error(errorMessage);
        }

        // Try to parse JSON response
        let result;
        try {
            const responseText = await response.text();
            console.log('Raw response text:', responseText);

            if (!responseText.trim()) {
                throw new Error('Empty response from server');
            }

            result = JSON.parse(responseText);
            console.log('Parsed backend response:', result);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            throw new Error('Invalid response format from server');
        }

        // Success handling
        if (window.navigationManager) {
            window.navigationManager.showNotification(
                result.message || 'Widget saved successfully',
                'success'
            );
        }

        // Process the returned data for non-text-header widgets
        if (widget.type !== 'text-header' && result.savedQuery && Array.isArray(result.savedQuery)) {
            console.log('Processing returned data:', result.savedQuery);

            // Use the data processing logic to format the data correctly
            const processedData = this.processWidgetDataFromResponse(result.savedQuery, widget.type);

            if (processedData) {
                widget.data = processedData;
                widget.hasData = true;
                widget.lastUpdated = new Date();
                widget.error = null;
                widget.isLoading = false; // Clear loading state

                // Update the widget in the app's widgets array again after data processing
                const updatedWidgetIndex = this.app.widgets.findIndex(w => w.id === widget.id);
                if (updatedWidgetIndex >= 0) {
                    this.app.widgets[updatedWidgetIndex] = { ...widget };
                    console.log("Updated widget with data in app.widgets array");
                }

                console.log('Widget data updated:', {
                    type: widget.type,
                    dataLength: Array.isArray(processedData) ? processedData.length : 'N/A',
                    hasData: widget.hasData
                });
            }
        } else {
            // Clear loading state even if no data
            widget.isLoading = false;
        }

        // Saving dashboard to sync with backend
        if (this.app && typeof this.app.saveDashboard === 'function') {
            console.log("Saving dashboard to sync changes...");
            await this.app.saveDashboard();
        }

    } catch (error) {
        console.error('Error sending widget to backend:', error);

        // Clear loading state on error
        widget.isLoading = false;
        widget.error = error.message;

        // Update widget in app array
        const errorWidgetIndex = this.app.widgets.findIndex(w => w.id === widget.id);
        if (errorWidgetIndex >= 0) {
            this.app.widgets[errorWidgetIndex] = { ...widget };
        }

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

    // Force a complete re-render of all widgets
    console.log("Force re-rendering widgets...");
    this.app.renderWidgets();

    // Additional delay to ensure DOM updates are complete before chart rendering
    setTimeout(() => {
        // Render chart if it's a chart widget and has data
        if (widget.type !== 'table' && widget.type !== 'text-header' && widget.hasData && window.chartRenderer) {
            console.log("Rendering chart for widget:", widget.id);
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.chartRenderer.renderChart(widget);
                }, 150);
            });
        }
    }, 100);

    if (window.navigationManager) {
        window.navigationManager.showNotification('Widget updated successfully', 'success');
    }
}

// Helper method to show loading state on widget
showWidgetLoading(widget) {
        console.log('Setting loading state for widget:', widget.id);
        
        widget.isLoading = true;
        widget.error = null;
        widget.hasData = false; // Reset data state to show loading

        // Update widget in app array
        const widgetIndex = this.app.widgets.findIndex(w => w.id === widget.id);
        if (widgetIndex >= 0) {
            this.app.widgets[widgetIndex] = { ...widget };
            console.log('Updated widget in array with loading state:', this.app.widgets[widgetIndex]);
        }

        // Force re-render to show loading state
        console.log('Force rendering widgets to show loading...');
        this.app.renderWidgets();
        
        // Verify the widget element was updated
        setTimeout(() => {
            const widgetElement = document.querySelector(`[data-widget-id="${widget.id}"]`);
            if (widgetElement) {
                console.log('Widget element after loading update:', widgetElement.innerHTML.substring(0, 200));
                const spinner = widgetElement.querySelector('.loading-spinner');
                console.log('Spinner element found:', !!spinner);
            } else {
                console.log('Widget element not found in DOM');
            }
        }, 100);
    }

processWidgetDataFromResponse(responseData, widgetType) {
        console.log('Processing response data for', widgetType + ':', responseData);

    if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
        console.warn('No valid data in response');
        return null;
    }

    switch (widgetType) {
        case 'table':
            return this.processTableDataFromResponse(responseData);
        case 'single-value':
            return this.processSingleValueFromResponse(responseData);
        case 'bar':
        case 'line':
        case 'pie':
        case 'donut':
        case 'histogram':
        default:
            return this.processChartDataFromResponse(responseData);
    }
}

processTableDataFromResponse(responseData) {
    return responseData.map(row => {
        const cleanRow = {};
        Object.keys(row).forEach(key => {
            // Create clean column names - handle camelCase and various formats
            let cleanKey = key;

            // Convert camelCase to Title Case
            if (key.includes('applicationName')) cleanKey = 'Application Name';
            else if (key.includes('logFilePath')) cleanKey = 'Log File Path';
            else if (key.includes('messageCollected')) cleanKey = 'Messages Collected';
            else if (key.includes('techology')) cleanKey = 'Technology'; // Handle typo in API
            else if (key.includes('AppName')) cleanKey = 'App Name';
            else if (key.includes('ErrorCount')) cleanKey = 'Error Count';
            else if (key.includes('TotalApp')) cleanKey = 'Total App';
            else {
                // General conversion for other fields
                cleanKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            }

            cleanRow[cleanKey] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
        });
        return cleanRow;
    });
}

processSingleValueFromResponse(responseData) {
    const item = responseData[0] || {};

    // Look for numeric fields that could be used as single values
    let value = 0;
    let label = 'Total';

    // Check for common numeric fields
    const numericFields = ['messageCollected', 'TotalApp', 'ErrorCount', 'Total', 'value', 'count'];
    const nameFields = ['AppName', 'applicationName', 'name', 'label', 'techology'];

    for (const field of numericFields) {
        if (item[field] !== undefined && !isNaN(item[field])) {
            value = Number(item[field]);
            break;
        }
    }

    for (const field of nameFields) {
        if (item[field] !== undefined) {
            label = String(item[field]);
            break;
        }
    }

    // If no numeric value found, count the array length
    if (value === 0) {
        value = responseData.length;
        label = 'Total Records';
    }

    return {
        value: value,
        label: label,
        formatted: Number(value).toLocaleString()
    };
}

processChartDataFromResponse(responseData) {
    console.log('Processing chart data from response:', responseData);

    const processedData = responseData.map((item, index) => {
        // Default values
        let name = `Item ${index + 1}`;
        let value = 1; // Default to 1 for counting purposes

        // Priority order for name fields
        const nameFields = [
            'AppName', 'applicationName', 'name', 'label', 'techology',
            'transaction_type', 'product_name', 'month', 'salesperson',
            'region', 'device_type', 'logFilePath'
        ];

        // Priority order for value fields
        const valueFields = [
            'messageCollected', 'TotalApp', 'ErrorCount', 'value',
            'success_rate', 'total_sales', 'revenue', 'avg_views',
            'avg_duration', 'count', 'Total'
        ];

        // Find the best name field
        for (const field of nameFields) {
            if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                name = String(item[field]);
                // For file paths, extract just the filename
                if (field === 'logFilePath') {
                    const pathParts = name.split('\\');
                    name = pathParts[pathParts.length - 1] || name;
                    // Remove file extension for cleaner display
                    name = name.replace(/\.[^/.]+$/, "");
                }
                break;
            }
        }

        // Find the best value field
        for (const field of valueFields) {
            if (item[field] !== undefined && !isNaN(item[field])) {
                value = Number(item[field]);
                break;
            }
        }

        // If no numeric value found, we'll count occurrences by grouping
        if (value === 1 && Object.keys(item).length > 0) {
            // This means we're likely dealing with categorical data
            // The value will represent count of this category
            value = 1;
        }

        return {
            name: name,
            value: value,
            label: name,
            color: this.getChartColor(index)
        };
    });

    // Group by name and sum values (for categorical data)
    const groupedData = {};
    processedData.forEach(item => {
        if (groupedData[item.name]) {
            groupedData[item.name].value += item.value;
        } else {
            groupedData[item.name] = { ...item };
        }
    });

    // Convert back to array and sort
    const finalData = Object.values(groupedData)
        .sort((a, b) => b.value - a.value);

    console.log('Processed chart data from response:', finalData);
    return finalData;
}

getChartColor(index) {
    const colors = ['#0D9488', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#FF6B6B', '#4ECDC4'];
    return colors[index % colors.length];
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

    // Add data processing methods
    processApiData(rawData, widgetType) {
        console.log('Processing API data for', widgetType + ':', rawData);

        if (!rawData || !Array.isArray(rawData.data) || rawData.data.length === 0) {
            throw new Error('No data to process');
        }

        switch (widgetType) {
            case 'table':
                return this.processTableData(rawData.data);
            case 'single-value':
                return this.processSingleValue(rawData.data);
            case 'bar':
            case 'line':
            case 'pie':
            case 'donut':
            case 'histogram':
            default:
                return this.processChartData(rawData.data);
        }
    }

    processTableData(rawData) {
        return rawData.map(row => {
            const cleanRow = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                cleanRow[cleanKey] = row[key] !== null ? String(row[key]) : '';
            });
            return cleanRow;
        });
    }

    processSingleValue(rawData) {
        const item = rawData && Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : {};

        // Look for total/count fields in your data
        let value = item.TotalApp || item.messageCollected || item.ErrorCount || item.Total || 0;
        let label = item.AppName || 'Total Value';

        return {
            value: value,
            label: label,
            formatted: value.toLocaleString()
        };
    }

    processChartData(rawData) {
        console.log('Processing chart data:', rawData);

        const processedData = rawData.map((item, index) => {
            let name = item.name || `Item ${index + 1}`;
            let value = item.value || 0;

            // Prioritize specific keys for common chart data
            if (item.transaction_type !== undefined) {
                name = item.transaction_type;
            } else if (item.AppName !== undefined) {
                name = item.AppName;
            } else if (item.product_name !== undefined) {
                name = item.product_name;
            } else if (item.month !== undefined) {
                name = item.month;
            } else if (item.salesperson !== undefined) {
                name = item.salesperson;
            } else if (item.region !== undefined) {
                name = item.region;
            } else if (item.device_type !== undefined) {
                name = item.device_type;
            }

            if (item.success_rate !== undefined) {
                value = item.success_rate;
            } else if (item.messageCollected !== undefined) {
                value = item.messageCollected;
            } else if (item.TotalApp !== undefined) {
                value = item.TotalApp;
            } else if (item.ErrorCount !== undefined) {
                value = item.ErrorCount;
            } else if (item.total_sales !== undefined) {
                value = item.total_sales;
            } else if (item.revenue !== undefined) {
                value = item.revenue;
            } else if (item.avg_views !== undefined) {
                value = item.avg_views;
            } else if (item.avg_duration !== undefined) {
                value = item.avg_duration;
            }

            return {
                name: name,
                value: Number(value),
                label: name,
                color: this.getChartColor(index)
            };
        })
        // Removed .filter(item => item.value > 0) to allow zero values to be processed
        .sort((a, b) => b.value - a.value); // Sort by value descending

        console.log('Processed chart data:', processedData);
        return processedData;
    }

    getChartColor(index) {
        const colors = ['#0D9488', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#FF6B6B', '#4ECDC4'];
        return colors[index % colors.length];
    }

    loadSampleData(widgetId, widgetType) {
        const widget = this.app.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        console.log('Loading sample data for', widgetType, 'widget:', widget.title);

        // Generate sample data based on widget type
        let sampleData;

        if (widgetType === 'table') {
            sampleData = [
                { AppName: 'General UI', messageCollected: 1452, ErrorCount: 23 },
                { AppName: 'Nginx', messageCollected: 865, ErrorCount: 12 },
                { AppName: 'Database', messageCollected: 634, ErrorCount: 8 },
                { AppName: 'API Gateway', messageCollected: 423, ErrorCount: 5 },
                { AppName: 'Authentication', messageCollected: 298, ErrorCount: 3 }
            ];
        } else if (widgetType === 'single-value') {
            sampleData = {
                value: 3672,
                label: 'Total Messages',
                formatted: '3,672'
            };
        } else {
            // Chart data - using your API format
            const rawSampleData = [
                { AppName: 'General UI', messageCollected: 1452 },
                { AppName: 'Nginx', messageCollected: 865 },
                { AppName: 'Database', messageCollected: 634 },
                { AppName: 'API Gateway', messageCollected: 423 },
                { AppName: 'Authentication', messageCollected: 298 }
            ];

            // Process using the same logic as real data
            sampleData = this.processChartData(rawSampleData);
        }

        widget.data = sampleData;
        widget.hasData = true;
        widget.lastUpdated = new Date();
        widget.error = null;

        this.closeBottomSheet();
        this.app.renderWidgets();

        // Render chart if it's a chart widget
        if (widget.type !== 'table' && widget.type !== 'text-header' && window.chartRenderer) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.chartRenderer.renderChart(widget);
                }, 150);
            });
        }

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