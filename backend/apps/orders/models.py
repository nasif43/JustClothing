from django.db import models
from django.contrib.auth import get_user_model
from djmoney.models.fields import MoneyField
from phonenumber_field.modelfields import PhoneNumberField
import uuid
from decimal import Decimal
from django.utils import timezone
import random
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db.models import QuerySet

User = get_user_model()


class Order(models.Model):
    """Orders placed by customers - matches frontend Order structure"""
    
    ORDER_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('partially_delivered', 'Partially Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_METHOD = (
        ('cod', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('mobile_banking', 'Mobile Banking'),
        ('bank_transfer', 'Bank Transfer'),
    )
    
    id = models.CharField(max_length=20, primary_key=True)  # Custom ID like "69420"
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.SET_NULL, null=True, related_name='seller_orders')
    
    # Customer information
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()
    
    # Order details - frontend compatible fields
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, default='cod')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    bill = models.DecimalField(max_digits=10, decimal_places=2)  # Frontend uses 'bill'
    
    # Frontend timestamp fields
    placedOn = models.CharField(max_length=20, blank=True)  # Frontend format: "02/03/25"
    time = models.CharField(max_length=20, blank=True)  # Frontend format: "04:20 P.M"
    placedTime = models.CharField(max_length=20, blank=True)  # Alternative field name
    
    # Standard timestamps
    placed_on_date = models.DateField(auto_now_add=True)
    placed_time_obj = models.TimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        # Generate custom order ID if not provided
        if not self.id:
            self.id = str(random.randint(10000, 99999))
            while Order.objects.filter(id=self.id).exists():
                self.id = str(random.randint(10000, 99999))
        
        # Sync bill with total_amount
        if self.total_amount:
            self.bill = self.total_amount
        
        # Format frontend date/time fields using current time if created_at is not set yet
        current_time = self.created_at or timezone.now()
        if not self.placedOn:
            self.placedOn = current_time.strftime("%d/%m/%y")
        if not self.time:
            self.time = current_time.strftime("%I:%M %p")
        if not self.placedTime:
            self.placedTime = self.time
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order #{self.id}"
    
class Order(models.Model):
    """Orders placed by customers - matches frontend Order structure"""
    
    ORDER_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('partially_delivered', 'Partially Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_METHOD = (
        ('cod', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('mobile_banking', 'Mobile Banking'),
        ('bank_transfer', 'Bank Transfer'),
    )
    
    id = models.CharField(max_length=20, primary_key=True)  # Custom ID like "69420"
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.SET_NULL, null=True, related_name='seller_orders')
    
    # Customer information
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()
    
    # Order details - frontend compatible fields
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, default='cod')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    bill = models.DecimalField(max_digits=10, decimal_places=2)  # Frontend uses 'bill'
    
    # Frontend timestamp fields
    placedOn = models.CharField(max_length=20, blank=True)  # Frontend format: "02/03/25"
    time = models.CharField(max_length=20, blank=True)  # Frontend format: "04:20 P.M"
    placedTime = models.CharField(max_length=20, blank=True)  # Alternative field name
    
    # Standard timestamps
    placed_on_date = models.DateField(auto_now_add=True)
    placed_time_obj = models.TimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        # Generate custom order ID if not provided
        if not self.id:
            self.id = str(random.randint(10000, 99999))
            while Order.objects.filter(id=self.id).exists():
                self.id = str(random.randint(10000, 99999))
        
        # Sync bill with total_amount
        if self.total_amount:
            self.bill = self.total_amount
        
        # Format frontend date/time fields using current time if created_at is not set yet
        current_time = self.created_at or timezone.now()
        if not self.placedOn:
            self.placedOn = current_time.strftime("%d/%m/%y")
        if not self.time:
            self.time = current_time.strftime("%I:%M %p")
        if not self.placedTime:
            self.placedTime = self.time
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order #{self.id}"
    
    @property
    def totalItems(self):
        """Frontend compatibility"""
        return sum(item.quantity for item in self.items.all())  # type: ignore
    
    @property
    def total_items(self):
        return self.totalItems
    
    @property
    def billAmount(self):
        """Frontend compatibility"""
        return self.bill
    
    @property
    def isCompleted(self):
        """Frontend compatibility"""
        return self.status in ['delivered', 'partially_delivered']
    
    @property
    def is_completed(self):
        return self.isCompleted
    
    @property
    def is_partially_completed(self):
        """Check if order is partially completed"""
        return self.status == 'partially_delivered'


class OrderItem(models.Model):
    """Items within an order - matches frontend order detail structure"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    
    # Frontend compatible fields
    title = models.CharField(max_length=200)  # Frontend uses 'title'
    product_name = models.CharField(max_length=200)  # Alternative field
    photo = models.ImageField(upload_to='orders/photos/', blank=True, null=True)
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Frontend uses 'price'
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'order_items'
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.unit_price * self.quantity
        
        # Sync fields for frontend compatibility
        if not self.title and self.product:
            self.title = self.product.name
        if not self.product_name:
            self.product_name = self.title
        if not self.price:
            self.price = self.unit_price
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} x{self.quantity}"


class OrderStatusHistory(models.Model):
    """Track status changes for orders"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, null=True, blank=True, related_name='status_history')
    
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'order_status_history'
        indexes = [
            models.Index(fields=['order', 'created_at']),
            models.Index(fields=['order_item', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        target = self.order_item if self.order_item else self.order
        return f"{target} - {self.previous_status} → {self.new_status}"


class Cart(models.Model):
    """Shopping cart for users"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'carts'
    
    def __str__(self):
        return f"Cart for {self.user.email}"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())  # type: ignore
    
    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())  # type: ignore


class CartItem(models.Model):
    """Items in shopping cart"""
    
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cart_items'
        unique_together = [['cart', 'product', 'size', 'color']]
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
    
    @property
    def total_price(self):
        return self.product.discounted_price * self.quantity
    
    @property
    def unit_price(self):
        return self.product.discounted_price


class Wishlist(models.Model):
    """User wishlist"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wishlists'
    
    def __str__(self):
        return f"Wishlist for {self.user.email}"


class WishlistItem(models.Model):
    """Items in wishlist"""
    
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'wishlist_items'
        unique_together = [['wishlist', 'product']]
    
    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.email}'s wishlist"



