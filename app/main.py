from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import uuid
import os
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import engine
from app.models import Base
from app.utils.logging import setup_logging, logger
from app.utils.errors import AppException

# Setup logging
setup_logging()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Real Estate CRM API",
    description="Production-ready CRM with RBAC and approval workflow",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Security middleware
if not settings.DEBUG:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static files for local file uploads (fallback if not using S3/Supabase)
if not settings.aws_access_key_id and not settings.supabase_url:
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "status_code": response.status_code,
            "process_time": process_time,
        }
    )
    
    return response

# Exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "ok": True,
        "message": "Real Estate CRM API",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None
    }

@app.get("/health")
async def health():
    return {"ok": True, "status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_config=None  # Use our custom logging
    )