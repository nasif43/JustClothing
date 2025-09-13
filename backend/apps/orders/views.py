from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import F, Sum

from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from .serializers import (
    CartSerializer, CartItemSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    OrderSerializer, CreateOrderSerializer, CreateQuickOrderSerializer
)
from apps.products.models import Product
from apps.promos.models import PromoCode
from apps.notifications.models import UserNotification


def notify_sellers_about_new_order(order):
    """Create notifications for sellers about new orders"""
    # Get unique sellers from order items
    sellers = set()
    for item in order.items.all():
        if hasattr(item.product, 'seller'):
            sellers.add(item.product.seller)
    
    # Create notification for each seller
    for seller in sellers:
        UserNotification.objects.create(
            user=seller.user,  # Access the User instance through the seller profile
            type='order_confirmed',
            title=f'New Order #{order.id}',
            message=f'You have received a new order #{order.id} worth {order.bill}tk.',
            related_order=order,
            data={
                'order_id': order.id,
                'order_amount': str(order.bill),
                'customer_name': order.customer_name,
            }
        )


def notify_customer_about_order(order):
    """Create notification for customer about order confirmation"""
    UserNotification.objects.create(
        user=order.user,
        type='order_confirmed',
        title=f'Order Confirmed #{order.id}',
        message=f'Your order #{order.id} has been confirmed and is being processed.',
        related_order=order,
        data={
            'order_id': order.id,
            'order_amount': str(order.bill),
            'estimated_delivery': '2-4 days',
        }
    )


class CartView(generics.RetrieveAPIView):
    """Get user's cart"""
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart


class AddToCartView(APIView):
    """Add item to cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        if serializer.is_valid():
            product = Product.objects.get(id=serializer.validated_data['product_id'])
            
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Check if item already exists in cart
            existing_item = cart.items.filter(
                product=product,
                size=serializer.validated_data.get('size', ''),
                color=serializer.validated_data.get('color', '')
            ).first()
            
            if existing_item:
                # Update quantity
                new_quantity = existing_item.quantity + serializer.validated_data['quantity']
                if new_quantity > product.stock_quantity:
                    return Response(
                        {'error': f'Only {product.stock_quantity} items available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                existing_item.quantity = new_quantity
                existing_item.save()
                item = existing_item
            else:
                # Create new cart item
                item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=serializer.validated_data['quantity'],
                    size=serializer.validated_data.get('size', ''),
                    color=serializer.validated_data.get('color', '')
                )
            
            return Response(
                CartItemSerializer(item, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateCartItemView(generics.UpdateAPIView):
    """Update cart item quantity"""
    serializer_class = UpdateCartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            instance.quantity = serializer.validated_data['quantity']
            instance.save()
            return Response(CartItemSerializer(instance, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RemoveFromCartView(generics.DestroyAPIView):
    """Remove item from cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)


class ClearCartView(APIView):
    """Clear all items from cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            cart = Cart.objects.get(user=request.user)
            cart.items.all().delete()
            return Response({'message': 'Cart cleared successfully'})
        except Cart.DoesNotExist:
            return Response({'message': 'Cart is already empty'})


class OrderListView(APIView):
    """List user's orders"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
            serializer = OrderSerializer(orders, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching orders: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderDetailView(APIView):
    """Get order details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            order = Order.objects.filter(user=request.user).prefetch_related('items').get(pk=pk)
            serializer = OrderSerializer(order, context={'request': request})
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error fetching order {pk}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateOrderView(APIView):
    """Create order from cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Get user's cart
            try:
                cart = Cart.objects.get(user=request.user)
                if not cart.items.exists():
                    return Response(
                        {'error': 'Cart is empty'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Cart.DoesNotExist:
                return Response(
                    {'error': 'Cart not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get only the selected items from request data
            selected_items = request.data.get('selected_items', [])
            if not selected_items:
                return Response(
                    {'error': 'No items selected'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Filter cart items based on selected items
            filtered_cart_items = []
            for selected_item in selected_items:
                item_id = selected_item.get('item_id')
                size = selected_item.get('size', '')
                color = selected_item.get('color', '')
                
                cart_item = cart.items.filter(
                    product_id=item_id,
                    size=size,
                    color=color
                ).first()
                
                if cart_item:
                    filtered_cart_items.append(cart_item)
            
            # Group cart items by seller
            seller_items = {}
            for item in filtered_cart_items:
                seller = item.product.seller
                if seller not in seller_items:
                    seller_items[seller] = []
                seller_items[seller].append(item)
            
            # Create separate orders for each seller
            orders = []
            for seller, items in seller_items.items():
                # Calculate total amount for this seller's items
                total_amount = sum(item.total_price for item in items)
                
                # Create order for this seller
                order = Order.objects.create(
                    user=request.user,
                    seller=seller,
                    customer_name=request.user.get_full_name() or request.user.email,
                    customer_email=request.user.email,
                    customer_phone=serializer.validated_data.get('customer_phone', ''),
                    customer_address=serializer.validated_data.get('customer_address', ''),
                    payment_method=serializer.validated_data['payment_method'],
                    total_amount=total_amount,
                )
                
                # Create order items
                for cart_item in items:
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        title=cart_item.product.name,
                        photo=cart_item.product.images.filter(is_primary=True).first().image if cart_item.product.images.filter(is_primary=True).exists() else None,
                        size=cart_item.size,
                        color=cart_item.color,
                        quantity=cart_item.quantity,
                        unit_price=cart_item.product.price,
                        total_price=cart_item.total_price,
                    )
                    
                    # Update product stock
                    product = cart_item.product
                    if product.track_inventory:
                        product.stock_quantity = F('stock_quantity') - cart_item.quantity
                        product.save()
                
                # Create order status history
                OrderStatusHistory.objects.create(
                    order=order,
                    new_status='pending',
                    changed_by=request.user,
                )
                
                # Notify seller about new order
                notify_sellers_about_new_order(order)
                
                orders.append(order)
            
            # Remove ONLY the ordered items from the cart
            for cart_item in filtered_cart_items:
                try:
                    cart_item.delete()
                    print(f"Deleted cart item: {cart_item.product.name}, size: {cart_item.size}, color: {cart_item.color}")
                except Exception as e:
                    print(f"Error deleting cart item: {e}")
            
            # Notify customer about orders
            for order in orders:
                notify_customer_about_order(order)
            
            # Return all created orders
            return Response(
                OrderSerializer(orders, many=True, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class CreateQuickOrderView(APIView):
    """Create order for single product (from product detail page)"""
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateQuickOrderSerializer(data=request.data)
        if serializer.is_valid():
            # Get product
            product = Product.objects.get(id=serializer.validated_data['product_id'])
            
            # Validate stock availability
            quantity = serializer.validated_data['quantity']
            if quantity > product.stock_quantity:
                return Response(
                    {'error': f'Only {product.stock_quantity} items available'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate total price
            unit_price = product.price
            total_price = unit_price * quantity
            
            # Create order with total amount
            order = Order.objects.create(
                user=request.user,
                seller=product.seller,
                customer_name=serializer.validated_data['customer_name'],
                customer_email=request.user.email,
                customer_phone=serializer.validated_data['customer_phone'],
                customer_address=serializer.validated_data['customer_address'],
                payment_method=serializer.validated_data['payment_method'],
                total_amount=total_price,
                bill=total_price,
                status='pending'
            )
            
            # Create order item
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                size=serializer.validated_data.get('size', ''),
                color=serializer.validated_data.get('color', ''),
                title=product.name
            )
            
            # Update product stock
            product.stock_quantity = F('stock_quantity') - quantity
            product.sales_count = F('sales_count') + quantity
            product.save()
            
            # Notify sellers and customer about new order
            notify_sellers_about_new_order(order)
            notify_customer_about_order(order)
            
            return Response(
                OrderSerializer(order, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Seller views for order management
class SellerOrderListView(generics.ListAPIView):
    """List orders for seller"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Check if user has seller profile
        if not hasattr(self.request.user, 'seller_profile'):
            return Order.objects.none()
        
        # Get orders containing products from this seller
        from apps.products.models import Product
        seller_product_ids = Product.objects.filter(seller=self.request.user.seller_profile).values_list('id', flat=True)
        return Order.objects.filter(
            items__product_id__in=seller_product_ids
        ).distinct().prefetch_related('items')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_order_detail(request, order_id):
    """Get order details for seller"""
    if not hasattr(request.user, 'seller_profile'):
        return Response({'error': 'User is not a seller'}, status=400)
    
    try:
        order = Order.objects.get(id=order_id)
        
        # Check if seller has products in this order
        from apps.products.models import Product
        seller_product_ids = Product.objects.filter(seller=request.user.seller_profile).values_list('id', flat=True)
        if not order.items.filter(product_id__in=seller_product_ids).exists():
            return Response({'error': 'Order not found'}, status=404)
        
        # Return order details
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def seller_update_order_status(request, order_id):
    """Update order status by seller"""
    try:
        # Get order and verify seller
        order = Order.objects.get(id=order_id)
        if not hasattr(request.user, 'seller_profile') or order.seller != request.user.seller_profile:
            return Response(
                {'error': 'You are not authorized to update this order'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate new status
        new_status = request.data.get('status')
        if not new_status or new_status not in dict(Order.ORDER_STATUS).keys():
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save previous status for history
        previous_status = order.status
        
        # Update order status
        order.status = new_status
        order.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=request.user,
            reason=request.data.get('reason', ''),
            notes=request.data.get('notes', '')
        )
        
        # If this order is part of a larger customer order (same created_at timestamp),
        # check if we need to update other orders' status
        related_orders = Order.objects.filter(
            user=order.user,
            created_at=order.created_at
        ).exclude(id=order.id)
        
        if related_orders.exists():
            # If any order is delivered and others are not, mark as partially delivered
            if new_status == 'delivered':
                undelivered_orders = related_orders.exclude(status='delivered')
                if undelivered_orders.exists():
                    for undelivered_order in undelivered_orders:
                        if undelivered_order.status not in ['cancelled', 'refunded']:
                            undelivered_order.status = 'partially_delivered'
                            undelivered_order.save()
                            
                            # Create status history for partial delivery
                            OrderStatusHistory.objects.create(
                                order=undelivered_order,
                                previous_status=undelivered_order.status,
                                new_status='partially_delivered',
                                changed_by=request.user,
                                reason='Other parts of the order were delivered',
                                notes='Order marked as partially delivered due to delivery of related orders'
                            )
        
        # Create notification for customer
        UserNotification.objects.create(
            user=order.user,
            type='order_status_update',
            title=f'Order #{order.id} Status Updated',
            message=f'Your order #{order.id} status has been updated to {dict(Order.ORDER_STATUS)[new_status]}.',
            related_order=order,
            data={
                'order_id': order.id,
                'new_status': new_status,
                'previous_status': previous_status
            }
        )
        
        return Response(OrderSerializer(order, context={'request': request}).data)
    
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
