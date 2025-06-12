from django.contrib import admin
from django.utils.html import format_html
from .models import SellerProfile
from justclothing.admin import admin_site

class SellerProfileAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'first_name', 'last_name', 'email', 'status', 
        'business_type', 'created_at', 'reviewed_at'
    ]
    list_filter = ['status', 'business_type', 'created_at', 'reviewed_at']
    search_fields = ['business_name', 'first_name', 'last_name', 'email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'id_number')
        }),
        ('Business Information', {
            'fields': ('business_name', 'business_type', 'founded_date', 'bio', 'pickup_location', 'logo')
        }),
        ('Social Links', {
            'fields': ('instagram', 'facebook')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'account_number', 'bank_name', 'branch_name')
        }),
        ('Review Status', {
            'fields': ('status', 'admin_notes', 'reviewed_by', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj:  # Editing existing object
            readonly.extend(['first_name', 'last_name', 'email'])
        return readonly
    
    actions = ['approve_applications', 'reject_applications']
    
    def approve_applications(self, request, queryset):
        from django.contrib.auth import get_user_model
        from stores.models import Store
        from django.utils import timezone
        
        User = get_user_model()
        approved_count = 0
        
        for seller_profile in queryset.filter(status='pending'):
            seller_profile.status = 'approved'
            seller_profile.reviewed_by = request.user
            seller_profile.reviewed_at = timezone.now()
            seller_profile.save()
            
            # Create user account if it doesn't exist
            if not seller_profile.user:
                try:
                    user = User.objects.create_user(
                        username=seller_profile.email,
                        email=seller_profile.email,
                        first_name=seller_profile.first_name,
                        last_name=seller_profile.last_name,
                        phone=seller_profile.phone,
                        user_type='seller',
                        is_verified=True
                    )
                    seller_profile.user = user
                    seller_profile.save()
                    
                    # Create store for the seller
                    from datetime import datetime
                    from django.utils.text import slugify
                    
                    # Parse the founded_date from DD/MM/YYYY format
                    try:
                        founded_date_obj = datetime.strptime(seller_profile.founded_date, '%d/%m/%Y').date()
                    except ValueError:
                        # If parsing fails, use today's date
                        from datetime import date
                        founded_date_obj = date.today()
                    
                    store = Store.objects.create(
                        owner=user,
                        name=seller_profile.business_name,
                        slug=slugify(seller_profile.business_name),
                        bio=seller_profile.bio,
                        business_type=seller_profile.business_type.lower().replace(' ', '_'),
                        founded_date=founded_date_obj,
                        pickup_location=seller_profile.pickup_location,
                        instagram_handle=seller_profile.instagram,
                        facebook_page=seller_profile.facebook,
                        verified=True
                    )
                    
                    if seller_profile.logo:
                        store.logo = seller_profile.logo
                        store.save()
                    
                    approved_count += 1
                except Exception as e:
                    self.message_user(request, f"Error creating account for {seller_profile.email}: {str(e)}", level='ERROR')
        
        self.message_user(request, f"Successfully approved {approved_count} seller applications.")
    
    approve_applications.short_description = "Approve selected seller applications"
    
    def reject_applications(self, request, queryset):
        from django.utils import timezone
        
        updated = queryset.filter(status='pending').update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f"Successfully rejected {updated} seller applications.")
    
    reject_applications.short_description = "Reject selected seller applications"

# Register with custom admin site
admin_site.register(SellerProfile, SellerProfileAdmin)
