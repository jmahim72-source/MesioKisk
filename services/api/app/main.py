from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from services.api.app.core.config import settings
from services.api.app.seed.seed_data import init_db
from services.api.app.api.v1.auth import router as auth_router
from services.api.app.api.v1.patients import router as patients_router
from services.api.app.api.v1.consents import router as consents_router
from services.api.app.api.v1.encounters import router as encounters_router
from services.api.app.api.v1.interviews import router as interviews_router
from services.api.app.api.v1.documents import router as documents_router
from services.api.app.api.v1.summaries import router as summaries_router
from services.api.app.api.v1.red_flags import router as red_flags_router
from services.api.app.api.v1.export import router as export_router
from services.api.app.api.v1.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize and seed database
    try:
        init_db()
    except Exception as e:
        print(f"Database initialization warning: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(patients_router, prefix=api_prefix)
app.include_router(consents_router, prefix=api_prefix)
app.include_router(encounters_router, prefix=api_prefix)
app.include_router(interviews_router, prefix=api_prefix)
app.include_router(documents_router, prefix=api_prefix)
app.include_router(summaries_router, prefix=api_prefix)
app.include_router(red_flags_router, prefix=api_prefix)
app.include_router(export_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "service": "MediKiosk Clinical Intake API",
        "version": "1.0.0",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "status": "HEALTHY"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "medikiosk-api"}
