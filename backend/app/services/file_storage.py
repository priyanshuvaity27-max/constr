import boto3
from botocore.exceptions import ClientError
from typing import Tuple, Optional
from app.config import settings
from app.utils.errors import AppException
import os
import uuid

async def upload_file(
    file_content: bytes,
    filename: str,
    content_type: str,
    entity: str,
    entity_id: str
) -> Tuple[str, Optional[str]]:
    """Upload file to S3 or local storage"""
    
    # Generate unique filename
    file_extension = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"{entity}/{entity_id}/{unique_filename}"
    
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return await _upload_to_s3(file_content, file_path, content_type)
    else:
        return await _upload_to_local(file_content, file_path, content_type)

async def _upload_to_s3(file_content: bytes, file_path: str, content_type: str) -> Tuple[str, str]:
    """Upload file to AWS S3"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        s3_client.put_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=file_path,
            Body=file_content,
            ContentType=content_type
        )
        
        # Return S3 path and public URL
        public_url = f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_path}"
        return file_path, public_url
        
    except ClientError as e:
        raise AppException(
            code="UPLOAD_FAILED",
            message=f"Failed to upload file: {str(e)}",
            status_code=500
        )

async def _upload_to_local(file_content: bytes, file_path: str, content_type: str) -> Tuple[str, str]:
    """Upload file to local storage"""
    try:
        # Create upload directory if it doesn't exist
        full_path = f"uploads/{file_path}"
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Save file
        with open(full_path, "wb") as f:
            f.write(file_content)
        
        # Return local path and URL
        public_url = f"/uploads/{file_path}"
        return file_path, public_url
        
    except Exception as e:
        raise AppException(
            code="UPLOAD_FAILED",
            message=f"Failed to upload file: {str(e)}",
            status_code=500
        )

async def delete_file(file_path: str) -> bool:
    """Delete file from S3 or local storage"""
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return await _delete_from_s3(file_path)
    else:
        return await _delete_from_local(file_path)

async def _delete_from_s3(file_path: str) -> bool:
    """Delete file from AWS S3"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        s3_client.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=file_path)
        return True
    except Exception:
        return False

async def _delete_from_local(file_path: str) -> bool:
    """Delete file from local storage"""
    try:
        full_path = f"uploads/{file_path}"
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
    except Exception:
        return False