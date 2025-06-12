from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Store, StoreTeamMember, StoreFollow
from .serializers import StoreSerializer, StoreTeamMemberSerializer, StoreFollowSerializer

# Create your views here.

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]

class FollowStoreView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, store_id):
        try:
            store = Store.objects.get(id=store_id)
            follow, created = StoreFollow.objects.get_or_create(user=request.user, store=store)
            if created:
                return Response({'message': 'Store followed successfully'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Already following this store'}, status=status.HTTP_200_OK)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)

class StoreTeamView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        team_members = StoreTeamMember.objects.filter(store_id=store_id)
        serializer = StoreTeamMemberSerializer(team_members, many=True)
        return Response(serializer.data)
