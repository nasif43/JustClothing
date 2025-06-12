from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .models import SellerProfile
from .serializers import SellerSignupSerializer, SellerProfileSerializer
from django.utils import timezone

class SellerSignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SellerSignupSerializer(data=request.data)
        if serializer.is_valid():
            seller_profile = serializer.save()
            return Response({
                'message': 'Seller application submitted successfully',
                'seller_id': seller_profile.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SellerProfileViewSet(viewsets.ModelViewSet):
    queryset = SellerProfile.objects.all()
    serializer_class = SellerProfileSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        # Admin can see all, others can only see their own
        if self.request.user.is_staff:
            return SellerProfile.objects.all()
        return SellerProfile.objects.filter(user=self.request.user)

class PendingSellerApplicationsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        pending_applications = SellerProfile.objects.filter(status='pending')
        serializer = SellerProfileSerializer(pending_applications, many=True)
        return Response(serializer.data)

class ApproveSellerView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, seller_id):
        try:
            seller_profile = SellerProfile.objects.get(id=seller_id)
            seller_profile.status = 'approved'
            seller_profile.reviewed_by = request.user
            seller_profile.reviewed_at = timezone.now()
            seller_profile.save()
            
            # Create user account if it doesn't exist
            from django.contrib.auth import get_user_model
            from stores.models import Store
            
            User = get_user_model()
            
            if not seller_profile.user:
                # Create user account
                user = User.objects.create_user(
                    username=seller_profile.email,
                    email=seller_profile.email,
                    first_name=seller_profile.first_name,
                    last_name=seller_profile.last_name,
                    phone=seller_profile.phone,
                    user_type='seller',
                    is_verified=True
                )
                seller_profile.user = user
                seller_profile.save()
                
                # Create store for the seller
                from datetime import datetime
                from django.utils.text import slugify
                
                # Parse the founded_date from DD/MM/YYYY format
                try:
                    founded_date_obj = datetime.strptime(seller_profile.founded_date, '%d/%m/%Y').date()
                except ValueError:
                    # If parsing fails, use today's date
                    from datetime import date
                    founded_date_obj = date.today()
                
                store = Store.objects.create(
                    owner=user,
                    name=seller_profile.business_name,
                    slug=slugify(seller_profile.business_name),
                    bio=seller_profile.bio,
                    business_type=seller_profile.business_type.lower().replace(' ', '_'),
                    founded_date=founded_date_obj,
                    pickup_location=seller_profile.pickup_location,
                    instagram_handle=seller_profile.instagram,
                    facebook_page=seller_profile.facebook,
                    verified=True
                )
                
                if seller_profile.logo:
                    store.logo = seller_profile.logo
                    store.save()
            
            return Response({
                'message': 'Seller application approved successfully',
                'user_created': seller_profile.user is not None
            }, status=status.HTTP_200_OK)
            
        except SellerProfile.DoesNotExist:
            return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)

class RejectSellerView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, seller_id):
        try:
            seller_profile = SellerProfile.objects.get(id=seller_id)
            seller_profile.status = 'rejected'
            seller_profile.reviewed_by = request.user
            seller_profile.reviewed_at = timezone.now()
            seller_profile.admin_notes = request.data.get('notes', '')
            seller_profile.save()
            
            return Response({
                'message': 'Seller application rejected'
            }, status=status.HTTP_200_OK)
            
        except SellerProfile.DoesNotExist:
            return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)
