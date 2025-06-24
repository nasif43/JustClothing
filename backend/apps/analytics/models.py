from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from djmoney.models.fields import MoneyField
from decimal import Decimal

User = get_user_model()


class SellerAnalytics(models.Model):
    """Daily analytics snapshot for sellers"""
    
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField()
    
    # Sales metrics
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    total_items_sold = models.PositiveIntegerField(default=0)
    average_order_value = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', default=0)
    
    # Product metrics
    total_products = models.PositiveIntegerField(default=0)
    active_products = models.PositiveIntegerField(default=0)
    out_of_stock_products = models.PositiveIntegerField(default=0)
    
    # Customer metrics
    new_customers = models.PositiveIntegerField(default=0)
    returning_customers = models.PositiveIntegerField(default=0)
    
    # Review metrics
    new_reviews = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, null=True, blank=True)
    
    # Traffic metrics (can be enhanced later)
    store_views = models.PositiveIntegerField(default=0, null=True, blank=True)
    product_views = models.PositiveIntegerField(default=0, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_analytics'
        unique_together = [['seller', 'date']]
        indexes = [
            models.Index(fields=['seller', 'date']),
            models.Index(fields=['date']),
        ]
        ordering = ['-date']
    
    def __str__(self):
        return f"Analytics for {self.seller.business_name} on {self.date}"


class SellerRevenueTracker(models.Model):
    """Track revenue goals and progress for sellers"""
    
    seller = models.OneToOneField('users.SellerProfile', on_delete=models.CASCADE, related_name='revenue_tracker')
    
    # Monthly targets
    monthly_target = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    current_month_revenue = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    
    # Quarterly targets
    quarterly_target = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    current_quarter_revenue = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    
    # Annual targets
    annual_target = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    current_year_revenue = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    
    # Best performing metrics
    best_month_revenue = MoneyField(max_digits=12, decimal_places=2, default_currency='BDT', default=0)
    best_month_date = models.DateField(null=True, blank=True)
    best_day_revenue = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', default=0)
    best_day_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_revenue_tracker'
    
    def __str__(self):
        return f"Revenue tracker for {self.seller.business_name}"
    
    @property
    def monthly_progress_percentage(self):
        if self.monthly_target and float(self.monthly_target.amount) > 0:
            return min((float(self.current_month_revenue.amount) / float(self.monthly_target.amount)) * 100, 100)
        return 0
    
    @property
    def quarterly_progress_percentage(self):
        if self.quarterly_target and float(self.quarterly_target.amount) > 0:
            return min((float(self.current_quarter_revenue.amount) / float(self.quarterly_target.amount)) * 100, 100)
        return 0
    
    @property
    def annual_progress_percentage(self):
        if self.annual_target and float(self.annual_target.amount) > 0:
            return min((float(self.current_year_revenue.amount) / float(self.annual_target.amount)) * 100, 100)
        return 0


class PopularProduct(models.Model):
    """Track popular products for analytics"""
    
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='popular_products')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    
    # Metrics for the period
    period_start = models.DateField()
    period_end = models.DateField()
    
    total_orders = models.PositiveIntegerField(default=0)
    total_quantity_sold = models.PositiveIntegerField(default=0)
    total_revenue = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', default=0)
    
    # Rankings
    rank_by_orders = models.PositiveIntegerField(null=True, blank=True)
    rank_by_revenue = models.PositiveIntegerField(null=True, blank=True)
    rank_by_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'popular_products'
        unique_together = [['seller', 'product', 'period_start', 'period_end']]
        indexes = [
            models.Index(fields=['seller', 'period_start', 'period_end']),
            models.Index(fields=['rank_by_revenue']),
            models.Index(fields=['rank_by_orders']),
        ]
        ordering = ['rank_by_revenue']
    
    def __str__(self):
        return f"{self.product.name} - {self.seller.business_name} ({self.period_start} to {self.period_end})"
