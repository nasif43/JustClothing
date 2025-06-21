from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    # path('process/', views.ProcessPaymentView.as_view(), name='process_payment'),
    # path('webhook/', views.PaymentWebhookView.as_view(), name='payment_webhook'),
    path('', include(router.urls)),
] 