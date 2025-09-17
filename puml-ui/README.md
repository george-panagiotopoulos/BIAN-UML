# BIAN UML Visualizer

A web-based interface for visualizing BIAN (Banking Industry Architecture Network) UML diagrams. This application allows users to select individual or multiple UML diagrams and render them using PlantUML.

## Features

### Core Functionality
- **Individual Diagram Visualization**: Select and view single BIAN domain diagrams
- **Multi-Diagram Combination**: Select multiple diagrams to create a consolidated view
- **Interactive Selection**: Checkbox-based selection with visual feedback
- **Real-time Rendering**: Generate diagrams using PlantUML server
- **Download Support**: Export generated diagrams as SVG files

### User Interface
- **Modern Design**: Built with Tailwind CSS for responsive, modern UI
- **Visual Feedback**: Color-coded diagram categories and selection states
- **Loading States**: Animated feedback during diagram generation
- **Responsive Layout**: Works on desktop, tablet, and mobile devices

### Architecture
- **Extensible Design**: Easy to add new diagram types
- **Modular Structure**: Clean separation of concerns
- **Error Handling**: Graceful handling of network and rendering errors
- **Performance Optimized**: Efficient loading and caching of UML content

## Available BIAN Diagrams

The application currently supports the following BIAN domain diagrams:

1. **Business Support** - IT Management, Enterprise Services, Facilities
2. **Channels** - Digital Channels, Branch Operations, ATM, Contact Center
3. **Cross Product Ops** - Cross-product operational services
4. **Customer Servicing** - Customer service and support operations
5. **Investment & Market Ops** - Investment and market operations
6. **Marketing & Sales** - Marketing and sales operations
7. **Products, Loans & Cards** - Product management, loans, and card services
8. **Reference & Market Data** - Reference data and market information
9. **Risk & Compliance** - Risk management and compliance operations

## How to Use

### Quick Start with Flask Server (Recommended)
1. Run the startup script: `./start.sh`
2. Open your browser to `http://localhost:7777`
3. Select one or more diagrams using the checkboxes
4. Click "Visualize UML" to generate the diagram
5. View the rendered diagram in the visualization area
6. Optionally download the diagram as an SVG file
7. Stop the server: `./stop.sh` or press Ctrl+C

### Alternative: Direct File Access
1. Open `index.html` directly in a web browser
2. Follow steps 3-6 above

### Multi-Diagram Visualization
1. Select multiple diagrams by checking multiple boxes
2. Click "Visualize UML"
3. The application will create a combined diagram showing all selected domains
4. The combined view maintains the structure and relationships of individual diagrams

### Clear and Reset
- Use the "Clear Selection" button to deselect all diagrams
- The visualization area will reset to the default state

## Technical Requirements

### Dependencies
- Python 3.7+ (for Flask server)
- Java 8+ (for running PlantUML jar)
- GraphViz (for complex diagram rendering)
  - **Homebrew**: `brew install graphviz` (recommended for macOS)
  - **System**: Available through package managers
- Modern web browser with JavaScript support
- Internet connection for:
  - Tailwind CSS (CDN)
- Local PlantUML jar file (included: plantuml.jar)

### Installation
1. Ensure Python 3.7+ is installed
2. Run `./start.sh` - it will automatically install Flask dependencies
3. The server will start on `http://localhost:7777`

### File Structure
```
puml-ui/
├── index.html          # Main HTML interface
├── app.js             # Frontend application logic
├── app.py             # Flask web server
├── styles.css         # Additional CSS styles and animations
├── requirements.txt   # Python dependencies
├── start.sh          # Server startup script
├── stop.sh           # Server stop script
└── README.md         # This documentation
```

### Server Features
- **Flask Web Server**: Serves files on port 7777
- **Local PlantUML Processing**: Uses local plantuml.jar for diagram generation
- **GraphViz Auto-Detection**: Automatically detects Homebrew, system, and PATH GraphViz installations
- **Multiple Output Formats**: Supports SVG and PNG diagram export with proper visualization
- **API Endpoints**: RESTful endpoints for diagram access and generation
- **Auto Port Cleanup**: Automatically kills existing processes on port 7777
- **Health Monitoring**: Built-in health check with Java, PlantUML, and GraphViz status
- **Error Handling**: Comprehensive error handling and logging

### API Endpoints
- `GET /` - Main application interface
- `GET /health` - Health check and system status (includes Java/PlantUML status)
- `GET /api/diagrams` - List all available UML diagrams
- `GET /api/diagram/<filename>` - Get content of specific UML file
- `POST /api/generate-diagram` - Generate diagram using local PlantUML jar
- `GET /ModularLandscape/PUML/<filename>` - Direct access to PUML files

### PlantUML Files
The application expects UML files to be located at:
```
../ModularLandscape/PUML/
├── bian_business_support.puml
├── bian_channels.puml
├── bian_cross_product_ops.puml
├── bian_customer_servicing.puml
├── bian_investment_market_ops.puml
├── bian_marketing_sales.puml
├── bian_product_loans_cards.puml
├── bian_reference_market_data.puml
└── bian_risk_compliance.puml
```

## Development

### Adding New Diagrams
To add a new BIAN diagram:

1. Add the `.puml` file to the `../ModularLandscape/PUML/` directory
2. Update the `initializeDiagramConfigs()` method in `app.js`:

```javascript
{
    id: 'new_diagram_id',
    filename: 'bian_new_diagram.puml',
    displayName: 'New Diagram Name',
    description: 'Description of the new diagram',
    color: 'bg-teal-500'  // Choose an appropriate color
}
```

### Customization
- **Colors**: Modify the `color` property in diagram configurations
- **PlantUML Server**: Change the `plantUMLServer` variable in `renderUMLDiagram()`
- **Styling**: Modify `styles.css` for custom styling
- **Layout**: Adjust Tailwind classes in `index.html`

### Error Handling
The application includes comprehensive error handling for:
- Network connectivity issues
- PlantUML server unavailability
- Invalid UML syntax
- Missing diagram files

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

**Diagrams not generating:**
- Ensure Java is installed: `java -version`
- Verify PlantUML jar exists: `ls -la plantuml.jar`
- Check server health endpoint: `http://localhost:7777/health`
- Ensure UML files are in correct location

**PlantUML errors:**
- Check Java installation and version (Java 8+ required)
- Verify PlantUML jar is not corrupted: `java -jar plantuml.jar -version`
- Check UML syntax in source files
- Try individual diagrams to isolate syntax issues

**Server issues:**
- Port 7777 already in use: Run `./stop.sh` first
- Flask dependencies: Run `./start.sh` to auto-install
- Check browser console for JavaScript errors
- Verify Flask server is running and accessible

**Performance issues:**
- Large combined diagrams may take longer to render (up to 30 seconds)
- Consider selecting fewer diagrams for better performance
- Monitor server logs for PlantUML processing time

## Future Enhancements

The architecture supports easy addition of:
- Local PlantUML server integration
- Diagram export in multiple formats (PNG, PDF)
- Custom diagram themes and styling
- Diagram comparison features
- Interactive diagram elements
- Collaborative features

## License

This project is part of the BIAN UML architecture documentation system.
