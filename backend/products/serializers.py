from rest_framework import serializers
from .models import Product, Category, Collection, ProductImage, ProductVariant, Size, Color

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = '__all__'

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at'] 