from rest_framework import serializers
from .models import Review, SellerReview, ReviewImage, ReviewReply
from apps.products.models import Product
from apps.users.models import SellerProfile


class ReviewReplySerializer(serializers.ModelSerializer):
    """Serializer for review replies"""
    
    seller_name = serializers.CharField(source='seller.business_name', read_only=True)
    
    class Meta:
        model = ReviewReply
        fields = [
            'id', 'content', 'seller', 'seller_name', 'is_approved', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'seller', 'seller_name', 'is_approved', 'created_at', 'updated_at')


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""
    
    user_info = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    reply = ReviewReplySerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_info', 'product', 'product_name', 'productId',
            'order', 'rating', 'content', 'review_type', 'is_approved',
            'is_featured', 'created_at', 'createdAt', 'updated_at', 'reply'
        ]
        read_only_fields = (
            'id', 'user', 'user_info', 'product_name', 'productId', 
            'is_approved', 'is_featured', 'created_at', 'createdAt', 'updated_at', 'reply'
        )
    
    def get_user_info(self, obj):
        """Get user information for frontend compatibility"""
        return {
            'id': obj.user.id,
            'name': obj.user.get_full_name() or obj.user.username or obj.user.email,
            'avatar': None  # Can be enhanced with user avatars
        }
    
    def validate(self, data):
        """Validate review data"""
        if data.get('product') and data.get('seller'):
            raise serializers.ValidationError("Review cannot be for both product and seller")
        
        if not data.get('product') and not data.get('seller'):
            raise serializers.ValidationError("Review must be for either a product or seller")
        
        return data


class CreateReviewSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating reviews"""
    
    class Meta:
        model = Review
        fields = ['product', 'order', 'rating', 'content', 'review_type']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_content(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Review must be at least 10 characters long")
        return value.strip()


class SellerReviewSerializer(serializers.ModelSerializer):
    """Serializer for seller reviews"""
    
    user_info = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='seller.business_name', read_only=True)
    reply = ReviewReplySerializer(read_only=True)
    
    class Meta:
        model = SellerReview
        fields = [
            'id', 'user', 'user_info', 'seller', 'seller_name', 'order',
            'rating', 'content', 'communication_rating', 'shipping_rating',
            'quality_rating', 'is_approved', 'created_at', 'updated_at', 'reply'
        ]
        read_only_fields = (
            'id', 'user', 'user_info', 'seller_name', 'is_approved', 
            'created_at', 'updated_at', 'reply'
        )
    
    def get_user_info(self, obj):
        """Get user information for frontend compatibility"""
        return {
            'id': obj.user.id,
            'name': obj.user.get_full_name() or obj.user.username or obj.user.email,
            'avatar': None  # Can be enhanced with user avatars
        }


class ReviewImageSerializer(serializers.ModelSerializer):
    """Serializer for review images"""
    
    class Meta:
        model = ReviewImage
        fields = ['id', 'image', 'caption', 'created_at']
        read_only_fields = ('id', 'created_at')


class ReviewWithImagesSerializer(ReviewSerializer):
    """Review serializer with images included"""
    
    images = ReviewImageSerializer(many=True, read_only=True)
    
    class Meta(ReviewSerializer.Meta):
        fields = ReviewSerializer.Meta.fields + ['images'] 