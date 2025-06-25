from django.contrib.auth.models import AbstractUser
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.utils import timezone

class User(AbstractUser):
    """Custom User model supporting customers, sellers, and site admins"""
    
    USER_TYPES = (
        ('customer', 'Customer'),
        ('seller', 'Seller'),
        ('admin', 'Site Admin'),
    )
    
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='customer')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['user_type']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"


class CustomerProfile(models.Model):
    """Extended profile for customers"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    phone_number = PhoneNumberField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=10, 
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True
    )
    profile_picture = models.ImageField(upload_to='profiles/customers/', blank=True, null=True)
    
    # Preferences
    preferred_categories = models.ManyToManyField('products.Category', blank=True)
    preferred_tags = models.JSONField(default=list, blank=True)  # Store user's preferred tags from onboarding
    newsletter_subscription = models.BooleanField(default=True)
    onboarding_completed = models.BooleanField(default=False)  # Track if user completed onboarding
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customer_profiles'
    
    def __str__(self):
        return f"Customer Profile: {self.user.email}"


class SellerProfile(models.Model):
    """Enhanced profile for sellers with frontend compatibility"""
    
    SELLER_STATUS = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    )
    
    BUSINESS_TYPES = (
        ('General Clothing', 'General Clothing'),
        ('Thrifted Clothing', 'Thrifted Clothing'),
        ('Loose Fabric', 'Loose Fabric'),
    )
    
    # Basic seller info
    id = models.AutoField(primary_key=True)  # Frontend compatibility
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    business_name = models.CharField(max_length=200)
    business_description = models.TextField()
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPES, default='General Clothing')
    phone_number = PhoneNumberField()
    business_address = models.TextField()
    business_license = models.CharField(max_length=100, blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    
    # Frontend compatibility fields
    name = models.CharField(max_length=200, blank=True)  # Will sync with business_name
    bio = models.TextField(blank=True)  # Will sync with business_description
    verified = models.BooleanField(default=False)  # Frontend uses 'verified' field
    followers = models.PositiveIntegerField(default=0)  # Follower count
    productsCount = models.PositiveIntegerField(default=0)  # Product count
    joinedDate = models.DateField(null=True, blank=True)  # When they joined as seller
    
    # Social links (from frontend seller signup)
    instagram = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    
    # Payment information (from frontend)
    payment_method = models.CharField(max_length=50, blank=True)  # Bank, bKash, Nagad
    account_number = models.CharField(max_length=100, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    branch_name = models.CharField(max_length=100, blank=True)
    
    # Status and verification
    status = models.CharField(max_length=15, choices=SELLER_STATUS, default='pending')
    verification_documents = models.FileField(upload_to='sellers/documents/', blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_sellers')
    
    # Business metrics
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    
    # Profile and branding
    logo = models.ImageField(upload_to='sellers/logos/', blank=True, null=True)
    banner_image = models.ImageField(upload_to='sellers/banners/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_profiles'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['business_type']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
            models.Index(fields=['verified']),
        ]
    
    @property
    def category(self):
        """Get the category corresponding to this seller's business type"""
        try:
            from apps.products.models import Category
            return Category.objects.get(name=self.business_type)
        except Category.DoesNotExist:
            return None
    
    def save(self, *args, **kwargs):
        # Sync fields for frontend compatibility
        if self.business_name and not self.name:
            self.name = self.business_name
        if self.business_description and not self.bio:
            self.bio = self.business_description
        
        # Set verified status based on approval
        self.verified = self.status == 'approved'
        
        # Set joined date
        if not self.joinedDate and self.status == 'approved':
            self.joinedDate = timezone.now().date()
        
        # Update product count
        if self.pk:
            self.productsCount = self.products.filter(status='active').count()
        
        # Ensure corresponding category exists
        if self.business_type:
            self._ensure_business_category_exists()
        
        super().save(*args, **kwargs)
    
    def _ensure_business_category_exists(self):
        """Ensure the business type category exists"""
        try:
            from apps.products.models import Category
            Category.objects.get_or_create(
                name=self.business_type,
                defaults={
                    'description': f'Products from {self.business_type} sellers',
                    'is_active': True
                }
            )
        except Exception as e:
            # Don't fail the save if category creation fails
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to create category for business type {self.business_type}: {e}")
    
    def __str__(self):
        return f"Seller: {self.business_name} ({self.business_type})"


class SellerFollower(models.Model):
    """Track seller followers for frontend compatibility"""
    
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='seller_followers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_sellers')
    followed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'seller_followers'
        unique_together = [['seller', 'user']]
    
    def __str__(self):
        return f"{self.user.email} follows {self.seller.business_name}"


class Address(models.Model):
    """Address model for users"""
    
    ADDRESS_TYPES = (
        ('home', 'Home'),
        ('office', 'Office'),
        ('other', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPES, default='home')
    full_name = models.CharField(max_length=100)
    phone_number = PhoneNumberField()
    address_line_1 = models.CharField(max_length=200)
    address_line_2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Bangladesh')
    
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'addresses'
        indexes = [
            models.Index(fields=['user', 'is_default']),
            models.Index(fields=['city']),
            models.Index(fields=['postal_code']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.address_line_1}, {self.city}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default address per user
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class SellerTeamMember(models.Model):
    """Team members for seller accounts"""
    
    ROLES = (
        ('manager', 'Manager'),
        ('inventory', 'Inventory Manager'),
        ('support', 'Customer Support'),
        ('marketing', 'Marketing'),
    )
    
    PERMISSIONS = (
        ('read', 'Read Only'),
        ('write', 'Read & Write'),
        ('admin', 'Full Access'),
    )
    
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_teams')
    role = models.CharField(max_length=20, choices=ROLES)
    permissions = models.CharField(max_length=10, choices=PERMISSIONS, default='read')
    is_active = models.BooleanField(default=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='invited_team_members')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'seller_team_members'
        unique_together = [['seller', 'user']]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_role_display()} at {self.seller.business_name}"


class SellerHomepageProduct(models.Model):
    """Track products selected by seller for their homepage/store profile"""
    
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='homepage_products')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='homepage_selections')
    order = models.PositiveIntegerField(default=0)  # Display order (0-5 for 6 slots)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_homepage_products'
        unique_together = [['seller', 'order']]  # Only one product per order position
        indexes = [
            models.Index(fields=['seller', 'order']),
        ]
    
    def __str__(self):
        return f"{self.seller.business_name} - {self.product.name} (Position {self.order})"
