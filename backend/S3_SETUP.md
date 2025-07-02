# AWS S3 Setup Guide for JustClothing

This guide will help you configure AWS S3 for image storage in your JustClothing application.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Django application set up

## Step 1: Create S3 Bucket

### Using AWS Console

1. **Log into AWS Console** and navigate to S3
2. **Create a new bucket**:
   - Bucket name: `justclothing-media` (choose a unique name)
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - Keep default settings for versioning and encryption

3. **Configure bucket permissions**:
   - Go to the "Permissions" tab
   - **Block Public Access**: Uncheck "Block all public access" (we need public read for images)
   - Confirm the warning

4. **Add Bucket Policy** (for public read access to media files):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/media/*"
       }
     ]
   }
   ```
   Replace `your-bucket-name` with your actual bucket name.

5. **Configure CORS** (for frontend access):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Using AWS CLI

```bash
# Create bucket
aws s3 mb s3://justclothing-media --region us-east-1

# Set bucket policy (save policy to file first)
aws s3api put-bucket-policy --bucket justclothing-media --policy file://bucket-policy.json

# Set CORS configuration
aws s3api put-bucket-cors --bucket justclothing-media --cors-configuration file://cors-config.json
```

## Step 2: Create IAM User

1. **Navigate to IAM** in AWS Console
2. **Create new user**:
   - Username: `justclothing-s3-user`
   - Access type: Programmatic access

3. **Attach policies**:
   - Create custom policy or use `AmazonS3FullAccess` (not recommended for production)
   
   **Custom Policy (Recommended)**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

4. **Save credentials**: Download the CSV with Access Key ID and Secret Access Key

## Step 3: Configure Environment Variables

Update your `.env` file:

```env
# AWS S3 Configuration
USE_S3=True
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1
```

## Step 4: Install Dependencies

The required packages should already be installed, but verify:

```bash
pip install django-storages boto3
```

## Step 5: Test the Configuration

1. **Check settings**:
   ```bash
   python manage.py shell
   ```
   ```python
   from django.conf import settings
   print("USE_S3:", settings.USE_S3)
   print("Bucket:", settings.AWS_STORAGE_BUCKET_NAME)
   ```

2. **Test file upload**:
   - Upload a product image through Django admin
   - Check if it appears in your S3 bucket

## Step 6: Migrate Existing Images (Optional)

If you have existing local images, migrate them to S3:

```bash
# Dry run first to see what will be migrated
python manage.py migrate_images_to_s3 --dry-run

# Actually migrate the files
python manage.py migrate_images_to_s3
```

## File Organization in S3

Your S3 bucket will be organized as follows:

```
your-bucket-name/
├── static/           # Static files (CSS, JS)
├── media/
│   ├── products/
│   │   ├── images/   # Product images
│   │   └── videos/   # Product videos
│   ├── profiles/
│   │   └── customers/  # Customer profile pictures
│   └── sellers/
│       ├── logos/    # Seller logos
│       ├── banners/  # Seller banner images
│       └── documents/ # Private verification documents
└── private/          # Private files (documents, etc.)
```

## Security Best Practices

1. **Separate environments**: Use different buckets for development, staging, and production
2. **IAM policies**: Use minimal required permissions
3. **Private files**: Sensitive documents are stored in the `private/` folder with restricted access
4. **HTTPS only**: All S3 URLs use HTTPS
5. **No query string auth**: Disabled for public media files

## Monitoring and Costs

- **CloudWatch**: Monitor S3 requests and storage usage
- **Cost alerts**: Set up billing alerts for S3 usage
- **Lifecycle policies**: Consider adding rules to delete old files or move to cheaper storage classes

## Troubleshooting

### Common Issues

1. **Access Denied Errors**:
   - Check IAM permissions
   - Verify bucket policy
   - Ensure credentials are correct

2. **CORS Errors**:
   - Verify CORS configuration in S3
   - Check frontend domain is allowed

3. **Files not uploading**:
   - Check Django settings
   - Verify `USE_S3=True` in environment
   - Check AWS credentials

### Debug Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# List bucket contents
aws s3 ls s3://your-bucket-name --recursive

# Check Django storage backend
python manage.py shell -c "from django.core.files.storage import default_storage; print(type(default_storage))"
```

## Environment-Specific Configuration

### Development
```env
USE_S3=False  # Use local storage for development
```

### Production
```env
USE_S3=True
AWS_ACCESS_KEY_ID=prod-access-key
AWS_SECRET_ACCESS_KEY=prod-secret-key
AWS_STORAGE_BUCKET_NAME=justclothing-prod-media
```

## Performance Tips

1. **CDN**: Consider using CloudFront for faster image delivery
2. **Image optimization**: Images are automatically optimized before upload
3. **Thumbnails**: Generate thumbnails for faster loading
4. **Caching**: Enable browser caching with appropriate headers

This setup provides a robust, scalable solution for handling media files in your JustClothing application. 