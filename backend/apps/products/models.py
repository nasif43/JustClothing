from django.db import models
from django.contrib.auth import get_user_model
from taggit.managers import TaggableManager
from djmoney.models.fields import MoneyField
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import json

User = get_user_model()


class Collection(models.Model):
    """Product collections (like 'ANIME BUCKET SET', 'VINTAGE COLLECTION')"""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'collections'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Category(models.Model):
    """Flexible category system for clothing items"""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Enhanced product model to match frontend expectations"""
    
    PRODUCT_STATUS = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('out_of_stock', 'Out of Stock'),
    )
    
    id = models.AutoField(primary_key=True)  # Frontend compatibility
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=255, blank=True)
    
    # Pricing - using decimal for frontend compatibility  
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Main price field for frontend
    base_price = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT')
    compare_price = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    cost_price = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    
    # Categories, collections and tags
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    tags = TaggableManager(blank=True)
    
    # Frontend compatibility fields
    storeId = models.IntegerField(null=True, blank=True)  # Will be populated from seller.id
    availableSizes = models.JSONField(default=list, blank=True)  # ["S", "M", "L", "XL", "XXL"]
    availableColors = models.JSONField(default=list, blank=True)  # ["Black", "White", "Red"]
    features = models.JSONField(default=list, blank=True)  # Product features list
    
    # Custom sizing options
    offers_custom_sizes = models.BooleanField(default=False)
    custom_size_fields = models.JSONField(default=list, blank=True)  # ["Waist Size", "Top Length", etc.]
    
    # Seller options from frontend
    requires_advance_payment = models.BooleanField(default=False)
    estimated_pickup_days = models.PositiveIntegerField(default=3)
    
    # SEO and meta
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    
    # Status and visibility
    status = models.CharField(max_length=15, choices=PRODUCT_STATUS, default='active')
    is_featured = models.BooleanField(default=False)
    is_digital = models.BooleanField(default=False)
    
    # Inventory
    track_inventory = models.BooleanField(default=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    
    # Shipping
    requires_shipping = models.BooleanField(default=True)
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    shipping_days_min = models.PositiveIntegerField(default=1)
    shipping_days_max = models.PositiveIntegerField(default=7)
    
    # Metrics
    views_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['collection', 'status']),
            models.Index(fields=['is_featured', 'status']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
            models.Index(fields=['slug']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            unique_slug = base_slug
            counter = 1
            while Product.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        
        # Sync price fields
        if self.price and not self.base_price:
            self.base_price = self.price
        
        # Set storeId from seller
        if self.seller_id:
            self.storeId = self.seller_id
        
        # AUTO-ASSIGN CATEGORY FROM SELLER'S BUSINESS TYPE
        if self.seller and not self.category:
            self.category = self.seller.category
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def is_in_stock(self):
        # Always check stock quantity, regardless of track_inventory setting
        # If track_inventory is False, we still shouldn't sell items with 0 stock
        return self.stock_quantity > 0 and self.status == 'active'
    
    @property
    def is_low_stock(self):
        if not self.track_inventory:
            return False
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def primary_image(self):
        """Get the primary product image"""
        return self.images.filter(is_primary=True).first()
    
    @property
    def image(self):
        """Frontend compatibility - returns primary image URL"""
        primary = self.primary_image
        return primary.image.url if primary else None
    
    @property
    def active_offer(self):
        """Get the currently active offer for this product"""
        from django.utils import timezone
        now = timezone.now()
        return self.offers.filter(
            status='active',
            start_date__lte=now,
            end_date__gte=now
        ).first()
    
    @property
    def discounted_price(self):
        """Get current discounted price if offer is active, otherwise original price"""
        active_offer = self.active_offer
        if active_offer:
            return active_offer.discounted_price
        return float(self.price)
    
    @property
    def original_price(self):
        """Always return the original price"""
        return float(self.price)
    
    @property
    def has_active_offer(self):
        """Check if product has an active offer"""
        return self.active_offer is not None
    
    @property
    def savings_amount(self):
        """Get current savings amount"""
        active_offer = self.active_offer
        if active_offer:
            return active_offer.savings
        return 0


class ProductAttributeType(models.Model):
    """Define custom attribute types for products (e.g., sleeve_length, collar_type)"""
    
    INPUT_TYPES = (
        ('text', 'Text'),
        ('number', 'Number'),
        ('select', 'Select'),
        ('multiselect', 'Multi Select'),
        ('boolean', 'Yes/No'),
        ('color', 'Color'),
        ('size', 'Size'),
    )
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    input_type = models.CharField(max_length=15, choices=INPUT_TYPES)
    is_required = models.BooleanField(default=False)
    is_variant_attribute = models.BooleanField(default=False)  # Used for creating variants
    options = models.JSONField(default=list, blank=True)  # For select/multiselect options
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_attribute_types'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_variant_attribute']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class ProductAttribute(models.Model):
    """Custom attributes for products"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    attribute_type = models.ForeignKey(ProductAttributeType, on_delete=models.CASCADE)
    value = models.TextField()  # Store as JSON for complex values
    
    class Meta:
        db_table = 'product_attributes'
        unique_together = [['product', 'attribute_type']]
    
    def __str__(self):
        return f"{self.product.name} - {self.attribute_type.name}: {self.value}"


class ProductVariant(models.Model):
    """Product variants for size/color combinations"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Inventory
    stock_quantity = models.PositiveIntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_variants'
        indexes = [
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['sku']),
        ]
        unique_together = [['product', 'size', 'color']]
    
    def __str__(self):
        return f"{self.product.name} - {self.size}/{self.color}"


class ProductVariantAttribute(models.Model):
    """Attributes for product variants"""
    
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='attributes')
    attribute_type = models.ForeignKey(ProductAttributeType, on_delete=models.CASCADE)
    value = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'product_variant_attributes'
        unique_together = [['variant', 'attribute_type']]
    
    def __str__(self):
        return f"{self.variant.sku} - {self.attribute_type.name}: {self.value}"


class ProductImage(models.Model):
    """Product images - up to 6 as per frontend requirement"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_images'
        indexes = [
            models.Index(fields=['product', 'is_primary']),
            models.Index(fields=['sort_order']),
        ]
        ordering = ['sort_order']
    
    def save(self, *args, **kwargs):
        # Ensure only one primary image per product
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Image for {self.product.name}"


class ProductVideo(models.Model):
    """Product videos"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to='products/videos/')
    thumbnail = models.ImageField(upload_to='products/video_thumbnails/', blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_videos'
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['sort_order']),
        ]
        ordering = ['sort_order']
    
    def __str__(self):
        return f"{self.product.name} - Video {self.id}"


class ProductOffer(models.Model):
    """Direct product offers/sales without promo codes"""
    
    OFFER_TYPE = (
        ('percentage', 'Percentage Discount'),
        ('flat', 'Flat Discount'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
    )
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='offers')
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='product_offers')
    
    # Offer details
    name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    offer_type = models.CharField(max_length=15, choices=OFFER_TYPE)
    
    # Discount values
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    
    # Timing
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_offers'
        indexes = [
            models.Index(fields=['product', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.product.name}"
    
    @property
    def is_active(self):
        """Check if offer is currently active"""
        from django.utils import timezone
        now = timezone.now()
        return (
            self.status == 'active' and
            self.start_date <= now <= self.end_date
        )
    
    @property
    def discounted_price(self):
        """Calculate the discounted price"""
        if not self.is_active:
            return self.product.price
        
        original_price = float(self.product.price)
        
        if self.offer_type == 'percentage' and self.discount_percentage:
            discount_value = original_price * (float(self.discount_percentage) / 100)
            return round(original_price - discount_value, 2)
        elif self.offer_type == 'flat' and self.discount_amount:
            return max(0, round(original_price - float(self.discount_amount), 2))
        
        return original_price
    
    @property
    def savings(self):
        """Calculate savings amount"""
        if not self.is_active:
            return 0
        
        original_price = float(self.product.price)
        discounted_price = self.discounted_price
        return round(original_price - discounted_price, 2)
