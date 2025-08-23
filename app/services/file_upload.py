import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import uuid
import os


class FileUploadService:
    def __init__(self):
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
            self.use_s3 = True
        else:
            self.use_s3 = False
    
    async def upload_file(self, file: UploadFile, folder: str = "documents") -> str:
        """Upload file to S3 or local storage"""
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        if self.use_s3:
            return await self._upload_to_s3(file, folder, unique_filename)
        else:
            return await self._upload_to_local(file, folder, unique_filename)
    
    async def _upload_to_s3(self, file: UploadFile, folder: str, filename: str) -> str:
        """Upload file to AWS S3"""
        try:
            key = f"{folder}/{filename}"
            self.s3_client.upload_fileobj(
                file.file,
                settings.aws_bucket_name,
                key,
                ExtraArgs={'ContentType': file.content_type}
            )
            
            # Return the S3 URL
            return f"https://{settings.aws_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"
        
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    async def _upload_to_local(self, file: UploadFile, folder: str, filename: str) -> str:
        """Upload file to local storage"""
        try:
            # Create upload directory if it doesn't exist
            upload_dir = f"uploads/{folder}"
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = f"{upload_dir}/{filename}"
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            return f"/uploads/{folder}/{filename}"
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    def delete_file(self, file_url: str) -> bool:
        """Delete file from S3 or local storage"""
        if self.use_s3 and file_url.startswith("https://"):
            return self._delete_from_s3(file_url)
        else:
            return self._delete_from_local(file_url)
    
    def _delete_from_s3(self, file_url: str) -> bool:
        """Delete file from AWS S3"""
        try:
            # Extract key from URL
            key = file_url.split(f"{settings.aws_bucket_name}.s3.{settings.aws_region}.amazonaws.com/")[1]
            self.s3_client.delete_object(Bucket=settings.aws_bucket_name, Key=key)
            return True
        except Exception:
            return False
    
    def _delete_from_local(self, file_path: str) -> bool:
        """Delete file from local storage"""
        try:
            if file_path.startswith("/uploads/"):
                full_path = file_path[1:]  # Remove leading slash
                if os.path.exists(full_path):
                    os.remove(full_path)
                    return True
            return False
        except Exception:
            return False


# Global instance
file_upload_service = FileUploadService()