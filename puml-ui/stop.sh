#!/bin/bash

# BIAN UML Visualizer Server Stop Script
# Kills any processes running on port 7777

echo "🛑 BIAN UML Visualizer - Server Stop"
echo "====================================="

# Function to kill processes on port 7777
kill_server() {
    echo "🔍 Looking for processes on port 7777..."
    
    # Find processes using port 7777
    PIDS=$(lsof -ti:7777 2>/dev/null)
    
    if [ -n "$PIDS" ]; then
        echo "🔪 Stopping server processes: $PIDS"
        
        # First try graceful termination
        echo "$PIDS" | xargs kill -TERM 2>/dev/null
        sleep 3
        
        # Check if processes are still running
        REMAINING=$(lsof -ti:7777 2>/dev/null)
        if [ -n "$REMAINING" ]; then
            echo "💀 Force killing remaining processes: $REMAINING"
            echo "$REMAINING" | xargs kill -9 2>/dev/null
            sleep 1
        fi
        
        # Final check
        FINAL_CHECK=$(lsof -ti:7777 2>/dev/null)
        if [ -n "$FINAL_CHECK" ]; then
            echo "❌ Failed to stop some processes: $FINAL_CHECK"
            echo "   You may need to kill them manually: kill -9 $FINAL_CHECK"
            exit 1
        else
            echo "✅ Server stopped successfully"
        fi
    else
        echo "ℹ️  No server processes found on port 7777"
    fi
}

# Main execution
main() {
    kill_server
    echo "👋 Server shutdown complete"
}

# Handle script interruption
trap 'echo -e "\n👋 Stop script interrupted"; exit 130' INT

# Run main function
main "$@"
