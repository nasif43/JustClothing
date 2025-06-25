from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from decimal import Decimal
import random

from apps.users.models import User, CustomerProfile, SellerProfile
from apps.products.models import Category, Collection, Product


class Command(BaseCommand):
    help = 'Populate database with test data for JustClothing platform'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete existing test data before creating new data',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.flush_test_data()
        
        self.stdout.write('🚀 Populating test data for JustClothing...')
        
        self.create_categories()
        self.create_collections()
        self.create_test_users()
        self.create_test_products()
        
        self.stdout.write(self.style.SUCCESS('✅ Test data population completed!'))
        self.stdout.write('\n' + '='*50)
        self.stdout.write('📝 TEST LOGIN CREDENTIALS:')
        self.stdout.write('='*50)
        self.stdout.write('👥 Customers:')
        self.stdout.write('  • customer1@test.com (Ahmed Rahman)')
        self.stdout.write('  • customer2@test.com (Fatima Khan)')
        self.stdout.write('  • customer3@test.com (Mohammad Ali)')
        self.stdout.write('')
        self.stdout.write('🏪 Sellers:')
        self.stdout.write('  • seller1@test.com (Karim Fashion House - General Clothing)')
        self.stdout.write('  • seller2@test.com (Vintage Closet BD - Thrifted Clothing)')
        self.stdout.write('  • seller3@test.com (Salim Fabric Emporium - Loose Fabric)')
        self.stdout.write('')
        self.stdout.write('🔐 Password for all accounts: testpass123')
        self.stdout.write('='*50)

    def flush_test_data(self):
        """Remove existing test data"""
        self.stdout.write('🗑️  Flushing existing test data...')
        
        # Delete test users and their related data
        test_emails = [
            'customer1@test.com', 'customer2@test.com', 'customer3@test.com',
            'seller1@test.com', 'seller2@test.com', 'seller3@test.com'
        ]
        User.objects.filter(email__in=test_emails).delete()
        
        # Delete test categories and collections
        Category.objects.filter(name__in=['General Clothing', 'Thrifted Clothing', 'Loose Fabric']).delete()
        Collection.objects.filter(name__in=[
            'ANIME BUCKET SET', 'VINTAGE COLLECTION', 'URBAN COLLECTION',
            'ESSENTIALS', 'CLASSICS', 'STREET WEAR', 'FORMAL WEAR'
        ]).delete()

    def create_categories(self):
        """Create the three main business type categories"""
        self.stdout.write('📁 Creating categories...')
        categories = [
            ('General Clothing', 'Products from General Clothing sellers'),
            ('Thrifted Clothing', 'Pre-owned and vintage clothing items'),
            ('Loose Fabric', 'Fabric and materials for custom clothing'),
        ]
        
        for name, description in categories:
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={'description': description, 'is_active': True}
            )
            if created:
                self.stdout.write(f"  ✓ Created category: {name}")
            else:
                self.stdout.write(f"  • Category already exists: {name}")

    def create_collections(self):
        """Create sample collections"""
        self.stdout.write('📦 Creating collections...')
        collections = [
            ('ANIME BUCKET SET', 'Japanese anime and manga inspired clothing'),
            ('VINTAGE COLLECTION', 'Carefully curated vintage pieces'), 
            ('URBAN COLLECTION', 'Modern streetwear and urban fashion'),
            ('ESSENTIALS', 'Basic wardrobe essentials'),
            ('CLASSICS', 'Timeless classic pieces'),
            ('STREET WEAR', 'Contemporary street fashion'),
            ('FORMAL WEAR', 'Professional and formal attire')
        ]
        
        for name, description in collections:
            collection, created = Collection.objects.get_or_create(
                name=name,
                defaults={'description': description, 'is_active': True}
            )
            if created:
                self.stdout.write(f"  ✓ Created collection: {name}")
            else:
                self.stdout.write(f"  • Collection already exists: {name}")

    def create_test_users(self):
        """Create test customers and sellers"""
        self.stdout.write('👥 Creating test users...')
        
        # Create test customers
        customers = [
            {
                'email': 'customer1@test.com', 
                'first_name': 'Ahmed', 
                'last_name': 'Rahman',
                'phone': '+8801712345678'
            },
            {
                'email': 'customer2@test.com', 
                'first_name': 'Fatima', 
                'last_name': 'Khan',
                'phone': '+8801812345678'
            },
            {
                'email': 'customer3@test.com', 
                'first_name': 'Mohammad', 
                'last_name': 'Ali',
                'phone': '+8801912345678'
            },
        ]
        
        for customer_data in customers:
            user, created = User.objects.get_or_create(
                email=customer_data['email'],
                defaults={
                    'username': customer_data['email'],
                    'first_name': customer_data['first_name'],
                    'last_name': customer_data['last_name'],
                    'password': make_password('testpass123'),
                    'user_type': 'customer',
                    'is_verified': True
                }
            )
            if created:
                CustomerProfile.objects.create(
                    user=user,
                    phone_number=customer_data['phone']
                )
                self.stdout.write(f"  ✓ Created customer: {customer_data['email']}")
            else:
                self.stdout.write(f"  • Customer already exists: {customer_data['email']}")
        
        # Create test sellers
        sellers = [
            {
                'email': 'seller1@test.com',
                'first_name': 'Karim',
                'last_name': 'Textiles',
                'business_name': 'Karim Fashion House',
                'business_type': 'General Clothing',
                'business_description': 'High-quality ready-to-wear clothing for all occasions. We specialize in contemporary fashion with traditional touches.',
                'phone': '+8801512345678',
                'address': 'Shop 15, New Market, Dhaka 1205',
                'instagram': 'https://instagram.com/karimfashionhouse',
                'payment_method': 'bKash',
                'account_number': '01712345678'
            },
            {
                'email': 'seller2@test.com', 
                'first_name': 'Ruma',
                'last_name': 'Vintage',
                'business_name': 'Vintage Closet BD',
                'business_type': 'Thrifted Clothing',
                'business_description': 'Curated vintage and pre-owned clothing with character. Each piece tells a story and brings unique style.',
                'phone': '+8801612345678',
                'address': 'Level 3, Bashundhara City, Dhaka 1229',
                'facebook': 'https://facebook.com/vintageclosetbd',
                'payment_method': 'Bank',
                'account_number': '1234567890',
                'bank_name': 'Dutch Bangla Bank',
                'branch_name': 'Dhanmondi Branch'
            },
            {
                'email': 'seller3@test.com',
                'first_name': 'Salim',
                'last_name': 'Fabrics',
                'business_name': 'Salim Fabric Emporium', 
                'business_type': 'Loose Fabric',
                'business_description': 'Premium fabrics and materials for custom tailoring. We import the finest textiles from around the world.',
                'phone': '+8801712345678',
                'address': 'Fabric Market, Chawk Bazaar, Dhaka 1211',
                'payment_method': 'Nagad',
                'account_number': '01812345678'
            }
        ]
        
        for seller_data in sellers:
            user, created = User.objects.get_or_create(
                email=seller_data['email'],
                defaults={
                    'username': seller_data['email'],
                    'first_name': seller_data['first_name'],
                    'last_name': seller_data['last_name'],
                    'password': make_password('testpass123'),
                    'user_type': 'seller',
                    'is_verified': True
                }
            )
            if created:
                SellerProfile.objects.create(
                    user=user,
                    business_name=seller_data['business_name'],
                    business_type=seller_data['business_type'],
                    business_description=seller_data['business_description'],
                    phone_number=seller_data['phone'],
                    business_address=seller_data['address'],
                    instagram=seller_data.get('instagram', ''),
                    facebook=seller_data.get('facebook', ''),
                    payment_method=seller_data['payment_method'],
                    account_number=seller_data['account_number'],
                    bank_name=seller_data.get('bank_name', ''),
                    branch_name=seller_data.get('branch_name', ''),
                    status='approved',
                    verified=True
                )
                self.stdout.write(f"  ✓ Created seller: {seller_data['business_name']} ({seller_data['business_type']})")
            else:
                self.stdout.write(f"  • Seller already exists: {seller_data['business_name']}")

    def create_test_products(self):
        """Create test products for each seller"""
        self.stdout.write('🛍️ Creating test products...')
        
        sellers = SellerProfile.objects.all()
        collections = Collection.objects.all()
        
        if not collections:
            self.stdout.write(self.style.WARNING('No collections found. Creating products without collections.'))
        
        # Product templates by business type
        product_templates = {
            'General Clothing': [
                {
                    'name': 'Classic Cotton T-Shirt',
                    'description': 'Comfortable 100% cotton t-shirt perfect for everyday wear.',
                    'price': 850.00,
                    'tags': ['streetwear', 'casual', 'cotton'],
                    'sizes': ['S', 'M', 'L', 'XL'],
                    'colors': ['Black', 'White', 'Navy', 'Grey']
                },
                {
                    'name': 'Formal Dress Shirt',
                    'description': 'Elegant formal shirt for office and special occasions.',
                    'price': 1200.00,
                    'tags': ['formal wear', 'office', 'cotton'],
                    'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
                    'colors': ['White', 'Light Blue', 'Light Pink']
                },
                {
                    'name': 'Athletic Gym Set',
                    'description': 'Breathable workout set for your fitness routine.',
                    'price': 1500.00,
                    'tags': ['gym wear', 'fitness', 'athletic'],
                    'sizes': ['M', 'L', 'XL'],
                    'colors': ['Black', 'Grey', 'Navy']
                }
            ],
            'Thrifted Clothing': [
                {
                    'name': 'Vintage Denim Jacket',
                    'description': 'Authentic vintage denim jacket with character.',
                    'price': 2200.00,
                    'tags': ['streetwear', 'vintage', 'denim'],
                    'sizes': ['M', 'L'],
                    'colors': ['Blue Wash', 'Dark Blue']
                },
                {
                    'name': 'Retro Band T-Shirt',
                    'description': 'Original vintage band merchandise from the 90s.',
                    'price': 1800.00,
                    'tags': ['streetwear', 'vintage', 'band'],
                    'sizes': ['S', 'M', 'L'],
                    'colors': ['Black', 'Faded Black']
                }
            ],
            'Loose Fabric': [
                {
                    'name': 'Premium Cotton Fabric',
                    'description': 'High-quality cotton fabric perfect for custom clothing.',
                    'price': 450.00,
                    'tags': ['cotton', 'custom', 'material'],
                    'sizes': ['Per Yard'],
                    'colors': ['White', 'Cream', 'Light Blue', 'Pink']
                },
                {
                    'name': 'Silk Fabric Collection',
                    'description': 'Luxurious silk fabric for special occasion garments.',
                    'price': 1200.00,
                    'tags': ['silk', 'luxury', 'formal'],
                    'sizes': ['Per Yard'],
                    'colors': ['Ivory', 'Gold', 'Burgundy', 'Navy']
                }
            ]
        }
        
        for seller in sellers:
            templates = product_templates.get(seller.business_type, [])
            
            for template in templates:
                product = Product.objects.create(
                    seller=seller,
                    name=template['name'],
                    description=template['description'],
                    price=Decimal(str(template['price'])),
                    base_price=template['price'],
                    availableSizes=template['sizes'],
                    availableColors=template['colors'],
                    stock_quantity=random.randint(10, 100),
                    collection=random.choice(collections) if collections else None,
                    status='active',
                    features=[
                        "High Quality Materials",
                        "Comfortable Fit", 
                        "Durable Construction",
                        "Available in Multiple Sizes"
                    ]
                )
                
                # Add tags
                product.tags.add(*template['tags'])
                
                self.stdout.write(f"  ✓ Created product: {product.name} for {seller.business_name}")
        
        # Show summary
        total_products = Product.objects.count()
        total_sellers = SellerProfile.objects.count()
        self.stdout.write(f"\n📊 Summary: Created {total_products} products across {total_sellers} sellers") 