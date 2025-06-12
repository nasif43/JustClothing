from django.contrib import admin
from .models import Store, StoreTeamMember, StoreBankingInfo, StoreFollow
from justclothing.admin import admin_site

class StoreTeamMemberInline(admin.TabularInline):
    model = StoreTeamMember
    extra = 0

class StoreBankingInfoInline(admin.StackedInline):
    model = StoreBankingInfo
    extra = 0

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'business_type', 'verified', 'is_active', 'rating', 'total_orders')
    list_filter = ('business_type', 'subscription_tier', 'verified', 'is_active', 'created_at')
    search_fields = ('name', 'owner__email', 'owner__first_name', 'owner__last_name')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('rating', 'total_reviews', 'followers_count', 'total_sales', 'total_orders', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'owner', 'bio', 'business_type')
        }),
        ('Media', {
            'fields': ('logo', 'banner')
        }),
        ('Business Details', {
            'fields': ('subscription_tier', 'founded_date', 'pickup_location')
        }),
        ('Social Media', {
            'fields': ('instagram_handle', 'facebook_page', 'website')
        }),
        ('Status & Metrics', {
            'fields': ('verified', 'is_active', 'rating', 'total_reviews', 'followers_count', 'total_sales', 'total_orders')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [StoreTeamMemberInline, StoreBankingInfoInline]

@admin.register(StoreTeamMember)
class StoreTeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'store', 'role', 'is_active', 'joined_at')
    list_filter = ('role', 'is_active', 'joined_at')
    search_fields = ('user__email', 'store__name')

@admin.register(StoreBankingInfo)
class StoreBankingInfoAdmin(admin.ModelAdmin):
    list_display = ('store', 'payment_method', 'account_number', 'is_verified')
    list_filter = ('payment_method', 'is_verified')
    search_fields = ('store__name', 'account_number', 'account_name')

@admin.register(StoreFollow)
class StoreFollowAdmin(admin.ModelAdmin):
    list_display = ('user', 'store', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'store__name')

# Register with custom admin site
admin_site.register(Store, StoreAdmin)
admin_site.register(StoreTeamMember, StoreTeamMemberAdmin)
admin_site.register(StoreBankingInfo, StoreBankingInfoAdmin)
admin_site.register(StoreFollow, StoreFollowAdmin)
