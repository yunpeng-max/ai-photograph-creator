#!/bin/bash
# AI Photograph Creator - One-click start script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Get local IP for other devices to access
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

echo "=============================="
echo " AI Photograph Creator"
echo "=============================="

# Kill any existing processes on our ports
echo ""
echo "Cleaning up old processes..."
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null

# Start backend
echo ""
echo "Starting backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on http://localhost:5173 ..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=============================="
echo " 本机访问:"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
if [ -n "$LOCAL_IP" ]; then
echo " 局域网访问:"
echo "  http://$LOCAL_IP:5173"
fi
echo "=============================="
echo ""
echo "Press Ctrl+C to stop all services."

# Trap Ctrl+C to stop both
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for either process to exit
wait
