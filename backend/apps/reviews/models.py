from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from decimal import Decimal

User = get_user_model()


def update_seller_rating(seller_profile):
    """Update seller's rating based on all reviews for their products"""
    from apps.products.models import Product
    
    # Get all products for this seller
    seller_products = Product.objects.filter(seller=seller_profile)
    
    # Get all approved reviews for the seller's products
    product_reviews = Review.objects.filter(
        product__in=seller_products,
        is_approved=True,
        review_type='product'
    )
    
    # Calculate average rating and total review count
    review_stats = product_reviews.aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id')
    )
    
    # Update seller profile
    avg_rating = review_stats['avg_rating'] or 0
    total_reviews = review_stats['total_reviews'] or 0
    
    # Round to 2 decimal places
    if avg_rating:
        avg_rating = round(float(avg_rating), 2)
    
    # Update the seller profile
    seller_profile.rating = Decimal(str(avg_rating))
    seller_profile.total_reviews = total_reviews
    seller_profile.save(update_fields=['rating', 'total_reviews'])
    
    return avg_rating, total_reviews


def update_product_rating(product):
    """Update product's rating based on its reviews"""
    # Get all approved reviews for this product
    product_reviews = Review.objects.filter(
        product=product,
        is_approved=True,
        review_type='product'
    )
    
    # Calculate average rating and total review count
    review_stats = product_reviews.aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id')
    )
    
    # Update product
    avg_rating = review_stats['avg_rating'] or 0
    total_reviews = review_stats['total_reviews'] or 0
    
    # Round to 2 decimal places
    if avg_rating:
        avg_rating = round(float(avg_rating), 2)
    
    # Update the product
    product.rating = Decimal(str(avg_rating))
    product.review_count = total_reviews
    product.save(update_fields=['rating', 'review_count'])
    
    return avg_rating, total_reviews


class Review(models.Model):
    """Product and seller reviews - matches frontend review structure"""
    
    REVIEW_TYPE = (
        ('product', 'Product Review'),
        ('seller', 'Seller Review'),
    )
    
    id = models.AutoField(primary_key=True)  # Frontend compatibility
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    
    # Frontend compatible fields
    productId = models.IntegerField(null=True, blank=True)  # Will sync with product.id
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    content = models.TextField()
    
    review_type = models.CharField(max_length=10, choices=REVIEW_TYPE, default='product')
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    moderated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_reviews')
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    createdAt = models.DateTimeField(auto_now_add=True)  # Frontend compatibility
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        indexes = [
            models.Index(fields=['product', 'is_approved']),
            models.Index(fields=['seller', 'is_approved']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Sync fields for frontend compatibility
        if self.product_id:
            self.productId = self.product_id
        
        # Call super save first to set created_at
        super().save(*args, **kwargs)
        
        # Then sync createdAt if it wasn't set
        if not self.createdAt and self.created_at:
            self.createdAt = self.created_at
            # Save again only if createdAt was updated
            super().save(update_fields=['createdAt'])
    
    def __str__(self):
        target = self.product.name if self.product else self.seller.business_name
        return f"Review by {self.user.email} for {target}"
    
    @property
    def user_info(self):
        """Frontend compatible user information"""
        return {
            'id': self.user.id,
            'name': self.user.get_full_name() or self.user.username,
            'avatar': None  # Can be enhanced with user avatars
        }


class ReviewImage(models.Model):
    """Images attached to reviews"""
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/images/')
    caption = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_images'
    
    def __str__(self):
        return f"Image for review {self.review.id}"


class ReviewVote(models.Model):
    """Helpful/not helpful votes on reviews"""
    
    VOTE_TYPES = (
        ('helpful', 'Helpful'),
        ('not_helpful', 'Not Helpful'),
    )
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_votes')
    vote_type = models.CharField(max_length=15, choices=VOTE_TYPES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_votes'
        unique_together = [['review', 'user']]
    
    def __str__(self):
        return f"{self.user.email} voted {self.vote_type} on review {self.review.id}"


class ReviewReport(models.Model):
    """Reports for inappropriate reviews"""
    
    REPORT_REASONS = (
        ('spam', 'Spam'),
        ('inappropriate', 'Inappropriate Content'),
        ('fake', 'Fake Review'),
        ('offensive', 'Offensive Language'),
        ('other', 'Other'),
    )
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_reports')
    reason = models.CharField(max_length=20, choices=REPORT_REASONS)
    description = models.TextField(blank=True)
    
    # Moderation
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_reports'
        unique_together = [['review', 'reported_by']]
    
    def __str__(self):
        return f"Report for review {self.review.id} by {self.reported_by.email}"


class SellerReview(models.Model):
    """Specific reviews for sellers/stores"""
    
    id = models.AutoField(primary_key=True)
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='seller_reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_reviews')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True)
    
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    content = models.TextField()
    
    # Review aspects
    communication_rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    shipping_rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    quality_rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    moderated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_seller_reviews')
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_reviews'
        indexes = [
            models.Index(fields=['seller', 'is_approved']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Seller review by {self.user.email} for {self.seller.business_name}"


class ReviewReply(models.Model):
    """Replies to reviews by sellers"""
    
    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name='reply')
    seller = models.ForeignKey('users.SellerProfile', on_delete=models.CASCADE, related_name='review_replies')
    content = models.TextField()
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    moderated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_review_replies')
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'review_replies'
        indexes = [
            models.Index(fields=['review']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Reply by {self.seller.business_name} to review {self.review.id}"


# Signal handlers for review notifications
@receiver(post_save, sender=Review)
def handle_new_review(sender, instance, created, **kwargs):
    """Send notification when a new review is created and update ratings"""
    if created and instance.product:
        # Update the product's rating
        update_product_rating(instance.product)
        
        # Update the seller's rating if product has a seller
        if instance.product.seller:
            update_seller_rating(instance.product.seller)
        
        # Optionally notify the seller about new product review
        # This can be implemented later if needed
        pass


@receiver(post_delete, sender=Review)
def handle_review_deletion(sender, instance, **kwargs):
    """Update ratings when a review is deleted"""
    if instance.product:
        # Update product rating
        update_product_rating(instance.product)
        
        # Update seller rating if product has a seller
        if instance.product.seller:
            update_seller_rating(instance.product.seller)


@receiver(post_save, sender=Review)
def handle_review_update(sender, instance, created, **kwargs):
    """Update ratings when a review is updated (approval status changes)"""
    if not created and instance.product:
        # This handles cases where review approval status changes
        # Update product rating
        update_product_rating(instance.product)
        
        # Update seller rating if product has a seller
        if instance.product.seller:
            update_seller_rating(instance.product.seller)


@receiver(post_save, sender=SellerReview)
def handle_new_seller_review(sender, instance, created, **kwargs):
    """Send notification when a new seller review is created"""
    if created:
        # Optionally notify the seller about new review
        # This can be implemented later if needed
        pass
