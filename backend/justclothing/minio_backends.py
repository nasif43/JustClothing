from minio import Minio
from minio.error import S3Error
from django.core.files.storage import Storage
from django.conf import settings
from django.core.files.base import ContentFile
from urllib.parse import urljoin
import io
import os
from datetime import timedelta


class MinIOStorage(Storage):
    """MinIO storage backend for Django"""
    
    def __init__(self, bucket_name=None):
        self.bucket_name = bucket_name or settings.MINIO_STORAGE_BUCKET_NAME
        self.client = Minio(
            settings.MINIO_STORAGE_ENDPOINT,
            access_key=settings.MINIO_STORAGE_ACCESS_KEY,
            secret_key=settings.MINIO_STORAGE_SECRET_KEY,
            secure=settings.MINIO_STORAGE_USE_HTTPS
        )
        
        # Create bucket if it doesn't exist
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error:
            pass
    
    def _save(self, name, content):
        """Save file to MinIO"""
        try:
            # Ensure content is bytes
            if hasattr(content, 'read'):
                content_bytes = content.read()
            else:
                content_bytes = content
            
            print(f"[MinIO DEBUG] Attempting to save file: {name}")
            print(f"[MinIO DEBUG] Bucket: {self.bucket_name}")
            print(f"[MinIO DEBUG] Content size: {len(content_bytes)} bytes")
            print(f"[MinIO DEBUG] Endpoint: {settings.MINIO_STORAGE_ENDPOINT}")
            print(f"[MinIO DEBUG] Use HTTPS: {settings.MINIO_STORAGE_USE_HTTPS}")
            
            # Upload to MinIO
            self.client.put_object(
                self.bucket_name,
                name,
                io.BytesIO(content_bytes),
                length=len(content_bytes)
            )
            
            print(f"[MinIO DEBUG] Successfully uploaded: {name}")
            return name
        except S3Error as e:
            print(f"[MinIO ERROR] Failed to upload {name}: {e}")
            raise IOError(f"Error saving file to MinIO: {e}")
        except Exception as e:
            print(f"[MinIO ERROR] Unexpected error uploading {name}: {e}")
            raise
    
    def _open(self, name, mode='rb'):
        """Open file from MinIO"""
        try:
            response = self.client.get_object(self.bucket_name, name)
            return ContentFile(response.read())
        except S3Error as e:
            raise IOError(f"Error opening file from MinIO: {e}")
    
    def delete(self, name):
        """Delete file from MinIO"""
        try:
            self.client.remove_object(self.bucket_name, name)
        except S3Error:
            pass
    
    def exists(self, name):
        """Check if file exists in MinIO"""
        try:
            self.client.stat_object(self.bucket_name, name)
            return True
        except S3Error:
            return False
    
    def url(self, name):
        """Get URL for file"""
        try:
            # Generate presigned URL valid for 1 hour
            return self.client.presigned_get_object(
                self.bucket_name, 
                name, 
                expires=timedelta(hours=1)
            )
        except S3Error:
            return urljoin(settings.MINIO_STORAGE_MEDIA_URL, name)
    
    def size(self, name):
        """Get file size"""
        try:
            stat = self.client.stat_object(self.bucket_name, name)
            return stat.size
        except S3Error:
            return 0


class MinIOMediaStorage(MinIOStorage):
    """MinIO storage for media files"""
    
    def __init__(self):
        super().__init__(settings.MINIO_STORAGE_MEDIA_BUCKET_NAME)


class MinIOStaticStorage(MinIOStorage):
    """MinIO storage for static files"""
    
    def __init__(self):
        super().__init__(settings.MINIO_STORAGE_STATIC_BUCKET_NAME)
