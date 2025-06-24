from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'seller-requests', views.SellerPromoRequestViewSet, basename='seller-promo-requests')
router.register(r'promotions', views.PromotionViewSet, basename='promotions')

urlpatterns = [
    # Seller-specific endpoints
    path('seller/products/', views.seller_products_for_offers, name='seller_products_for_offers'),
    path('seller/analytics/', views.seller_promo_analytics, name='seller_promo_analytics'),
    
    # General promo endpoints
    path('validate/', views.validate_promo_code, name='validate_promo_code'),
    
    # Include router URLs
    path('', include(router.urls)),
] 