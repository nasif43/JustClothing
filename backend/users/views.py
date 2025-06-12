from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"User created successfully: {user.username}, active: {user.is_active}")
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        logger.info(f"Login attempt for username: {username}")
        
        if not username or not password:
            return Response({'detail': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to find user by username or email
        user = None
        try:
            # First try to find by username
            user = User.objects.get(username=username)
            logger.info(f"Found user by username: {user.username}, active: {user.is_active}")
        except User.DoesNotExist:
            try:
                # Then try to find by email
                user = User.objects.get(email=username)
                logger.info(f"Found user by email: {user.username}, active: {user.is_active}")
            except User.DoesNotExist:
                logger.warning(f"No user found with username/email: {username}")
                return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"User {user.username} is not active")
            return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate user
        if user.check_password(password):
            logger.info(f"Password correct for user: {user.username}")
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                }
            })
        else:
            logger.warning(f"Password incorrect for user: {user.username}")
            return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
