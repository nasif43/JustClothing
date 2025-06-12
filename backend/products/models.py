from django.db import models
from django.conf import settings
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class ProductTag(models.Model):
    TAG_TYPES = [
        ('predefined', 'Predefined'),
        ('custom', 'Custom'),
    ]
    
    name = models.CharField(max_length=50, unique=True, db_index=True)
    type = models.CharField(max_length=20, choices=TAG_TYPES, default='custom')
    usage_count = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return self.name

class Collection(models.Model):
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='collections/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=300, db_index=True)
    slug = models.SlugField(max_length=350)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(ProductTag, blank=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Product attributes
    material = models.CharField(max_length=200, blank=True)
    care_instructions = models.TextField(blank=True)
    country_origin = models.CharField(max_length=100, blank=True)
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Customization
    offers_custom_sizes = models.BooleanField(default=False)
    custom_size_fields = models.JSONField(default=list)  # ["Waist Size", "Top Length", etc.]
    
    # Fulfillment
    requires_advance_payment = models.BooleanField(default=False)
    estimated_pickup_days = models.PositiveIntegerField(default=3)
    max_production_time = models.PositiveIntegerField(default=7)  # For delivery calculation
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    
    # Status and metrics
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    total_sold = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def average_rating(self):
        return self.rating
    
    @property
    def in_stock(self):
        return self.variants.filter(stock_quantity__gt=0, is_available=True).exists()
    
    class Meta:
        unique_together = ['store', 'slug']
        indexes = [
            models.Index(fields=['store', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['base_price', 'is_active']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['rating', 'is_active']),
            models.Index(fields=['is_featured', 'is_active']),
        ]

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.product.name} - Image {self.sort_order}"
    
    class Meta:
        ordering = ['sort_order']

class ProductVideo(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to='product_videos/')
    thumbnail = models.ImageField(upload_to='video_thumbnails/')
    title = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return f"{self.product.name} - Video"

class Size(models.Model):
    name = models.CharField(max_length=20, unique=True)
    display_name = models.CharField(max_length=30)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.display_name
    
    class Meta:
        ordering = ['sort_order']

class Color(models.Model):
    name = models.CharField(max_length=50)
    hex_code = models.CharField(max_length=7, null=True, blank=True)
    image = models.ImageField(upload_to='color_swatches/', null=True, blank=True)
    
    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.ForeignKey(Size, on_delete=models.CASCADE)
    color = models.ForeignKey(Color, on_delete=models.CASCADE)
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Pricing
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Inventory
    stock_quantity = models.PositiveIntegerField(default=0, db_index=True)
    reserved_quantity = models.PositiveIntegerField(default=0)  # For pending orders
    low_stock_threshold = models.PositiveIntegerField(default=5)
    
    # Status
    is_available = models.BooleanField(default=True)
    
    # Tracking
    total_sold = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.product.name} - {self.color.name} / {self.size.name}"
    
    @property
    def final_price(self):
        return self.product.base_price + self.price_adjustment
    
    @property
    def available_quantity(self):
        return max(0, self.stock_quantity - self.reserved_quantity)
    
    @property
    def is_low_stock(self):
        return self.available_quantity <= self.low_stock_threshold
    
    class Meta:
        unique_together = ['product', 'size', 'color']
        indexes = [
            models.Index(fields=['product', 'is_available']),
            models.Index(fields=['stock_quantity', 'is_available']),
        ]
