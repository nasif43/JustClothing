from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    # Seller Analytics Endpoints
    path('seller/dashboard/', views.seller_dashboard_stats, name='seller_dashboard_stats'),
    path('seller/revenue/', views.seller_revenue_analytics, name='seller_revenue_analytics'),
    path('seller/orders/', views.seller_order_analytics, name='seller_order_analytics'),
    path('seller/targets/', views.update_revenue_targets, name='update_revenue_targets'),
    
    # Include router URLs
    path('', include(router.urls)),
] 