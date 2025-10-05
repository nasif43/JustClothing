from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from .models import (
    Promotion, PromoCode, SellerPromoRequest, 
    PromotionalCampaign, PromoUsage, FeaturedPromo, PromoImpression
)
from .serializers import (
    PromotionSerializer, PromoCodeSerializer, SellerPromoRequestSerializer,
    PromoUsageSerializer, ProductBasicSerializer, FeaturedPromoSerializer
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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def offers_page_data(request):
    """Get comprehensive data for offers page"""
    now = timezone.now()
    
    # Get featured banners/promos
    featured_banners = FeaturedPromo.objects.filter(
        placement='homepage_banner',
        is_currently_active=True
    ).select_related('promo_code__promotion')[:5]
    
    # Get all active promotions
    active_promotions = Promotion.objects.filter(
        status='active',
        start_date__lte=now,
        end_date__gte=now
    ).prefetch_related('promo_codes', 'applicable_products')
    
    # Get category-wise offers
    category_offers = {}
    for promotion in active_promotions:
        for category in promotion.applicable_categories.all():
            if category.name not in category_offers:
                category_offers[category.name] = []
            category_offers[category.name].append(PromotionSerializer(promotion).data)
    
    # Get flash deals (promotions ending soon)
    flash_deals = active_promotions.filter(
        end_date__lte=now + timezone.timedelta(days=7)
    ).order_by('end_date')[:10]
    
    # Get hot deals (heavily used promotions)
    hot_deals = active_promotions.filter(
        usage_count__gte=10
    ).order_by('-usage_count')[:10]
    
    # Get seasonal/special offers (featured ones)
    seasonal_offers = active_promotions.filter(is_featured=True)[:8]
    
    # Get free shipping offers
    free_shipping_offers = active_promotions.filter(
        promotion_type='free_shipping'
    )[:5]
    
    # Get percentage deals
    percentage_deals = active_promotions.filter(
        promotion_type='percentage',
        discount_percentage__gte=20
    ).order_by('-discount_percentage')[:8]
    
    # Get buy x get y deals
    bxgy_deals = active_promotions.filter(
        promotion_type='buy_x_get_y'
    )[:6]
    
    return Response({
        'featured_banners': FeaturedPromoSerializer(featured_banners, many=True).data,
        'flash_deals': PromotionSerializer(flash_deals, many=True).data,
        'hot_deals': PromotionSerializer(hot_deals, many=True).data,
        'seasonal_offers': PromotionSerializer(seasonal_offers, many=True).data,
        'free_shipping_offers': PromotionSerializer(free_shipping_offers, many=True).data,
        'percentage_deals': PromotionSerializer(percentage_deals, many=True).data,
        'bxgy_deals': PromotionSerializer(bxgy_deals, many=True).data,
        'category_offers': category_offers,
        'total_active_offers': active_promotions.count()
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def trending_offers(request):
    """Get trending/popular offers"""
    now = timezone.now()
    
    # Get most used promotions in last 30 days
    trending = Promotion.objects.filter(
        status='active',
        start_date__lte=now,
        end_date__gte=now,
        usages__used_at__gte=now - timezone.timedelta(days=30)
    ).annotate(
        recent_usage_count=Count('usages')
    ).filter(
        recent_usage_count__gte=5
    ).order_by('-recent_usage_count')[:15]
    
    return Response({
        'trending_offers': PromotionSerializer(trending, many=True).data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def promo_code_search(request):
    """Search for promo codes"""
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    discount_type = request.GET.get('type', '')
    
    if not query and not category and not discount_type:
        return Response({'error': 'Please provide search parameters'}, status=400)
    
    now = timezone.now()
    promo_codes = PromoCode.objects.filter(
        is_active=True,
        promotion__status='active',
        promotion__start_date__lte=now,
        promotion__end_date__gte=now
    )
    
    if query:
        promo_codes = promo_codes.filter(
            Q(code__icontains=query) | 
            Q(promotion__name__icontains=query) |
            Q(promotion__description__icontains=query)
        )
    
    if category:
        promo_codes = promo_codes.filter(
            promotion__applicable_categories__name__icontains=category
        )
    
    if discount_type:
        promo_codes = promo_codes.filter(
            promotion__promotion_type=discount_type
        )
    
    promo_codes = promo_codes.distinct()[:20]
    
    return Response({
        'promo_codes': PromoCodeSerializer(promo_codes, many=True).data,
        'total_found': promo_codes.count()
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def track_promo_impression(request):
    """Track promo code impression/click"""
    featured_promo_id = request.data.get('featured_promo_id')
    action_type = request.data.get('action', 'view')  # 'view' or 'click'
    
    if not featured_promo_id:
        return Response({'error': 'Featured promo ID required'}, status=400)
    
    try:
        featured_promo = FeaturedPromo.objects.get(id=featured_promo_id)
        
        # Create or get impression record
        impression, created = PromoImpression.objects.get_or_create(
            featured_promo=featured_promo,
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key if hasattr(request, 'session') else '',
            defaults={
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': request.META.get('REMOTE_ADDR'),
                'referrer': request.META.get('HTTP_REFERER', '')
            }
        )
        
        # Update impression/click counts
        if action_type == 'click' and not impression.clicked_at:
            impression.clicked_at = timezone.now()
            impression.save()
            
            # Update featured promo click count
            featured_promo.current_clicks += 1
            featured_promo.save()
        elif created:
            # New impression
            featured_promo.current_impressions += 1
            featured_promo.save()
        
        return Response({'success': True})
        
    except FeaturedPromo.DoesNotExist:
        return Response({'error': 'Featured promo not found'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def offers_by_category(request, category_slug):
    """Get offers for a specific category"""
    from apps.products.models import Category
    
    try:
        category = Category.objects.get(slug=category_slug)
        now = timezone.now()
        
        offers = Promotion.objects.filter(
            status='active',
            start_date__lte=now,
            end_date__gte=now,
            applicable_categories=category
        ).prefetch_related('promo_codes', 'applicable_products')
        
        return Response({
            'category': category.name,
            'offers': PromotionSerializer(offers, many=True).data,
            'total_offers': offers.count()
        })
        
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
