from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r'user-notifications', views.UserNotificationViewSet)

urlpatterns = [
    # path('mark-read/', views.MarkNotificationReadView.as_view(), name='mark_read'),
    # path('settings/', views.NotificationSettingsView.as_view(), name='notification_settings'),
    path('', include(router.urls)),
] 