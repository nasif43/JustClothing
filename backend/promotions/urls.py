from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'promo-codes', views.PromoCodeViewSet)
router.register(r'featured', views.FeaturedProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('validate-promo/', views.ValidatePromoCodeView.as_view(), name='validate-promo'),
] 