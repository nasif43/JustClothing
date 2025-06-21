from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryListCreateView, CategoryDetailView,
    ProductListView, ProductDetailView, ProductCreateView, 
    ProductUpdateView, ProductDeleteView, SellerProductListView,
    ProductImageListCreateView, ProductImageDetailView,
    ProductVideoListCreateView, ProductVideoDetailView,
    ProductAttributeTypeListView,
    featured_products_view, trending_products_view, 
    related_products_view, bulk_update_products_view
)

router = DefaultRouter()
# No ViewSets needed for now, using APIViews

urlpatterns = [
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<str:slug>/', CategoryDetailView.as_view(), name='category_detail'),
    
    # Products - Public
    path('', ProductListView.as_view(), name='product_list'),
    path('<str:id>/', ProductDetailView.as_view(), name='product_detail'),
    path('featured/', featured_products_view, name='featured_products'),
    path('trending/', trending_products_view, name='trending_products'),
    path('<str:product_id>/related/', related_products_view, name='related_products'),
    
    # Products - Seller Management
    path('seller/products/', SellerProductListView.as_view(), name='seller_product_list'),
    path('seller/products/create/', ProductCreateView.as_view(), name='product_create'),
    path('seller/products/<str:pk>/update/', ProductUpdateView.as_view(), name='product_update'),
    path('seller/products/<str:pk>/delete/', ProductDeleteView.as_view(), name='product_delete'),
    path('seller/products/bulk-update/', bulk_update_products_view, name='bulk_update_products'),
    
    # Product Images
    path('<str:product_id>/images/', ProductImageListCreateView.as_view(), name='product_image_list'),
    path('<str:product_id>/images/<int:pk>/', ProductImageDetailView.as_view(), name='product_image_detail'),
    
    # Product Videos
    path('<str:product_id>/videos/', ProductVideoListCreateView.as_view(), name='product_video_list'),
    path('<str:product_id>/videos/<int:pk>/', ProductVideoDetailView.as_view(), name='product_video_detail'),
    
    # Product Attributes
    path('attribute-types/', ProductAttributeTypeListView.as_view(), name='product_attribute_types'),
    
    # Include router URLs
    path('', include(router.urls)),
] 