from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class AdminNotification(models.Model):
    """Notifications for site administrators"""
    
    NOTIFICATION_TYPES = (
        ('review_flagged', 'Review Flagged'),
        ('seller_review_flagged', 'Seller Review Flagged'),
        ('seller_registration', 'New Seller Registration'),
        ('order_issue', 'Order Issue'),
        ('payment_failed', 'Payment Failed'),
        ('product_reported', 'Product Reported'),
        ('system_alert', 'System Alert'),
        ('promo_request', 'Promo Code Request'),
    )
    
    PRIORITY_LEVELS = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    
    # Additional data (JSON)
    data = models.JSONField(default=dict, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_notifications')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_notifications'
        indexes = [
            models.Index(fields=['type', 'is_read']),
            models.Index(fields=['priority', 'created_at']),
            models.Index(fields=['is_resolved']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_type_display()}: {self.title}"


class UserNotification(models.Model):
    """Notifications for users (customers and sellers)"""
    
    NOTIFICATION_TYPES = (
        ('order_confirmed', 'Order Confirmed'),
        ('order_shipped', 'Order Shipped'),
        ('order_delivered', 'Order Delivered'),
        ('order_cancelled', 'Order Cancelled'),
        ('payment_success', 'Payment Successful'),
        ('payment_failed', 'Payment Failed'),
        ('review_received', 'Review Received'),
        ('product_back_in_stock', 'Product Back in Stock'),
        ('promo_code_available', 'Promo Code Available'),
        ('seller_approved', 'Seller Account Approved'),
        ('seller_rejected', 'Seller Account Rejected'),
        ('product_approved', 'Product Approved'),
        ('product_rejected', 'Product Rejected'),
        ('low_stock_alert', 'Low Stock Alert'),
        ('system_message', 'System Message'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Additional data (JSON)
    data = models.JSONField(default=dict, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Related objects
    related_order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True)
    related_product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_notifications'
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['type']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_type_display()} for {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            from django.utils import timezone
            self.read_at = timezone.now()
            self.save()


class NotificationSettings(models.Model):
    """User notification preferences"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Email notifications
    email_order_updates = models.BooleanField(default=True)
    email_marketing = models.BooleanField(default=True)
    email_product_updates = models.BooleanField(default=False)
    email_review_requests = models.BooleanField(default=True)
    
    # In-app notifications
    app_order_updates = models.BooleanField(default=True)
    app_marketing = models.BooleanField(default=False)
    app_product_updates = models.BooleanField(default=True)
    app_review_requests = models.BooleanField(default=True)
    
    # SMS notifications (if phone number provided)
    sms_order_updates = models.BooleanField(default=False)
    sms_delivery_updates = models.BooleanField(default=False)
    
    # Seller-specific notifications
    seller_low_stock_alerts = models.BooleanField(default=True)
    seller_new_orders = models.BooleanField(default=True)
    seller_review_alerts = models.BooleanField(default=True)
    seller_performance_reports = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_settings'
    
    def __str__(self):
        return f"Notification Settings for {self.user.email}"
