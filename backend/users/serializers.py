from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'phone', 'avatar', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_verified']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)
    user_type = serializers.CharField(default='customer')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type']
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Ensure username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate(self, attrs):
        # If password_confirm is provided, validate it matches password
        if 'password_confirm' in attrs and attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        # Remove password_confirm if it exists
        validated_data.pop('password_confirm', None)
        
        # Set default user_type if not provided
        if 'user_type' not in validated_data:
            validated_data['user_type'] = 'customer'
        
        # Create user with proper password hashing
        password = validated_data.pop('password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type=validated_data.get('user_type', 'customer'),
            password=password
        )
        
        # Ensure user is active
        user.is_active = True
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        return user 