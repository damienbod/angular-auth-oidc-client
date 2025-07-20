#!/bin/bash

# Test IDP Server Start Script
# Based on wiremock's approach but adapted for Node.js

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$SCRIPT_DIR/tmp"
PID_FILE="$TMP_DIR/test-idp-server.pid"
PORT_FILE="$TMP_DIR/test-idp-server.port"
LOG_FILE="$TMP_DIR/test-idp-server.log"
DEFAULT_PORT=8081

# Create tmp directory if it doesn't exist
mkdir -p "$TMP_DIR"

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        PORT=$(cat "$PORT_FILE" 2>/dev/null || echo "$DEFAULT_PORT")
        echo "Test IDP Server is already running on port $PORT (PID: $PID)"
        exit 0
    else
        echo "Removing stale PID file..."
        rm -f "$PID_FILE"
        rm -f "$PORT_FILE"
    fi
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Change to script directory
cd "$SCRIPT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Find available port
PORT=$DEFAULT_PORT
while lsof -i :$PORT >/dev/null 2>&1; do
    echo "Port $PORT is in use, trying next port..."
    PORT=$((PORT + 1))
done

echo "Starting Test IDP Server on port $PORT..."

# Start the server in background
PORT=$PORT nohup npm run start > "$LOG_FILE" 2>&1 &
PID=$!
disown $PID

# Store PID and port
echo $PID > "$PID_FILE"
echo $PORT > "$PORT_FILE"

# Wait for server to start
echo "Waiting for server to start..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s "http://localhost:$PORT/.well-known/openid-configuration" > /dev/null 2>&1; then
        echo "Test IDP Server started successfully on port $PORT (PID: $PID)"
        echo "Log file: $LOG_FILE"
        exit 0
    fi

    # Check if process is still running
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "Server failed to start. Check the log file: $LOG_FILE"
        tail -20 "$LOG_FILE"
        rm -f "$PID_FILE"
        rm -f "$PORT_FILE"
        exit 1
    fi

    sleep 1
    ATTEMPT=$((ATTEMPT + 1))
done

echo "Server failed to start within 30 seconds. Check the log file: $LOG_FILE"
tail -20 "$LOG_FILE"
exit 1
