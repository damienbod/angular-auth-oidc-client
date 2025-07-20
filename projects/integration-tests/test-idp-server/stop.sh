#!/bin/bash

# Test IDP Server Stop Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$SCRIPT_DIR/tmp"
PID_FILE="$TMP_DIR/test-idp-server.pid"
PORT_FILE="$TMP_DIR/test-idp-server.port"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "Test IDP Server is not running (no PID file found)"
    exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "Test IDP Server is not running (process $PID not found)"
    rm -f "$PID_FILE"
    rm -f "$PORT_FILE"
    exit 0
fi

# Get port for display
PORT=$(cat "$PORT_FILE" 2>/dev/null || echo "unknown")

echo "Stopping Test IDP Server on port $PORT (PID: $PID)..."

# Send SIGTERM to gracefully stop the server
kill -TERM "$PID"

# Wait for process to stop (max 10 seconds)
WAIT_TIME=0
while ps -p "$PID" > /dev/null 2>&1 && [ $WAIT_TIME -lt 10 ]; do
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
done

# Force kill if still running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "Server didn't stop gracefully, forcing shutdown..."
    kill -9 "$PID"
fi

# Clean up files
rm -f "$PID_FILE"
rm -f "$PORT_FILE"

echo "Test IDP Server stopped"