from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.StoreViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:store_id>/follow/', views.FollowStoreView.as_view(), name='follow-store'),
    path('<uuid:store_id>/team/', views.StoreTeamView.as_view(), name='store-team'),
] 