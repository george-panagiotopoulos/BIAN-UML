/**
 * BIAN UML Visualizer Application
 * Handles UML diagram selection, rendering, and combination functionality
 */

class BianUMLVisualizer {
    constructor() {
        this.selectedDiagrams = new Set();
        this.diagramConfigs = this.initializeDiagramConfigs();
        this.dataModelConfigs = this.initializeDataModelConfigs();
        this.umlContents = new Map();
        this.currentTab = 'bian';
        this.currentDataModelTab = 'visualization';
        this.vocabularyData = null;
        this.init();
    }

    /**
     * Initialize diagram configurations - easily extensible for future diagrams
     */
    initializeDiagramConfigs() {
        return [
            { id: 'business_support', filename: 'bian_business_support.puml', displayName: 'Business Support', description: 'IT Management, Enterprise Services, Facilities', color: 'bg-blue-500' },
            { id: 'channels', filename: 'bian_channels.puml', displayName: 'Channels', description: 'Digital Channels, Branch Operations, ATM, Contact Center', color: 'bg-green-500' },
            { id: 'cross_product_ops', filename: 'bian_cross_product_ops.puml', displayName: 'Cross Product Ops', description: 'Cross-product operational services', color: 'bg-purple-500' },
            { id: 'customer_servicing', filename: 'bian_customer_servicing.puml', displayName: 'Customer Servicing', description: 'Customer service and support operations', color: 'bg-orange-500' },
            { id: 'investment_market_ops', filename: 'bian_investment_market_ops.puml', displayName: 'Investment & Market Ops', description: 'Investment and market operations', color: 'bg-red-500' },
            { id: 'marketing_sales', filename: 'bian_marketing_sales.puml', displayName: 'Marketing & Sales', description: 'Marketing and sales operations', color: 'bg-yellow-500' },
            { id: 'product_loans_cards', filename: 'bian_product_loans_cards.puml', displayName: 'Products, Loans & Cards', description: 'Product management, loans, and card services', color: 'bg-indigo-500' },
            { id: 'reference_market_data', filename: 'bian_reference_market_data.puml', displayName: 'Reference & Market Data', description: 'Reference data and market information', color: 'bg-pink-500' },
            { id: 'risk_compliance', filename: 'bian_risk_compliance.puml', displayName: 'Risk & Compliance', description: 'Risk management and compliance operations', color: 'bg-gray-600' }
        ];
    }

    /**
     * Initialize data model configurations for Temenos modules
     */
    initializeDataModelConfigs() {
        return [
            {
                id: 'deposits',
                filename: 'deposits_logical_data_model.puml',
                displayName: 'Deposits',
                description: 'Customer deposits and account management',
                color: 'bg-green-500'
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
        this.renderDataModelButtons();
        this.attachEventListeners();
        this.attachTabEventListeners();
        this.attachDataModelTabEventListeners();
        this.attachVocabularyEventListeners();
        await this.loadAllUMLContents();
        await this.loadAllDataModelContents();
        console.log('BIAN UML Visualizer initialized successfully');
    }

    /**
     * Check system support and show status
     */
    checkLibrarySupport() {
        console.log('🔍 Checking system support...');
        console.log('✅ Using local PlantUML jar for diagram generation');
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
                console.warn('⚠️ PlantUML setup issues detected:', { java: health.java_available, jar: health.plantuml_jar_exists });
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
            if (!health.java_available) { statusText = 'Java: Not Available'; statusColor = 'bg-red-400'; }
            else if (!health.plantuml_jar_exists) { statusText = 'PlantUML: Jar Missing'; statusColor = 'bg-red-400'; }
            else if (!health.graphviz_available) { statusText = 'GraphViz: Not Found'; statusColor = 'bg-yellow-400'; }
            else if (health.graphviz_installations && health.graphviz_installations.length > 0) {
                const installation = health.graphviz_installations[0];
                statusText = `PlantUML + ${installation.type} GraphViz: Ready`;
            }
            statusElement.innerHTML = `<span class="inline-block w-2 h-2 ${statusColor} rounded-full mr-1"></span>${statusText}`;
        }
    }

    /**
     * Attach tab event listeners
     */
    attachTabEventListeners() {
        document.getElementById('bianTab').addEventListener('click', () => this.switchTab('bian'));
        document.getElementById('dataModelTab').addEventListener('click', () => this.switchTab('dataModel'));
    }

    /**
     * Switch between tabs
     */
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        if (tab === 'bian') {
            document.getElementById('bianTab').classList.add('active');
            document.getElementById('bianContent').classList.remove('hidden');
            this.currentTab = 'bian';
        } else if (tab === 'dataModel') {
            document.getElementById('dataModelTab').classList.add('active');
            document.getElementById('dataModelContent').classList.remove('hidden');
            this.currentTab = 'dataModel';
            // Initialize documentation when first entering data model tab
            if (this.currentDataModelTab === 'documentation') {
                this.loadDocumentation();
            }
        }
    }

    /**
     * Attach data model sub-tab event listeners
     */
    attachDataModelTabEventListeners() {
        document.getElementById('dataModelVisualizationTab').addEventListener('click', () => this.switchDataModelTab('visualization'));
        document.getElementById('dataModelDocumentationTab').addEventListener('click', () => this.switchDataModelTab('documentation'));
        document.getElementById('apiVocabularyTab').addEventListener('click', () => this.switchDataModelTab('vocabulary'));
    }

    /**
     * Switch between data model sub-tabs
     */
    switchDataModelTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.data-model-tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Update tab content
        document.querySelectorAll('.data-model-tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        if (tab === 'visualization') {
            document.getElementById('dataModelVisualizationTab').classList.add('active');
            document.getElementById('dataModelVisualizationContent').classList.remove('hidden');
            this.currentDataModelTab = 'visualization';
        } else if (tab === 'documentation') {
            document.getElementById('dataModelDocumentationTab').classList.add('active');
            document.getElementById('dataModelDocumentationContent').classList.remove('hidden');
            this.currentDataModelTab = 'documentation';
            this.loadDocumentation();
        } else if (tab === 'vocabulary') {
            document.getElementById('apiVocabularyTab').classList.add('active');
            document.getElementById('apiVocabularyContent').classList.remove('hidden');
            this.currentDataModelTab = 'vocabulary';
        }
    }

    /**
     * Attach vocabulary event listeners
     */
    attachVocabularyEventListeners() {
        document.getElementById('downloadVocabularyBtn').addEventListener('click', () => this.downloadVocabulary());
        document.getElementById('viewVocabularyBtn').addEventListener('click', () => this.viewVocabulary());
        document.getElementById('searchVocabularyBtn').addEventListener('click', () => this.toggleSearchInterface());
        document.getElementById('performSearchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());

        // Add enter key support for search
        document.getElementById('vocabularySearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    }

    /**
     * Load and display documentation
     */
    async loadDocumentation() {
        const documentationArea = document.getElementById('documentationArea');
        documentationArea.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-2">Loading documentation...</span></div>';

        try {
            const response = await fetch('/Vocabulary/deposits_data_model_documentation.md');
            if (!response.ok) {
                throw new Error('Documentation not found');
            }

            const markdown = await response.text();
            // Convert markdown to HTML (simple conversion)
            const html = this.markdownToHTML(markdown);
            documentationArea.innerHTML = html;
        } catch (error) {
            console.error('Error loading documentation:', error);
            documentationArea.innerHTML = `
                <div class="text-center text-red-600 p-8">
                    <div class="text-lg font-semibold mb-2">Error Loading Documentation</div>
                    <div class="text-sm">${error.message}</div>
                </div>
            `;
        }
    }

    /**
     * Simple markdown to HTML converter
     */
    markdownToHTML(markdown) {
        let html = markdown
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-800 mt-8 mb-4">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-800 mt-8 mb-6">$1</h1>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>')
            .replace(/\n\n/g, '</p><p class="mb-4">')
            .replace(/\n/g, '<br>');

        // Wrap in paragraph tags and add classes
        html = '<div class="text-gray-700 leading-relaxed"><p class="mb-4">' + html + '</p></div>';

        // Clean up any empty paragraphs
        html = html.replace(/<p class="mb-4"><\/p>/g, '');

        return html;
    }

    /**
     * Download vocabulary JSON file
     */
    async downloadVocabulary() {
        try {
            const response = await fetch('/Vocabulary/FinalVocab.json');
            if (!response.ok) {
                throw new Error('Vocabulary file not found');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'FinalVocab.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading vocabulary:', error);
            alert('Error downloading vocabulary: ' + error.message);
        }
    }

    /**
     * View vocabulary JSON data
     */
    async viewVocabulary() {
        const vocabularyArea = document.getElementById('vocabularyArea');
        vocabularyArea.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-2">Loading vocabulary...</span></div>';

        try {
            if (!this.vocabularyData) {
                const response = await fetch('/Vocabulary/FinalVocab.json');
                if (!response.ok) {
                    throw new Error('Vocabulary file not found');
                }
                this.vocabularyData = await response.json();
            }

            this.displayVocabulary(this.vocabularyData);
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            vocabularyArea.innerHTML = `
                <div class="text-center text-red-600 p-8">
                    <div class="text-lg font-semibold mb-2">Error Loading Vocabulary</div>
                    <div class="text-sm">${error.message}</div>
                </div>
            `;
        }
    }

    /**
     * Display vocabulary data
     */
    displayVocabulary(data, searchTerm = null) {
        const vocabularyArea = document.getElementById('vocabularyArea');

        if (Array.isArray(data)) {
            // Filter items if search term is provided
            let filteredData = data;
            if (searchTerm) {
                filteredData = data.filter(item =>
                    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Add counter at the top
            const totalCount = data.length;
            const displayedCount = filteredData.length;
            let counterText = searchTerm
                ? `Showing ${displayedCount} of ${totalCount} items (${totalCount - displayedCount} hidden)`
                : `Total items: ${totalCount}`;

            let html = `
                <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="text-sm font-medium text-blue-800">${counterText}</div>
                    ${searchTerm ? `<div class="text-xs text-blue-600 mt-1">Search term: "${searchTerm}"</div>` : ''}
                </div>
                <div class="space-y-4">
            `;

            filteredData.forEach((item, index) => {
                const originalIndex = data.indexOf(item);
                const itemHtml = this.renderVocabularyItem(item, originalIndex, searchTerm);
                html += itemHtml;
            });

            html += '</div>';

            if (searchTerm && filteredData.length === 0) {
                html += `
                    <div class="text-center text-gray-500 mt-8 p-8">
                        <svg class="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <div class="text-lg font-medium text-gray-700 mb-2">No matches found</div>
                        <div class="text-sm text-gray-500">Try a different search term or clear the search to see all items</div>
                    </div>
                `;
            }

            vocabularyArea.innerHTML = html;
        } else if (typeof data === 'object') {
            // For object data, count properties and filter if needed
            const allKeys = this.getAllKeys(data);
            const totalCount = allKeys.length;

            let filteredData = data;
            let displayedCount = totalCount;

            if (searchTerm) {
                filteredData = this.filterObjectBySearchTerm(data, searchTerm);
                displayedCount = this.getAllKeys(filteredData).length;
            }

            let counterText = searchTerm
                ? `Showing ${displayedCount} of ${totalCount} properties (${totalCount - displayedCount} hidden)`
                : `Total properties: ${totalCount}`;

            const jsonHtml = this.renderJSONTree(filteredData, searchTerm);
            vocabularyArea.innerHTML = `
                <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="text-sm font-medium text-blue-800">${counterText}</div>
                    ${searchTerm ? `<div class="text-xs text-blue-600 mt-1">Search term: "${searchTerm}"</div>` : ''}
                </div>
                <div class="vocabulary-json">${jsonHtml}</div>
            `;
        } else {
            vocabularyArea.innerHTML = '<div class="text-center text-gray-500">No vocabulary data available</div>';
        }
    }

    /**
     * Render vocabulary item
     */
    renderVocabularyItem(item, index, searchTerm = null) {
        let itemText = JSON.stringify(item, null, 2);

        if (searchTerm) {
            // Highlight search term
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            itemText = itemText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
        }

        return `
            <div class="vocabulary-item">
                <div class="text-sm text-gray-600 mb-2">Item ${index + 1}</div>
                <pre class="text-sm overflow-x-auto">${itemText}</pre>
            </div>
        `;
    }

    /**
     * Render JSON tree
     */
    renderJSONTree(obj, searchTerm = null, depth = 0) {
        if (depth > 5) return '...'; // Prevent infinite recursion

        let html = '';
        const indent = '  '.repeat(depth);

        if (Array.isArray(obj)) {
            html += '[\n';
            obj.forEach((item, index) => {
                html += indent + '  ';
                if (typeof item === 'object') {
                    html += this.renderJSONTree(item, searchTerm, depth + 1);
                } else {
                    let value = JSON.stringify(item);
                    if (searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
                        const regex = new RegExp(`(${searchTerm})`, 'gi');
                        value = value.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
                    }
                    html += value;
                }
                html += index < obj.length - 1 ? ',\n' : '\n';
            });
            html += indent + ']';
        } else if (typeof obj === 'object' && obj !== null) {
            html += '{\n';
            const keys = Object.keys(obj);
            keys.forEach((key, index) => {
                let keyStr = `"${key}"`;
                if (searchTerm && key.toLowerCase().includes(searchTerm.toLowerCase())) {
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    keyStr = keyStr.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
                }

                html += indent + '  ' + keyStr + ': ';

                if (typeof obj[key] === 'object') {
                    html += this.renderJSONTree(obj[key], searchTerm, depth + 1);
                } else {
                    let value = JSON.stringify(obj[key]);
                    if (searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
                        const regex = new RegExp(`(${searchTerm})`, 'gi');
                        value = value.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
                    }
                    html += value;
                }
                html += index < keys.length - 1 ? ',\n' : '\n';
            });
            html += indent + '}';
        } else {
            let value = JSON.stringify(obj);
            if (searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                value = value.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
            }
            html += value;
        }

        return html;
    }

    /**
     * Toggle search interface
     */
    toggleSearchInterface() {
        const searchInterface = document.getElementById('searchInterface');
        const isHidden = searchInterface.classList.contains('hidden');

        if (isHidden) {
            searchInterface.classList.remove('hidden');
            document.getElementById('vocabularySearchInput').focus();
        } else {
            searchInterface.classList.add('hidden');
            this.clearSearch();
        }
    }

    /**
     * Perform search in vocabulary
     */
    async performSearch() {
        const searchTerm = document.getElementById('vocabularySearchInput').value.trim();

        if (!searchTerm) {
            alert('Please enter a search term');
            return;
        }

        if (!this.vocabularyData) {
            await this.viewVocabulary();
        }

        if (this.vocabularyData) {
            this.displayVocabulary(this.vocabularyData, searchTerm);
        }
    }

    /**
     * Clear search and reset display
     */
    clearSearch() {
        document.getElementById('vocabularySearchInput').value = '';
        if (this.vocabularyData) {
            this.displayVocabulary(this.vocabularyData);
        }
    }

    /**
     * Get all keys from a nested object
     */
    getAllKeys(obj, keys = new Set()) {
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                keys.add(key);
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    this.getAllKeys(obj[key], keys);
                }
            });
        }
        return Array.from(keys);
    }

    /**
     * Filter object by search term, keeping only matching keys/values
     */
    filterObjectBySearchTerm(obj, searchTerm) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const filtered = {};
        const lowerSearchTerm = searchTerm.toLowerCase();

        for (const [key, value] of Object.entries(obj)) {
            const keyMatches = key.toLowerCase().includes(lowerSearchTerm);
            const valueMatches = typeof value === 'string' && value.toLowerCase().includes(lowerSearchTerm);

            if (keyMatches || valueMatches) {
                filtered[key] = value;
            } else if (typeof value === 'object' && value !== null) {
                // Recursively filter nested objects
                const nestedFiltered = this.filterObjectBySearchTerm(value, searchTerm);
                if (Object.keys(nestedFiltered).length > 0) {
                    filtered[key] = nestedFiltered;
                }
            }
        }

        return filtered;
    }

    /**
     * Render data model buttons dynamically
     */
    renderDataModelButtons() {
        const container = document.getElementById('dataModelButtons');
        container.innerHTML = '';
        this.dataModelConfigs.forEach(config => {
            const button = document.createElement('button');
            button.className = `data-model-btn relative p-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 text-left group`;
            button.dataset.dataModelId = config.id;
            button.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <div class="w-3 h-3 ${config.color} rounded-full"></div>
                </div>
                <h3 class="font-semibold text-gray-800 mb-1">${config.displayName}</h3>
                <p class="text-xs text-gray-600">${config.description}</p>
            `;
            button.addEventListener('click', () => this.visualizeDataModel(config.id));
            container.appendChild(button);
        });
    }

    /**
     * Load all data model contents
     */
    async loadAllDataModelContents() {
        const loadPromises = this.dataModelConfigs.map(async (config) => {
            try {
                const response = await fetch(`/Vocabulary/${config.filename}`);
                if (response.ok) {
                    const content = await response.text();
                    this.umlContents.set(`datamodel_${config.id}`, content);
                } else {
                    console.warn(`Failed to load ${config.filename}: ${response.status}`);
                    this.umlContents.set(`datamodel_${config.id}`, `@startmindmap\n* Error Loading ${config.displayName}\n** Could not load file: ${config.filename}\n@endmindmap`);
                }
            } catch (error) {
                console.error(`Error loading ${config.filename}:`, error);
                this.umlContents.set(`datamodel_${config.id}`, `@startmindmap\n* Error Loading ${config.displayName}\n** Error: ${error.message}\n@endmindmap`);
            }
        });
        await Promise.all(loadPromises);
        console.log('All data model contents loaded');
    }

    /**
     * Visualize specific data model
     */
    async visualizeDataModel(dataModelId) {
        const visualizationArea = document.getElementById('dataModelVisualizationArea');
        visualizationArea.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-2">Generating data model diagram...</span></div>';

        try {
            const umlContent = this.umlContents.get(`datamodel_${dataModelId}`);
            if (!umlContent) {
                throw new Error('Data model content not found');
            }
            await this.renderDataModelDiagram(umlContent);
        } catch (error) {
            console.error('Error visualizing data model:', error);
            visualizationArea.innerHTML = `
                <div class="text-center text-red-600">
                    <div class="text-lg font-semibold mb-2">Error Generating Data Model</div>
                    <div class="text-sm">${error.message}</div>
                    <div class="text-xs mt-2 text-gray-500">Please ensure PlantUML server is accessible</div>
                </div>
            `;
        }
    }

    /**
     * Render data model diagram
     */
    async renderDataModelDiagram(umlContent) {
        try {
            const visualizationArea = document.getElementById('dataModelVisualizationArea');
            visualizationArea.innerHTML = `
                <div class="flex flex-col items-center justify-center h-32">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <span class="text-gray-600">Generating data model with local PlantUML...</span>
                </div>
            `;

            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uml_content: umlContent, format: 'png' })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'w-full flex flex-col items-center';

            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'max-w-full overflow-auto border rounded-lg bg-white p-4 shadow-sm';
            contentWrapper.style.maxHeight = '80vh';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'max-w-full h-auto';
            img.style.maxHeight = '75vh';
            contentWrapper.appendChild(img);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex gap-2 mt-4';

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
            downloadBtn.textContent = 'Download PNG';
            downloadBtn.onclick = () => this.downloadImageFromUrl(imageUrl, 'deposits-data-model.png');
            buttonContainer.appendChild(downloadBtn);

            const downloadSvgBtn = document.createElement('button');
            downloadSvgBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
            downloadSvgBtn.textContent = 'Download as SVG';
            downloadSvgBtn.onclick = () => this.downloadDataModelAsSVG(umlContent);
            buttonContainer.appendChild(downloadSvgBtn);

            diagramContainer.appendChild(contentWrapper);
            diagramContainer.appendChild(buttonContainer);

            visualizationArea.innerHTML = '';
            visualizationArea.appendChild(diagramContainer);
        } catch (error) {
            const visualizationArea = document.getElementById('dataModelVisualizationArea');
            visualizationArea.innerHTML = `
                <div class="text-center text-red-600 p-8">
                    <div class="text-lg font-semibold mb-2">Error Generating Data Model</div>
                    <div class="text-sm mb-4">${error.message}</div>
                    <div class="text-xs text-gray-500">Make sure Java is installed and plantuml.jar is accessible</div>
                </div>
            `;
            throw error;
        }
    }

    /**
     * Download data model as SVG
     */
    async downloadDataModelAsSVG(umlContent) {
        try {
            const response = await fetch('/api/generate-diagram', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uml_content: umlContent, format: 'svg' })
            });
            if (!response.ok) throw new Error('Failed to generate SVG');
            const svgContent = await response.text();
            this.downloadSVGContent(svgContent, `deposits-data-model-${Date.now()}.svg`);
        } catch (error) { console.error('Error downloading SVG:', error); alert('Error downloading SVG: ' + error.message); }
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
        document.getElementById('diagramButtons').addEventListener('click', (e) => {
            const button = e.target.closest('.diagram-btn');
            if (button) {
                this.toggleDiagramSelection(button.dataset.diagramId);
            }
        });
        document.getElementById('visualizeBtn').addEventListener('click', () => this.visualizeSelectedDiagrams());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSelection());
    }

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

    updateSelectionUI() {
        const count = this.selectedDiagrams.size;
        document.getElementById('selectedCount').textContent = count;
        document.getElementById('visualizeBtn').disabled = count === 0;
    }

    clearSelection() {
        this.selectedDiagrams.clear();
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

    async visualizeSelectedDiagrams() {
        if (this.selectedDiagrams.size === 0) return;
        const visualizationArea = document.getElementById('visualizationArea');
        visualizationArea.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-2">Generating UML diagram...</span></div>';
        try {
            let umlContent;
            if (this.selectedDiagrams.size === 1) {
                const diagramId = Array.from(this.selectedDiagrams)[0];
                umlContent = this.umlContents.get(diagramId);
            } else {
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

    createCombinedUML() {
        const selectedConfigs = this.diagramConfigs.filter(config => this.selectedDiagrams.has(config.id));
        let combinedUML = '@startuml Combined BIAN Diagrams\n\n';
        combinedUML += 'title Combined BIAN Architecture Domains\n\n';
        combinedUML += '!define LAYOUT top to bottom direction\n\n';
        selectedConfigs.forEach((config) => {
            const content = this.umlContents.get(config.id);
            if (content) {
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

    async renderUMLDiagram(umlContent) {
        try {
            const visualizationArea = document.getElementById('visualizationArea');
            visualizationArea.innerHTML = `
                <div class="flex flex-col items-center justify-center h-32">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <span class="text-gray-600">Generating diagram with local PlantUML...</span>
                </div>
            `;
            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uml_content: umlContent, format: 'png' })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'w-full flex flex-col items-center';
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'max-w-full overflow-auto border rounded-lg bg-white p-4 shadow-sm';
            contentWrapper.style.maxHeight = '80vh';
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'max-w-full h-auto';
            img.style.maxHeight = '75vh';
            contentWrapper.appendChild(img);
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex gap-2 mt-4';
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
            downloadBtn.textContent = 'Download PNG';
            downloadBtn.onclick = () => this.downloadImageFromUrl(imageUrl, 'bian-diagram.png');
            buttonContainer.appendChild(downloadBtn);
            const downloadSvgBtn = document.createElement('button');
            downloadSvgBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200';
            downloadSvgBtn.textContent = 'Download as SVG';
            downloadSvgBtn.onclick = () => this.downloadAsSVG(umlContent);
            buttonContainer.appendChild(downloadSvgBtn);
            diagramContainer.appendChild(contentWrapper);
            diagramContainer.appendChild(buttonContainer);
            visualizationArea.innerHTML = '';
            visualizationArea.appendChild(diagramContainer);
        } catch (error) {
            const visualizationArea = document.getElementById('visualizationArea');
            visualizationArea.innerHTML = `
                <div class="text-center text-red-600 p-8">
                    <div class="text-lg font-semibold mb-2">Error Generating Diagram</div>
                    <div class="text-sm mb-4">${error.message}</div>
                    <div class="text-xs text-gray-500">Make sure Java is installed and plantuml.jar is accessible</div>
                </div>
            `;
            throw error;
        }
    }

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

    async downloadAsPNG(umlContent) {
        try {
            const response = await fetch('/api/generate-diagram', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uml_content: umlContent, format: 'png' })
            });
            if (!response.ok) throw new Error('Failed to generate PNG');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `bian-diagram-${Date.now()}.png`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        } catch (error) { console.error('Error downloading PNG:', error); alert('Error downloading PNG: ' + error.message); }
    }

    async downloadAsSVG(umlContent) {
        try {
            const response = await fetch('/api/generate-diagram', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uml_content: umlContent, format: 'svg' })
            });
            if (!response.ok) throw new Error('Failed to generate SVG');
            const svgContent = await response.text();
            this.downloadSVGContent(svgContent, `bian-diagram-${Date.now()}.svg`);
        } catch (error) { console.error('Error downloading SVG:', error); alert('Error downloading SVG: ' + error.message); }
    }

    downloadImageFromUrl(imageUrl, filename) {
        try {
            const a = document.createElement('a');
            a.href = imageUrl; a.download = filename || `bian-diagram-${Date.now()}.png`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        } catch (error) { console.error('Error downloading image:', error); alert('Error downloading image: ' + error.message); }
    }

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

    addDiagramConfig(config) { this.diagramConfigs.push(config); this.renderDiagramButtons(); }

    getSelectionInfo() {
        return { selectedCount: this.selectedDiagrams.size, selectedIds: Array.from(this.selectedDiagrams), selectedNames: Array.from(this.selectedDiagrams).map(id => this.diagramConfigs.find(c => c.id === id)?.displayName) };
    }
}

// Initialize the application when DOM is loaded

document.addEventListener('DOMContentLoaded', () => { window.bianVisualizer = new BianUMLVisualizer(); });

if (typeof module !== 'undefined' && module.exports) { module.exports = BianUMLVisualizer; }
