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
    
    # Offers page endpoints
    path('offers-page/', views.offers_page_data, name='offers_page_data'),
    path('trending/', views.trending_offers, name='trending_offers'),
    path('search/', views.promo_code_search, name='promo_code_search'),
    path('track-impression/', views.track_promo_impression, name='track_promo_impression'),
    path('category/<slug:category_slug>/', views.offers_by_category, name='offers_by_category'),
    
    # Include router URLs
    path('', include(router.urls)),
] 