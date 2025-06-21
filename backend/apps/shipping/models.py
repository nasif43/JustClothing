from django.db import models
from django.contrib.auth import get_user_model
from djmoney.models.fields import MoneyField
from django.core.validators import MinValueValidator
import uuid

User = get_user_model()


class ShippingZone(models.Model):
    """Shipping zones for different geographical areas"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    countries = models.JSONField(default=list, help_text="List of countries in this zone")
    states = models.JSONField(default=list, help_text="List of states/provinces")
    cities = models.JSONField(default=list, help_text="List of cities")
    postal_codes = models.JSONField(default=list, help_text="List of postal code patterns")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shipping_zones'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def matches_address(self, country, state, city, postal_code):
        """Check if an address falls within this shipping zone"""
        if self.countries and country not in self.countries:
            return False
        if self.states and state not in self.states:
            return False
        if self.cities and city not in self.cities:
            return False
        if self.postal_codes:
            # Simple pattern matching for postal codes
            for pattern in self.postal_codes:
                if postal_code.startswith(pattern):
                    return True
            return False
        return True


class ShippingMethod(models.Model):
    """Different shipping methods available"""
    
    METHOD_TYPE = (
        ('standard', 'Standard Delivery'),
        ('express', 'Express Delivery'),
        ('overnight', 'Overnight Delivery'),
        ('pickup', 'Store Pickup'),
        ('free', 'Free Shipping'),
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    method_type = models.CharField(max_length=20, choices=METHOD_TYPE)
    
    # Delivery time estimates
    min_delivery_days = models.PositiveIntegerField(default=1)
    max_delivery_days = models.PositiveIntegerField(default=7)
    
    # Restrictions
    max_weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Maximum weight in kg")
    max_dimensions = models.JSONField(null=True, blank=True, help_text="Max dimensions as {length, width, height}")
    
    # Availability
    zones = models.ManyToManyField(ShippingZone, through='ShippingRate', related_name='shipping_methods')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shipping_methods'
        indexes = [
            models.Index(fields=['method_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name


class ShippingRate(models.Model):
    """Shipping rates for different zones and methods - Admin managed"""
    
    CALCULATION_TYPE = (
        ('flat', 'Flat Rate'),
        ('weight_based', 'Weight Based'),
        ('price_based', 'Price Based'),
        ('item_based', 'Per Item'),
        ('free', 'Free'),
    )
    
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='shipping_rates')
    method = models.ForeignKey(ShippingMethod, on_delete=models.CASCADE, related_name='rates')
    
    # Rate calculation
    calculation_type = models.CharField(max_length=15, choices=CALCULATION_TYPE)
    base_rate = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', default=0)
    
    # Weight-based rates
    rate_per_kg = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    free_shipping_threshold = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    
    # Price-based rates
    price_tiers = models.JSONField(default=list, blank=True, help_text="Price tiers with rates")
    
    # Minimum/Maximum order values
    min_order_value = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    max_order_value = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    
    # Additional charges
    handling_fee = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', default=0)
    fuel_surcharge = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shipping_rates'
        unique_together = [['zone', 'method']]
        indexes = [
            models.Index(fields=['zone', 'method', 'is_active']),
            models.Index(fields=['calculation_type']),
        ]
    
    def __str__(self):
        return f"{self.method.name} - {self.zone.name}: {self.base_rate}"
    
    def calculate_shipping_cost(self, order_value, total_weight, item_count):
        """Calculate shipping cost based on order details"""
        if not self.is_active:
            return 0
        
        # Check order value limits
        if self.min_order_value and order_value < self.min_order_value:
            return None  # Not applicable
        if self.max_order_value and order_value > self.max_order_value:
            return None  # Not applicable
        
        cost = self.base_rate
        
        if self.calculation_type == 'flat':
            cost = self.base_rate
        
        elif self.calculation_type == 'weight_based' and self.rate_per_kg:
            cost = self.base_rate + (total_weight * self.rate_per_kg)
        
        elif self.calculation_type == 'price_based' and self.price_tiers:
            # Find applicable price tier
            for tier in sorted(self.price_tiers, key=lambda x: x.get('min_value', 0)):
                if order_value >= tier.get('min_value', 0):
                    cost = tier.get('rate', self.base_rate)
        
        elif self.calculation_type == 'item_based':
            cost = self.base_rate * item_count
        
        elif self.calculation_type == 'free':
            cost = 0
        
        # Add additional charges
        cost += self.handling_fee + self.fuel_surcharge
        
        # Check free shipping threshold
        if self.free_shipping_threshold and order_value >= self.free_shipping_threshold:
            cost = 0
        
        return max(cost, 0)  # Ensure non-negative


class ShippingCarrier(models.Model):
    """Third-party shipping carriers"""
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # API integration
    api_enabled = models.BooleanField(default=False)
    api_credentials = models.JSONField(default=dict, blank=True)
    tracking_url_template = models.CharField(max_length=500, blank=True, help_text="URL template with {tracking_number} placeholder")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'shipping_carriers'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_tracking_url(self, tracking_number):
        """Generate tracking URL for a tracking number"""
        if self.tracking_url_template and tracking_number:
            return self.tracking_url_template.format(tracking_number=tracking_number)
        return None


class ShippingLabel(models.Model):
    """Shipping labels for orders"""
    
    LABEL_STATUS = (
        ('created', 'Created'),
        ('printed', 'Printed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='shipping_labels')
    carrier = models.ForeignKey(ShippingCarrier, on_delete=models.CASCADE, related_name='shipping_labels')
    method = models.ForeignKey(ShippingMethod, on_delete=models.CASCADE)
    
    # Tracking information
    tracking_number = models.CharField(max_length=100, unique=True, blank=True)
    tracking_url = models.URLField(blank=True)
    
    # Label details
    label_file = models.FileField(upload_to='shipping/labels/', blank=True)
    label_format = models.CharField(max_length=10, choices=[('pdf', 'PDF'), ('png', 'PNG'), ('zpl', 'ZPL')], default='pdf')
    
    # Shipping details
    weight = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    dimensions = models.JSONField(null=True, blank=True, help_text="Dimensions as {length, width, height}")
    declared_value = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    
    # Status and dates
    status = models.CharField(max_length=15, choices=LABEL_STATUS, default='created')
    created_at = models.DateTimeField(auto_now_add=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Insurance and special services
    is_insured = models.BooleanField(default=False)
    insurance_amount = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    requires_signature = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'shipping_labels'
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['tracking_number']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Label for Order {self.order.order_number} - {self.tracking_number}"
    
    def save(self, *args, **kwargs):
        # Generate tracking URL if not provided
        if self.tracking_number and not self.tracking_url:
            self.tracking_url = self.carrier.get_tracking_url(self.tracking_number)
        super().save(*args, **kwargs)


class DeliveryAttempt(models.Model):
    """Track delivery attempts"""
    
    ATTEMPT_STATUS = (
        ('successful', 'Delivered Successfully'),
        ('failed', 'Delivery Failed'),
        ('rescheduled', 'Rescheduled'),
        ('returned', 'Returned to Sender'),
    )
    
    label = models.ForeignKey(ShippingLabel, on_delete=models.CASCADE, related_name='delivery_attempts')
    attempt_number = models.PositiveIntegerField()
    status = models.CharField(max_length=15, choices=ATTEMPT_STATUS)
    
    attempted_at = models.DateTimeField()
    notes = models.TextField(blank=True)
    next_attempt_scheduled = models.DateTimeField(null=True, blank=True)
    
    # Delivery details
    delivered_to = models.CharField(max_length=200, blank=True)
    signature_required = models.BooleanField(default=False)
    signature_obtained = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_attempts'
        unique_together = [['label', 'attempt_number']]
        indexes = [
            models.Index(fields=['label', 'attempted_at']),
            models.Index(fields=['status']),
        ]
        ordering = ['attempt_number']
    
    def __str__(self):
        return f"Attempt {self.attempt_number} for {self.label.tracking_number} - {self.get_status_display()}"


class ShippingSettings(models.Model):
    """Global shipping settings managed by admin"""
    
    # Default settings
    default_weight_unit = models.CharField(max_length=5, choices=[('kg', 'Kilograms'), ('lb', 'Pounds')], default='kg')
    default_dimension_unit = models.CharField(max_length=5, choices=[('cm', 'Centimeters'), ('in', 'Inches')], default='cm')
    
    # Packaging
    default_package_weight = models.DecimalField(max_digits=5, decimal_places=2, default=0.1, help_text="Default packaging weight")
    auto_calculate_dimensions = models.BooleanField(default=True)
    
    # Free shipping
    global_free_shipping_threshold = MoneyField(max_digits=10, decimal_places=2, default_currency='BDT', null=True, blank=True)
    free_shipping_message = models.CharField(max_length=200, blank=True)
    
    # Delivery estimates
    processing_days = models.PositiveIntegerField(default=1, help_text="Days to process orders before shipping")
    weekend_delivery = models.BooleanField(default=False)
    holiday_delivery = models.BooleanField(default=False)
    
    # Notifications
    send_shipping_notifications = models.BooleanField(default=True)
    send_delivery_notifications = models.BooleanField(default=True)
    
    # Admin contact
    shipping_admin_email = models.EmailField(blank=True)
    shipping_admin_phone = models.CharField(max_length=20, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shipping_settings'
        verbose_name = 'Shipping Settings'
        verbose_name_plural = 'Shipping Settings'
    
    def __str__(self):
        return "Shipping Settings"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and ShippingSettings.objects.exists():
            raise ValueError("Only one ShippingSettings instance is allowed")
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the shipping settings instance"""
        settings, created = cls.objects.get_or_create(defaults={})
        return settings
