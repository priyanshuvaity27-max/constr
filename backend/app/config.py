from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Security
    JWT_SECRET: str
    JWT_ISSUER: str = "real-estate-crm"
    JWT_AUDIENCE: str = "real-estate-crm"
    JWT_EXPIRES_MIN: int = 480  # 8 hours
    
    # Allowed users (hardcoded)
    ALLOWED_USERNAMES: List[str] = ["boss", "emp1", "emp2", "emp3", "emp4", "emp5"]
    
    # Cloudflare Worker (DB Proxy)
    WORKER_BASE: str
    WORKER_HMAC_SECRET: str
    
    # Cloudflare R2 Storage
    R2_ENDPOINT: str
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET: str = "real-estate-documents"
    
    # CORS & Security
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Rate limiting
    RATE_LIMIT_LOGIN: int = 5  # per minute per IP
    RATE_LIMIT_MUTATION: int = 30  # per minute per user
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()