from django.db import models
from django.conf import settings
import uuid

class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order_item = models.OneToOneField('orders.OrderItem', on_delete=models.CASCADE, null=True)
    
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)], db_index=True)
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    # Review flags for admin attention
    is_flagged = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True)
    
    # Verification
    is_verified_purchase = models.BooleanField(default=False)
    
    # Helpfulness
    helpful_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.rating} stars by {self.customer.username}"
    
    class Meta:
        indexes = [
            models.Index(fields=['product', 'rating']),
            models.Index(fields=['customer', '-created_at']),
            models.Index(fields=['is_flagged', 'rating']),
        ]

class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='review_images/')
    alt_text = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return f"Review image for {self.review.product.name}"

class ReviewHelpful(models.Model):
    """Track which users found a review helpful"""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='helpful_votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'user']
