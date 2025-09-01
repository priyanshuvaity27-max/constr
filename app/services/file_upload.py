import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import uuid
import os

class FileUploadService:
    def __init__(self):
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.use_s3 = True
        elif settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.R2_ENDPOINT,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                region_name='auto'
            )
            self.use_s3 = True
            self.bucket_name = settings.R2_BUCKET
        else:
            self.use_s3 = False
    
    async def upload_file(self, file: UploadFile, folder: str = "documents") -> Dict[str, str]:
        """Upload file to S3/R2 or local storage"""
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        if self.use_s3:
            return await self._upload_to_s3(file, folder, unique_filename)
        else:
            return await self._upload_to_local(file, folder, unique_filename)
    
    async def _upload_to_s3(self, file: UploadFile, folder: str, filename: str) -> Dict[str, str]:
        """Upload file to AWS S3 or Cloudflare R2"""
        try:
            key = f"{folder}/{filename}"
            bucket_name = getattr(self, 'bucket_name', settings.AWS_BUCKET_NAME)
            
            self.s3_client.upload_fileobj(
                file.file,
                bucket_name,
                key,
                ExtraArgs={'ContentType': file.content_type}
            )
            
            # Return the URL
            if settings.R2_ENDPOINT:
                public_url = f"{settings.R2_ENDPOINT}/{bucket_name}/{key}"
            else:
                public_url = f"https://{bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            
            return {
                "r2_key": key,
                "public_url": public_url,
                "filename": filename
            }
        
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    async def _upload_to_local(self, file: UploadFile, folder: str, filename: str) -> Dict[str, str]:
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
            
            return {
                "r2_key": file_path,
                "public_url": f"/uploads/{folder}/{filename}",
                "filename": filename
            }
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    def delete_file(self, r2_key: str) -> bool:
        """Delete file from S3/R2 or local storage"""
        if self.use_s3:
            return self._delete_from_s3(r2_key)
        else:
            return self._delete_from_local(r2_key)
    
    def _delete_from_s3(self, r2_key: str) -> bool:
        """Delete file from AWS S3 or Cloudflare R2"""
        try:
            bucket_name = getattr(self, 'bucket_name', settings.AWS_BUCKET_NAME)
            self.s3_client.delete_object(Bucket=bucket_name, Key=r2_key)
            return True
        except Exception:
            return False
    
    def _delete_from_local(self, file_path: str) -> bool:
        """Delete file from local storage"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False

# Global instance
file_upload_service = FileUploadService()