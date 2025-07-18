# Dashboard Creation Interface

An interactive dashboard builder that allows users to create custom dashboards with various widgets including charts, tables, and text headers.

## Features

- **Drag & Drop Interface**:  widget positioning with drag and drop
- **Multiple Widget Types**: Support for charts (bar, line, pie, donut, histogram), tables, single values, and text headers
- **Responsive Design**: Works on desktop and mobile devices
- **Team Management**: Invite and manage team members

 **Create dashboard**:
   - Click "Create new Dashboard"
   - Select widgets from the sidebar
   - Configure widgets using the bottom sheet editor
   - Drag widgets to position them

## Project Structure

```
├── index.html              # Main HTML file
├── src/
│   ├── core/
│   │   └── DashboardApp.js  # Main application logic
│   ├── widgets/
│   │   └── WidgetRenderer.js # Widget creation and management
│   ├── charts/
│   │   └── ChartRenderer.js  # Chart rendering with Chart.js
│   ├── data/
│   │   └── DataManager.js    # API data fetching and caching
│   ├── members/
│   │   └── MembersManager.js # Team member management
│   ├── settings/
│   │   └── SettingsManager.js # Application settings
│   └── utils/
│       └── NavigationManager.js # Navigation utilities
├── styles/
│   └── main.css             # Main stylesheet
├── assets/                  # SVG icons and images
└── server.js               # Development server
```

## Core Components

### DashboardApp (Main Controller)
- Manages application state and widget collection
- Handles screen navigation between dashboard, builder, members, settings
- Coordinates widget creation, selection, and deletion
- Manages widget positioning and rendering

### WidgetRenderer
- Creates and renders different widget types
- Handles drag & drop functionality
- Manages widget resizing
- Creates bottom sheet editors for widget configuration
- Processes user interactions with widgets

### ChartRenderer
- Renders charts using Chart.js library
- Supports multiple chart types (bar, line, pie, donut, histogram)
- Handles responsive chart sizing
- Manages chart lifecycle and updates

### DataManager
- Fetches data from APIs
- Processes and formats data for different widget types
- Implements caching for performance
- Handles auto-refresh functionality

## Widget Types

### Charts
- **Bar Chart**: Vertical bar visualization
- **Line Chart**: Time series and trend data
- **Pie Chart**: Circular data representation
- **Donut Chart**: Pie chart with center hole
- **Histogram**: Distribution visualization
- **Single Value**: Large number display with label

### Data Widgets
- **Table**: Tabular data display with sorting
- **Text Header**: Customizable text headers

## Configuration

### Widget Configuration
Each widget can be configured through the bottom sheet editor:
- **Title**: Custom widget name
- **API Endpoint**: Data source URL
- **Refresh Interval**: Auto-refresh timing (30s, 1m, 5m)
- **Sample Data**: Load test data for development

### Text Headers
- **Content**: Editable text content
- **Font Size**: Adjustable text size
- **Positioning**: Free-form drag and drop


## User Interface

### Navigation
- **Home**: Dashboard overview and templates
- **Builder**: Widget creation and editing interface
- **Members**: Team management
- **Settings**: Application preferences


### Interactions
- **Click**: Select widgets
- **Drag**: Move widgets around the canvas
- **Resize**: Adjust widget dimensions
- **Double-click**: Quick edit for text headers

### Keyboard Shortcuts
- **Cmd/Ctrl + K**: Focus search
- **Escape**: Deselect widgets or close editors


## Development

### Adding New Widget Types
1. Add widget option to sidebar in `index.html`
2. Create rendering logic in `WidgetRenderer.js`
3. Add chart support in `ChartRenderer.js` if needed
4. Update data processing in `DataManager.js`

### Customizing Styles
- Main styles in `styles/main.css`
- Widget-specific styles use CSS classes


### API Integration
- Use `DataManager.fetchData()` for API calls
- Implement error handling for network failures
- Cache responses for performance



## Dependencies

- **Chart.js**: Chart rendering
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library
- **Google Fonts**: Typography (Montserrat, Inter)


