import os
import logging
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models.refill import RefillRequest
from routes.refills import router as refills_router
from routes.patients import router as patients_router
from routes.pharmacy import router as pharmacy_router
from seed import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("refill_resolve")

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Refill Resolve API",
    description="Orchestration platform for prescription refill workflows. From stuck refill to resolved refill.",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(refills_router)
app.include_router(patients_router)
app.include_router(pharmacy_router)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing Refill Resolve backend service...")
    db = SessionLocal()
    try:
        count = db.query(RefillRequest).count()
        if count == 0:
            logger.info("No existing records found. Auto-seeding database with initial demo records...")
            seed_database()
        else:
            logger.info(f"Database ready with {count} active refill records.")
    finally:
        db.close()

@app.get("/health")
def health_check():
    api_key_configured = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {
        "status": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "ai_triage": "operational (Claude API)" if api_key_configured else "operational (Deterministic Fallback Mode)",
            "workflow_engine": "operational",
            "pharmacy_gateway": "operational (Mock SCRIPT Gateway)",
            "database": "operational (SQLite)"
        },
        "mode": "DEMO_MODE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
