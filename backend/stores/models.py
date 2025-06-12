from django.db import models
from django.conf import settings
import uuid

class Store(models.Model):
    BUSINESS_TYPES = [
        ('general_clothing', 'General Clothing'),
        ('thrifted_clothing', 'Thrifted Clothing'),
        ('loose_fabric', 'Loose Fabric'),
    ]
    
    SUBSCRIPTION_TIERS = [
        ('free', 'Free'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True)
    bio = models.TextField()
    logo = models.ImageField(upload_to='store_logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='store_banners/', null=True, blank=True)
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPES)
    subscription_tier = models.CharField(max_length=20, choices=SUBSCRIPTION_TIERS, default='free')
    founded_date = models.DateField()
    pickup_location = models.TextField()
    
    # Social links
    instagram_handle = models.CharField(max_length=100, null=True, blank=True)
    facebook_page = models.CharField(max_length=200, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    
    # Status and metrics
    verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    followers_count = models.PositiveIntegerField(default=0)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        indexes = [
            models.Index(fields=['business_type', 'is_active']),
            models.Index(fields=['rating', 'verified']),
            models.Index(fields=['-created_at']),
        ]

class StoreTeamMember(models.Model):
    ROLES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLES)
    permissions = models.JSONField(default=dict)  # Custom permissions
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.store.name} ({self.role})"

class StoreBankingInfo(models.Model):
    PAYMENT_METHODS = [
        ('bank', 'Bank'),
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
    ]
    
    store = models.OneToOneField(Store, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=200)
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    branch_name = models.CharField(max_length=100, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.store.name} - {self.payment_method}"

class StoreFollow(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'store']
        
    def __str__(self):
        return f"{self.user.username} follows {self.store.name}"
