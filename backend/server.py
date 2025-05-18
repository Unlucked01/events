import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get server host and port from environment variables or use defaults
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True) 