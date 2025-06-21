from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from .models import Review, ReviewImage, ReviewVote, ReviewReport, SellerReview


class ReviewImageInline(admin.TabularInline):
    """Inline for review images"""
    model = ReviewImage
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Product and seller review management"""
    
    list_display = [
        'user', 'product', 'seller', 'rating_stars', 'is_approved', 'created_at'
    ]
    list_filter = [
        'rating', 'is_approved', 'is_featured', 'review_type', 'created_at',
        ('product', admin.RelatedOnlyFieldListFilter),
        ('seller', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['user__email', 'content', 'product__name', 'seller__business_name']
    readonly_fields = ['created_at', 'updated_at', 'createdAt', 'productId']
    raw_id_fields = ['user', 'product', 'seller', 'order', 'moderated_by']
    
    fieldsets = (
        ('Review Details', {
            'fields': ('user', 'product', 'seller', 'order', 'review_type')
        }),
        ('Content', {
            'fields': ('rating', 'content')
        }),
        ('Frontend Compatibility', {
            'fields': ('productId', 'createdAt'),
            'classes': ('collapse',)
        }),
        ('Moderation', {
            'fields': ('is_approved', 'is_featured', 'moderated_by', 'moderated_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ReviewImageInline]
    actions = ['approve_reviews', 'unapprove_reviews', 'feature_reviews']
    
    def rating_stars(self, obj):
        stars = '⭐' * obj.rating
        return format_html('<span title="{} stars">{}</span>', obj.rating, stars)
    rating_stars.short_description = 'Rating'
    
    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} reviews approved.')
    approve_reviews.short_description = "Approve selected reviews"
    
    def unapprove_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} reviews unapproved.')
    unapprove_reviews.short_description = "Unapprove selected reviews"
    
    def feature_reviews(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} reviews featured.')
    feature_reviews.short_description = "Feature selected reviews"


@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    """Review image management"""
    
    list_display = ['review', 'image', 'caption', 'created_at']
    list_filter = ['created_at']
    search_fields = ['review__content', 'caption']
    readonly_fields = ['created_at']
    raw_id_fields = ['review']


@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    """Review vote management"""
    
    list_display = ['review', 'user', 'vote_type', 'created_at']
    list_filter = ['vote_type', 'created_at']
    search_fields = ['review__content', 'user__email']
    readonly_fields = ['created_at']
    raw_id_fields = ['review', 'user']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('review', 'user')


@admin.register(ReviewReport)
class ReviewReportAdmin(admin.ModelAdmin):
    """Review report management"""
    
    list_display = [
        'review', 'reported_by', 'reason', 'is_resolved', 'created_at'
    ]
    list_filter = [
        'reason', 'is_resolved', 'created_at',
        ('reported_by', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['review__content', 'reported_by__email', 'description']
    readonly_fields = ['created_at']
    raw_id_fields = ['review', 'reported_by', 'resolved_by']
    
    fieldsets = (
        ('Report Details', {
            'fields': ('review', 'reported_by', 'reason', 'description')
        }),
        ('Resolution', {
            'fields': ('is_resolved', 'resolved_by', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_resolved', 'mark_unresolved']
    
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_resolved=True, resolved_at=timezone.now(), resolved_by=request.user)
        self.message_user(request, f'{updated} reports marked as resolved.')
    mark_resolved.short_description = "Mark as resolved"
    
    def mark_unresolved(self, request, queryset):
        updated = queryset.update(is_resolved=False, resolved_at=None, resolved_by=None)
        self.message_user(request, f'{updated} reports marked as unresolved.')
    mark_unresolved.short_description = "Mark as unresolved"


@admin.register(SellerReview)
class SellerReviewAdmin(admin.ModelAdmin):
    """Seller review management"""
    
    list_display = [
        'seller', 'user', 'rating_stars', 'is_approved', 'created_at'
    ]
    list_filter = [
        'rating', 'is_approved', 'created_at',
        ('seller', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['user__email', 'content', 'seller__business_name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['seller', 'user', 'order', 'moderated_by']
    
    fieldsets = (
        ('Review Details', {
            'fields': ('seller', 'user', 'order')
        }),
        ('Ratings', {
            'fields': ('rating', 'communication_rating', 'shipping_rating', 'quality_rating')
        }),
        ('Content', {
            'fields': ('content',)
        }),
        ('Moderation', {
            'fields': ('is_approved', 'moderated_by', 'moderated_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_reviews', 'unapprove_reviews']
    
    def rating_stars(self, obj):
        stars = '⭐' * obj.rating
        return format_html('<span title="{} stars">{}</span>', obj.rating, stars)
    rating_stars.short_description = 'Rating'
    
    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} seller reviews approved.')
    approve_reviews.short_description = "Approve selected reviews"
    
    def unapprove_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} seller reviews unapproved.')
    unapprove_reviews.short_description = "Unapprove selected reviews"
