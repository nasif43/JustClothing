# JustClothing Backend

A comprehensive Django REST Framework backend for the JustClothing multi-vendor marketplace.

## Features

### Core Functionality
- Multi-vendor marketplace for clothing
- Custom user system (customers, sellers, admins)
- Product management with flexible categories
- Order processing with auto-accept
- Review system with auto-flagging (≤2 stars)
- Conditional promo codes
- Admin-managed shipping rates
- Analytics and user tracking

### Auto-Flagging System
Reviews with ratings ≤2 stars are automatically flagged and admins are notified.

### Shipping Management
Admin-controlled shipping rates with zone-based calculations and multiple methods.

### Promotional System
Conditional promo codes based on sellers, products, and minimum order values.

## Quick Start

1. Install dependencies: `pip install -r requirements.txt`
2. Configure environment: Copy `env.example` to `.env`
3. Run migrations: `python manage.py migrate`
4. Create superuser: `python manage.py createsuperuser`
5. Start server: `python manage.py runserver`

## API Documentation

- Swagger UI: `http://localhost:8000/api/v1/schema/docs/`
- Admin Panel: `http://localhost:8000/admin/`

## Apps Structure

- `users/` - User management and authentication
- `products/` - Product catalog and categories
- `orders/` - Order processing and cart
- `reviews/` - Review system with auto-flagging
- `promos/` - Promotional codes
- `shipping/` - Shipping management
- `payments/` - Payment processing
- `analytics/` - Tracking and reports
- `notifications/` - User and admin notifications 