#!/bin/bash

# Test IDP Server Restart Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Restarting Test IDP Server..."

# Stop the server if running
"$SCRIPT_DIR/stop.sh"

# Wait a moment for cleanup
sleep 2

# Start the server
"$SCRIPT_DIR/start.sh"