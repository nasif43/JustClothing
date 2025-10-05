from django.shortcuts import render
from rest_framework import generics, filters, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Count
from django.shortcuts import get_object_or_404
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank, TrigramSimilarity
from django.db.models import Case, When, FloatField, IntegerField

from .models import Category, Product, ProductAttributeType, ProductImage, ProductVideo, ProductOffer
from .serializers import (
    CategorySerializer, CategoryCreateSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    ProductAttributeTypeSerializer, ProductImageSerializer, ProductVideoSerializer,
    ProductSearchSerializer, ProductOfferSerializer, ProductOfferCreateSerializer,
    ProductWithOfferSerializer
)
from .filters import ProductFilter
from .pagination import ProductPageNumberPagination, SearchResultsPagination
from taggit.models import Tag


class CategoryListCreateView(generics.ListCreateAPIView):
    """List categories and create new ones (auto-add from frontend)"""
    queryset = Category.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CategoryCreateSerializer
        return CategorySerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CategoryDetailView(generics.RetrieveAPIView):
    """Get category details"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ProductListView(generics.ListAPIView):
    """List products with comprehensive filtering and enhanced search"""
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ProductFilter
    ordering_fields = ['price', 'created_at', 'rating', 'sales_count']
    ordering = ['-created_at']
    pagination_class = ProductPageNumberPagination

    def get_queryset(self):
        queryset = Product.objects.select_related(
            'seller', 'category', 'collection'
        ).prefetch_related(
            'images', 'tags', 'variants'
        ).filter(status='active')
        
        # Enhanced search functionality with PostgreSQL full-text search
        search = self.request.query_params.get('search')
        if search:
            # Use custom pagination for search results
            self.pagination_class = SearchResultsPagination
            
            search_query = SearchQuery(search)
            
            # Create search vector with weighted fields
            search_vector = (
                SearchVector('name', weight='A') +
                SearchVector('description', weight='B') +
                SearchVector('seller__business_name', weight='C') +
                SearchVector('tags__name', weight='D')
            )
            
            # Apply search with ranking
            queryset = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query),
                # Add trigram similarity for fuzzy matching
                similarity=TrigramSimilarity('name', search)
            ).filter(
                Q(search=search_query) | Q(similarity__gt=0.1)
            ).distinct().order_by('-rank', '-similarity', '-created_at')
            
            # If no results found with full-text search, fall back to basic search
            if not queryset.exists():
                queryset = Product.objects.select_related(
                    'seller', 'category', 'collection'
                ).prefetch_related(
                    'images', 'tags', 'variants'
                ).filter(
                    status='active'
                ).filter(
                    Q(name__icontains=search) |
                    Q(description__icontains=search) |
                    Q(seller__business_name__icontains=search) |
                    Q(tags__name__icontains=search)
                ).distinct().annotate(
                    rank=Case(
                        When(name__icontains=search, then=1.0),
                        When(description__icontains=search, then=0.8),
                        When(seller__business_name__icontains=search, then=0.6),
                        When(tags__name__icontains=search, then=0.4),
                        default=0.0,
                        output_field=FloatField()
                    )
                ).order_by('-rank', '-created_at')
        
        # Category filtering
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # BUSINESS TYPE FILTERING (Main homepage categories)
        business_type = self.request.query_params.get('business_type')
        if business_type:
            queryset = queryset.filter(seller__business_type=business_type)
        
        # Price filtering
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)
        
        # Stock filtering
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            queryset = queryset.filter(stock_quantity__gt=0)
        
        # Featured products
        is_featured = self.request.query_params.get('is_featured')
        if is_featured and is_featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        # Tags filtering
        tags = self.request.query_params.get('tags')
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            print(f"DEBUG: Searching for tags: {tag_list}")
            
            # Handle both individual tags and JSON array tags
            tag_queries = Q()
            for tag in tag_list:
                print(f"DEBUG: Building query for tag: '{tag}'")
                # Search for exact match or JSON array containing the tag
                tag_queries |= (
                    Q(tags__name__iexact=tag) |  # Exact match (case insensitive)
                    Q(tags__name__icontains=f'"{tag}"')  # JSON array contains the tag
                )
            
            print(f"DEBUG: Final tag query: {tag_queries}")
            queryset = queryset.filter(tag_queries).distinct()
            print(f"DEBUG: Products found after tag filtering: {queryset.count()}")
            
            # Let's also see what tags actually exist
            from taggit.models import Tag
            all_tags = Tag.objects.all().values_list('name', flat=True)
            print(f"DEBUG: All tags in database: {list(all_tags)}")
        
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """Get product details and increment view count"""
    queryset = Product.objects.select_related('seller', 'category').prefetch_related(
        'images', 'videos', 'attributes', 'variants', 'tags'
    )
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count
        Product.objects.filter(id=instance.id).update(views_count=F('views_count') + 1)
        
        # Refresh instance to get updated view count
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProductCreateView(generics.CreateAPIView):
    """Create new product (sellers only)"""
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Product.objects.filter(seller__user=self.request.user)
    
    def perform_create(self, serializer):
        # Ensure user has seller profile
        if not hasattr(self.request.user, 'seller_profile'):
            raise ValueError("User must be a seller to create products")
        
        serializer.save(seller=self.request.user.seller_profile)


class ProductUpdateView(generics.UpdateAPIView):
    """Update product (sellers only - their own products)"""
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Product.objects.filter(seller__user=self.request.user)


class ProductDeleteView(generics.DestroyAPIView):
    """Delete product (sellers only - their own products)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Product.objects.filter(seller__user=self.request.user)


class SellerProductListView(generics.ListAPIView):
    """List products for authenticated seller"""
    serializer_class = ProductListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_description']
    ordering_fields = ['created_at', 'base_price', 'stock_quantity', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'seller_profile'):
            return Product.objects.none()
        
        return Product.objects.filter(
            seller=self.request.user.seller_profile
        ).select_related('category').prefetch_related('images', 'tags')


class ProductImageListCreateView(generics.ListCreateAPIView):
    """List and create product images"""
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Product, id=product_id, seller__user=self.request.user)
        return ProductImage.objects.filter(product=product)
    
    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Product, id=product_id, seller__user=self.request.user)
        serializer.save(product=product)


class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete product image"""
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Product, id=product_id, seller__user=self.request.user)
        return ProductImage.objects.filter(product=product)


class ProductVideoListCreateView(generics.ListCreateAPIView):
    """List and create product videos"""
    serializer_class = ProductVideoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Product, id=product_id, seller__user=self.request.user)
        return ProductVideo.objects.filter(product=product)
    
    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Product, id=product_id, seller__user=self.request.user)
        serializer.save(product=product)


class ProductVideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete product video"""
    serializer_class = ProductVideoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        product = get_object_or_404(Product, id=product_id, seller__user=self.request.user)
        return ProductVideo.objects.filter(product=product)


class ProductAttributeTypeListView(generics.ListAPIView):
    """List available product attribute types"""
    queryset = ProductAttributeType.objects.all()
    serializer_class = ProductAttributeTypeSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def featured_products_view(request):
    """Get featured products"""
    products = Product.objects.filter(
        is_featured=True, 
        status='active'
    ).select_related('seller', 'category').prefetch_related('images', 'tags')[:10]
    
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def trending_products_view(request):
    """Get trending products with analytics"""
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count, Sum
    from apps.orders.models import OrderItem, CartItem
    
    # Get time range for analytics (last 24 hours by default)
    hours = int(request.GET.get('hours', 24))
    time_threshold = timezone.now() - timedelta(hours=hours)
    
    # Get products with basic ordering
    products = Product.objects.filter(
        status='active'
    ).select_related('seller', 'category').prefetch_related('images', 'tags').order_by(
        '-views_count', '-sales_count'
    )[:20]
    
    # Prepare response with analytics
    products_data = []
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    
    for i, product_data in enumerate(serializer.data):
        product_id = product_data['id']
        
        # Get cart analytics (added to cart in last X hours)
        cart_adds = CartItem.objects.filter(
            product_id=product_id,
            created_at__gte=time_threshold
        ).aggregate(
            total_cart_adds=Count('id'),
            total_cart_quantity=Sum('quantity')
        )
        
        # Get order analytics (ordered in last X hours)
        order_stats = OrderItem.objects.filter(
            product_id=product_id,
            created_at__gte=time_threshold
        ).aggregate(
            total_orders=Count('id'),
            total_ordered_quantity=Sum('quantity')
        )
        
        # Add analytics to product data
        product_data['analytics'] = {
            'cart_adds': cart_adds['total_cart_adds'] or 0,
            'cart_quantity': cart_adds['total_cart_quantity'] or 0,
            'orders': order_stats['total_orders'] or 0,
            'ordered_quantity': order_stats['total_ordered_quantity'] or 0,
            'hours_analyzed': hours
        }
        
        # Generate analytics subtitle
        analytics_parts = []
        if product_data['analytics']['cart_adds'] > 0:
            analytics_parts.append(f"added to cart {product_data['analytics']['cart_adds']} times")
        if product_data['analytics']['orders'] > 0:
            analytics_parts.append(f"ordered {product_data['analytics']['orders']} times")
        
        if analytics_parts:
            product_data['analytics_subtitle'] = f"{' and '.join(analytics_parts)} in the last {hours} hours"
        else:
            product_data['analytics_subtitle'] = f"No recent activity in the last {hours} hours"
        
        products_data.append(product_data)
    
    return Response({
        'products': products_data,
        'analytics_period_hours': hours,
        'total_products': len(products_data)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def related_products_view(request, product_id):
    """Get related products based on category and tags"""
    try:
        product = Product.objects.get(id=product_id)
        
        # Get products with same category or tags
        related = Product.objects.filter(
            Q(category=product.category) | Q(tags__in=product.tags.all()),
            status='active'
        ).exclude(id=product_id).distinct().select_related(
            'seller', 'category'
        ).prefetch_related('images', 'tags')[:8]
        
        serializer = ProductListSerializer(related, many=True, context={'request': request})
        return Response(serializer.data)
    
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_products_view(request):
    """Bulk update multiple products"""
    
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'Only sellers can bulk update products'}, status=403)
    
    product_ids = request.data.get('product_ids', [])
    update_data = request.data.get('update_data', {})
    
    if not product_ids:
        return Response({'error': 'No product IDs provided'}, status=400)
    
    # Only allow updating products owned by the seller
    products = Product.objects.filter(
        id__in=product_ids,
        seller=request.user.seller_profile
    )
    
    # Apply updates
    updated_count = products.update(**update_data)
    
    return Response({
        'message': f'Updated {updated_count} products',
        'updated_count': updated_count
    })


# Product Offer Views
class ProductOfferListCreateView(generics.ListCreateAPIView):
    """List and create product offers for a seller"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductOfferCreateSerializer
        return ProductOfferSerializer
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'seller_profile'):
            return ProductOffer.objects.none()
        
        return ProductOffer.objects.filter(
            seller=self.request.user.seller_profile
        ).select_related('product').order_by('-created_at')
    
    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'seller_profile'):
            raise ValueError("User must be a seller to create offers")
        
        # Validate that the product belongs to the seller
        product = serializer.validated_data['product']
        if product.seller != self.request.user.seller_profile:
            raise ValueError("You can only create offers for your own products")
        
        serializer.save(seller=self.request.user.seller_profile)


class ProductOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a product offer"""
    serializer_class = ProductOfferSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'seller_profile'):
            return ProductOffer.objects.none()
        
        return ProductOffer.objects.filter(seller=self.request.user.seller_profile)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_products_for_offers_view(request):
    """Get seller's products available for creating offers"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'Only sellers can access this endpoint'}, status=403)
    
    products = Product.objects.filter(
        seller=request.user.seller_profile,
        status='active'
    ).select_related('seller').prefetch_related('images').order_by('-created_at')
    
    serializer = ProductWithOfferSerializer(products, many=True, context={'request': request})
    return Response({'products': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_products_for_offers_view(request):
    """Get seller's products available for creating offers"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'Only sellers can access this endpoint'}, status=403)
    
    products = Product.objects.filter(
        seller=request.user.seller_profile,
        status='active'
    ).select_related('seller', 'category').prefetch_related('images', 'tags')
    
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response({'products': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_active_offers_view(request):
    """Get seller's currently active offers"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'Only sellers can access this endpoint'}, status=403)
    
    from django.utils import timezone
    now = timezone.now()
    
    active_offers = ProductOffer.objects.filter(
        seller=request.user.seller_profile,
        status='active',
        start_date__lte=now,
        end_date__gte=now
    ).select_related('product').prefetch_related('product__images')
    
    serializer = ProductOfferSerializer(active_offers, many=True)
    return Response({'offers': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_active_offers_view(request, seller_id):
    """Get active offers for a specific store/seller"""
    from django.utils import timezone
    now = timezone.now()
    
    try:
        from apps.users.models import SellerProfile
        seller = SellerProfile.objects.get(id=seller_id)
    except SellerProfile.DoesNotExist:
        return Response({'offers': []})
    
    active_offers = ProductOffer.objects.filter(
        seller=seller,
        status='active',
        start_date__lte=now,
        end_date__gte=now
    ).select_related('product').prefetch_related('product__images')
    
    serializer = ProductOfferSerializer(active_offers, many=True)
    return Response({'offers': serializer.data})


class TagListView(APIView):
    """
    API endpoint for listing all available tags
    Tags are sorted by usage count (most used first)
    """
    permission_classes = []  # Allow public access
    
    def get(self, request, *args, **kwargs):
        tags = Tag.objects.annotate(
            usage_count=Count('taggit_taggeditem_items')
        ).order_by('-usage_count', 'name')
        
        tag_data = []
        for tag in tags:
            tag_data.append({
                'id': tag.id,
                'name': tag.name,
                'slug': tag.slug,
                'usage_count': tag.usage_count
            })
        
        return Response({
            'results': tag_data,
            'count': len(tag_data)
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_suggestions(request):
    """
    API endpoint for search suggestions/autocomplete
    Returns suggested products, categories, tags, and sellers based on query
    """
    query = request.GET.get('q', '').strip()
    limit = int(request.GET.get('limit', 5))
    
    if len(query) < 2:
        return Response({'suggestions': []})
    
    suggestions = {
        'products': [],
        'tags': [],
        'categories': [],
        'sellers': []
    }
    
    # Product name suggestions using trigram similarity
    product_suggestions = Product.objects.filter(
        status='active'
    ).annotate(
        similarity=TrigramSimilarity('name', query)
    ).filter(
        Q(name__icontains=query) | Q(similarity__gt=0.3)
    ).order_by('-similarity', '-created_at').values_list('name', flat=True)[:limit]
    
    suggestions['products'] = list(product_suggestions)
    
    # Tag suggestions
    tag_suggestions = Tag.objects.filter(
        name__icontains=query
    ).annotate(
        usage_count=Count('taggit_taggeditem_items')
    ).order_by('-usage_count', 'name').values_list('name', flat=True)[:limit]
    
    suggestions['tags'] = list(tag_suggestions)
    
    # Category suggestions
    category_suggestions = Category.objects.filter(
        name__icontains=query
    ).values_list('name', flat=True)[:limit]
    
    suggestions['categories'] = list(category_suggestions)
    
    # Seller/business suggestions
    try:
        from apps.users.models import SellerProfile
        seller_suggestions = SellerProfile.objects.filter(
            business_name__icontains=query,
            is_active=True
        ).values_list('business_name', flat=True)[:limit]
        
        suggestions['sellers'] = list(seller_suggestions)
    except ImportError:
        suggestions['sellers'] = []
    
    return Response({'suggestions': suggestions})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def trending_searches(request):
    """
    API endpoint for trending search terms
    Returns popular search terms based on product names and tags
    """
    limit = int(request.GET.get('limit', 10))
    
    # Get trending product names (most viewed/popular products)
    trending_products = Product.objects.filter(
        status='active'
    ).order_by('-views_count', '-sales_count')[:limit].values_list('name', flat=True)
    
    # Get trending tags (most used tags)
    trending_tags = Tag.objects.annotate(
        usage_count=Count('taggit_taggeditem_items')
    ).order_by('-usage_count')[:limit].values_list('name', flat=True)
    
    return Response({
        'trending': {
            'products': list(trending_products),
            'tags': list(trending_tags),
        }
    })
