import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files import File
from apps.products.models import ProductImage
from apps.users.models import CustomerProfile, SellerProfile
from justclothing.minio_backends import MinIOMediaStorage


class Command(BaseCommand):
    help = 'Migrate existing images from local storage to MinIO'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        storage = MinIOMediaStorage()
        
        if dry_run:
            self.stdout.write("DRY RUN - No files will be actually migrated")
        
        # Migrate product images
        self.stdout.write("Migrating product images...")
        product_images = ProductImage.objects.all()
        
        for img in product_images:
            if img.image and hasattr(img.image, 'path'):
                try:
                    local_path = img.image.path
                    if os.path.exists(local_path):
                        relative_path = os.path.relpath(local_path, settings.MEDIA_ROOT)
                        
                        if not dry_run:
                            with open(local_path, 'rb') as f:
                                storage._save(relative_path, f.read())
                        
                        self.stdout.write(f"Migrated: {relative_path}")
                    else:
                        self.stdout.write(f"File not found: {local_path}")
                except Exception as e:
                    self.stdout.write(f"Error migrating {img.image.name}: {e}")
        
        # Migrate user profile images
        self.stdout.write("Migrating customer profile images...")
        customer_profiles = CustomerProfile.objects.exclude(profile_image='')
        
        for profile in customer_profiles:
            if profile.profile_image and hasattr(profile.profile_image, 'path'):
                try:
                    local_path = profile.profile_image.path
                    if os.path.exists(local_path):
                        relative_path = os.path.relpath(local_path, settings.MEDIA_ROOT)
                        
                        if not dry_run:
                            with open(local_path, 'rb') as f:
                                storage._save(relative_path, f.read())
                        
                        self.stdout.write(f"Migrated: {relative_path}")
                except Exception as e:
                    self.stdout.write(f"Error migrating {profile.profile_image.name}: {e}")
        
        # Migrate seller profile images
        self.stdout.write("Migrating seller profile images...")
        seller_profiles = SellerProfile.objects.exclude(profile_image='')
        
        for profile in seller_profiles:
            if profile.profile_image and hasattr(profile.profile_image, 'path'):
                try:
                    local_path = profile.profile_image.path
                    if os.path.exists(local_path):
                        relative_path = os.path.relpath(local_path, settings.MEDIA_ROOT)
                        
                        if not dry_run:
                            with open(local_path, 'rb') as f:
                                storage._save(relative_path, f.read())
                        
                        self.stdout.write(f"Migrated: {relative_path}")
                except Exception as e:
                    self.stdout.write(f"Error migrating {profile.profile_image.name}: {e}")
        
        if dry_run:
            self.stdout.write("DRY RUN completed - no files were actually migrated")
        else:
            self.stdout.write("Migration to MinIO completed!")
