from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from .models import (
    ShippingZone, ShippingMethod, ShippingRate, ShippingCarrier,
    ShippingLabel, DeliveryAttempt, ShippingSettings
)


class ShippingRateInline(admin.TabularInline):
    """Inline for shipping rates"""
    model = ShippingRate
    extra = 0
    fields = ['min_weight', 'max_weight', 'min_value', 'max_value', 'rate', 'is_active']


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    """Shipping zone management"""
    
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Zone Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Geographic Coverage', {
            'fields': ('countries', 'states', 'cities', 'postal_codes'),
            'description': 'JSON arrays of geographic areas covered by this zone'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ShippingRateInline]
    
    actions = ['activate_zones', 'deactivate_zones']
    
    def activate_zones(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} shipping zones activated.')
    activate_zones.short_description = "Activate selected zones"
    
    def deactivate_zones(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} shipping zones deactivated.')
    deactivate_zones.short_description = "Deactivate selected zones"


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    """Shipping method management"""
    
    list_display = [
        'name', 'method_type', 'min_delivery_days', 'max_delivery_days', 'is_active'
    ]
    list_filter = ['method_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Method Information', {
            'fields': ('name', 'description', 'method_type', 'is_active')
        }),
        ('Delivery Estimates', {
            'fields': ('min_delivery_days', 'max_delivery_days')
        }),
        ('Restrictions', {
            'fields': ('max_weight', 'max_dimensions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_methods', 'deactivate_methods']
    
    def activate_methods(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} shipping methods activated.')
    activate_methods.short_description = "Activate selected methods"
    
    def deactivate_methods(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} shipping methods deactivated.')
    deactivate_methods.short_description = "Deactivate selected methods"


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    """Shipping rate management"""
    
    list_display = [
        'zone', 'method', 'calculation_type', 'base_rate', 'is_active'
    ]
    list_filter = [
        'calculation_type', 'is_active', 'created_at',
        ('zone', admin.RelatedOnlyFieldListFilter),
        ('method', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['zone__name', 'method__name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['zone', 'method']
    
    fieldsets = (
        ('Rate Configuration', {
            'fields': ('zone', 'method', 'calculation_type', 'base_rate', 'is_active')
        }),
        ('Weight-Based Rates', {
            'fields': ('rate_per_kg', 'free_shipping_threshold'),
            'classes': ('collapse',)
        }),
        ('Price-Based Rates', {
            'fields': ('price_tiers',),
            'classes': ('collapse',)
        }),
        ('Order Value Limits', {
            'fields': ('min_order_value', 'max_order_value'),
            'classes': ('collapse',)
        }),
        ('Additional Charges', {
            'fields': ('handling_fee', 'fuel_surcharge'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_rates', 'deactivate_rates']
    
    def activate_rates(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} shipping rates activated.')
    activate_rates.short_description = "Activate selected rates"
    
    def deactivate_rates(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} shipping rates deactivated.')
    deactivate_rates.short_description = "Deactivate selected rates"


@admin.register(ShippingCarrier)
class ShippingCarrierAdmin(admin.ModelAdmin):
    """Shipping carrier management"""
    
    list_display = ['name', 'code', 'api_enabled', 'is_active', 'created_at']
    list_filter = ['api_enabled', 'is_active', 'created_at']
    search_fields = ['name', 'code', 'website']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Carrier Information', {
            'fields': ('name', 'code', 'website', 'phone', 'email', 'is_active')
        }),
        ('API Integration', {
            'fields': ('api_enabled', 'api_credentials', 'tracking_url_template'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_carriers', 'deactivate_carriers']
    
    def activate_carriers(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} carriers activated.')
    activate_carriers.short_description = "Activate selected carriers"
    
    def deactivate_carriers(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} carriers deactivated.')
    deactivate_carriers.short_description = "Deactivate selected carriers"


class DeliveryAttemptInline(admin.TabularInline):
    """Inline for delivery attempts"""
    model = DeliveryAttempt
    extra = 0
    readonly_fields = ['attempted_at']
    fields = ['attempted_at', 'status', 'notes', 'next_attempt_date']


@admin.register(ShippingLabel)
class ShippingLabelAdmin(admin.ModelAdmin):
    """Shipping label management"""
    
    list_display = [
        'order', 'carrier', 'tracking_number', 'status_badge', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'shipped_at', 'delivered_at',
        ('carrier', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['tracking_number', 'order__id']
    readonly_fields = ['created_at']
    raw_id_fields = ['order', 'carrier', 'method']
    
    fieldsets = (
        ('Label Information', {
            'fields': ('order', 'carrier', 'method', 'tracking_number', 'tracking_url')
        }),
        ('Label File', {
            'fields': ('label_file', 'label_format')
        }),
        ('Shipping Details', {
            'fields': ('weight', 'dimensions', 'declared_value')
        }),
        ('Status & Dates', {
            'fields': ('status', 'created_at', 'shipped_at', 'delivered_at')
        }),
        ('Insurance & Services', {
            'fields': ('is_insured', 'insurance_amount', 'requires_signature'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [DeliveryAttemptInline]
    
    actions = ['mark_shipped', 'mark_delivered']
    
    def status_badge(self, obj):
        colors = {
            'created': 'blue',
            'printed': 'orange',
            'shipped': 'green',
            'delivered': 'darkgreen',
            'returned': 'red',
            'cancelled': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def mark_shipped(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='shipped', shipped_at=timezone.now())
        self.message_user(request, f'{updated} labels marked as shipped.')
    mark_shipped.short_description = "Mark as shipped"
    
    def mark_delivered(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='delivered', delivered_at=timezone.now())
        self.message_user(request, f'{updated} labels marked as delivered.')
    mark_delivered.short_description = "Mark as delivered"


@admin.register(DeliveryAttempt)
class DeliveryAttemptAdmin(admin.ModelAdmin):
    """Delivery attempt tracking"""
    
    list_display = [
        'label', 'attempt_number', 'status', 'attempted_at', 'created_at'
    ]
    list_filter = ['status', 'attempted_at', 'created_at']
    search_fields = ['label__tracking_number', 'notes', 'delivered_to']
    readonly_fields = ['created_at']
    raw_id_fields = ['label']
    
    fieldsets = (
        ('Attempt Information', {
            'fields': ('label', 'attempt_number', 'status', 'attempted_at')
        }),
        ('Details', {
            'fields': ('notes', 'next_attempt_scheduled')
        }),
        ('Delivery Info', {
            'fields': ('delivered_to', 'signature_required', 'signature_obtained'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('label')


@admin.register(ShippingSettings)
class ShippingSettingsAdmin(admin.ModelAdmin):
    """Global shipping settings"""
    
    list_display = [
        'default_weight_unit', 'default_dimension_unit', 'processing_days', 
        'send_shipping_notifications', 'created_at'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Default Units', {
            'fields': ('default_weight_unit', 'default_dimension_unit')
        }),
        ('Packaging', {
            'fields': ('default_package_weight', 'auto_calculate_dimensions')
        }),
        ('Free Shipping', {
            'fields': ('global_free_shipping_threshold', 'free_shipping_message')
        }),
        ('Delivery Estimates', {
            'fields': ('processing_days', 'weekend_delivery', 'holiday_delivery')
        }),
        ('Notifications', {
            'fields': ('send_shipping_notifications', 'send_delivery_notifications')
        }),
        ('Admin Contact', {
            'fields': ('shipping_admin_email', 'shipping_admin_phone'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not ShippingSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion of settings
        return False
