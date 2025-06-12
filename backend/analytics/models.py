from django.db import models
from django.conf import settings

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('page_view', 'Page View'),
        ('product_view', 'Product View'),
        ('store_visit', 'Store Visit'),
        ('search', 'Search'),
        ('add_to_cart', 'Add to Cart'),
        ('remove_from_cart', 'Remove from Cart'),
        ('checkout_start', 'Checkout Started'),
        ('order_complete', 'Order Completed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=200, db_index=True)
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES, db_index=True)
    
    # Related objects
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True)
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, null=True, blank=True)
    
    # Activity data
    data = models.JSONField(default=dict)  # search terms, page URLs, etc.
    
    # Context
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    referrer = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    def __str__(self):
        return f"{self.activity_type} - {self.user or 'Anonymous'}"
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'activity_type', '-created_at']),
            models.Index(fields=['session_id', '-created_at']),
            models.Index(fields=['product', 'activity_type']),
        ]

class DailyMetrics(models.Model):
    """Pre-calculated daily metrics for faster reporting"""
    date = models.DateField(unique=True, db_index=True)
    
    # User metrics
    daily_active_users = models.PositiveIntegerField(default=0)
    new_customer_registrations = models.PositiveIntegerField(default=0)
    new_seller_registrations = models.PositiveIntegerField(default=0)
    
    # Order metrics
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    order_cancellations = models.PositiveIntegerField(default=0)
    
    # Product metrics
    products_added = models.PositiveIntegerField(default=0)
    total_products_in_stock = models.PositiveIntegerField(default=0)
    total_products_out_of_stock = models.PositiveIntegerField(default=0)
    
    # Review metrics
    reviews_added = models.PositiveIntegerField(default=0)
    flagged_reviews = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Metrics for {self.date}"

class SearchAnalytics(models.Model):
    """Track search queries and results"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=200, db_index=True)
    search_query = models.CharField(max_length=500, db_index=True)
    results_count = models.PositiveIntegerField()
    clicked_product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True)
    click_position = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    def __str__(self):
        return f"Search: {self.search_query}"
    
    class Meta:
        indexes = [
            models.Index(fields=['search_query', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

class ProductPerformance(models.Model):
    """Track product performance metrics"""
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE)
    
    # Views and engagement
    total_views = models.PositiveIntegerField(default=0)
    unique_views = models.PositiveIntegerField(default=0)
    cart_additions = models.PositiveIntegerField(default=0)
    wishlist_additions = models.PositiveIntegerField(default=0)
    
    # Conversion metrics
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    cart_abandonment_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Search performance
    search_impressions = models.PositiveIntegerField(default=0)
    search_clicks = models.PositiveIntegerField(default=0)
    avg_search_position = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Performance: {self.product.name}"
