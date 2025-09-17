#!/bin/bash

# BIAN UML Visualizer Server Startup Script
# Kills any existing process on port 7777 and starts the Flask server

echo "🚀 BIAN UML Visualizer - Server Startup"
echo "========================================"

# Function to kill processes on port 7777
kill_port_7777() {
    echo "🔍 Checking for existing processes on port 7777..."
    
    # Find processes using port 7777
    PIDS=$(lsof -ti:7777 2>/dev/null)
    
    if [ -n "$PIDS" ]; then
        echo "⚠️  Found existing processes on port 7777: $PIDS"
        echo "🔪 Killing existing processes..."
        
        # Kill the processes
        echo "$PIDS" | xargs kill -9 2>/dev/null
        
        # Wait a moment for processes to die
        sleep 2
        
        # Check if any processes are still running
        REMAINING=$(lsof -ti:7777 2>/dev/null)
        if [ -n "$REMAINING" ]; then
            echo "❌ Failed to kill some processes: $REMAINING"
            echo "   You may need to kill them manually: kill -9 $REMAINING"
            exit 1
        else
            echo "✅ Successfully killed existing processes"
        fi
    else
        echo "✅ No existing processes found on port 7777"
    fi
}

# Function to check Python and pip
check_python() {
    echo "🐍 Checking Python environment..."
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 not found. Please install Python 3.7 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo "✅ Python version: $PYTHON_VERSION"
    
    if ! command -v pip3 &> /dev/null; then
        echo "❌ pip3 not found. Please install pip for Python 3."
        exit 1
    fi
    
    echo "✅ pip3 is available"
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing Python dependencies..."
    
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        if [ $? -eq 0 ]; then
            echo "✅ Dependencies installed successfully"
        else
            echo "❌ Failed to install dependencies"
            exit 1
        fi
    else
        echo "❌ requirements.txt not found"
        exit 1
    fi
}

# Function to verify UML files
check_uml_files() {
    echo "📄 Checking for UML files..."
    
    PUML_DIR="../ModularLandscape/PUML"
    if [ -d "$PUML_DIR" ]; then
        PUML_COUNT=$(find "$PUML_DIR" -name "*.puml" | wc -l)
        echo "✅ Found $PUML_COUNT UML files in $PUML_DIR"
    else
        echo "⚠️  UML directory not found: $PUML_DIR"
        echo "   The server will start but UML files won't be available"
    fi
}

# Function to start the server
start_server() {
    echo "🌐 Starting Flask server on port 7777..."
    echo "   Server URL: http://localhost:7777"
    echo "   Press Ctrl+C to stop the server"
    echo "========================================"
    # Prefer Homebrew Graphviz if available (session-only, does not modify your shell config)
    if [ -x "/opt/homebrew/bin/brew" ]; then
        eval "$('/opt/homebrew/bin/brew' shellenv)"
        export PATH="/opt/homebrew/bin:$PATH"
    elif [ -x "/usr/local/bin/brew" ]; then
        eval "$('/usr/local/bin/brew' shellenv)"
        export PATH="/usr/local/bin:$PATH"
    fi

    echo "🔧 Diagnostics:"
    echo "   brew path: $(command -v brew || echo 'not found')"
    echo "   dot  path: $(command -v dot || echo 'not found')"
    if command -v dot >/dev/null 2>&1; then
        dot -V 2>&1 | sed 's/^/   /'
    else
        echo "   Graphviz 'dot' not found in PATH"
    fi

    # Start the Python Flask server
    python3 app.py
}

# Main execution
main() {
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Execute startup sequence
    kill_port_7777
    check_python
    install_dependencies
    check_uml_files
    start_server
}

# Handle script interruption
trap 'echo -e "\n👋 Startup interrupted by user"; exit 130' INT

# Run main function
main "$@"
