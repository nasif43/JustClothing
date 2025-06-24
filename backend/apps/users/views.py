from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import CustomerProfile, SellerProfile, Address, SellerTeamMember, SellerHomepageProduct
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    SellerSignupSerializer,
    SellerProfileSerializer,
    CustomerProfileSerializer,
    AddressSerializer,
    ChangePasswordSerializer,
    SellerTeamMemberSerializer,
    SellerHomepageProductSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view that accepts email instead of username"""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerSignupView(generics.CreateAPIView):
    """Seller signup/onboarding endpoint"""
    serializer_class = SellerSignupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Create a mutable copy of request data and update email
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['email'] = request.user.email
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        seller_profile = serializer.save()
        
        return Response({
            'seller_profile': SellerProfileSerializer(seller_profile).data,
            'message': 'Seller application submitted successfully. Please wait for approval.'
        }, status=status.HTTP_201_CREATED)


class SellerProfileView(generics.RetrieveUpdateAPIView):
    """Get and update seller profile"""
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return get_object_or_404(SellerProfile, user=self.request.user)


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    """Get and update customer profile"""
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = CustomerProfile.objects.get_or_create(user=self.request.user)
        return profile


class AddressListCreateView(generics.ListCreateAPIView):
    """List and create user addresses"""
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete specific address"""
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class SellerTeamMemberListCreateView(generics.ListCreateAPIView):
    """List and create seller team members"""
    serializer_class = SellerTeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get seller profile for authenticated user
        try:
            seller_profile = SellerProfile.objects.get(user=self.request.user)
            return SellerTeamMember.objects.filter(seller=seller_profile)
        except SellerProfile.DoesNotExist:
            return SellerTeamMember.objects.none()
    
    def perform_create(self, serializer):
        seller_profile = get_object_or_404(SellerProfile, user=self.request.user)
        serializer.save(seller=seller_profile, invited_by=self.request.user)


class SellerTeamMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete specific team member"""
    serializer_class = SellerTeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        try:
            seller_profile = SellerProfile.objects.get(user=self.request.user)
            return SellerTeamMember.objects.filter(seller=seller_profile)
        except SellerProfile.DoesNotExist:
            return SellerTeamMember.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout endpoint that blacklists refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_status_view(request):
    """Get current user status and permissions"""
    user = request.user
    
    # Get profiles
    customer_profile = None
    seller_profile = None
    
    try:
        customer_profile = CustomerProfile.objects.get(user=user)
    except CustomerProfile.DoesNotExist:
        pass
    
    try:
        seller_profile = SellerProfile.objects.get(user=user)
    except SellerProfile.DoesNotExist:
        pass
    
    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': user.user_type,
            'is_verified': user.is_verified,
        },
        'customer_profile': CustomerProfileSerializer(customer_profile).data if customer_profile else None,
        'seller_profile': SellerProfileSerializer(seller_profile).data if seller_profile else None,
        'permissions': {
            'is_customer': user.user_type in ['customer', 'admin'],
            'is_seller': user.user_type in ['seller', 'admin'],
            'is_admin': user.user_type == 'admin',
            'seller_approved': seller_profile.status == 'approved' if seller_profile else False,
        }
    })


class PublicSellerListView(generics.ListAPIView):
    """Public list of approved sellers/stores"""
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return SellerProfile.objects.filter(status='approved')


class PublicSellerDetailView(generics.RetrieveAPIView):
    """Public view of specific seller/store"""
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        return SellerProfile.objects.filter(status='approved')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def seller_stats_view(request, seller_id):
    """Get seller statistics including rating and review count"""
    try:
        seller = SellerProfile.objects.get(id=seller_id, status='approved')
        return Response({
            'seller_id': seller.id,
            'business_name': seller.business_name,
            'rating': float(seller.rating) if seller.rating else 0.0,
            'total_reviews': seller.total_reviews,
            'total_products': seller.products.count(),
            'created_at': seller.created_at,
        })
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_reviews_view(request, seller_id):
    """Get all reviews for a store/seller's products"""
    try:
        from apps.reviews.models import Review
        from apps.reviews.serializers import ReviewSerializer
        from django.db.models import Avg, Count
        
        seller = SellerProfile.objects.get(id=seller_id, status='approved')
        
        # Get all reviews for this seller's products
        reviews = Review.objects.filter(
            product__seller=seller,
            is_approved=True,
            review_type='product'
        ).select_related('user', 'product').order_by('-created_at')
        
        # Calculate statistics
        review_stats = reviews.aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id')
        )
        
        # Calculate rating distribution
        rating_distribution = []
        for rating in [5, 4, 3, 2, 1]:
            count = reviews.filter(rating=rating).count()
            rating_distribution.append({
                'stars': rating,
                'count': count
            })
        
        # Serialize reviews and format for frontend compatibility
        serialized_reviews = ReviewSerializer(reviews, many=True).data
        
        # Transform data for frontend compatibility
        formatted_reviews = []
        for review in serialized_reviews:
            formatted_review = {
                'id': review['id'],
                'user': review['user_info'],  # Use user_info as user
                'content': review['content'],
                'rating': review['rating'],
                'productId': review['productId'] or review['product'],
                'productName': review['product_name'],
                'productImage': None,  # Will be enhanced by frontend
                'images': [],  # Can be enhanced later with review images
                'createdAt': review['createdAt'] or review['created_at']
            }
            formatted_reviews.append(formatted_review)
        
        return Response({
            'reviews': formatted_reviews,
            'stats': {
                'averageRating': round(float(review_stats['avg_rating'] or 0), 1),
                'totalReviews': review_stats['total_reviews'] or 0,
                'distribution': rating_distribution
            }
        })
        
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_shipping_info(request):
    """Get user's default shipping information"""
    user = request.user
    
    # Get default address
    default_address = Address.objects.filter(user=user, is_default=True).first()
    
    # Get customer profile for phone number
    try:
        customer_profile = CustomerProfile.objects.get(user=user)
        phone_number = str(customer_profile.phone_number) if customer_profile.phone_number else None
    except CustomerProfile.DoesNotExist:
        phone_number = None
    
    # If no default address found, get the most recent one
    if not default_address:
        default_address = Address.objects.filter(user=user).order_by('-created_at').first()
    
    shipping_info = {
        'phone': phone_number,
        'address': default_address.address_line_1 if default_address else None,
        'has_default_address': bool(default_address),
        'has_phone': bool(phone_number)
    }
    
    if default_address:
        shipping_info.update({
            'full_name': default_address.full_name,
            'address_line_1': default_address.address_line_1,
            'address_line_2': default_address.address_line_2,
            'city': default_address.city,
            'state': default_address.state,
            'postal_code': default_address.postal_code,
            'country': default_address.country
        })
    
    return Response(shipping_info)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def seller_homepage_products_view(request):
    """Get or set seller's homepage products"""
    
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'User is not a seller'}, status=status.HTTP_403_FORBIDDEN)
    
    seller = request.user.seller_profile
    
    if request.method == 'GET':
        print(f"🏪 DEBUG: Seller {seller.id} ({seller.business_name}) fetching their homepage products")
        
        homepage_products = SellerHomepageProduct.objects.filter(
            seller=seller
        ).select_related('product').order_by('order')
        
        print(f"🏪 DEBUG: Found {homepage_products.count()} homepage products for seller")
        for hp in homepage_products:
            print(f"🏪 DEBUG: Seller's Product {hp.order}: {hp.product.name} (ID: {hp.product.id})")
        
        serializer = SellerHomepageProductSerializer(homepage_products, many=True, context={'request': request})
        print(f"🏪 DEBUG: Seller's serialized data: {serializer.data}")
        
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Update homepage products
        print(f"🔍 DEBUG: Raw request data: {request.data}")
        print(f"🔍 DEBUG: Request content type: {request.content_type}")
        print(f"🔍 DEBUG: Request META Authorization: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        
        products_data = request.data.get('products', [])
        
        print(f"🏪 DEBUG: Seller {seller.id} ({seller.business_name}) updating homepage products")
        print(f"🏪 DEBUG: Products data received: {products_data}")
        print(f"🏪 DEBUG: Products data type: {type(products_data)}")
        print(f"🏪 DEBUG: Products data length: {len(products_data) if hasattr(products_data, '__len__') else 'N/A'}")
        
        # Clear existing homepage products
        deleted_count = SellerHomepageProduct.objects.filter(seller=seller).count()
        SellerHomepageProduct.objects.filter(seller=seller).delete()
        print(f"🏪 DEBUG: Deleted {deleted_count} existing homepage products")
        
        # Create new homepage products
        created_count = 0
        for product_data in products_data:
            product_id = product_data.get('product_id')
            order = product_data.get('order', 0)
            
            print(f"🏪 DEBUG: Creating product: ID={product_id}, order={order}")
            
            try:
                # Verify the product exists and belongs to this seller
                from apps.products.models import Product
                product = Product.objects.get(id=product_id, seller=seller)
                
                SellerHomepageProduct.objects.create(
                    seller=seller,
                    product=product,
                    order=order
                )
                created_count += 1
                print(f"🏪 DEBUG: Successfully created homepage product for {product.name}")
                
            except Product.DoesNotExist:
                print(f"🏪 DEBUG: ERROR - Product {product_id} not found or doesn't belong to seller")
                continue
            except Exception as e:
                print(f"🏪 DEBUG: ERROR creating homepage product: {e}")
                continue
        
        print(f"🏪 DEBUG: Created {created_count} new homepage products")
        
        # Verification - check what was actually saved
        saved_products = SellerHomepageProduct.objects.filter(seller=seller).order_by('order')
        print(f"🏪 DEBUG: Verification - found {saved_products.count()} saved homepage products:")
        for sp in saved_products:
            print(f"🏪 DEBUG: - {sp.product.name} (ID: {sp.product.id}) at order {sp.order}")
        
        return Response({'message': 'Homepage products updated successfully'})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_homepage_products_view(request, store_id):
    """Get homepage products for a specific store (public endpoint)"""
    
    print(f"🔍 DEBUG: Fetching homepage products for store_id: {store_id}")
    
    try:
        seller = SellerProfile.objects.get(id=store_id)
        print(f"🔍 DEBUG: Found seller: {seller.business_name}, status: {seller.status}")
        
        homepage_products = SellerHomepageProduct.objects.filter(
            seller=seller
        ).select_related('product').order_by('order')
        
        print(f"🔍 DEBUG: Found {homepage_products.count()} homepage products")
        for hp in homepage_products:
            print(f"🔍 DEBUG: Product {hp.order}: {hp.product.name} (ID: {hp.product.id})")
        
        serializer = SellerHomepageProductSerializer(homepage_products, many=True, context={'request': request})
        print(f"🔍 DEBUG: Serialized data: {serializer.data}")
        
        return Response(serializer.data)
    
    except SellerProfile.DoesNotExist:
        print(f"❌ DEBUG: Seller with ID {store_id} not found")
        return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
