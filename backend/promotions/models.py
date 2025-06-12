from django.db import models
from django.conf import settings
import uuid

class PromoCode(models.Model):
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
        ('free_shipping', 'Free Shipping'),
    ]
    
    USAGE_TYPES = [
        ('unlimited', 'Unlimited'),
        ('single_use', 'Single Use'),
        ('limited', 'Limited Uses'),
    ]
    
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Who created this promo
    created_by_admin = models.BooleanField(default=False)
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, null=True, blank=True)
    
    # Discount details
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maximum_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Usage limits
    usage_type = models.CharField(max_length=20, choices=USAGE_TYPES, default='unlimited')
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Restrictions
    applicable_products = models.ManyToManyField('products.Product', blank=True)
    applicable_categories = models.ManyToManyField('products.Category', blank=True)
    first_time_customers_only = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.discount_type == 'percentage' else ''}"
    
    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        return (self.is_active and 
                self.valid_from <= now <= self.valid_until and
                (self.usage_type == 'unlimited' or self.usage_count < self.usage_limit))

class FeaturedProduct(models.Model):
    """Admin-managed featured/promoted products"""
    PLACEMENT_TYPES = [
        ('homepage_hero', 'Homepage Hero'),
        ('homepage_grid', 'Homepage Grid'),
        ('search_sponsored', 'Search Sponsored'),
        ('category_featured', 'Category Featured'),
    ]
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    placement_type = models.CharField(max_length=30, choices=PLACEMENT_TYPES)
    priority = models.PositiveIntegerField(default=0)  # Higher number = higher priority
    
    # Campaign details
    campaign_name = models.CharField(max_length=200)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Performance tracking
    impressions = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.placement_type}"
    
    @property
    def click_through_rate(self):
        if self.impressions == 0:
            return 0
        return (self.clicks / self.impressions) * 100
    
    class Meta:
        indexes = [
            models.Index(fields=['placement_type', 'is_active', 'priority']),
            models.Index(fields=['start_date', 'end_date']),
        ]

class PromoCodeUsage(models.Model):
    """Track promo code usage"""
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.promo_code.code} used by {self.user.username}"
