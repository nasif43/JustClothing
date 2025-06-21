from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    # Review endpoints
    path('', views.ReviewListCreateView.as_view(), name='review-list-create'),
    path('<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
    
    # Product review endpoints
    path('products/<int:product_id>/', views.ProductReviewsView.as_view(), name='product-reviews'),
    path('products/<int:product_id>/stats/', views.product_review_stats, name='product-review-stats'),
    
    # Seller review endpoints
    path('sellers/', views.SellerReviewListCreateView.as_view(), name='seller-review-list-create'),
    path('sellers/<int:seller_id>/stats/', views.seller_review_stats, name='seller-review-stats'),
    
    # Include router URLs
    path('', include(router.urls)),
] 