from rest_framework import serializers
from .models import PromoCode, FeaturedProduct

class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = '__all__'

class FeaturedProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeaturedProduct
        fields = '__all__'