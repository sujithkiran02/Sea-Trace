import uvicorn
import os
import sys

# Ensure backend and backend/app are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(backend_dir, "app")
sys.path.insert(0, backend_dir)
sys.path.insert(0, app_dir)

if __name__ == "__main__":
    print("Starting SeaTrace AI FastAPI Backend on http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
