from django.db import models
from django.contrib.auth import get_user_model
from djmoney.models.fields import MoneyField
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid
from decimal import Decimal

User = get_user_model()


class Promotion(models.Model):
    """Main promotion model for discounts and offers"""
    
    PROMOTION_TYPE = (
        ('percentage', 'Percentage Discount'),
        ('fixed_amount', 'Fixed Amount Discount'),
        ('buy_x_get_y', 'Buy X Get Y'),
        ('free_shipping', 'Free Shipping'),
    )
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('expired', 'Expired'),
        ('completed', 'Completed'),
    )
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    promotion_type = models.CharField(max_length=20, choices=PROMOTION_TYPE)
    
    # Discount configuration
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    
    # Buy X Get Y configuration
    buy_quantity = models.PositiveIntegerField(null=True, blank=True)
    get_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    # Minimum requirements
    minimum_order_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    minimum_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    # Usage limits
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total usage limit")
    usage_limit_per_customer = models.PositiveIntegerField(null=True, blank=True, help_text="Usage limit per customer")
    usage_count = models.PositiveIntegerField(default=0)
    
    # Date restrictions
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    
    # Applicable products and categories
    applicable_products = models.ManyToManyField('products.Product', blank=True)
    applicable_categories = models.ManyToManyField('products.Category', blank=True)
    applicable_sellers = models.ManyToManyField('users.SellerProfile', blank=True)
    
    # Creator
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_promos')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'promotions'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['promotion_type']),
            models.Index(fields=['is_featured']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def is_active(self):
        now = timezone.now()
        return (
            self.status == 'active' and
            self.start_date <= now <= self.end_date and
            (self.usage_limit is None or self.usage_count < self.usage_limit)
        )
    
    def can_be_used_by(self, user):
        if not self.is_active:
            return False
        
        if self.usage_limit_per_customer:
            user_usage = self.usages.filter(user=user).count()
            return user_usage < self.usage_limit_per_customer
        
        return True


class PromoCode(models.Model):
    """Promo codes for promotions"""
    
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name='promo_codes')
    code = models.CharField(max_length=50, unique=True)
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'promo_codes'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['promotion', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.promotion.name}"
    
    def can_be_used(self):
        return (
            self.is_active and
            self.promotion.is_active and
            (self.usage_limit is None or self.usage_count < self.usage_limit)
        )


class PromoUsage(models.Model):
    """Track promotion usage"""
    
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name='usages')
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, null=True, blank=True, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='promo_usages')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True, related_name='promo_usages')
    
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'promo_usages'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['promotion']),
            models.Index(fields=['used_at']),
        ]
    
    def __str__(self):
        return f"{self.promotion.name} used by {self.user.email}"


class PromotionalCampaign(models.Model):
    """Promotional campaigns for sellers"""
    
    CAMPAIGN_STATUS = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )
    
    id = models.AutoField(primary_key=True)
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    # Campaign details
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Targeting
    target_products = models.ManyToManyField('products.Product', blank=True)
    target_categories = models.ManyToManyField('products.Category', blank=True)
    
    # Status and approval
    status = models.CharField(max_length=15, choices=CAMPAIGN_STATUS, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_promos')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Metrics
    impressions = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'promotional_campaigns'
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} by {self.seller.business_name}"


class PromoRequest(models.Model):
    """Requests from sellers for promotional features"""
    
    REQUEST_TYPE = (
        ('featured_product', 'Featured Product'),
        ('banner_ad', 'Banner Advertisement'),
        ('newsletter', 'Newsletter Inclusion'),
        ('social_media', 'Social Media Promotion'),
    )
    
    REQUEST_STATUS = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='promotion_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE)
    
    # Request details
    title = models.CharField(max_length=200)
    description = models.TextField()
    target_products = models.ManyToManyField('products.Product', blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_days = models.PositiveIntegerField()
    
    # Files and media
    media_files = models.FileField(upload_to='promo_requests/', blank=True, null=True)
    
    # Status and review
    status = models.CharField(max_length=15, choices=REQUEST_STATUS, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_promotion_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'promo_requests'
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['request_type']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_request_type_display()} request by {self.seller.business_name}"


class FeaturedPromo(models.Model):
    """Featured/promoted promo codes for homepage"""
    
    PLACEMENT_CHOICES = (
        ('homepage_banner', 'Homepage Banner'),
        ('search_results', 'Search Results'),
        ('product_page', 'Product Page'),
        ('cart_page', 'Cart Page'),
        ('checkout_page', 'Checkout Page'),
    )
    
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='featured_placements')
    placement = models.CharField(max_length=20, choices=PLACEMENT_CHOICES)
    priority = models.PositiveIntegerField(default=0, help_text="Higher numbers appear first")
    
    # Promotion period
    promotion_start = models.DateTimeField()
    promotion_end = models.DateTimeField()
    
    # Promotion intensity/budget
    daily_budget = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    max_impressions = models.PositiveIntegerField(null=True, blank=True)
    current_impressions = models.PositiveIntegerField(default=0)
    max_clicks = models.PositiveIntegerField(null=True, blank=True)
    current_clicks = models.PositiveIntegerField(default=0)
    
    # Targeting
    target_user_interests = models.ManyToManyField('products.Category', blank=True)
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='featured_promos')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'featured_promos'
        indexes = [
            models.Index(fields=['placement', 'is_active', 'priority']),
            models.Index(fields=['promotion_start', 'promotion_end']),
        ]
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"Featured: {self.promo_code.code} on {self.get_placement_display()}"
    
    @property
    def is_currently_active(self):
        """Check if promotion is currently active"""
        now = timezone.now()
        return (
            self.is_active and
            self.promotion_start <= now <= self.promotion_end and
            (not self.max_impressions or self.current_impressions < self.max_impressions) and
            (not self.max_clicks or self.current_clicks < self.max_clicks)
        )


class PromoImpression(models.Model):
    """Track promo code impressions and clicks"""
    
    featured_promo = models.ForeignKey(FeaturedPromo, on_delete=models.CASCADE, related_name='impressions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True)  # For anonymous users
    
    # Analytics
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    referrer = models.URLField(blank=True)
    
    # Actions
    viewed_at = models.DateTimeField(auto_now_add=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)  # When promo was actually used
    
    class Meta:
        db_table = 'promo_impressions'
        indexes = [
            models.Index(fields=['featured_promo', 'viewed_at']),
            models.Index(fields=['user']),
            models.Index(fields=['session_key']),
        ]
    
    def __str__(self):
        user_id = self.user.email if self.user else f"Anonymous ({self.session_key})"
        return f"Impression: {self.featured_promo.promo_code.code} by {user_id}"


class SellerPromoRequest(models.Model):
    """Seller requests for creating promotional codes"""
    
    REQUEST_STATUS = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    )
    
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='seller_promo_requests')
    requested_code = models.CharField(max_length=50)
    requested_name = models.CharField(max_length=200)
    requested_description = models.TextField()
    
    # Requested promo details
    requested_type = models.CharField(max_length=20, choices=Promotion.PROMOTION_TYPE)
    requested_discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(50)]  # Max 50% for seller promos
    )
    requested_discount_amount = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    requested_minimum_order_amount = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    requested_usage_limit = models.PositiveIntegerField(null=True, blank=True)
    requested_start_date = models.DateTimeField()
    requested_end_date = models.DateTimeField()
    
    # Admin review
    status = models.CharField(max_length=15, choices=REQUEST_STATUS, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_seller_promo_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    # Created promo (if approved)
    created_promo = models.OneToOneField(PromoCode, on_delete=models.SET_NULL, null=True, blank=True, related_name='seller_request')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'seller_promo_requests'
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Promo Request: {self.requested_code} by {self.seller.business_name}"
