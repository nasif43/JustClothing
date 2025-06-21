from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User as DjangoUser
from django.utils.html import format_html
from django.db.models import Count
from .models import User, CustomerProfile, SellerProfile, SellerFollower, Address, SellerTeamMember


# Unregister the default User admin and register our custom one
try:
    admin.site.unregister(DjangoUser)
except admin.sites.NotRegistered:
    pass


class CustomerProfileInline(admin.StackedInline):
    """Inline for customer profile"""
    model = CustomerProfile
    can_delete = False
    verbose_name_plural = 'Customer Profile'
    readonly_fields = ['created_at', 'updated_at']


class SellerProfileInline(admin.StackedInline):
    """Inline for seller profile"""
    model = SellerProfile
    fk_name = 'user'  # Specify which ForeignKey to use
    can_delete = False
    verbose_name_plural = 'Seller Profile'
    readonly_fields = ['followers', 'productsCount', 'created_at', 'updated_at']


class AddressInline(admin.TabularInline):
    """Inline for user addresses"""
    model = Address
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced user administration"""
    
    list_display = [
        'email', 'first_name', 'last_name', 'user_type', 
        'is_verified', 'is_active', 'date_joined'
    ]
    list_filter = [
        'user_type', 'is_verified', 'is_active', 'is_staff', 
        'is_superuser', 'date_joined'
    ]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    readonly_fields = ['date_joined', 'last_login', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'username')
        }),
        ('Account Type', {
            'fields': ('user_type', 'is_verified')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Account Creation', {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'user_type', 'password1', 'password2'),
        }),
    )
    
    inlines = [CustomerProfileInline, SellerProfileInline, AddressInline]
    
    actions = ['verify_users', 'unverify_users']
    
    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} users verified.')
    verify_users.short_description = "Verify selected users"
    
    def unverify_users(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} users unverified.')
    unverify_users.short_description = "Unverify selected users"


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    """Customer profile management"""
    
    list_display = [
        'user', 'phone_number', 'gender', 'date_of_birth', 
        'newsletter_subscription', 'created_at'
    ]
    list_filter = [
        'gender', 'newsletter_subscription', 'created_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Personal Details', {
            'fields': ('phone_number', 'date_of_birth', 'gender', 'profile_picture')
        }),
        ('Preferences', {
            'fields': ('preferred_categories', 'newsletter_subscription')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['preferred_categories']
    
    actions = ['enable_newsletter', 'disable_newsletter']
    
    def enable_newsletter(self, request, queryset):
        updated = queryset.update(newsletter_subscription=True)
        self.message_user(request, f'{updated} customers subscribed to newsletter.')
    enable_newsletter.short_description = "Enable newsletter subscription"
    
    def disable_newsletter(self, request, queryset):
        updated = queryset.update(newsletter_subscription=False)
        self.message_user(request, f'{updated} customers unsubscribed from newsletter.')
    disable_newsletter.short_description = "Disable newsletter subscription"


class SellerTeamMemberInline(admin.TabularInline):
    """Inline for seller team members"""
    model = SellerTeamMember
    extra = 0
    readonly_fields = ['joined_at']
    raw_id_fields = ['user', 'invited_by']


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    """Seller profile management"""
    
    list_display = [
        'business_name', 'user', 'status_badge', 'verified', 'followers', 'created_at'
    ]
    list_filter = [
        'status', 'verified', 'created_at'
    ]
    search_fields = ['business_name', 'user__email', 'business_description']
    readonly_fields = ['followers', 'productsCount', 'created_at', 'updated_at', 'name', 'bio', 'joinedDate']
    raw_id_fields = ['user', 'approved_by']
    
    fieldsets = (
        ('Business Information', {
            'fields': ('user', 'business_name', 'business_description', 'phone_number', 'business_address')
        }),
        ('Frontend Compatibility', {
            'fields': ('name', 'bio', 'verified', 'joinedDate'),
            'classes': ('collapse',)
        }),
        ('Legal Information', {
            'fields': ('business_license', 'tax_id', 'verification_documents'),
            'classes': ('collapse',)
        }),
        ('Social Media', {
            'fields': ('instagram', 'facebook'),
            'classes': ('collapse',)
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'account_number', 'bank_name', 'branch_name'),
            'classes': ('collapse',)
        }),
        ('Status & Verification', {
            'fields': ('status', 'approved_by', 'approved_at')
        }),
        ('Business Metrics', {
            'fields': ('total_sales', 'rating', 'total_reviews', 'followers', 'productsCount'),
            'classes': ('collapse',)
        }),
        ('Branding', {
            'fields': ('logo', 'banner_image'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [SellerTeamMemberInline]
    
    actions = ['approve_sellers', 'suspend_sellers', 'reject_sellers']
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'suspended': 'red',
            'rejected': 'darkred'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_sellers(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            status='approved',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} sellers approved.')
    approve_sellers.short_description = "Approve selected sellers"
    
    def suspend_sellers(self, request, queryset):
        updated = queryset.update(status='suspended')
        self.message_user(request, f'{updated} sellers suspended.')
    suspend_sellers.short_description = "Suspend selected sellers"
    
    def reject_sellers(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} sellers rejected.')
    reject_sellers.short_description = "Reject selected sellers"


@admin.register(SellerFollower)
class SellerFollowerAdmin(admin.ModelAdmin):
    """Seller follower management"""
    
    list_display = ['seller', 'user', 'followed_at']
    list_filter = ['followed_at']
    search_fields = ['seller__business_name', 'user__email']
    readonly_fields = ['followed_at']
    raw_id_fields = ['seller', 'user']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('seller', 'user')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Address management"""
    
    list_display = [
        'user', 'full_name', 'address_type', 'city', 
        'state', 'postal_code', 'is_default'
    ]
    list_filter = ['address_type', 'is_default', 'city', 'state', 'country']
    search_fields = [
        'user__email', 'full_name', 'address_line_1', 
        'city', 'postal_code'
    ]
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('User & Type', {
            'fields': ('user', 'address_type', 'is_default')
        }),
        ('Contact Information', {
            'fields': ('full_name', 'phone_number')
        }),
        ('Address Details', {
            'fields': ('address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['set_as_default']
    
    def set_as_default(self, request, queryset):
        for address in queryset:
            # Unset other defaults for the same user
            Address.objects.filter(user=address.user).update(is_default=False)
            # Set this one as default
            address.is_default = True
            address.save()
        self.message_user(request, f'{queryset.count()} addresses set as default.')
    set_as_default.short_description = "Set as default address"


@admin.register(SellerTeamMember)
class SellerTeamMemberAdmin(admin.ModelAdmin):
    """Seller team member management"""
    
    list_display = [
        'seller', 'user', 'role', 'permissions', 'is_active', 'joined_at'
    ]
    list_filter = ['role', 'permissions', 'is_active', 'joined_at']
    search_fields = ['seller__business_name', 'user__email']
    readonly_fields = ['joined_at']
    raw_id_fields = ['seller', 'user', 'invited_by']
    
    fieldsets = (
        ('Team Member Information', {
            'fields': ('seller', 'user', 'invited_by')
        }),
        ('Role & Permissions', {
            'fields': ('role', 'permissions', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_members', 'deactivate_members']
    
    def activate_members(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} team members activated.')
    activate_members.short_description = "Activate selected members"
    
    def deactivate_members(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} team members deactivated.')
    deactivate_members.short_description = "Deactivate selected members"


# Custom admin site configuration
admin.site.site_header = "JustClothing Admin Panel"
admin.site.site_title = "JustClothing Admin"
admin.site.index_title = "Welcome to JustClothing Administration" 