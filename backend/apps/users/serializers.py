from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CustomerProfile, SellerProfile, Address, SellerTeamMember


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to handle email login"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # No need to add email field or remove username field
        # The parent class already creates the correct field based on USERNAME_FIELD
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'), 
                             username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            # The parent class expects the USERNAME_FIELD key, which is 'email'
            return super().validate(attrs)
        
        raise serializers.ValidationError('Must include email and password.')
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['user_type'] = user.user_type
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm', 'user_type')
        extra_kwargs = {
            'username': {'required': False},  # Will be set to email
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        
        # Set username to email if not provided
        if not attrs.get('username'):
            attrs['username'] = attrs['email']
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create appropriate profile
        if user.user_type == 'customer':
            CustomerProfile.objects.create(user=user)
        
        return user


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for user addresses"""
    
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user',)


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profiles"""
    
    addresses = AddressSerializer(source='user.addresses', many=True, read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = '__all__'
        read_only_fields = ('user',)


class SellerProfileSerializer(serializers.ModelSerializer):
    """Serializer for seller profiles"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SellerProfile
        fields = '__all__'
        read_only_fields = ('user', 'status', 'approved_at', 'approved_by', 'total_sales', 'rating', 'total_reviews')


class SellerSignupSerializer(serializers.Serializer):
    """Serializer for seller signup - matches frontend form"""
    
    # Owner information
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    id_number = serializers.CharField(max_length=50)
    
    # Business information
    business_name = serializers.CharField(max_length=200)
    business_type = serializers.CharField(max_length=100)
    founded_date = serializers.DateField()
    bio = serializers.CharField()
    pickup_location = serializers.CharField()
    
    # Social links (optional)
    instagram = serializers.URLField(required=False, allow_blank=True)
    facebook = serializers.URLField(required=False, allow_blank=True)
    
    # Payment information
    payment_method = serializers.CharField(max_length=50)
    account_number = serializers.CharField(max_length=100)
    bank_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    branch_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Logo file
    logo = serializers.ImageField(required=False)
    
    def validate_email(self, value):
        """Check if user with this email exists and is not already a seller"""
        try:
            user = User.objects.get(email=value)
            if user.user_type == 'seller':
                raise serializers.ValidationError("User is already a seller.")
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist. Please register first.")
        return value
    
    def create(self, validated_data):
        """Create seller profile for existing user"""
        email = validated_data['email']
        user = User.objects.get(email=email)
        
        # Update user information
        user.first_name = validated_data['first_name']
        user.last_name = validated_data['last_name']
        user.user_type = 'seller'
        user.save()
        
        # Create customer profile if it doesn't exist
        customer_profile, created = CustomerProfile.objects.get_or_create(user=user)
        if created or not customer_profile.phone_number:
            customer_profile.phone_number = validated_data['phone']
            customer_profile.save()
        
        # Create seller profile
        seller_profile = SellerProfile.objects.create(
            user=user,
            business_name=validated_data['business_name'],
            business_description=validated_data['bio'],
            phone_number=validated_data['phone'],
            business_address=validated_data['pickup_location'],
            business_license=validated_data.get('id_number', ''),
            logo=validated_data.get('logo'),
            status='pending'
        )
        
        return seller_profile


class UserProfileSerializer(serializers.ModelSerializer):
    """Comprehensive user profile serializer"""
    
    customer_profile = CustomerProfileSerializer(read_only=True)
    seller_profile = SellerProfileSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'user_type', 
                 'is_verified', 'created_at', 'customer_profile', 'seller_profile', 'addresses')
        read_only_fields = ('id', 'email', 'username', 'user_type', 'is_verified', 'created_at')


class SellerTeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for seller team members"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.get_full_name', read_only=True)
    
    class Meta:
        model = SellerTeamMember
        fields = '__all__'
        read_only_fields = ('seller', 'invited_by', 'joined_at')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value 