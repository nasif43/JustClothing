from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    USER_TYPES = [
        ('customer', 'Customer'),
        ('seller', 'Seller'),
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
        ('support', 'Customer Support'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    phone = models.CharField(max_length=20, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Analytics fields
    total_orders = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.username} ({self.user_type})"

    class Meta:
        indexes = [
            models.Index(fields=['user_type', 'is_active']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['-created_at']),
        ]

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')
    
    def __str__(self):
        return f"{self.user.username} Profile"
