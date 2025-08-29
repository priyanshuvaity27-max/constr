from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/real_estate_crm"
    
    # Security
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours
    
    # Hardcoded users (no self-registration)
    allowed_usernames: List[str] = ["boss", "emp1", "emp2", "emp3", "emp4", "emp5"]
    
    # AWS S3 Storage (Optional)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_bucket_name: Optional[str] = None
    aws_region: str = "us-east-1"
    
    # Supabase Storage (Alternative to S3)
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_bucket: str = "documents"
    
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