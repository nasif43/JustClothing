from django.db import models
from django.conf import settings
import uuid

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    
    # Status
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending', db_index=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Addresses
    shipping_address = models.JSONField()
    billing_address = models.JSONField()
    
    # Payment
    payment_method = models.CharField(max_length=50)
    payment_reference = models.CharField(max_length=200, blank=True)
    
    # Delivery
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    tracking_number = models.CharField(max_length=200, blank=True)
    
    # Guest orders
    guest_email = models.EmailField(null=True, blank=True)
    
    # Promotion
    promo_code_used = models.CharField(max_length=50, blank=True)
    
    # Analytics
    acquisition_source = models.CharField(max_length=100, blank=True)  # organic, facebook, google, etc.
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order {self.order_number}"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    class Meta:
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['payment_status', 'status']),
        ]

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey('products.ProductVariant', on_delete=models.CASCADE)
    
    # Store this order item belongs to (for multi-vendor split)
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE)
    
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Custom sizing data
    custom_size_values = models.JSONField(null=True, blank=True)
    
    # Store-specific status (for when sellers need to cancel specific items)
    item_status = models.CharField(max_length=20, default='confirmed')
    seller_notes = models.TextField(blank=True)
    
    # Commission tracking
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product_variant}"

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.order.order_number} - {self.status}"
    
    class Meta:
        ordering = ['-created_at']

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Cart"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey('products.ProductVariant', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    custom_size_values = models.JSONField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.cart.user.username} - {self.product_variant}"
    
    @property
    def total_price(self):
        return self.product_variant.final_price * self.quantity
    
    class Meta:
        unique_together = ['cart', 'product_variant']
