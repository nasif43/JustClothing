from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests
from .serializers import UserProfileSerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Google OAuth authentication endpoint
    Accepts Google ID token and returns JWT tokens
    """
    try:
        # Get the ID token from request
        id_token_value = request.data.get('idToken')
        
        if not id_token_value:
            return Response(
                {'error': 'ID token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the Google ID token
        try:
            # Use Google's verification
            idinfo = id_token.verify_oauth2_token(
                id_token_value, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
        except ValueError:
            return Response(
                {'error': 'Invalid Google ID token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information from Google token
        google_id = idinfo['sub']
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        picture = idinfo.get('picture', '')
        
        # Check if user already exists
        try:
            user = User.objects.get(email=email)
            # User exists, log them in
            created = False
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                email=email,
                username=email,  # Use email as username
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            created = True
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Get user profile data
        user_data = UserProfileSerializer(user).data
        
        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
            'created': created,
            'message': 'Successfully authenticated with Google'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_web(request):
    """
    Alternative Google OAuth endpoint for web applications
    Accepts authorization code and exchanges it for tokens
    """
    try:
        # Get authorization code from request
        auth_code = request.data.get('code')
        
        if not auth_code:
            return Response(
                {'error': 'Authorization code is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Exchange authorization code for tokens
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            'code': auth_code,
            'grant_type': 'authorization_code',
            'redirect_uri': request.data.get('redirectUri', 'http://localhost:3000'),
        }
        
        token_response = http_requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'error' in token_json:
            return Response(
                {'error': f'Failed to exchange code: {token_json["error"]}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user info from Google
        access_token = token_json['access_token']
        user_info_url = f'https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}'
        user_response = http_requests.get(user_info_url)
        user_info = user_response.json()
        
        if 'error' in user_info:
            return Response(
                {'error': 'Failed to get user information'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information
        google_id = user_info['id']
        email = user_info['email']
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        picture = user_info.get('picture', '')
        
        # Check if user already exists
        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                email=email,
                username=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            created = True
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Get user profile data
        user_data = UserProfileSerializer(user).data
        
        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
            'created': created,
            'message': 'Successfully authenticated with Google'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 