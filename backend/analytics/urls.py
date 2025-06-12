from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('track/', views.TrackActivityView.as_view(), name='track-activity'),
    path('search/', views.SearchAnalyticsView.as_view(), name='search-analytics'),
] 