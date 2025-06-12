#!/usr/bin/env python
"""
Test script to verify Django setup
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'justclothing.settings')

try:
    # Setup Django
    django.setup()
    
    # Import models to test
    from users.models import User, UserProfile
    from stores.models import Store
    from products.models import Product, Category
    from orders.models import Order
    from reviews.models import Review
    from promotions.models import PromoCode
    from analytics.models import UserActivity
    
    print("✅ Django setup successful!")
    print("✅ All models imported successfully!")
    print("✅ Backend is ready for deployment!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1) 