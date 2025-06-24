from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from django.db.models import Avg
from .models import Review, SellerReview, ReviewReply
from .serializers import ReviewSerializer, SellerReviewSerializer, CreateReviewSerializer, ReviewReplySerializer
from apps.products.models import Product
from apps.users.models import SellerProfile


class ReviewListCreateView(generics.ListCreateAPIView):
    """List and create product reviews"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Review.objects.filter(is_approved=True)
        product_id = self.request.query_params.get('product_id')
        seller_id = self.request.query_params.get('seller_id')
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if seller_id:
            queryset = queryset.filter(product__seller_id=seller_id)
            
        return queryset.select_related('user', 'product', 'reply__seller').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a review"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)


class ProductReviewsView(generics.ListAPIView):
    """Get all reviews for a specific product"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return Review.objects.filter(
            product_id=product_id, 
            is_approved=True
        ).select_related('user', 'reply__seller').order_by('-created_at')


class SellerReviewListCreateView(generics.ListCreateAPIView):
    """List and create seller reviews"""
    serializer_class = SellerReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = SellerReview.objects.filter(is_approved=True)
        seller_id = self.request.query_params.get('seller_id')
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
        return queryset.select_related('user', 'seller').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewReplyCreateView(generics.CreateAPIView):
    """Create a reply to a review (seller only)"""
    serializer_class = ReviewReplySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Get the review
        review_id = self.kwargs['review_id']
        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response(
                {'error': 'Review not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is a seller and owns the product/store being reviewed
        if not hasattr(request.user, 'seller_profile'):
            return Response(
                {'error': 'Only sellers can reply to reviews'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        seller_profile = request.user.seller_profile
        
        # Check if this review is for the seller's product
        if review.product and review.product.seller != seller_profile:
            return Response(
                {'error': 'You can only reply to reviews for your own products'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if reply already exists
        if hasattr(review, 'reply'):
            return Response(
                {'error': 'A reply already exists for this review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the reply
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            reply = serializer.save(review=review, seller=seller_profile)
            # Return the reply data with the seller information populated
            response_serializer = self.get_serializer(reply)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerReviewsView(generics.ListAPIView):
    """Get all reviews for seller's products"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'seller_profile'):
            return Review.objects.none()
        
        seller_profile = self.request.user.seller_profile
        return Review.objects.filter(
            product__seller=seller_profile,
            is_approved=True
        ).select_related('user', 'product', 'reply__seller').order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_review_stats(request, product_id):
    """Get review statistics for a product"""
    try:
        product = Product.objects.get(id=product_id)
        reviews = Review.objects.filter(product=product, is_approved=True)
        
        stats = {
            'total_reviews': reviews.count(),
            'average_rating': reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0,
            'rating_distribution': {
                '5': reviews.filter(rating=5).count(),
                '4': reviews.filter(rating=4).count(),
                '3': reviews.filter(rating=3).count(),
                '2': reviews.filter(rating=2).count(),
                '1': reviews.filter(rating=1).count(),
            }
        }
        
        return Response(stats)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def seller_review_stats(request, seller_id):
    """Get review statistics for a seller"""
    try:
        seller = SellerProfile.objects.get(id=seller_id)
        
        # Get both direct seller reviews and product reviews
        seller_reviews = SellerReview.objects.filter(seller=seller, is_approved=True)
        product_reviews = Review.objects.filter(product__seller=seller, is_approved=True)
        
        # Combine stats
        total_seller_reviews = seller_reviews.count()
        total_product_reviews = product_reviews.count()
        total_reviews = total_seller_reviews + total_product_reviews
        
        if total_reviews > 0:
            seller_avg = seller_reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
            product_avg = product_reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
            
            # Weighted average
            if total_seller_reviews > 0 and total_product_reviews > 0:
                average_rating = (seller_avg * total_seller_reviews + product_avg * total_product_reviews) / total_reviews
            elif total_seller_reviews > 0:
                average_rating = seller_avg
            else:
                average_rating = product_avg
        else:
            average_rating = 0
        
        # Get distribution from product reviews (more common)
        stats = {
            'total_reviews': total_reviews,
            'average_rating': round(average_rating, 2),
            'rating_distribution': {
                '5': product_reviews.filter(rating=5).count() + seller_reviews.filter(rating=5).count(),
                '4': product_reviews.filter(rating=4).count() + seller_reviews.filter(rating=4).count(),
                '3': product_reviews.filter(rating=3).count() + seller_reviews.filter(rating=3).count(),
                '2': product_reviews.filter(rating=2).count() + seller_reviews.filter(rating=2).count(),
                '1': product_reviews.filter(rating=1).count() + seller_reviews.filter(rating=1).count(),
            }
        }
        
        return Response(stats)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_reviews(request, store_id):
    """Get all reviews for a store (seller)"""
    try:
        seller = SellerProfile.objects.get(id=store_id)
        
        # Get product reviews for this seller
        reviews = Review.objects.filter(
            product__seller=seller,
            is_approved=True
        ).select_related('user', 'product', 'reply__seller').order_by('-created_at')
        
        # Get sorting parameter
        sort_by = request.query_params.get('sort', 'default')
        if sort_by == 'rating_high':
            reviews = reviews.order_by('-rating', '-created_at')
        elif sort_by == 'rating_low':
            reviews = reviews.order_by('rating', '-created_at')
        elif sort_by == 'oldest':
            reviews = reviews.order_by('created_at')
        # default is already newest first
        
        # Get review stats
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
        
        rating_distribution = []
        for rating in [5, 4, 3, 2, 1]:
            count = reviews.filter(rating=rating).count()
            rating_distribution.append({
                'rating': rating,
                'count': count,
                'percentage': round((count / total_reviews * 100) if total_reviews > 0 else 0, 1)
            })
        
        # Serialize reviews
        serializer = ReviewSerializer(reviews, many=True)
        
        return Response({
            'reviews': serializer.data,
            'stats': {
                'averageRating': round(avg_rating, 1),
                'totalReviews': total_reviews,
                'distribution': rating_distribution
            }
        })
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
