from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r'codes', views.PromoCodeViewSet)
# router.register(r'featured', views.FeaturedPromoViewSet)

urlpatterns = [
    # path('validate/', views.ValidatePromoCodeView.as_view(), name='validate_promo'),
    path('', include(router.urls)),
] 