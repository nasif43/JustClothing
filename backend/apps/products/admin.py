from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg, Q
from .models import (
    Category, Collection, Product, ProductImage, ProductVariant,
    ProductAttributeType, ProductAttribute, ProductVariantAttribute, ProductVideo
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Category management with hierarchy support"""
    
    list_display = ['name', 'parent', 'product_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    
    def product_count(self, obj):
        return obj.products.filter(status='active').count()
    product_count.short_description = 'Active Products'
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            product_count=Count('products', filter=Q(products__status='active'))
        )


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    """Collection management"""
    
    list_display = ['name', 'product_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    
    def product_count(self, obj):
        return obj.products.filter(status='active').count()
    product_count.short_description = 'Active Products'


class ProductImageInline(admin.TabularInline):
    """Inline for product images"""
    model = ProductImage
    extra = 1
    max_num = 6  # Max 6 images as per frontend
    fields = ['image', 'alt_text', 'is_primary', 'sort_order']
    readonly_fields = ['image_preview']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "No image"
    image_preview.short_description = 'Preview'


class ProductVariantInline(admin.TabularInline):
    """Inline for product variants"""
    model = ProductVariant
    extra = 0
    fields = ['sku', 'size', 'color', 'price', 'stock_quantity', 'is_active']


class ProductAttributeInline(admin.TabularInline):
    """Inline for product attributes"""
    model = ProductAttribute
    extra = 0
    fields = ['attribute_type', 'value']


class ProductVideoInline(admin.TabularInline):
    """Inline for product videos"""
    model = ProductVideo
    extra = 0
    fields = ['video', 'thumbnail', 'title', 'sort_order']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Comprehensive product management"""
    
    list_display = [
        'name', 'seller_name', 'category', 'status_badge', 'price', 
        'stock_quantity', 'rating', 'sales_count', 'is_featured', 'created_at'
    ]
    list_filter = [
        'status', 'is_featured', 'category', 'collection', 'created_at',
        ('seller', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['name', 'description', 'seller__business_name']
    readonly_fields = ['views_count', 'sales_count', 'rating', 'review_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('seller', 'name', 'slug', 'description', 'short_description')
        }),
        ('Pricing', {
            'fields': ('price', 'base_price', 'compare_price', 'cost_price')
        }),
        ('Categorization', {
            'fields': ('category', 'collection', 'tags')
        }),
        ('Product Options', {
            'fields': ('availableSizes', 'availableColors', 'features'),
            'classes': ('collapse',)
        }),
        ('Custom Sizing', {
            'fields': ('offers_custom_sizes', 'custom_size_fields'),
            'classes': ('collapse',)
        }),
        ('Seller Options', {
            'fields': ('requires_advance_payment', 'estimated_pickup_days'),
            'classes': ('collapse',)
        }),
        ('Inventory', {
            'fields': ('track_inventory', 'stock_quantity', 'low_stock_threshold')
        }),
        ('Shipping', {
            'fields': ('requires_shipping', 'weight', 'shipping_days_min', 'shipping_days_max'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Status & Features', {
            'fields': ('status', 'is_featured', 'is_digital')
        }),
        ('Metrics', {
            'fields': ('views_count', 'sales_count', 'rating', 'review_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProductImageInline, ProductVariantInline, ProductAttributeInline, ProductVideoInline]
    
    actions = ['activate_products', 'deactivate_products', 'feature_products', 'unfeature_products']
    
    def status_badge(self, obj):
        colors = {
            'draft': 'gray',
            'active': 'green',
            'inactive': 'orange',
            'out_of_stock': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def seller_name(self, obj):
        return obj.seller.business_name
    seller_name.short_description = 'Seller'
    
    def activate_products(self, request, queryset):
        updated = queryset.update(status='active')
        self.message_user(request, f'{updated} products activated.')
    activate_products.short_description = "Activate selected products"
    
    def deactivate_products(self, request, queryset):
        updated = queryset.update(status='inactive')
        self.message_user(request, f'{updated} products deactivated.')
    deactivate_products.short_description = "Deactivate selected products"
    
    def feature_products(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} products featured.')
    feature_products.short_description = "Feature selected products"
    
    def unfeature_products(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} products unfeatured.')
    unfeature_products.short_description = "Unfeature selected products"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('seller', 'category', 'collection')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Product image management"""
    
    list_display = ['product_name', 'image_preview', 'is_primary', 'sort_order']
    list_filter = ['is_primary', 'product__category']
    search_fields = ['product__name', 'alt_text']
    raw_id_fields = ['product']
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "No image"
    image_preview.short_description = 'Preview'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """Product variant management"""
    
    list_display = ['product_name', 'sku', 'size', 'color', 'price', 'stock_quantity', 'is_active']
    list_filter = ['is_active', 'size', 'color', 'product__category']
    search_fields = ['product__name', 'sku', 'size', 'color']
    raw_id_fields = ['product']
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'


@admin.register(ProductAttributeType)
class ProductAttributeTypeAdmin(admin.ModelAdmin):
    """Product attribute type management"""
    
    list_display = ['name', 'input_type', 'is_required', 'is_variant_attribute', 'created_at']
    list_filter = ['input_type', 'is_required', 'is_variant_attribute']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at']


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    """Product attribute management"""
    
    list_display = ['product', 'attribute_type', 'value_preview']
    list_filter = ['attribute_type', 'product__category']
    search_fields = ['product__name', 'attribute_type__name', 'value']
    raw_id_fields = ['product', 'attribute_type']
    
    def value_preview(self, obj):
        if len(obj.value) > 50:
            return obj.value[:50] + '...'
        return obj.value
    value_preview.short_description = 'Value'


@admin.register(ProductVariantAttribute)
class ProductVariantAttributeAdmin(admin.ModelAdmin):
    """Product variant attribute management"""
    
    list_display = ['variant', 'attribute_type', 'value']
    list_filter = ['attribute_type']
    search_fields = ['variant__product__name', 'attribute_type__name', 'value']
    raw_id_fields = ['variant', 'attribute_type']


@admin.register(ProductVideo)
class ProductVideoAdmin(admin.ModelAdmin):
    """Product video management"""
    
    list_display = ['product', 'title', 'video_preview', 'sort_order', 'created_at']
    list_filter = ['created_at', 'product__category']
    search_fields = ['product__name', 'title', 'description']
    raw_id_fields = ['product']
    readonly_fields = ['created_at']
    
    def video_preview(self, obj):
        if obj.thumbnail:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.thumbnail.url)
        return "No thumbnail"
    video_preview.short_description = 'Thumbnail'
