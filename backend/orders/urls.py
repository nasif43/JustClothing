from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.AddToCartView.as_view(), name='add-to-cart'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
] 