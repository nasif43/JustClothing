from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile
from justclothing.admin import admin_site

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_active', 'groups')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        (_('User Type'), {'fields': ('user_type',)}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Analytics'), {'fields': ('total_orders', 'total_spent', 'is_verified')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'user_type'),
        }),
    )

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'preferred_language')
    list_filter = ('preferred_language', 'city')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'city')
    
    fieldsets = (
        (_('User Info'), {'fields': ('user',)}),
        (_('Personal Details'), {'fields': ('date_of_birth', 'address', 'city', 'postal_code')}),
        (_('Preferences'), {'fields': ('preferred_language',)}),
    )

# Register with custom admin site
admin_site.register(User, CustomUserAdmin)
admin_site.register(UserProfile, UserProfileAdmin)

# Also register with default admin site for development
admin.site.register(User, CustomUserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
