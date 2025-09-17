/**
 * BIAN UML Visualizer Application
 * Handles UML diagram selection, rendering, and combination functionality
 */

class BianUMLVisualizer {
    constructor() {
        this.selectedDiagrams = new Set();
        this.diagramConfigs = this.initializeDiagramConfigs();
        this.umlContents = new Map();
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
        this.checkLibrarySupport();
        this.renderDiagramButtons();
        this.attachEventListeners();
        await this.loadAllUMLContents();
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
            
            // Send UML content to local Flask server
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            // Get the response content
            const contentType = response.headers.get('content-type');
            let diagramContent;
            let isImage = false;
            
            if (contentType && contentType.includes('image/')) {
                // Handle binary image data (PNG, etc.)
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                diagramContent = imageUrl;
                isImage = true;
            } else {
                // Handle text content (SVG)
                diagramContent = await response.text();
                isImage = false;
            }
            
            // Create container for the diagram
            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'w-full flex flex-col items-center';
            
            // Create content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'max-w-full overflow-auto border rounded-lg bg-white p-4 shadow-sm';
            contentWrapper.style.maxHeight = '80vh';
            
            if (isImage) {
                // Display as image
                const img = document.createElement('img');
                img.src = diagramContent;
                img.className = 'max-w-full h-auto';
                img.style.maxHeight = '75vh';
                contentWrapper.appendChild(img);
            } else {
                // Display as SVG
                contentWrapper.innerHTML = diagramContent;
            }
            
            // Create download buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex gap-2 mt-4';
            
            if (isImage) {
                // For images, create appropriate download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
                downloadBtn.textContent = 'Download Image';
                downloadBtn.onclick = () => this.downloadImageFromUrl(diagramContent, 'bian-diagram.png');
                buttonContainer.appendChild(downloadBtn);
                
                // Also offer SVG option
                const downloadSvgBtn = document.createElement('button');
                downloadSvgBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
                downloadSvgBtn.textContent = 'Download as SVG';
                downloadSvgBtn.onclick = () => this.downloadAsSVG(umlContent);
                buttonContainer.appendChild(downloadSvgBtn);
            } else {
                // For SVG, create SVG download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
                downloadBtn.textContent = 'Download SVG';
                downloadBtn.onclick = () => this.downloadSVGContent(diagramContent, 'bian-diagram.svg');
                buttonContainer.appendChild(downloadBtn);
                
                // Also offer PNG option
                const downloadPngBtn = document.createElement('button');
                downloadPngBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
                downloadPngBtn.textContent = 'Download PNG';
                downloadPngBtn.onclick = () => this.downloadAsPNG(umlContent);
                buttonContainer.appendChild(downloadPngBtn);
            }
            
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
        visualizationArea.innerHTML = '<p class="text-gray-500">Select diagrams and click "Visualize UML" to see the rendered diagrams</p>';
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bianVisualizer = new BianUMLVisualizer();
});

// Export for potential future module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BianUMLVisualizer;
}
