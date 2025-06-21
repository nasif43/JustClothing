from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    # Analytics endpoints (to be implemented)
    # path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    # path('reports/', views.ReportsView.as_view(), name='reports'),
    # path('tracking/', views.UserTrackingView.as_view(), name='user_tracking'),
    
    # Include router URLs
    path('', include(router.urls)),
] 