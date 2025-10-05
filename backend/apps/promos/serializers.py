from rest_framework import serializers
from .models import (
    Promotion, PromoCode, SellerPromoRequest, 
    PromotionalCampaign, PromoUsage, FeaturedPromo
)
from apps.products.models import Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class ProductBasicSerializer(serializers.ModelSerializer):
    """Basic product info for offer creation"""
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'images', 'stock_quantity']


class SellerPromoRequestSerializer(serializers.ModelSerializer):
    """Serializer for seller promo requests"""
    target_products = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        many=True, 
        required=False
    )
    target_products_details = ProductBasicSerializer(
        source='target_products', 
        many=True, 
        read_only=True
    )
    
    class Meta:
        model = SellerPromoRequest
        fields = [
            'id', 'requested_code', 'requested_name', 'requested_description',
            'requested_type', 'requested_discount_percentage', 'requested_discount_amount',
            'requested_minimum_order_amount', 'requested_usage_limit',
            'requested_start_date', 'requested_end_date', 'target_products',
            'target_products_details', 'status', 'review_notes', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'review_notes', 'created_at']

    def create(self, validated_data):
        # Set the seller from the request user
        validated_data['seller'] = self.context['request'].user.seller_profile
        target_products = validated_data.pop('target_products', [])
        
        promo_request = SellerPromoRequest.objects.create(**validated_data)
        if target_products:
            promo_request.target_products.set(target_products)
        
        return promo_request

    def validate(self, data):
        """Validate promo request data"""
        # Ensure dates are valid
        if data.get('requested_start_date') and data.get('requested_end_date'):
            if data['requested_start_date'] >= data['requested_end_date']:
                raise serializers.ValidationError("End date must be after start date")
        
        # Validate discount values based on type
        if data.get('requested_type') == 'percentage':
            if not data.get('requested_discount_percentage'):
                raise serializers.ValidationError("Percentage discount is required for percentage type")
            if data.get('requested_discount_percentage', 0) > 50:
                raise serializers.ValidationError("Percentage discount cannot exceed 50%")
        elif data.get('requested_type') == 'fixed_amount':
            if not data.get('requested_discount_amount'):
                raise serializers.ValidationError("Discount amount is required for fixed amount type")
        
        return data


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for approved promo codes"""
    promotion_details = serializers.SerializerMethodField()
    applicable_products = ProductBasicSerializer(
        source='promotion.applicable_products', 
        many=True, 
        read_only=True
    )
    
    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'usage_count', 'usage_limit', 'is_active',
            'created_at', 'promotion_details', 'applicable_products'
        ]
    
    def get_promotion_details(self, obj):
        return {
            'id': obj.promotion.id,
            'name': obj.promotion.name,
            'description': obj.promotion.description,
            'promotion_type': obj.promotion.promotion_type,
            'discount_percentage': obj.promotion.discount_percentage,
            'discount_amount': obj.promotion.discount_amount,
            'start_date': obj.promotion.start_date,
            'end_date': obj.promotion.end_date,
            'status': obj.promotion.status,
            'is_active': obj.promotion.is_active
        }


class PromotionSerializer(serializers.ModelSerializer):
    """Serializer for promotions"""
    applicable_products = ProductBasicSerializer(many=True, read_only=True)
    promo_codes = PromoCodeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Promotion
        fields = [
            'id', 'name', 'description', 'promotion_type',
            'discount_percentage', 'discount_amount', 'minimum_order_amount',
            'usage_limit', 'usage_count', 'start_date', 'end_date',
            'status', 'is_featured', 'applicable_products', 'promo_codes',
            'created_at', 'updated_at'
        ]


class PromoUsageSerializer(serializers.ModelSerializer):
    """Serializer for promo usage tracking"""
    promotion_name = serializers.CharField(source='promotion.name', read_only=True)
    promo_code = serializers.CharField(source='promo_code.code', read_only=True)
    
    class Meta:
        model = PromoUsage
        fields = [
            'id', 'promotion_name', 'promo_code', 'discount_amount',
            'used_at'
        ]


class FeaturedPromoSerializer(serializers.ModelSerializer):
    """Serializer for featured promotions"""
    promo_code_details = PromoCodeSerializer(source='promo_code', read_only=True)
    
    class Meta:
        model = FeaturedPromo
        fields = [
            'id', 'placement', 'priority', 'promotion_start', 'promotion_end',
            'current_impressions', 'current_clicks', 'is_active', 
            'is_currently_active', 'promo_code_details'
        ] 