from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from .models import Cart, Order

@login_required
@require_GET
def debug_cart_info(request):
    """Debug endpoint to check cart and order functionality"""
    try:
        # Get user's cart info
        cart = Cart.objects.filter(user=request.user).first()
        cart_info = {
            'exists': cart is not None,
            'total_items': cart.total_items if cart else 0,
            'items': []
        }
        
        if cart:
            for item in cart.items.all():
                cart_info['items'].append({
                    'id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'size': item.size,
                    'color': item.color,
                    'price': str(item.product.price),
                })
        
        # Get user's recent orders
        recent_orders = Order.objects.filter(user=request.user).order_by('-created_at')[:5]
        orders_info = []
        for order in recent_orders:
            order_items = []
            for item in order.items.all():
                order_items.append({
                    'id': item.id,
                    'product_id': item.product_id,
                    'title': item.title,
                    'quantity': item.quantity,
                    'price': str(item.price),
                })
            
            orders_info.append({
                'id': order.id,
                'status': order.status,
                'bill': str(order.bill),
                'created_at': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'items_count': len(order_items),
                'items': order_items,
            })
        
        return JsonResponse({
            'success': True,
            'user': request.user.email,
            'cart': cart_info,
            'recent_orders': orders_info,
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)