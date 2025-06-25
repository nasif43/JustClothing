from rest_framework import serializers
from taggit.serializers import TagListSerializerField, TaggitSerializer
from .models import (
    Category, ProductAttributeType, Product, ProductAttribute, 
    ProductVariant, ProductVariantAttribute, ProductImage, ProductVideo, Collection, ProductOffer
)
from apps.users.models import SellerProfile


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories"""
    
    subcategories = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'parent', 'parent_name', 'is_active', 'subcategories']
    
    def get_subcategories(self, obj):
        if hasattr(obj, 'children'):
            return CategorySerializer(obj.children.all(), many=True).data
        return []


class ProductAttributeTypeSerializer(serializers.ModelSerializer):
    """Serializer for product attribute types"""
    
    class Meta:
        model = ProductAttributeType
        fields = '__all__'


class ProductAttributeSerializer(serializers.ModelSerializer):
    """Serializer for product attributes"""
    
    attribute_name = serializers.CharField(source='attribute_type.name', read_only=True)
    attribute_input_type = serializers.CharField(source='attribute_type.input_type', read_only=True)
    
    class Meta:
        model = ProductAttribute
        fields = ['id', 'attribute_type', 'attribute_name', 'attribute_input_type', 'value']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'sort_order']


class ProductVideoSerializer(serializers.ModelSerializer):
    """Serializer for product videos"""
    
    class Meta:
        model = ProductVideo
        fields = '__all__'
        read_only_fields = ('product',)


class ProductVariantAttributeSerializer(serializers.ModelSerializer):
    """Serializer for product variant attributes"""
    
    attribute_name = serializers.CharField(source='attribute_type.name', read_only=True)
    
    class Meta:
        model = ProductVariantAttribute
        fields = ['id', 'attribute_type', 'attribute_name', 'value']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Product variant serializer"""
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'size', 'color', 'price', 
            'stock_quantity', 'is_active'
        ]


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['id', 'name', 'slug', 'description', 'is_active']


class SellerBasicSerializer(serializers.ModelSerializer):
    """Basic seller info for product listings - matches frontend store structure"""
    
    class Meta:
        model = SellerProfile
        fields = ['id', 'name', 'bio', 'verified', 'rating', 'followers', 'productsCount', 'joinedDate', 'logo']


class ProductListSerializer(serializers.ModelSerializer):
    """Product serializer for list views - matches frontend product structure"""
    
    # Frontend compatibility fields
    image = serializers.SerializerMethodField()
    store = SellerBasicSerializer(source='seller', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    tags_list = serializers.SerializerMethodField()
    business_type = serializers.CharField(source='seller.business_type', read_only=True)
    
    # Offer fields - will be set after ProductOfferSerializer is defined
    discounted_price = serializers.ReadOnlyField()
    original_price = serializers.ReadOnlyField()
    has_active_offer = serializers.ReadOnlyField()
    savings_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'original_price', 'discounted_price', 'has_active_offer', 'savings_amount',
            'rating', 'review_count', 'sales_count',
            'category', 'category_name', 'collection', 'collection_name',
            'tags_list', 'availableSizes', 'availableColors', 'features',
            'is_featured', 'status', 'storeId', 'store', 'business_type',
            'image', 'created_at', 'updated_at',
            'stock_quantity', 'is_in_stock', 'is_low_stock', 'track_inventory'
        ]
    
    def get_image(self, obj):
        """Get primary image URL for frontend compatibility"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        return None
    
    def get_tags_list(self, obj):
        """Convert tags to list format for frontend"""
        return [tag.name for tag in obj.tags.all()]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed product serializer - matches frontend product detail structure"""
    
    # Images
    images = ProductImageSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    
    # Variants
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    # Related data
    category_data = CategorySerializer(source='category', read_only=True)
    collection_data = CollectionSerializer(source='collection', read_only=True)
    store = SellerBasicSerializer(source='seller', read_only=True)
    
    # Frontend compatibility fields
    category_name = serializers.CharField(source='category.name', read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    tags_list = serializers.SerializerMethodField()
    
    # Offer fields - will be set after ProductOfferSerializer is defined
    discounted_price = serializers.ReadOnlyField()
    original_price = serializers.ReadOnlyField()
    has_active_offer = serializers.ReadOnlyField()
    savings_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'original_price', 'discounted_price', 'has_active_offer', 'savings_amount',
            'base_price', 'compare_price', 'rating', 'review_count', 'sales_count',
            'category', 'category_name', 'category_data',
            'collection', 'collection_name', 'collection_data',
            'tags_list', 'availableSizes', 'availableColors', 'features',
            'offers_custom_sizes', 'custom_size_fields',
            'requires_advance_payment', 'estimated_pickup_days',
            'is_featured', 'status', 'storeId', 'store',
            'stock_quantity', 'is_in_stock', 'is_low_stock',
            'weight', 'shipping_days_min', 'shipping_days_max',
            'images', 'image', 'variants',
            'views_count', 'meta_title', 'meta_description',
            'created_at', 'updated_at'
        ]
    
    def get_image(self, obj):
        """Get primary image URL"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        return None
    
    def get_tags_list(self, obj):
        """Convert tags to list format"""
        return [tag.name for tag in obj.tags.all()]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products"""
    
    images = ProductImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    
    # Handle tags properly for JSON serialization
    tags_list = serializers.SerializerMethodField(read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'short_description',
            'price', 'compare_price', 'cost_price',
            'category', 'collection', 'tags', 'tags_list',
            'availableSizes', 'availableColors', 'features',
            'offers_custom_sizes', 'custom_size_fields',
            'requires_advance_payment', 'estimated_pickup_days',
            'status', 'is_featured',
            'track_inventory', 'stock_quantity', 'low_stock_threshold',
            'requires_shipping', 'weight', 'shipping_days_min', 'shipping_days_max',
            'meta_title', 'meta_description',
            'images', 'uploaded_images'
        ]
        read_only_fields = ('id', 'category')
    
    def get_tags_list(self, obj):
        """Convert tags to list format for JSON serialization"""
        return [tag.name for tag in obj.tags.all()]
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        tags = validated_data.pop('tags', [])
        
        # Set seller from context
        validated_data['seller'] = self.context['request'].user.seller_profile
        
        # Category will be auto-assigned in Product.save() method
        product = Product.objects.create(**validated_data)
        
        # Add tags if provided
        if tags:
            product.tags.add(*tags)
        
        # Handle uploaded images
        for i, image in enumerate(uploaded_images):
            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=(i == 0),  # First image is primary
                sort_order=i
            )
        
        return product
    
    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', None)
        tags = validated_data.pop('tags', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tags is not None:
            instance.tags.clear()
            instance.tags.add(*tags)
        
        # Handle new uploaded images
        if uploaded_images:
            # Remove old images
            instance.images.all().delete()
            
            # Add new images
            for i, image in enumerate(uploaded_images):
                ProductImage.objects.create(
                    product=instance,
                    image=image,
                    is_primary=(i == 0),
                    sort_order=i
                )
        
        return instance


class ProductSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search results"""
    
    image = serializers.SerializerMethodField()
    store_name = serializers.CharField(source='seller.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'rating', 'review_count',
            'image', 'store_name', 'category_name', 'is_featured'
        ]
    
    def get_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        return None


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating categories (auto-adding from frontend)"""
    
    class Meta:
        model = Category
        fields = ['name', 'description', 'parent']
    
    def create(self, validated_data):
        name = validated_data['name'].strip().lower()
        
        # Check if category already exists (case-insensitive)
        existing = Category.objects.filter(name__iexact=name).first()
        if existing:
            return existing
        
        # Create new category
        validated_data['name'] = name.title()  # Title case
        return Category.objects.create(**validated_data)


class ProductOfferSerializer(serializers.ModelSerializer):
    """Serializer for product offers"""
    discounted_price = serializers.ReadOnlyField()
    savings = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductOffer
        fields = [
            'id', 'name', 'description', 'offer_type',
            'discount_percentage', 'discount_amount',
            'start_date', 'end_date', 'status',
            'discounted_price', 'savings', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the seller from the request user
        validated_data['seller'] = self.context['request'].user.seller_profile
        return super().create(validated_data)


class ProductOfferCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating product offers"""
    
    class Meta:
        model = ProductOffer
        fields = [
            'product', 'name', 'description', 'offer_type',
            'discount_percentage', 'discount_amount',
            'start_date', 'end_date'
        ]
    
    def validate(self, data):
        """Validate offer data"""
        offer_type = data.get('offer_type')
        discount_percentage = data.get('discount_percentage')
        discount_amount = data.get('discount_amount')
        
        if offer_type == 'percentage':
            if not discount_percentage:
                raise serializers.ValidationError("Discount percentage is required for percentage offers")
            if discount_percentage <= 0 or discount_percentage > 100:
                raise serializers.ValidationError("Discount percentage must be between 1 and 100")
        elif offer_type == 'flat':
            if not discount_amount:
                raise serializers.ValidationError("Discount amount is required for flat offers")
            if discount_amount <= 0:
                raise serializers.ValidationError("Discount amount must be greater than 0")
        
        # Validate dates
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("End date must be after start date")
        
        return data
    
    def create(self, validated_data):
        # Set the seller from the request user
        validated_data['seller'] = self.context['request'].user.seller_profile
        return super().create(validated_data)


class ProductWithOfferSerializer(serializers.ModelSerializer):
    """Product serializer that includes offer information"""
    images = ProductImageSerializer(many=True, read_only=True)
    active_offer = ProductOfferSerializer(read_only=True)
    discounted_price = serializers.ReadOnlyField()
    original_price = serializers.ReadOnlyField()
    has_active_offer = serializers.ReadOnlyField()
    savings_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'original_price', 'discounted_price',
            'has_active_offer', 'savings_amount', 'active_offer',
            'images', 'stock_quantity', 'status'
        ]


# Offer fields are already defined in the serializers without the active_offer field reference
# The active_offer field will be handled via the model property 