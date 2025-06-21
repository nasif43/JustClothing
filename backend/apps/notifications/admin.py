from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import AdminNotification, UserNotification, NotificationSettings


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    """Admin notification management"""
    
    list_display = [
        'title', 'type', 'priority_badge', 'is_read', 
        'is_resolved', 'created_at'
    ]
    list_filter = [
        'type', 'priority', 'is_read', 'is_resolved', 'created_at'
    ]
    search_fields = ['title', 'message']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('type', 'title', 'message', 'priority')
        }),
        ('Status', {
            'fields': ('is_read', 'is_resolved', 'resolved_by', 'resolved_at', 'resolution_notes')
        }),
        ('Data', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread', 'mark_as_resolved']
    
    def priority_badge(self, obj):
        colors = {
            'low': 'green',
            'medium': 'orange',
            'high': 'red',
            'critical': 'darkred'
        }
        color = colors.get(obj.priority, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark as Read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark as Unread"
    
    def mark_as_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_resolved=True, resolved_at=timezone.now())
        self.message_user(request, f'{updated} notifications marked as resolved.')
    mark_as_resolved.short_description = "Mark as Resolved"


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    """User notification management"""
    
    list_display = [
        'user', 'title', 'type', 'is_read', 'created_at'
    ]
    list_filter = [
        'type', 'is_read', 'created_at',
        ('user', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['created_at']
    raw_id_fields = ['user', 'related_order', 'related_product']
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('user', 'type', 'title', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Related Objects', {
            'fields': ('related_order', 'related_product'),
            'classes': ('collapse',)
        }),
        ('Data', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark as Read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark as Unread"


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    """Notification settings management"""
    
    list_display = [
        'user', 'email_order_updates', 'email_marketing', 
        'app_order_updates', 'sms_order_updates', 'created_at'
    ]
    list_filter = [
        'email_order_updates', 'email_marketing', 'app_order_updates',
        'sms_order_updates', 'seller_new_orders', 'created_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Notifications', {
            'fields': ('email_order_updates', 'email_marketing', 'email_product_updates', 'email_review_requests')
        }),
        ('In-App Notifications', {
            'fields': ('app_order_updates', 'app_marketing', 'app_product_updates', 'app_review_requests')
        }),
        ('SMS Notifications', {
            'fields': ('sms_order_updates', 'sms_delivery_updates'),
            'classes': ('collapse',)
        }),
        ('Seller Notifications', {
            'fields': ('seller_low_stock_alerts', 'seller_new_orders', 'seller_review_alerts', 'seller_performance_reports'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['enable_all_notifications', 'disable_all_notifications']
    
    def enable_all_notifications(self, request, queryset):
        updated = queryset.update(
            email_order_updates=True,
            email_marketing=True,
            app_order_updates=True,
            sms_order_updates=True,
            seller_new_orders=True
        )
        self.message_user(request, f'{updated} users had notifications enabled.')
    enable_all_notifications.short_description = "Enable key notifications"
    
    def disable_all_notifications(self, request, queryset):
        updated = queryset.update(
            email_order_updates=False,
            email_marketing=False,
            app_order_updates=False,
            sms_order_updates=False,
            seller_new_orders=False
        )
        self.message_user(request, f'{updated} users had notifications disabled.')
    disable_all_notifications.short_description = "Disable all notifications"
