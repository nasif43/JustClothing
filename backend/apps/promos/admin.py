from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from django.utils import timezone
from .models import (
    Promotion, PromoCode, PromoUsage, PromotionalCampaign,
    PromoRequest, FeaturedPromo, PromoImpression, SellerPromoRequest
)


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    """Promotion management"""
    
    list_display = [
        'name', 'promotion_type', 'status_badge', 'usage_count', 
        'start_date', 'end_date', 'is_featured'
    ]
    list_filter = [
        'promotion_type', 'status', 'is_featured',
        'start_date', 'end_date', 'created_at'
    ]
    search_fields = ['name', 'description']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'promotion_type')
        }),
        ('Discount Details', {
            'fields': ('discount_percentage', 'discount_amount', 'buy_quantity', 'get_quantity')
        }),
        ('Requirements', {
            'fields': ('minimum_order_amount', 'minimum_quantity')
        }),
        ('Usage Limits', {
            'fields': ('usage_limit', 'usage_limit_per_customer', 'usage_count')
        }),
        ('Validity', {
            'fields': ('start_date', 'end_date', 'status')
        }),
        ('Applicability', {
            'fields': ('applicable_products', 'applicable_categories', 'applicable_sellers'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_featured', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['applicable_categories', 'applicable_products', 'applicable_sellers']
    raw_id_fields = ['created_by']
    
    actions = ['activate_promotions', 'deactivate_promotions', 'feature_promotions']
    
    def status_badge(self, obj):
        colors = {
            'draft': 'gray',
            'active': 'green',
            'paused': 'orange',
            'expired': 'red',
            'completed': 'blue'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def activate_promotions(self, request, queryset):
        updated = queryset.update(status='active')
        self.message_user(request, f'{updated} promotions activated.')
    activate_promotions.short_description = "Activate selected promotions"
    
    def deactivate_promotions(self, request, queryset):
        updated = queryset.update(status='paused')
        self.message_user(request, f'{updated} promotions paused.')
    deactivate_promotions.short_description = "Pause selected promotions"
    
    def feature_promotions(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} promotions featured.')
    feature_promotions.short_description = "Feature selected promotions"


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    """Promo code management"""
    
    list_display = [
        'code', 'promotion', 'usage_count', 'usage_limit', 'is_active', 'created_at'
    ]
    list_filter = [
        'is_active', 'created_at',
        ('promotion', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['code', 'promotion__name']
    readonly_fields = ['usage_count', 'created_at']
    raw_id_fields = ['promotion']
    
    fieldsets = (
        ('Code Information', {
            'fields': ('code', 'promotion')
        }),
        ('Usage Settings', {
            'fields': ('usage_limit', 'usage_count', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_codes', 'deactivate_codes']
    
    def activate_codes(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} promo codes activated.')
    activate_codes.short_description = "Activate selected codes"
    
    def deactivate_codes(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} promo codes deactivated.')
    deactivate_codes.short_description = "Deactivate selected codes"


@admin.register(PromoUsage)
class PromoUsageAdmin(admin.ModelAdmin):
    """Promo usage tracking"""
    
    list_display = [
        'user', 'promotion', 'promo_code', 'discount_amount', 'used_at'
    ]
    list_filter = [
        'used_at', 
        ('promotion', admin.RelatedOnlyFieldListFilter),
        ('user', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = [
        'user__email', 'promotion__name', 'promo_code__code'
    ]
    readonly_fields = ['used_at']
    raw_id_fields = ['user', 'promotion', 'promo_code', 'order']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'promotion', 'promo_code'
        )


@admin.register(PromotionalCampaign)
class PromotionalCampaignAdmin(admin.ModelAdmin):
    """Promotional campaign management"""
    
    list_display = [
        'name', 'seller', 'status_badge', 'start_date', 'end_date', 'budget'
    ]
    list_filter = [
        'status', 'start_date', 'end_date', 'created_at'
    ]
    search_fields = ['name', 'description', 'seller__business_name']
    readonly_fields = ['impressions', 'clicks', 'conversions', 'created_at', 'updated_at']
    raw_id_fields = ['seller', 'approved_by']
    
    fieldsets = (
        ('Campaign Details', {
            'fields': ('seller', 'name', 'description', 'budget')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date')
        }),
        ('Targeting', {
            'fields': ('target_products', 'target_categories'),
            'classes': ('collapse',)
        }),
        ('Status & Approval', {
            'fields': ('status', 'approved_by', 'approved_at', 'rejection_reason')
        }),
        ('Performance', {
            'fields': ('impressions', 'clicks', 'conversions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['target_products', 'target_categories']
    
    actions = ['approve_campaigns', 'reject_campaigns']
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'blue',
            'active': 'green',
            'paused': 'yellow',
            'completed': 'gray',
            'rejected': 'red'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_campaigns(self, request, queryset):
        updated = queryset.update(
            status='approved',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} campaigns approved.')
    approve_campaigns.short_description = "Approve selected campaigns"
    
    def reject_campaigns(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} campaigns rejected.')
    reject_campaigns.short_description = "Reject selected campaigns"


@admin.register(PromoRequest)
class PromoRequestAdmin(admin.ModelAdmin):
    """Promotion request management"""
    
    list_display = [
        'seller', 'request_type', 'title', 'status_badge', 'created_at'
    ]
    list_filter = [
        'request_type', 'status', 'created_at',
        ('seller', admin.RelatedOnlyFieldListFilter),
        ('reviewed_by', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = ['seller__business_name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['seller', 'reviewed_by']
    
    fieldsets = (
        ('Request Details', {
            'fields': ('seller', 'request_type', 'title', 'description')
        }),
        ('Campaign Settings', {
            'fields': ('budget', 'duration_days', 'media_files')
        }),
        ('Targeting', {
            'fields': ('target_products',),
            'classes': ('collapse',)
        }),
        ('Review', {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'review_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['target_products']
    
    actions = ['approve_requests', 'reject_requests']
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'completed': 'blue'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_requests(self, request, queryset):
        updated = queryset.update(
            status='approved',
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{updated} requests approved.')
    approve_requests.short_description = "Approve selected requests"
    
    def reject_requests(self, request, queryset):
        updated = queryset.update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{updated} requests rejected.')
    reject_requests.short_description = "Reject selected requests"


@admin.register(FeaturedPromo)
class FeaturedPromoAdmin(admin.ModelAdmin):
    """Featured promotion management"""
    
    list_display = [
        'promo_code', 'placement', 'priority', 'is_active', 
        'promotion_start', 'promotion_end'
    ]
    list_filter = ['is_active', 'placement', 'promotion_start', 'promotion_end', 'created_at']
    search_fields = ['promo_code__code', 'promo_code__promotion__name']
    readonly_fields = ['current_impressions', 'current_clicks', 'created_at']
    raw_id_fields = ['promo_code', 'created_by']
    
    fieldsets = (
        ('Featured Promotion', {
            'fields': ('promo_code', 'placement', 'priority', 'is_active')
        }),
        ('Display Period', {
            'fields': ('promotion_start', 'promotion_end')
        }),
        ('Budget & Limits', {
            'fields': ('daily_budget', 'max_impressions', 'current_impressions', 'max_clicks', 'current_clicks'),
            'classes': ('collapse',)
        }),
        ('Targeting', {
            'fields': ('target_user_interests',),
            'classes': ('collapse',)
        }),
        ('Management', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['target_user_interests']
    
    actions = ['activate_featured', 'deactivate_featured']
    
    def activate_featured(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} featured promotions activated.')
    activate_featured.short_description = "Activate selected featured promos"
    
    def deactivate_featured(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} featured promotions deactivated.')
    deactivate_featured.short_description = "Deactivate selected featured promos"


@admin.register(PromoImpression)
class PromoImpressionAdmin(admin.ModelAdmin):
    """Promotion impression tracking"""
    
    list_display = ['featured_promo', 'user', 'viewed_at', 'clicked_at']
    list_filter = [
        'viewed_at', 'clicked_at',
        ('featured_promo', admin.RelatedOnlyFieldListFilter),
        ('user', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = ['featured_promo__promo_code__code', 'user__email', 'user_agent']
    readonly_fields = ['viewed_at']
    raw_id_fields = ['featured_promo', 'user']
    
    fieldsets = (
        ('Impression Details', {
            'fields': ('featured_promo', 'user', 'session_key')
        }),
        ('Analytics', {
            'fields': ('user_agent', 'ip_address', 'referrer'),
            'classes': ('collapse',)
        }),
        ('Actions', {
            'fields': ('viewed_at', 'clicked_at', 'converted_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('featured_promo', 'user')


@admin.register(SellerPromoRequest)
class SellerPromoRequestAdmin(admin.ModelAdmin):
    """Seller promotion request management"""
    
    list_display = [
        'seller', 'requested_code', 'requested_type', 'status_badge', 'created_at'
    ]
    list_filter = [
        'requested_type', 'status', 'created_at',
        ('seller', admin.RelatedOnlyFieldListFilter),
        ('reviewed_by', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = ['seller__business_name', 'requested_code', 'requested_name']
    readonly_fields = ['created_at']
    raw_id_fields = ['seller', 'reviewed_by', 'created_promo']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('seller', 'requested_code', 'requested_name', 'requested_description')
        }),
        ('Promotion Details', {
            'fields': (
                'requested_type', 'requested_discount_percentage', 'requested_discount_amount',
                'requested_minimum_order_amount', 'requested_usage_limit'
            )
        }),
        ('Timing', {
            'fields': ('requested_start_date', 'requested_end_date')
        }),
        ('Review & Approval', {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'review_notes')
        }),
        ('Created Promotion', {
            'fields': ('created_promo',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_seller_requests', 'reject_seller_requests']
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'expired': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_seller_requests(self, request, queryset):
        updated = queryset.update(
            status='approved',
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{updated} seller requests approved.')
    approve_seller_requests.short_description = "Approve selected requests"
    
    def reject_seller_requests(self, request, queryset):
        updated = queryset.update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f'{updated} seller requests rejected.')
    reject_seller_requests.short_description = "Reject selected requests"
