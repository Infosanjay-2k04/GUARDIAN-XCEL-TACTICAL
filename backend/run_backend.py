import uvicorn
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("================================================================")
    print("       GUARDIAN XCEL // AUTONOMOUS RESCUE SYSTEM BACKEND       ")
    print("   Central WebSocket Hub & Hardware Simulation Engine Started   ")
    print("================================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
