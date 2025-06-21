from django.core.management.base import BaseCommand
from apps.users.models import SellerProfile
from apps.products.models import Product
from apps.reviews.models import update_seller_rating, update_product_rating


class Command(BaseCommand):
    help = 'Recalculate ratings for all sellers and products based on their reviews'

    def add_arguments(self, parser):
        parser.add_argument(
            '--seller-id',
            type=int,
            help='Update rating for a specific seller by ID',
        )
        parser.add_argument(
            '--product-id',
            type=int,
            help='Update rating for a specific product by ID',
        )
        parser.add_argument(
            '--products-only',
            action='store_true',
            help='Update only product ratings, not seller ratings',
        )

    def handle(self, *args, **options):
        seller_id = options.get('seller_id')
        product_id = options.get('product_id')
        products_only = options.get('products_only')
        
        if product_id:
            # Update specific product
            try:
                product = Product.objects.get(id=product_id)
                rating, total_reviews = update_product_rating(product)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated product "{product.name}": '
                        f'Rating: {rating}, Total Reviews: {total_reviews}'
                    )
                )
            except Product.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Product with ID {product_id} not found')
                )
        elif seller_id:
            # Update specific seller
            try:
                seller = SellerProfile.objects.get(id=seller_id)
                rating, total_reviews = update_seller_rating(seller)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated seller "{seller.business_name}": '
                        f'Rating: {rating}, Total Reviews: {total_reviews}'
                    )
                )
            except SellerProfile.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Seller with ID {seller_id} not found')
                )
        else:
            # Update all products
            products = Product.objects.all()
            product_count = 0
            
            for product in products:
                rating, total_reviews = update_product_rating(product)
                product_count += 1
                self.stdout.write(
                    f'Updated product {product.name}: '
                    f'Rating: {rating}, Reviews: {total_reviews}'
                )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated ratings for {product_count} products'
                )
            )
            
            if not products_only:
                # Update all sellers
                sellers = SellerProfile.objects.all()
                seller_count = 0
                
                for seller in sellers:
                    rating, total_reviews = update_seller_rating(seller)
                    seller_count += 1
                    self.stdout.write(
                        f'Updated seller {seller.business_name}: '
                        f'Rating: {rating}, Reviews: {total_reviews}'
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully updated ratings for {seller_count} sellers'
                    )
                ) 