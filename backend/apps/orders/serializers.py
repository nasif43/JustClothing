from rest_framework import serializers
from django.db import transaction
from django.shortcuts import get_object_or_404
from apps.products.models import Product
from apps.users.models import User
from .models import (
    Cart, CartItem, Order, OrderItem, OrderStatusHistory
)


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_image = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='product.seller.business_name', read_only=True)
    seller_id = serializers.CharField(source='product.seller.id', read_only=True)
    unit_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    is_available = serializers.BooleanField(source='product.is_in_stock', read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'quantity', 'size', 'color',
            'product_name', 'product_slug', 'product_image', 'seller_name', 'seller_id',
            'unit_price', 'total_price', 'is_available',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'unit_price', 'total_price', 'created_at', 'updated_at')
    
    def get_unit_price(self, obj):
        """Get unit price from product"""
        return obj.product.price
    
    def get_total_price(self, obj):
        """Calculate total price"""
        return obj.product.price * obj.quantity
    
    def get_product_image(self, obj):
        """Get product primary image"""
        image = obj.product.images.filter(is_primary=True).first()
        if image and hasattr(image, 'image') and image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""
    
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_items', 'total_price', 'created_at', 'updated_at']
        read_only_fields = ('id', 'user', 'total_items', 'total_price', 'created_at', 'updated_at')


class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding items to cart"""
    
    product_id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    size = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    
    def validate_product_id(self, value):
        """Validate product exists and is available"""
        try:
            product = Product.objects.get(id=value, status='active')
            if not product.is_in_stock or product.stock_quantity <= 0:
                raise serializers.ValidationError("Product is out of stock")
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")
    
    def validate(self, attrs):
        """Validate quantity against stock"""
        product = Product.objects.get(id=attrs['product_id'])
        quantity = attrs['quantity']
        
        if quantity > product.stock_quantity:
            raise serializers.ValidationError(
                f"Only {product.stock_quantity} items available in stock"
            )
        
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity"""
    
    quantity = serializers.IntegerField(min_value=1)
    
    def validate_quantity(self, value):
        """Validate quantity against available stock"""
        cart_item = self.instance
        if cart_item and value > cart_item.product.stock_quantity:
            raise serializers.ValidationError(
                f"Only {cart_item.product.stock_quantity} items available in stock"
            )
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='product.seller.business_name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'title', 'photo', 'size', 'color', 'quantity', 
            'price', 'unit_price', 'total_price', 'product_name', 'product_image', 
            'seller_name'
        ]
    
    def get_product_image(self, obj):
        """Get product primary image"""
        image = obj.product.images.filter(is_primary=True).first()
        if image and hasattr(image, 'image') and image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    totalItems = serializers.SerializerMethodField()
    billAmount = serializers.DecimalField(source='bill', max_digits=10, decimal_places=2, read_only=True)
    isCompleted = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'seller', 'customer_name', 'customer_email', 'customer_phone', 
            'customer_address', 'status', 'payment_method', 'items',
            'total_amount', 'bill', 'totalItems', 'billAmount', 'isCompleted',
            'placedOn', 'time', 'placedTime', 'created_at', 'updated_at'
        ]
        read_only_fields = (
            'id', 'user', 'seller', 'total_amount', 'bill', 'totalItems', 'billAmount',
            'isCompleted', 'placedOn', 'time', 'placedTime', 'created_at', 'updated_at'
        )
    
    def get_totalItems(self, obj):
        """Get total items in order"""
        return obj.totalItems
    
    def get_isCompleted(self, obj):
        """Check if order is completed"""
        return obj.isCompleted
    
    def get_seller(self, obj):
        """Get seller information"""
        if obj.seller:
            return {
                'id': obj.seller.id,
                'business_name': obj.seller.business_name,
                'email': obj.seller.user.email,
                'phone_number': str(obj.seller.phone_number) if obj.seller.phone_number else None,
                'business_address': obj.seller.business_address
            }
        return None


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating orders from cart"""
    
    PAYMENT_METHOD_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('mobile_banking', 'Mobile Banking'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    payment_method = serializers.ChoiceField(choices=PAYMENT_METHOD_CHOICES)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    customer_address = serializers.CharField(required=False, allow_blank=True)
    promo_code = serializers.CharField(required=False, allow_blank=True)
    
    def validate_promo_code(self, value):
        """Validate promo code if provided"""
        if value:
            from apps.promos.models import PromoCode
            try:
                promo = PromoCode.objects.get(code=value, is_active=True)
                if not promo.can_be_used():
                    raise serializers.ValidationError("Promo code is no longer available")
                if not promo.promotion.can_be_used_by(self.context['request'].user):
                    raise serializers.ValidationError("You cannot use this promo code")
                return value
            except PromoCode.DoesNotExist:
                raise serializers.ValidationError("Invalid promo code")
        return value


class CreateQuickOrderSerializer(serializers.Serializer):
    """Serializer for creating quick orders (single product)"""
    
    PAYMENT_METHOD_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('mobile_banking', 'Mobile Banking'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    product_id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    size = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=PAYMENT_METHOD_CHOICES)
    customer_name = serializers.CharField()
    customer_phone = serializers.CharField()
    customer_address = serializers.CharField()
    promo_code = serializers.CharField(required=False, allow_blank=True)
    
    def validate_promo_code(self, value):
        """Validate promo code if provided"""
        if value:
            from apps.promos.models import PromoCode
            try:
                promo = PromoCode.objects.get(code=value, is_active=True)
                if not promo.can_be_used():
                    raise serializers.ValidationError("Promo code is no longer available")
                if not promo.promotion.can_be_used_by(self.context['request'].user):
                    raise serializers.ValidationError("You cannot use this promo code")
                return value
            except PromoCode.DoesNotExist:
                raise serializers.ValidationError("Invalid promo code")
        return value
    
    def validate_product_id(self, value):
        """Validate product exists and is available"""
        try:
            product = Product.objects.get(id=value, status='active')
            if not product.is_in_stock or product.stock_quantity <= 0:
                raise serializers.ValidationError("Product is out of stock")
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")
    
    def validate(self, attrs):
        """Validate quantity against stock"""
        product = Product.objects.get(id=attrs['product_id'])
        quantity = attrs['quantity']
        
        if quantity > product.stock_quantity:
            raise serializers.ValidationError(
                f"Only {product.stock_quantity} items available in stock"
            )
        
        return attrs 