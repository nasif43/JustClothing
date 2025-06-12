from rest_framework import serializers
from .models import SellerProfile

class SellerSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'id_number',
            'business_name', 'business_type', 'founded_date', 'bio', 'pickup_location',
            'logo', 'instagram', 'facebook', 'payment_method', 'account_number',
            'bank_name', 'branch_name'
        ]
    
    def create(self, validated_data):
        # Create the seller profile
        seller_profile = SellerProfile.objects.create(**validated_data)
        return seller_profile

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reviewed_by', 'reviewed_at'] 