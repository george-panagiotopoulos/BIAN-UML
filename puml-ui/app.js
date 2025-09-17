/**
 * BIAN UML Visualizer Application
 * Handles UML diagram selection, rendering, and combination functionality
 */

class BianUMLVisualizer {
    constructor() {
        this.selectedDiagrams = new Set();
        this.diagramConfigs = this.initializeDiagramConfigs();
        this.umlContents = new Map();
        this.largeFontsEnabled = false;
        this.init();
    }

    /**
     * Initialize diagram configurations - easily extensible for future diagrams
     */
    initializeDiagramConfigs() {
        return [
            {
                id: 'business_support',
                filename: 'bian_business_support.puml',
                displayName: 'Business Support',
                description: 'IT Management, Enterprise Services, Facilities',
                color: 'bg-blue-500'
            },
            {
                id: 'channels',
                filename: 'bian_channels.puml',
                displayName: 'Channels',
                description: 'Digital Channels, Branch Operations, ATM, Contact Center',
                color: 'bg-green-500'
            },
            {
                id: 'cross_product_ops',
                filename: 'bian_cross_product_ops.puml',
                displayName: 'Cross Product Ops',
                description: 'Cross-product operational services',
                color: 'bg-purple-500'
            },
            {
                id: 'customer_servicing',
                filename: 'bian_customer_servicing.puml',
                displayName: 'Customer Servicing',
                description: 'Customer service and support operations',
                color: 'bg-orange-500'
            },
            {
                id: 'investment_market_ops',
                filename: 'bian_investment_market_ops.puml',
                displayName: 'Investment & Market Ops',
                description: 'Investment and market operations',
                color: 'bg-red-500'
            },
            {
                id: 'marketing_sales',
                filename: 'bian_marketing_sales.puml',
                displayName: 'Marketing & Sales',
                description: 'Marketing and sales operations',
                color: 'bg-yellow-500'
            },
            {
                id: 'product_loans_cards',
                filename: 'bian_product_loans_cards.puml',
                displayName: 'Products, Loans & Cards',
                description: 'Product management, loans, and card services',
                color: 'bg-indigo-500'
            },
            {
                id: 'reference_market_data',
                filename: 'bian_reference_market_data.puml',
                displayName: 'Reference & Market Data',
                description: 'Reference data and market information',
                color: 'bg-pink-500'
            },
            {
                id: 'risk_compliance',
                filename: 'bian_risk_compliance.puml',
                displayName: 'Risk & Compliance',
                description: 'Risk management and compliance operations',
                color: 'bg-gray-600'
            }
        ];
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing BIAN UML Visualizer...');
        this.checkLibrarySupport();
        this.renderDiagramButtons();
        this.attachEventListeners();
        await this.loadAllUMLContents();
        console.log('BIAN UML Visualizer initialized successfully');

        // Test if font toggle button is accessible
        setTimeout(() => {
            const testBtn = document.getElementById('fontSizeToggle');
            console.log('Font toggle button test:', testBtn ? 'Found' : 'Not found');
            if (testBtn) {
                console.log('Button text content:', testBtn.textContent);
            }
        }, 500);
    }

    /**
     * Check system support and show status
     */
    checkLibrarySupport() {
        console.log('🔍 Checking system support...');
        console.log('✅ Using local PlantUML jar for diagram generation');
        
        // Check server health
        this.checkServerHealth();
    }

    /**
     * Check server health and PlantUML availability
     */
    async checkServerHealth() {
        try {
            const response = await fetch('/health');
            const health = await response.json();
            
            console.log('Server Health:', health);
            
            if (health.java_available && health.plantuml_jar_exists) {
                console.log('✅ Local PlantUML setup is ready');
            } else {
                console.warn('⚠️ PlantUML setup issues detected:', {
                    java: health.java_available,
                    jar: health.plantuml_jar_exists
                });
            }
            
            this.updateSystemStatus(health);
            
        } catch (error) {
            console.error('❌ Failed to check server health:', error);
        }
    }

    /**
     * Update UI to show system status
     */
    updateSystemStatus(health) {
        const statusElement = document.querySelector('.server-status');
        if (statusElement && health) {
            const isReady = health.java_available && health.plantuml_jar_exists && health.graphviz_available;
            let statusText = 'Local PlantUML: Ready';
            let statusColor = 'bg-green-400';
            
            if (!health.java_available) {
                statusText = 'Java: Not Available';
                statusColor = 'bg-red-400';
            } else if (!health.plantuml_jar_exists) {
                statusText = 'PlantUML: Jar Missing';
                statusColor = 'bg-red-400';
            } else if (!health.graphviz_available) {
                statusText = 'GraphViz: Not Found';
                statusColor = 'bg-yellow-400';
            } else if (health.graphviz_installations && health.graphviz_installations.length > 0) {
                const installation = health.graphviz_installations[0];
                statusText = `PlantUML + ${installation.type} GraphViz: Ready`;
            }
            
            statusElement.innerHTML = `
                <span class="inline-block w-2 h-2 ${statusColor} rounded-full mr-1"></span>
                ${statusText}
            `;
            
            // Add tooltip with detailed GraphViz info
            if (health.graphviz_installations && health.graphviz_installations.length > 0) {
                const installations = health.graphviz_installations.map(inst => 
                    `${inst.type}: ${inst.path}`
                ).join(', ');
                statusElement.title = `GraphViz installations: ${installations}`;
            }
        }
    }

    /**
     * Render diagram selection buttons dynamically
     */
    renderDiagramButtons() {
        const container = document.getElementById('diagramButtons');
        container.innerHTML = '';

        this.diagramConfigs.forEach(config => {
            const button = document.createElement('button');
            button.className = `diagram-btn relative p-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 text-left group`;
            button.dataset.diagramId = config.id;
            
            button.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <div class="w-4 h-4 rounded border-2 border-gray-400 flex items-center justify-center transition-all duration-200">
                        <svg class="w-3 h-3 text-white opacity-0 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="w-3 h-3 ${config.color} rounded-full"></div>
                </div>
                <h3 class="font-semibold text-gray-800 mb-1">${config.displayName}</h3>
                <p class="text-xs text-gray-600">${config.description}</p>
            `;

            container.appendChild(button);
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Diagram button clicks
        document.getElementById('diagramButtons').addEventListener('click', (e) => {
            const button = e.target.closest('.diagram-btn');
            if (button) {
                this.toggleDiagramSelection(button.dataset.diagramId);
            }
        });

        // Visualize button
        document.getElementById('visualizeBtn').addEventListener('click', () => {
            this.visualizeSelectedDiagrams();
        });

        // Clear selection button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearSelection();
        });

        // Font size toggle button
        const fontToggleBtn = document.getElementById('fontSizeToggle');
        if (fontToggleBtn) {
            fontToggleBtn.addEventListener('click', (event) => {
                console.log('Font size toggle button clicked!', event);
                // Add a simple visual feedback
                fontToggleBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    fontToggleBtn.style.transform = '';
                }, 100);

                this.toggleFontSize();
            });
            console.log('Font size toggle button event listener attached');
        } else {
            console.error('Font size toggle button not found!');
            // If button not found, try to find it after a delay
            setTimeout(() => {
                const retryBtn = document.getElementById('fontSizeToggle');
                if (retryBtn) {
                    console.log('Font size toggle button found on retry');
                    retryBtn.addEventListener('click', () => {
                        console.log('Font size toggle button clicked (retry)!');
                        this.toggleFontSize();
                    });
                }
            }, 1000);
        }
    }

    /**
     * Toggle diagram selection
     */
    toggleDiagramSelection(diagramId) {
        const button = document.querySelector(`[data-diagram-id="${diagramId}"]`);
        const checkbox = button.querySelector('div div');
        const checkIcon = button.querySelector('svg');

        if (this.selectedDiagrams.has(diagramId)) {
            this.selectedDiagrams.delete(diagramId);
            button.classList.remove('border-blue-500', 'bg-blue-50');
            button.classList.add('border-gray-300');
            checkbox.classList.remove('bg-blue-500', 'border-blue-500');
            checkbox.classList.add('border-gray-400');
            checkIcon.classList.add('opacity-0');
        } else {
            this.selectedDiagrams.add(diagramId);
            button.classList.remove('border-gray-300');
            button.classList.add('border-blue-500', 'bg-blue-50');
            checkbox.classList.remove('border-gray-400');
            checkbox.classList.add('bg-blue-500', 'border-blue-500');
            checkIcon.classList.remove('opacity-0');
        }

        this.updateSelectionUI();
    }

    /**
     * Update selection UI state
     */
    updateSelectionUI() {
        const count = this.selectedDiagrams.size;
        document.getElementById('selectedCount').textContent = count;
        document.getElementById('visualizeBtn').disabled = count === 0;
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedDiagrams.clear();

        // Reset all buttons
        document.querySelectorAll('.diagram-btn').forEach(button => {
            const checkbox = button.querySelector('div div');
            const checkIcon = button.querySelector('svg');

            button.classList.remove('border-blue-500', 'bg-blue-50');
            button.classList.add('border-gray-300');
            checkbox.classList.remove('bg-blue-500', 'border-blue-500');
            checkbox.classList.add('border-gray-400');
            checkIcon.classList.add('opacity-0');
        });

        this.updateSelectionUI();
        this.clearVisualization();
    }

    /**
     * Toggle font size for better readability
     */
    toggleFontSize() {
        console.log('toggleFontSize method called');
        this.largeFontsEnabled = !this.largeFontsEnabled;
        console.log('largeFontsEnabled set to:', this.largeFontsEnabled);

        const toggleButton = document.getElementById('fontSizeToggle');
        const fontSizeText = document.getElementById('fontSizeText');
        const visualizationArea = document.getElementById('visualizationArea');

        console.log('DOM elements found:', {
            toggleButton: !!toggleButton,
            fontSizeText: !!fontSizeText,
            visualizationArea: !!visualizationArea
        });

        if (this.largeFontsEnabled) {
            toggleButton.classList.add('active');
            toggleButton.style.backgroundColor = '#22c55e'; // Force green color
            fontSizeText.textContent = 'Normal Fonts';
            visualizationArea.classList.add('large-fonts');

            // Add visual indicator
            const indicator = document.createElement('div');
            indicator.id = 'font-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #22c55e;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            indicator.innerHTML = '🔍 Large Fonts Applied!<br><small>Using PlantUML skinparam</small>';
            document.body.appendChild(indicator);

            // Remove indicator after 3 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 3000);

            console.log('Applied large fonts styling - using PlantUML skinparam');
        } else {
            toggleButton.classList.remove('active');
            toggleButton.style.backgroundColor = ''; // Reset to default
            fontSizeText.textContent = 'Larger Fonts';
            visualizationArea.classList.remove('large-fonts');

            // Remove any existing indicators
            const existingIndicator = document.getElementById('font-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            console.log('Removed large fonts styling');
        }

        // Regenerate current diagram with new font settings if one is displayed
        const hasExistingDiagram = visualizationArea.querySelector('img') || 
                                   !visualizationArea.innerHTML.includes('Select diagrams');

        if (hasExistingDiagram && this.selectedDiagrams.size > 0) {
            console.log('Regenerating current diagram with new font settings...');
            setTimeout(() => {
                this.visualizeSelectedDiagrams();
            }, 100);
        }

        console.log(`Font size ${this.largeFontsEnabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Apply font size settings to currently displayed SVG
     */
    applyFontSizeToCurrentSVG() {
        console.log('applyFontSizeToCurrentSVG called');
        const visualizationArea = document.getElementById('visualizationArea');

        // Try multiple selectors for SVG elements
        let svgElement = visualizationArea.querySelector('svg');
        if (!svgElement) {
            // Try finding SVG in nested containers
            const contentWrapper = visualizationArea.querySelector('.max-w-full');
            if (contentWrapper) {
                svgElement = contentWrapper.querySelector('svg');
            }
        }

        console.log('SVG element found:', !!svgElement);
        console.log('Visualization area HTML:', visualizationArea.innerHTML.substring(0, 200) + '...');

        if (svgElement) {
            console.log('SVG element details:', {
                tagName: svgElement.tagName,
                className: svgElement.className,
                id: svgElement.id,
                width: svgElement.getAttribute('width'),
                height: svgElement.getAttribute('height')
            });

            if (this.largeFontsEnabled) {
                console.log('Applying large fonts to SVG');

                // Method 1: Direct style manipulation
                svgElement.style.fontSize = '16px';
                // Remove font-weight to avoid bold text

                // Method 2: Apply to all text elements
                const textElements = svgElement.querySelectorAll('text');
                console.log('Found', textElements.length, 'text elements');

                textElements.forEach((text, index) => {
                    const originalSize = text.getAttribute('font-size') || text.style.fontSize;
                    const originalFill = text.getAttribute('fill') || text.style.fill;
                    console.log(`Text element ${index}: original size "${originalSize}", fill "${originalFill}"`);

                    // Try multiple approaches - only change font-size, preserve colors and weights
                    text.setAttribute('font-size', '16px');
                    // Don't change font-weight to avoid bold text
                    text.style.fontSize = '16px';

                    // CRITICAL: Preserve original colors, especially blue
                    if (originalFill && (originalFill.includes('#0000FF') || originalFill.includes('#0000ff') || originalFill.includes('blue'))) {
                        text.setAttribute('fill', '#0000FF');
                        text.style.fill = '#0000FF';
                        console.log(`Preserved blue color for text element ${index}`);
                    }

                    console.log(`Updated text element ${index} to 16px (preserved original styling)`);
                });

                // Method 3: Add CSS class to parent
                svgElement.classList.add('large-fonts-applied');
                console.log('Added large-fonts-applied class to SVG');

                // Method 4: Force style injection (only font-size, preserve colors and weights)
                const styleElement = document.createElement('style');
                styleElement.textContent = `
                    #${svgElement.id || 'visualizationArea'} svg text {
                        font-size: 16px !important;
                    }
                    .large-fonts svg text {
                        font-size: 16px !important;
                    }
                    /* CRITICAL: Preserve blue colors */
                    .large-fonts svg text[fill="#0000FF"],
                    .large-fonts svg text[fill="#0000ff"],
                    .large-fonts svg text[fill="blue"],
                    .large-fonts svg text[fill="Blue"] {
                        fill: #0000FF !important;
                    }
                    /* Ensure all blue text remains blue */
                    svg text[fill="#0000FF"],
                    svg text[fill="#0000ff"],
                    svg text[fill="blue"],
                    svg text[fill="Blue"] {
                        fill: #0000FF !important;
                    }
                    /* Preserve original colors and weights for all other elements */
                    .large-fonts svg text {
                        fill: inherit !important;
                    }
                `;
                document.head.appendChild(styleElement);
                console.log('Injected CSS style (size only, blue colors preserved)');

                // Method 5: Direct SVG content manipulation as last resort
                try {
                    const svgContent = svgElement.outerHTML;
                    let modifiedContent = svgContent;

                    // Replace font-size attributes only, preserve colors and weights
                    modifiedContent = modifiedContent.replace(/font-size="[^"]*"/g, 'font-size="16px"');
                    modifiedContent = modifiedContent.replace(/font-size='[^']*'/g, "font-size='16px'");

                    // CRITICAL: Ensure blue colors are preserved in the modified content
                    modifiedContent = modifiedContent.replace(/fill="[^"]*"/g, (match) => {
                        if (match.includes('#0000FF') || match.includes('#0000ff') || match.includes('blue')) {
                            return 'fill="#0000FF"';
                        }
                        return match;
                    });

                    // Don't add font-weight to avoid bold text

                    if (modifiedContent !== svgContent) {
                        console.log('Direct SVG content modification applied (size only, colors preserved)');
                        // Replace the SVG element with modified version
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = modifiedContent;
                        const newSvg = tempDiv.querySelector('svg');
                        if (newSvg) {
                            svgElement.parentNode.replaceChild(newSvg, svgElement);
                            console.log('SVG element replaced with modified version (blue colors preserved)');
                        }
                    }
                } catch (error) {
                    console.error('Error in direct SVG manipulation:', error);
                }

            } else {
                console.log('Resetting SVG fonts to normal');

                // Reset all methods - remove font-size but preserve original styling
                svgElement.style.fontSize = '';
                svgElement.classList.remove('large-fonts-applied');

                const textElements = svgElement.querySelectorAll('text');
                textElements.forEach((text, index) => {
                    text.removeAttribute('font-size');
                    text.style.fontSize = '';
                    // Don't remove font-weight or colors - preserve original styling
                    console.log(`Reset font-size for text element ${index} (preserved original styling)`);
                });

                // Remove injected styles
                const styles = document.querySelectorAll('style');
                styles.forEach(style => {
                    if (style.textContent.includes('font-size: 16px')) {
                        style.remove();
                    }
                });
            }

            // Force a re-render
            setTimeout(() => {
                visualizationArea.style.display = 'none';
                visualizationArea.offsetHeight; // Trigger reflow
                visualizationArea.style.display = '';
                console.log('Forced re-render of visualization area');
            }, 10);

        } else {
            console.log('No SVG element found to apply font size changes');
            console.log('Available elements in visualization area:');
            const allElements = visualizationArea.querySelectorAll('*');
            allElements.forEach((el, index) => {
                if (index < 10) { // Limit output
                    console.log(`  ${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className : ''}`);
                }
            });
        }
    }

    /**
     * Load all UML file contents
     */
    async loadAllUMLContents() {
        const loadPromises = this.diagramConfigs.map(async (config) => {
            try {
                const response = await fetch(`../ModularLandscape/PUML/${config.filename}`);
                if (response.ok) {
                    const content = await response.text();
                    this.umlContents.set(config.id, content);
                } else {
                    console.warn(`Failed to load ${config.filename}: ${response.status}`);
                    this.umlContents.set(config.id, `@startuml\ntitle Error Loading ${config.displayName}\nnote "Could not load UML file: ${config.filename}" as N1\n@enduml`);
                }
            } catch (error) {
                console.error(`Error loading ${config.filename}:`, error);
                this.umlContents.set(config.id, `@startuml\ntitle Error Loading ${config.displayName}\nnote "Error: ${error.message}" as N1\n@enduml`);
            }
        });

        await Promise.all(loadPromises);
        console.log('All UML contents loaded');
    }

    /**
     * Visualize selected diagrams
     */
    async visualizeSelectedDiagrams() {
        if (this.selectedDiagrams.size === 0) return;

        const visualizationArea = document.getElementById('visualizationArea');
        visualizationArea.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-2">Generating UML diagram...</span></div>';

        try {
            let umlContent;
            
            if (this.selectedDiagrams.size === 1) {
                // Single diagram
                const diagramId = Array.from(this.selectedDiagrams)[0];
                umlContent = this.umlContents.get(diagramId);
            } else {
                // Combined diagrams
                umlContent = this.createCombinedUML();
            }

            await this.renderUMLDiagram(umlContent);
        } catch (error) {
            console.error('Error visualizing diagrams:', error);
            visualizationArea.innerHTML = `
                <div class="text-center text-red-600">
                    <div class="text-lg font-semibold mb-2">Error Generating Diagram</div>
                    <div class="text-sm">${error.message}</div>
                    <div class="text-xs mt-2 text-gray-500">Please ensure PlantUML server is accessible</div>
                </div>
            `;
        }
    }

    /**
     * Create combined UML from selected diagrams
     */
    createCombinedUML() {
        const selectedConfigs = this.diagramConfigs.filter(config => 
            this.selectedDiagrams.has(config.id)
        );

        let combinedUML = '@startuml Combined BIAN Diagrams\n\n';
        combinedUML += 'title Combined BIAN Architecture Domains\n\n';
        combinedUML += '!define LAYOUT top to bottom direction\n\n';

        // Extract and combine content from each selected diagram
        selectedConfigs.forEach((config, index) => {
            const content = this.umlContents.get(config.id);
            if (content) {
                // Remove @startuml/@enduml and title from individual diagrams
                let cleanContent = content
                    .replace(/@startuml[^\n]*\n?/g, '')
                    .replace(/@enduml[^\n]*\n?/g, '')
                    .replace(/title[^\n]*\n?/g, '')
                    .replace(/!define LAYOUT[^\n]*\n?/g, '')
                    .trim();

                if (cleanContent) {
                    combinedUML += `' === ${config.displayName} Domain ===\n`;
                    combinedUML += cleanContent + '\n\n';
                }
            }
        });

        combinedUML += '@enduml';
        return combinedUML;
    }

    /**
     * Render UML diagram using local PlantUML jar
     */
    async renderUMLDiagram(umlContent) {
        try {
            const visualizationArea = document.getElementById('visualizationArea');
            
            // Show loading state
            visualizationArea.innerHTML = `
                <div class="flex flex-col items-center justify-center h-32">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <span class="text-gray-600">Generating diagram with local PlantUML...</span>
                </div>
            `;
            
            // Always use PNG format for reliable rendering across environments
            const format = 'png';

            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uml_content: umlContent,
                    format: format,
                    large_fonts: this.largeFontsEnabled
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            // Get the response content
            const contentType = response.headers.get('content-type');
            let diagramContent;
            let isImage = false;

            if (contentType && contentType.includes('image/')) {
                // Handle binary image data (PNG, etc.) - always PNG for reliable rendering
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                diagramContent = imageUrl;
                isImage = true;
                console.log(`Generated PNG image ${this.largeFontsEnabled ? 'with large fonts' : 'with normal fonts'}`);
            } else {
                // Fallback: Handle text content (shouldn't happen with PNG format)
                diagramContent = await response.text();
                isImage = false;
                console.log('Unexpected text content received, treating as fallback');
            }
            
            // Create container for the diagram
            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'w-full flex flex-col items-center';
            
            // Create content wrapper - no CSS scaling needed, PlantUML handles font sizes
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'max-w-full overflow-auto border rounded-lg bg-white p-4 shadow-sm';
            contentWrapper.style.maxHeight = '80vh';

            if (isImage) {
                // Display as image - no CSS scaling, PlantUML generates appropriate size
                const img = document.createElement('img');
                img.src = diagramContent;
                img.className = 'max-w-full h-auto';
                img.style.maxHeight = '75vh';
                contentWrapper.appendChild(img);
                console.log('Displayed PNG image with native PlantUML font sizing');
            } else {
                // Fallback: Display as SVG (shouldn't happen with PNG format)
                contentWrapper.innerHTML = diagramContent;
                console.log('Fallback: Displaying text content as HTML');
            }
            
            // Create download buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex gap-2 mt-4';

            // Always use PNG format - create download buttons accordingly
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
            downloadBtn.textContent = 'Download PNG';
            downloadBtn.onclick = () => this.downloadImageFromUrl(diagramContent, 'bian-diagram.png');
            buttonContainer.appendChild(downloadBtn);

            // Also offer SVG option for compatibility
            const downloadSvgBtn = document.createElement('button');
            downloadSvgBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
            downloadSvgBtn.textContent = 'Download as SVG';
            downloadSvgBtn.onclick = () => this.downloadAsSVG(umlContent);
            buttonContainer.appendChild(downloadSvgBtn);
            
            // Assemble the result
            diagramContainer.appendChild(contentWrapper);
            diagramContainer.appendChild(buttonContainer);
            
            // Update visualization area
            visualizationArea.innerHTML = '';
            visualizationArea.appendChild(diagramContainer);
            
        } catch (error) {
            const visualizationArea = document.getElementById('visualizationArea');
            visualizationArea.innerHTML = `
                <div class="text-center text-red-600 p-8">
                    <div class="text-lg font-semibold mb-2">Error Generating Diagram</div>
                    <div class="text-sm mb-4">${error.message}</div>
                    <div class="text-xs text-gray-500">
                        Make sure Java is installed and plantuml.jar is accessible
                    </div>
                </div>
            `;
            throw error;
        }
    }


    /**
     * Download SVG content as file
     */
    downloadSVGContent(svgContent, filename) {
        try {
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `bian-diagram-${Date.now()}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading SVG:', error);
        }
    }

    /**
     * Download diagram as PNG
     */
    async downloadAsPNG(umlContent) {
        try {
            console.log('Downloading PNG...');
            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uml_content: umlContent,
                    format: 'png'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate PNG');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `bian-diagram-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('PNG download completed');

        } catch (error) {
            console.error('Error downloading PNG:', error);
            alert('Error downloading PNG: ' + error.message);
        }
    }

    /**
     * Download diagram as PNG (always use PNG for consistency)
     */
    async downloadAsPNG(umlContent) {
        try {
            console.log('Downloading PNG...');
            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uml_content: umlContent,
                    format: 'png'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate PNG');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `bian-diagram-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('PNG download completed');

        } catch (error) {
            console.error('Error downloading PNG:', error);
            alert('Error downloading PNG: ' + error.message);
        }
    }

    /**
     * Download diagram as SVG (alternative method)
     */
    async downloadAsSVG(umlContent) {
        try {
            console.log('Downloading SVG...');
            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uml_content: umlContent,
                    format: 'svg'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate SVG');
            }

            const svgContent = await response.text();
            this.downloadSVGContent(svgContent, `bian-diagram-${Date.now()}.svg`);
            console.log('SVG download completed');

        } catch (error) {
            console.error('Error downloading SVG:', error);
            alert('Error downloading SVG: ' + error.message);
        }
    }

    /**
     * Download image from blob URL
     */
    downloadImageFromUrl(imageUrl, filename) {
        try {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = filename || `bian-diagram-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Error downloading image: ' + error.message);
        }
    }

    /**
     * Clear visualization area
     */
    clearVisualization() {
        const visualizationArea = document.getElementById('visualizationArea');
        visualizationArea.innerHTML = `
            <div class="text-center">
                <svg class="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002-2M9 7a2 2 0 012 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 002-2"></path>
                </svg>
                <p class="text-gray-500 mb-2">Select diagrams and click "Visualize UML" to see the rendered diagrams</p>
                <p class="text-xs text-gray-400">Supports individual diagrams and combined multi-diagram views</p>
            </div>
        `;
    }

    /**
     * Add new diagram configuration (for future extensibility)
     */
    addDiagramConfig(config) {
        this.diagramConfigs.push(config);
        this.renderDiagramButtons();
    }

    /**
     * Get current selection info
     */
    getSelectionInfo() {
        return {
            selectedCount: this.selectedDiagrams.size,
            selectedIds: Array.from(this.selectedDiagrams),
            selectedNames: Array.from(this.selectedDiagrams).map(id => 
                this.diagramConfigs.find(config => config.id === id)?.displayName
            )
        };
    }
}

// Global test function for button
window.testFontToggle = function() {
    console.log('Global testFontToggle called!');
    alert('Button clicked! Font toggle test function executed.');
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bianVisualizer = new BianUMLVisualizer();
});

// Export for potential future module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BianUMLVisualizer;
}
