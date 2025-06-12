from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SellerSignupView, 
    SellerProfileViewSet, 
    PendingSellerApplicationsView,
    ApproveSellerView,
    RejectSellerView
)

router = DefaultRouter()
router.register('profiles', SellerProfileViewSet)

urlpatterns = [
    path('signup/', SellerSignupView.as_view(), name='seller-signup'),
    path('pending/', PendingSellerApplicationsView.as_view(), name='pending-applications'),
    path('approve/<uuid:seller_id>/', ApproveSellerView.as_view(), name='approve-seller'),
    path('reject/<uuid:seller_id>/', RejectSellerView.as_view(), name='reject-seller'),
    path('', include(router.urls)),
] 