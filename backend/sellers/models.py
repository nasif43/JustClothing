from django.db import models
from django.conf import settings
import uuid

class SellerProfile(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    BUSINESS_TYPE_CHOICES = [
        ('General Clothing', 'General Clothing'),
        ('Thrifted Clothing', 'Thrifted Clothing'),
        ('Loose Fabric', 'Loose Fabric'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('Bank', 'Bank'),
        ('bKash', 'bKash'),
        ('Nagad', 'Nagad'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    id_number = models.CharField(max_length=50, help_text="NID/Passport/Birth Certificate Number")
    
    # Business Information
    business_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPE_CHOICES)
    founded_date = models.CharField(max_length=20)  # Store as string since it comes as DD/MM/YYYY
    bio = models.TextField()
    pickup_location = models.TextField()
    logo = models.ImageField(upload_to='seller_logos/', null=True, blank=True)
    
    # Social Links
    instagram = models.CharField(max_length=100, null=True, blank=True)
    facebook = models.CharField(max_length=200, null=True, blank=True)
    
    # Payment Information
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    account_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    branch_name = models.CharField(max_length=100, null=True, blank=True)
    
    # Status and Admin fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_seller_profiles'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name} - {self.first_name} {self.last_name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['email']),
            models.Index(fields=['-created_at']),
        ]
