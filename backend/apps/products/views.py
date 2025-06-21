from django.shortcuts import render
from rest_framework import generics, filters, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from django.shortcuts import get_object_or_404

from .models import Category, Product, ProductAttributeType, ProductImage, ProductVideo
from .serializers import (
    CategorySerializer, CategoryCreateSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    ProductAttributeTypeSerializer, ProductImageSerializer, ProductVideoSerializer,
    ProductSearchSerializer
)
from .filters import ProductFilter


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
    """List products with filtering and search"""
    queryset = Product.objects.select_related('seller', 'category').prefetch_related(
        'images', 'tags'
    ).filter(status='active')
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'short_description', 'long_description', 'tags__name']
    ordering_fields = ['created_at', 'base_price', 'rating', 'sales_count', 'views_count', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search query if provided
        search_query = self.request.query_params.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(short_description__icontains=search_query) |
                Q(long_description__icontains=search_query) |
                Q(tags__name__icontains=search_query)
            ).distinct()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            try:
                # Try to get by ID first, then by slug
                if category.isdigit():
                    queryset = queryset.filter(category_id=category)
                else:
                    queryset = queryset.filter(category__slug=category)
            except:
                pass
        
        # Filter by seller
        seller = self.request.query_params.get('seller')
        if seller:
            queryset = queryset.filter(seller_id=seller)
        
        # Price range filtering
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
            queryset = queryset.filter(tags__name__in=tag_list).distinct()
        
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
    """Get trending products (most viewed/sold)"""
    products = Product.objects.filter(
        status='active'
    ).select_related('seller', 'category').prefetch_related('images', 'tags').order_by(
        '-views_count', '-sales_count'
    )[:10]
    
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


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
    """Bulk update products for sellers"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'User is not a seller'}, status=400)
    
    product_ids = request.data.get('product_ids', [])
    update_data = request.data.get('update_data', {})
    
    if not product_ids or not update_data:
        return Response({'error': 'product_ids and update_data are required'}, status=400)
    
    # Only allow updating specific fields
    allowed_fields = ['status', 'is_featured', 'stock_quantity', 'base_price']
    filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    updated_count = Product.objects.filter(
        id__in=product_ids,
        seller=request.user.seller_profile
    ).update(**filtered_data)
    
    return Response({
        'message': f'Updated {updated_count} products',
        'updated_count': updated_count
    })
