from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings


class StaticStorage(S3Boto3Storage):
    """Custom S3 storage for static files"""
    location = 'static'
    default_acl = 'public-read'


class MediaStorage(S3Boto3Storage):
    """Custom S3 storage for media files"""
    location = 'media'
    default_acl = 'public-read'
    file_overwrite = False
    
    def __init__(self, *args, **kwargs):
        kwargs['bucket_name'] = settings.AWS_STORAGE_BUCKET_NAME
        super().__init__(*args, **kwargs)


class PrivateMediaStorage(S3Boto3Storage):
    """Custom S3 storage for private files (documents, etc.)"""
    location = 'private'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False 