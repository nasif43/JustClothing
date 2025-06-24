from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import (
    Promotion, PromoCode, SellerPromoRequest, 
    PromotionalCampaign, PromoUsage
)
from .serializers import (
    PromotionSerializer, PromoCodeSerializer, SellerPromoRequestSerializer,
    PromoUsageSerializer, ProductBasicSerializer
)
from apps.products.models import Product


class SellerPromoRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for seller promo requests"""
    serializer_class = SellerPromoRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only return promo requests for the current seller
        if hasattr(self.request.user, 'seller_profile'):
            return SellerPromoRequest.objects.filter(seller=self.request.user.seller_profile)
        return SellerPromoRequest.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create a new seller promo request"""
        # Check if user is a seller
        if not hasattr(request.user, 'seller_profile'):
            return Response(
                {'error': 'Only sellers can create promo requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            promo_request = serializer.save()
            return Response(
                {
                    'message': 'Promo request submitted successfully',
                    'data': serializer.data
                }, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def active_offers(self, request):
        """Get seller's active/approved offers"""
        if not hasattr(request.user, 'seller_profile'):
            return Response({'offers': []})
        
        # Get approved promo requests that have created promo codes
        approved_requests = self.get_queryset().filter(
            status='approved',
            created_promo__isnull=False
        )
        
        offers = []
        for req in approved_requests:
            if req.created_promo and req.created_promo.promotion.is_active:
                offer_data = {
                    'id': req.id,
                    'name': req.requested_name,
                    'code': req.created_promo.code,
                    'type': req.requested_type,
                    'discount_percentage': req.requested_discount_percentage,
                    'discount_amount': req.requested_discount_amount,
                    'start_date': req.requested_start_date,
                    'end_date': req.requested_end_date,
                    'usage_count': req.created_promo.usage_count,
                    'usage_limit': req.created_promo.usage_limit,
                    'products': ProductBasicSerializer(req.target_products.all(), many=True).data,
                    'status': req.created_promo.promotion.status
                }
                offers.append(offer_data)
        
        return Response({'offers': offers})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_products_for_offers(request):
    """Get seller's products available for creating offers"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'Only sellers can access this endpoint'}, status=403)
    
    products = Product.objects.filter(
        seller=request.user.seller_profile,
        status='active'
    ).order_by('-created_at')
    
    serializer = ProductBasicSerializer(products, many=True)
    return Response({'products': serializer.data})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_promo_code(request):
    """Validate a promo code for checkout"""
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Promo code is required'}, status=400)
    
    try:
        promo_code = PromoCode.objects.get(code=code, is_active=True)
        
        if not promo_code.can_be_used():
            return Response({'error': 'Promo code is no longer available'}, status=400)
        
        if not promo_code.promotion.can_be_used_by(request.user):
            return Response({'error': 'You cannot use this promo code'}, status=400)
        
        # Return promo code details
        serializer = PromoCodeSerializer(promo_code)
        return Response({
            'valid': True,
            'promo_code': serializer.data
        })
        
    except PromoCode.DoesNotExist:
        return Response({'error': 'Invalid promo code'}, status=400)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_promo_analytics(request):
    """Get analytics for seller's promotions"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'Only sellers can access this endpoint'}, status=403)
    
    seller = request.user.seller_profile
    
    # Get all promo requests
    total_requests = SellerPromoRequest.objects.filter(seller=seller).count()
    approved_requests = SellerPromoRequest.objects.filter(seller=seller, status='approved').count()
    pending_requests = SellerPromoRequest.objects.filter(seller=seller, status='pending').count()
    
    # Get active promotions
    active_promos = PromoCode.objects.filter(
        promotion__applicable_sellers=seller,
        is_active=True,
        promotion__status='active'
    ).count()
    
    # Get total usage
    total_usage = PromoUsage.objects.filter(
        promotion__applicable_sellers=seller
    ).count()
    
    return Response({
        'total_requests': total_requests,
        'approved_requests': approved_requests,
        'pending_requests': pending_requests,
        'active_promos': active_promos,
        'total_usage': total_usage
    })


class PromotionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing promotions (read-only for customers)"""
    serializer_class = PromotionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Get active promotions"""
        queryset = Promotion.objects.filter(
            status='active',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        
        # Filter by seller if specified
        seller_id = self.request.query_params.get('seller')
        if seller_id:
            queryset = queryset.filter(applicable_sellers__id=seller_id)
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(applicable_products__id=product_id)
        
        return queryset.distinct()
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured promotions"""
        featured_promos = self.get_queryset().filter(is_featured=True)
        serializer = self.get_serializer(featured_promos, many=True)
        return Response(serializer.data)
