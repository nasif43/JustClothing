import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files import File
from apps.products.models import ProductImage
from apps.users.models import CustomerProfile, SellerProfile


class Command(BaseCommand):
    help = 'Migrate existing images from local storage to S3'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it',
        )

    def handle(self, *args, **options):
        if not settings.USE_S3:
            self.stdout.write(
                self.style.ERROR('S3 is not enabled. Set USE_S3=True in your environment.')
            )
            return

        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No files will be migrated'))

        # Migrate Product Images
        self.stdout.write('Migrating Product Images...')
        product_images = ProductImage.objects.all()
        
        for img in product_images:
            if img.image and hasattr(img.image, 'path'):
                local_path = img.image.path
                if os.path.exists(local_path):
                    if not dry_run:
                        # Save to S3
                        with open(local_path, 'rb') as f:
                            img.image.save(
                                os.path.basename(local_path),
                                File(f),
                                save=True
                            )
                    self.stdout.write(f'  Migrated: {local_path}')
                else:
                    self.stdout.write(f'  File not found: {local_path}')

        # Migrate Customer Profile Pictures
        self.stdout.write('Migrating Customer Profile Pictures...')
        customer_profiles = CustomerProfile.objects.filter(profile_picture__isnull=False)
        
        for profile in customer_profiles:
            if profile.profile_picture and hasattr(profile.profile_picture, 'path'):
                local_path = profile.profile_picture.path
                if os.path.exists(local_path):
                    if not dry_run:
                        with open(local_path, 'rb') as f:
                            profile.profile_picture.save(
                                os.path.basename(local_path),
                                File(f),
                                save=True
                            )
                    self.stdout.write(f'  Migrated: {local_path}')

        # Migrate Seller Logos and Banners
        self.stdout.write('Migrating Seller Images...')
        seller_profiles = SellerProfile.objects.all()
        
        for seller in seller_profiles:
            # Migrate logo
            if seller.logo and hasattr(seller.logo, 'path'):
                local_path = seller.logo.path
                if os.path.exists(local_path):
                    if not dry_run:
                        with open(local_path, 'rb') as f:
                            seller.logo.save(
                                os.path.basename(local_path),
                                File(f),
                                save=False
                            )
                    self.stdout.write(f'  Migrated logo: {local_path}')
            
            # Migrate banner
            if seller.banner_image and hasattr(seller.banner_image, 'path'):
                local_path = seller.banner_image.path
                if os.path.exists(local_path):
                    if not dry_run:
                        with open(local_path, 'rb') as f:
                            seller.banner_image.save(
                                os.path.basename(local_path),
                                File(f),
                                save=False
                            )
                    self.stdout.write(f'  Migrated banner: {local_path}')
            
            if not dry_run and (seller.logo or seller.banner_image):
                seller.save()

        if dry_run:
            self.stdout.write(self.style.SUCCESS('DRY RUN COMPLETE - No files were actually migrated'))
        else:
            self.stdout.write(self.style.SUCCESS('Image migration to S3 completed successfully!')) 