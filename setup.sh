#!/bin/bash
set -e

echo "=== Helicity Dev Setup ==="
echo ""

# --- Check prerequisites ---
echo "Checking prerequisites..."

# Find a compatible Python (3.11–3.13, not 3.14+ which breaks pydantic-core)
PYTHON_CMD=""
for cmd in python3.13 python3.12 python3.11; do
    if command -v "$cmd" &> /dev/null; then
        PYTHON_CMD="$cmd"
        break
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    # Fallback to python3 if it's a compatible version
    if command -v python3 &> /dev/null; then
        PY_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
        if [ "$PY_MINOR" -ge 11 ] && [ "$PY_MINOR" -le 13 ]; then
            PYTHON_CMD="python3"
        fi
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: Python 3.11–3.13 required (3.14 not yet supported by pydantic)."
    echo "  Install via: brew install python@3.12"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "  Python: $PYTHON_VERSION ($PYTHON_CMD)"

if ! command -v node &> /dev/null; then
    echo "ERROR: node not found. Install Node 18+"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "  Node: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found."
    exit 1
fi

echo "  npm: $(npm --version)"

if ! command -v bl &> /dev/null; then
    echo "WARNING: Blaxel CLI (bl) not found. Required for MCP Server deployment."
    echo "  Install via: brew tap blaxel-ai/blaxel && brew install blaxel"
else
    echo "  Blaxel CLI: installed"
fi
echo ""

# --- Backend setup ---
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    echo "  Created virtual environment (Python $PYTHON_VERSION)"
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "  Installed Python dependencies"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "" >> .env
    echo "# Hackathon Mock Keys & MCP Server" >> .env
    echo "HELICITY_API_KEY=sk-heli-live-mock-hackathon-key" >> .env
    echo "BL_WORKSPACE=" >> .env
    echo "BL_API_KEY=" >> .env
    echo "  Created .env from .env.example with mock API keys!"
else
    echo "  .env already exists"
fi

cd ..

# --- Frontend setup ---
echo ""
echo "Setting up frontend..."
cd frontend
npm install --silent
echo "  Installed Node dependencies"
cd ..

# --- Verify ---
echo ""
echo "=== Verification ==="
echo ""

echo "Starting backend health check..."
cd backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 &> /dev/null &
BACKEND_PID=$!
sleep 3

if curl -s http://127.0.0.1:8000/health | grep -q "ok"; then
    echo "  Backend: OK"
else
    echo "  Backend: FAILED (check errors above)"
fi

kill $BACKEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true
cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To run the backend:"
echo "  cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo ""
echo "To run the frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "IMPORTANT: Edit backend/.env with your API keys before starting."
