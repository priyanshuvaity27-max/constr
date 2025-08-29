from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/real_estate_crm"
    
    # Security
    JWT_SECRET: str
    JWT_ISSUER: str = "real-estate-crm"
    JWT_AUDIENCE: str = "real-estate-crm"
    JWT_EXPIRES_MIN: int = 480  # 8 hours
    
    # AWS S3 (Optional - for file storage)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # Supabase Storage (Alternative to S3)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "documents"
    
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