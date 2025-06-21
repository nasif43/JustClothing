from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r'methods', views.ShippingMethodViewSet)
# router.register(r'rates', views.ShippingRateViewSet)

urlpatterns = [
    # path('calculate/', views.CalculateShippingView.as_view(), name='calculate_shipping'),
    path('', include(router.urls)),
] 