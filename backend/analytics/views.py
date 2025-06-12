from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DailyMetrics, UserActivity, SearchAnalytics

# Create your views here.

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'total_users': 0,
            'total_orders': 0,
            'total_revenue': 0,
            'message': 'Dashboard data placeholder'
        })

class TrackActivityView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        activity_type = request.data.get('activity_type')
        UserActivity.objects.create(
            user=request.user,
            session_id=request.session.session_key or 'anonymous',
            activity_type=activity_type,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            data=request.data.get('data', {})
        )
        return Response({'message': 'Activity tracked'})

class SearchAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'message': 'Search analytics placeholder'})
