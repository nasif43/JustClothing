from decimal import Decimal
from django.utils import timezone
from .models import PromoCode, PromoUsage


def calculate_promo_discount(promo_code, order_total, cart_items=None, user=None):
    """
    Calculate discount amount for a promo code
    Returns: (discount_amount, is_valid, error_message)
    """
    try:
        promo = PromoCode.objects.get(code=promo_code, is_active=True)
        promotion = promo.promotion
        
        # Check if promotion is active
        if not promotion.is_active:
            return Decimal('0'), False, "Promotion is not active"
        
        # Check if user can use this promotion
        if user and not promotion.can_be_used_by(user):
            return Decimal('0'), False, "You have reached the usage limit for this promotion"
        
        # Check minimum order amount
        if promotion.minimum_order_amount and order_total < promotion.minimum_order_amount:
            return Decimal('0'), False, f"Minimum order amount is ৳{promotion.minimum_order_amount}"
        
        # Check minimum quantity if cart items provided
        if promotion.minimum_quantity and cart_items:
            total_quantity = sum(item.quantity for item in cart_items)
            if total_quantity < promotion.minimum_quantity:
                return Decimal('0'), False, f"Minimum {promotion.minimum_quantity} items required"
        
        # Calculate discount based on promotion type
        discount_amount = Decimal('0')
        
        if promotion.promotion_type == 'percentage':
            discount_amount = (order_total * promotion.discount_percentage) / 100
            
        elif promotion.promotion_type == 'fixed_amount':
            discount_amount = min(promotion.discount_amount, order_total)
            
        elif promotion.promotion_type == 'free_shipping':
            # For free shipping, we'll set a nominal discount amount
            # The actual shipping logic would be handled elsewhere
            discount_amount = Decimal('50')  # Assume ৳50 shipping cost
            
        elif promotion.promotion_type == 'buy_x_get_y':
            # For buy X get Y, calculate based on cheapest items
            if cart_items and promotion.buy_quantity and promotion.get_quantity:
                # Sort items by unit price (ascending)
                sorted_items = sorted(cart_items, key=lambda x: x.product.price)
                total_quantity = sum(item.quantity for item in cart_items)
                
                # Calculate how many free items user gets
                free_items_count = (total_quantity // promotion.buy_quantity) * promotion.get_quantity
                
                # Calculate discount based on cheapest items
                items_processed = 0
                for item in sorted_items:
                    if items_processed >= free_items_count:
                        break
                    
                    items_to_discount = min(item.quantity, free_items_count - items_processed)
                    discount_amount += item.product.price * items_to_discount
                    items_processed += items_to_discount
        
        # Ensure discount doesn't exceed order total
        discount_amount = min(discount_amount, order_total)
        
        return discount_amount, True, ""
        
    except PromoCode.DoesNotExist:
        return Decimal('0'), False, "Invalid promo code"


def apply_promo_code(promo_code, order, user, discount_amount):
    """
    Apply promo code to order and create usage record
    """
    try:
        promo = PromoCode.objects.get(code=promo_code, is_active=True)
        promotion = promo.promotion
        
        # Create usage record
        PromoUsage.objects.create(
            promotion=promotion,
            promo_code=promo,
            user=user,
            order=order,
            discount_amount=discount_amount
        )
        
        # Update usage counts
        promo.usage_count += 1
        promo.save()
        
        promotion.usage_count += 1
        promotion.save()
        
        return True, "Promo code applied successfully"
        
    except PromoCode.DoesNotExist:
        return False, "Invalid promo code"


def get_applicable_promotions(cart_items=None, user=None, category=None):
    """
    Get promotions that can be applied to current cart/order
    """
    from django.db.models import Q, Count
    from .models import Promotion
    
    now = timezone.now()
    promotions = Promotion.objects.filter(
        status='active',
        start_date__lte=now,
        end_date__gte=now
    )
    
    # Filter by user eligibility
    if user:
        # Exclude promotions user has reached limit for
        user_usage_counts = {}
        for usage in PromoUsage.objects.filter(user=user).values('promotion_id').annotate(count=Count('id')):
            user_usage_counts[usage['promotion_id']] = usage['count']
        
        eligible_promotion_ids = []
        for promotion in promotions:
            user_count = user_usage_counts.get(promotion.id, 0)
            if not promotion.usage_limit_per_customer or user_count < promotion.usage_limit_per_customer:
                eligible_promotion_ids.append(promotion.id)
        
        promotions = promotions.filter(id__in=eligible_promotion_ids)
    
    # Filter by category if provided
    if category:
        promotions = promotions.filter(
            Q(applicable_categories=category) | Q(applicable_categories__isnull=True)
        )
    
    # Filter by products if cart items provided
    if cart_items:
        product_ids = [item.product.id for item in cart_items]
        promotions = promotions.filter(
            Q(applicable_products__id__in=product_ids) | Q(applicable_products__isnull=True)
        )
    
    return promotions.distinct()