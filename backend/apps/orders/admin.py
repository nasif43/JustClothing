from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import Order, OrderItem, OrderStatusHistory, Cart, CartItem, Wishlist, WishlistItem


class OrderItemInline(admin.TabularInline):
    """Inline for order items"""
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']
    fields = ['product', 'title', 'size', 'color', 'quantity', 'unit_price', 'total_price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Comprehensive order management"""
    
    list_display = [
        'id', 'customer_name', 'status_badge', 'payment_method', 
        'total_amount', 'total_items', 'created_at'
    ]
    list_filter = [
        'status', 'payment_method', 'created_at', 'updated_at'
    ]
    search_fields = ['id', 'customer_name', 'customer_email', 'customer_phone']
    readonly_fields = ['id', 'placedOn', 'time', 'placedTime', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'user', 'status', 'payment_method')
        }),
        ('Customer Details', {
            'fields': ('customer_name', 'customer_email', 'customer_phone', 'customer_address')
        }),
        ('Order Amounts', {
            'fields': ('total_amount', 'bill')
        }),
        ('Timestamps', {
            'fields': ('placedOn', 'time', 'placedTime', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [OrderItemInline]
    
    actions = ['mark_processing', 'mark_shipped', 'mark_delivered', 'mark_cancelled']
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'processing': 'blue',
            'shipped': 'purple',
            'delivered': 'green',
            'cancelled': 'red',
            'refunded': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def total_items(self, obj):
        return obj.items.count()
    total_items.short_description = 'Total Items'
    
    def mark_processing(self, request, queryset):
        updated = queryset.update(status='processing')
        self.message_user(request, f'{updated} orders marked as processing.')
    mark_processing.short_description = "Mark as Processing"
    
    def mark_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'{updated} orders marked as shipped.')
    mark_shipped.short_description = "Mark as Shipped"
    
    def mark_delivered(self, request, queryset):
        updated = queryset.update(status='delivered')
        self.message_user(request, f'{updated} orders marked as delivered.')
    mark_delivered.short_description = "Mark as Delivered"
    
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} orders marked as cancelled.')
    mark_cancelled.short_description = "Mark as Cancelled"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Order item management"""
    
    list_display = ['order_id', 'title', 'size', 'color', 'quantity', 'unit_price', 'total_price']
    list_filter = ['size', 'color', 'created_at']
    search_fields = ['title', 'product__name', 'order__id']
    raw_id_fields = ['order', 'product']
    readonly_fields = ['total_price']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    """Order status change tracking"""
    
    list_display = ['order', 'order_item', 'previous_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['previous_status', 'new_status', 'created_at']
    search_fields = ['order__id', 'reason', 'notes']
    readonly_fields = ['created_at']
    raw_id_fields = ['order', 'order_item', 'changed_by']


class CartItemInline(admin.TabularInline):
    """Inline for cart items"""
    model = CartItem
    extra = 0
    readonly_fields = ['total_price', 'unit_price']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Shopping cart management"""
    
    list_display = ['user', 'total_items', 'total_price', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    inlines = [CartItemInline]
    
    def total_items(self, obj):
        return obj.total_items
    total_items.short_description = 'Total Items'
    
    def total_price(self, obj):
        return obj.total_price
    total_price.short_description = 'Total Price'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """Cart item management"""
    
    list_display = ['cart_user', 'product', 'size', 'color', 'quantity', 'unit_price', 'total_price']
    list_filter = ['size', 'color', 'created_at']
    search_fields = ['product__name', 'cart__user__email']
    readonly_fields = ['total_price', 'unit_price']
    raw_id_fields = ['cart', 'product']
    
    def cart_user(self, obj):
        return obj.cart.user.email
    cart_user.short_description = 'User'


class WishlistItemInline(admin.TabularInline):
    """Inline for wishlist items"""
    model = WishlistItem
    extra = 0
    readonly_fields = ['added_at']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    """Wishlist management"""
    
    list_display = ['user', 'item_count', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    inlines = [WishlistItemInline]
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    """Wishlist item management"""
    
    list_display = ['wishlist_user', 'product', 'added_at']
    list_filter = ['added_at']
    search_fields = ['product__name', 'wishlist__user__email']
    readonly_fields = ['added_at']
    raw_id_fields = ['wishlist', 'product']
    
    def wishlist_user(self, obj):
        return obj.wishlist.user.email
    wishlist_user.short_description = 'User'
