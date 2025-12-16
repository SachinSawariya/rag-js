#!/bin/bash

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 1. Check dependencies
if ! command_exists ollama; then
    echo "Error: Ollama is not installed."
    exit 1
fi

if ! command_exists docker; then
    echo "Error: Docker is not installed."
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed."
    exit 1
fi

# 2. Check Ollama is running
echo "Checking Ollama..."
if ! pgrep -x "ollama" >/dev/null && ! pgrep -f "ollama serve" >/dev/null; then
    # Fallback to checking via API if pgrep fails or remote
    if ! curl -s localhost:11434/api/tags >/dev/null; then
        echo "Error: Ollama is not running. Please start Ollama."
        exit 1
    fi
fi
echo "✅ Ollama is running."

# 3. Check/Start ChromaDB
echo "Checking ChromaDB..."
if docker ps | grep -q "chromadb"; then
    echo "✅ ChromaDB is already running."
elif docker ps -a | grep -q "chromadb"; then
    echo "🔄 Starting existing ChromaDB container..."
    docker start chromadb
    echo "✅ ChromaDB started."
else
    echo "🚀 Starting new ChromaDB container..."
    docker run -d -p 8000:8000 --name chromadb chromadb/chroma
    echo "✅ ChromaDB container created and started."
fi

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# 4. Start Backend Server
echo "🚀 Starting Backend Server..."
npm start &
BACKEND_PID=$!

# Wait for backend to potentially be ready (optional, but good for logs)
sleep 2

# 5. Start Frontend Server
echo "🚀 Starting Frontend Server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# 6. Wait for Frontend to be ready and Open Browser
echo "⏳ Waiting for Frontend to be ready on port 4200..."
max_retries=60
count=0
while ! nc -z localhost 4200; do   
  sleep 1
  count=$((count+1))
  if [ $count -ge $max_retries ]; then
      echo "Error: Frontend failed to start within 60 seconds."
      cleanup
  fi
done

echo "✅ Frontend is ready!"
echo "🌐 Opening Google Chrome..."
open -a "Google Chrome" http://localhost:4200 || open http://localhost:4200

# Keep the script running
wait
