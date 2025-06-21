from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    # Cart endpoints
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.AddToCartView.as_view(), name='add_to_cart'),
    path('cart/items/<int:pk>/update/', views.UpdateCartItemView.as_view(), name='update_cart_item'),
    path('cart/items/<int:pk>/remove/', views.RemoveFromCartView.as_view(), name='remove_from_cart'),
    path('cart/clear/', views.ClearCartView.as_view(), name='clear_cart'),
    
    # Order endpoints - more specific routes first
    path('orders/create/', views.CreateOrderView.as_view(), name='create_order'),
    path('orders/quick-create/', views.CreateQuickOrderView.as_view(), name='create_quick_order'),
    path('orders/', views.OrderListView.as_view(), name='order_list'),
    path('orders/<str:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    
    # Seller order management
    path('seller/orders/', views.SellerOrderListView.as_view(), name='seller_orders'),
    path('seller/orders/<str:order_id>/', views.seller_order_detail, name='seller_order_detail'),
    path('seller/orders/<str:order_id>/update-status/', views.seller_update_order_status, name='seller_update_order_status'),
    
    # Include router URLs
    path('', include(router.urls)),
] 