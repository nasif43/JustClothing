import os
from PIL import Image
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from io import BytesIO


def optimize_image(image_field, max_width=1200, max_height=1200, quality=85):
    """
    Optimize an image by resizing and compressing it.
    
    Args:
        image_field: Django ImageField instance
        max_width: Maximum width in pixels
        max_height: Maximum height in pixels
        quality: JPEG quality (1-100)
    
    Returns:
        Optimized image content
    """
    if not image_field:
        return None
    
    try:
        # Open the image
        with Image.open(image_field) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Calculate new dimensions maintaining aspect ratio
            original_width, original_height = img.size
            
            # Only resize if image is larger than max dimensions
            if original_width > max_width or original_height > max_height:
                ratio = min(max_width / original_width, max_height / original_height)
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
                
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save optimized image to BytesIO
            output = BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            
            return ContentFile(output.read())
    
    except Exception as e:
        print(f"Error optimizing image: {e}")
        return None


def generate_thumbnail(image_field, size=(300, 300)):
    """
    Generate a thumbnail from an image.
    
    Args:
        image_field: Django ImageField instance
        size: Tuple of (width, height) for thumbnail
    
    Returns:
        Thumbnail image content
    """
    if not image_field:
        return None
    
    try:
        with Image.open(image_field) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Create thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save thumbnail to BytesIO
            output = BytesIO()
            img.save(output, format='JPEG', quality=90, optimize=True)
            output.seek(0)
            
            return ContentFile(output.read())
    
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return None


def get_image_dimensions(image_field):
    """
    Get dimensions of an image without loading it fully into memory.
    
    Args:
        image_field: Django ImageField instance
    
    Returns:
        Tuple of (width, height) or None if error
    """
    if not image_field:
        return None
    
    try:
        with Image.open(image_field) as img:
            return img.size
    except Exception as e:
        print(f"Error getting image dimensions: {e}")
        return None


def validate_image(image_field, max_size_mb=10, allowed_formats=None):
    """
    Validate an uploaded image.
    
    Args:
        image_field: Django ImageField instance
        max_size_mb: Maximum file size in MB
        allowed_formats: List of allowed formats (e.g., ['JPEG', 'PNG'])
    
    Returns:
        Dict with validation results
    """
    if not image_field:
        return {'valid': False, 'error': 'No image provided'}
    
    if allowed_formats is None:
        allowed_formats = ['JPEG', 'PNG', 'WebP']
    
    try:
        # Check file size
        file_size_mb = image_field.size / (1024 * 1024)
        if file_size_mb > max_size_mb:
            return {
                'valid': False, 
                'error': f'File size ({file_size_mb:.1f}MB) exceeds maximum allowed size ({max_size_mb}MB)'
            }
        
        # Check image format
        with Image.open(image_field) as img:
            if img.format not in allowed_formats:
                return {
                    'valid': False,
                    'error': f'Format {img.format} not allowed. Allowed formats: {", ".join(allowed_formats)}'
                }
            
            # Check dimensions (optional)
            width, height = img.size
            if width < 100 or height < 100:
                return {
                    'valid': False,
                    'error': 'Image dimensions too small. Minimum 100x100 pixels required.'
                }
            
            return {
                'valid': True,
                'format': img.format,
                'dimensions': (width, height),
                'size_mb': file_size_mb
            }
    
    except Exception as e:
        return {'valid': False, 'error': f'Invalid image file: {str(e)}'}


def delete_s3_file(file_url):
    """
    Delete a file from S3 given its URL.
    
    Args:
        file_url: URL of the file to delete
    
    Returns:
        Boolean indicating success
    """
    try:
        if not file_url:
            return False
        
        # Extract the file path from URL for S3
        if 's3.amazonaws.com' in file_url:
            # Extract path after domain
            parts = file_url.split('s3.amazonaws.com/')
            if len(parts) > 1:
                file_path = parts[1]
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
                    return True
        
        return False
    
    except Exception as e:
        print(f"Error deleting S3 file: {e}")
        return False 