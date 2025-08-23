import boto3
from botocore.exceptions import ClientError
from typing import Optional, BinaryIO
from app.config import settings
from app.utils.errors import AppException

class R2Client:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto"
        )
        self.bucket = settings.R2_BUCKET
    
    async def upload_file(
        self, 
        key: str, 
        file_data: BinaryIO, 
        content_type: str,
        metadata: Optional[dict] = None
    ) -> str:
        try:
            extra_args = {"ContentType": content_type}
            if metadata:
                extra_args["Metadata"] = metadata
            
            self.client.upload_fileobj(
                file_data,
                self.bucket,
                key,
                ExtraArgs=extra_args
            )
            
            # Return public URL
            return f"{settings.R2_ENDPOINT.replace('https://', 'https://pub-')}/{self.bucket}/{key}"
            
        except ClientError as e:
            raise AppException(
                code="UPLOAD_FAILED",
                message=f"Failed to upload file: {str(e)}",
                status_code=500
            )
    
    async def delete_file(self, key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False
    
    async def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in
            )
        except ClientError as e:
            raise AppException(
                code="PRESIGN_FAILED",
                message=f"Failed to generate presigned URL: {str(e)}",
                status_code=500
            )

# Global instance
r2_client = R2Client()