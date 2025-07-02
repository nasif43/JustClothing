from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    ProfileView,
    ChangePasswordView,
    SellerSignupView,
    SellerProfileView,
    CustomerProfileView,
    AddressListCreateView,
    AddressDetailView,
    SellerTeamMemberListCreateView,
    SellerTeamMemberDetailView,
    logout_view,
    user_status_view,
    user_preferences_view,
    PublicSellerListView,
    PublicSellerDetailView,
    seller_stats_view,
    store_reviews_view,
    user_shipping_info,
    seller_homepage_products_view,
    store_homepage_products_view,
)
from .google_auth import google_auth, google_auth_web

router = DefaultRouter()
# No ViewSets needed for now, using APIViews

urlpatterns = [
    # JWT Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', logout_view, name='logout'),
    
    # Google OAuth
    path('google-auth/', google_auth, name='google_auth'),
    path('google-auth-web/', google_auth_web, name='google_auth_web'),
    
    # User management
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('status/', user_status_view, name='user_status'),
    path('preferences/', user_preferences_view, name='user_preferences'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('shipping-info/', user_shipping_info, name='user_shipping_info'),
    
    # Customer profile
    path('customer-profile/', CustomerProfileView.as_view(), name='customer_profile'),
    
    # Seller management
    path('seller/signup/', SellerSignupView.as_view(), name='seller_signup'),
    path('seller/profile/', SellerProfileView.as_view(), name='seller_profile'),
    path('seller/team/', SellerTeamMemberListCreateView.as_view(), name='seller_team_list'),
    path('seller/team/<int:pk>/', SellerTeamMemberDetailView.as_view(), name='seller_team_detail'),
    
    # Address management
    path('addresses/', AddressListCreateView.as_view(), name='address_list'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address_detail'),
    
    # Public seller/store endpoints (for store listings)
    path('stores/', PublicSellerListView.as_view(), name='store_list'),
    path('stores/<str:id>/', PublicSellerDetailView.as_view(), name='store_detail'),
    path('stores/<int:seller_id>/stats/', seller_stats_view, name='seller_stats'),
    path('stores/<int:seller_id>/reviews/', store_reviews_view, name='store_reviews'),
    
    # Seller homepage products
    path('seller/homepage-products/', seller_homepage_products_view, name='seller_homepage_products'),
    
    # Store homepage products
    path('stores/<int:store_id>/homepage-products/', store_homepage_products_view, name='store_homepage_products'),
    
    # Include router URLs
    path('', include(router.urls)),
] 