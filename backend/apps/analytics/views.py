from django.shortcuts import render
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Avg, Count, F, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import calendar
from djmoney.money import Money

from .models import SellerAnalytics, SellerRevenueTracker, PopularProduct
from apps.users.models import SellerProfile
from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from apps.reviews.models import Review


def safe_float_from_money(value):
    """Safely convert Money object or number to float"""
    if value is None:
        return 0.0
    if isinstance(value, Money):
        return float(value.amount)
    return float(value)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_dashboard_stats(request):
    """Get comprehensive seller dashboard statistics"""
    try:
        seller_profile = request.user.seller_profile
    except:
        return Response({'error': 'User is not a seller'}, status=400)
    
    # Get current date ranges
    today = timezone.now().date()
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = current_month_start - timedelta(days=1)
    
    # Get orders for this seller
    seller_orders = Order.objects.filter(seller=seller_profile)
    
    # Current month stats
    current_month_orders = seller_orders.filter(created_at__gte=current_month_start)
    current_month_stats = current_month_orders.aggregate(
        total_orders=Count('id'),
        total_revenue=Sum('total_amount'),
        total_items=Sum('items__quantity')
    )
    
    # Handle None values
    current_month_stats['total_revenue'] = current_month_stats['total_revenue'] or 0
    current_month_stats['total_items'] = current_month_stats['total_items'] or 0
    
    # Last month stats for comparison
    last_month_orders = seller_orders.filter(
        created_at__gte=last_month_start,
        created_at__lt=current_month_start
    )
    last_month_stats = last_month_orders.aggregate(
        total_orders=Count('id'),
        total_revenue=Sum('total_amount'),
        total_items=Sum('items__quantity')
    )
    
    # Handle None values
    last_month_stats['total_revenue'] = last_month_stats['total_revenue'] or 0
    last_month_stats['total_items'] = last_month_stats['total_items'] or 0
    
    # Calculate growth percentages
    def calculate_growth(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return ((current - previous) / previous) * 100
    
    # Product stats
    total_products = Product.objects.filter(seller=seller_profile).count()
    active_products = Product.objects.filter(seller=seller_profile, status='active').count()
    out_of_stock = Product.objects.filter(
        seller=seller_profile, 
        status='active',
        stock_quantity=0
    ).count()
    
    # Review stats
    product_reviews = Review.objects.filter(
        product__seller=seller_profile,
        is_approved=True
    )
    review_stats = product_reviews.aggregate(
        total_reviews=Count('id'),
        average_rating=Avg('rating')
    )
    
    # Get or create revenue tracker
    revenue_tracker, created = SellerRevenueTracker.objects.get_or_create(
        seller=seller_profile,
        defaults={
            'monthly_target': 50000,  # Default target
            'quarterly_target': 150000,
            'annual_target': 600000
        }
    )
    
    # Update current month revenue
    revenue_tracker.current_month_revenue = current_month_stats['total_revenue']
    revenue_tracker.save()
    
    return Response({
        'seller_info': {
            'business_name': seller_profile.business_name,
            'rating': float(seller_profile.rating) if seller_profile.rating else 0,
            'total_reviews': seller_profile.total_reviews,
            'joined_date': seller_profile.created_at.date(),
        },
        'current_month': {
            'orders': current_month_stats['total_orders'],
            'revenue': safe_float_from_money(current_month_stats['total_revenue']),
            'items_sold': current_month_stats['total_items'],
            'average_order_value': safe_float_from_money(current_month_stats['total_revenue']) / current_month_stats['total_orders'] if current_month_stats['total_orders'] > 0 else 0
        },
        'growth_metrics': {
            'orders_growth': round(calculate_growth(
                current_month_stats['total_orders'], 
                last_month_stats['total_orders']
            ), 1),
            'revenue_growth': round(calculate_growth(
                safe_float_from_money(current_month_stats['total_revenue']), 
                safe_float_from_money(last_month_stats['total_revenue'])
            ), 1),
            'items_growth': round(calculate_growth(
                current_month_stats['total_items'], 
                last_month_stats['total_items']
            ), 1),
        },
        'products': {
            'total': total_products,
            'active': active_products,
            'out_of_stock': out_of_stock,
            'low_stock': Product.objects.filter(
                seller=seller_profile, 
                status='active',
                stock_quantity__lte=5,
                stock_quantity__gt=0
            ).count()
        },
        'reviews': {
            'total': review_stats['total_reviews'] or 0,
            'average_rating': round(float(review_stats['average_rating'] or 0), 1),
            'this_month': product_reviews.filter(created_at__gte=current_month_start).count()
        },
        'revenue_tracker': {
            'monthly_target': safe_float_from_money(revenue_tracker.monthly_target),
            'monthly_progress': round(revenue_tracker.monthly_progress_percentage, 1),
            'quarterly_target': safe_float_from_money(revenue_tracker.quarterly_target),
            'quarterly_progress': round(revenue_tracker.quarterly_progress_percentage, 1),
            'annual_target': safe_float_from_money(revenue_tracker.annual_target),
            'annual_progress': round(revenue_tracker.annual_progress_percentage, 1),
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_revenue_analytics(request):
    """Get seller revenue analytics with trends"""
    try:
        seller_profile = request.user.seller_profile
    except:
        return Response({'error': 'User is not a seller'}, status=400)
    
    period = request.GET.get('period', '30d')
    
    # Calculate date range based on period
    end_date = timezone.now().date()
    if period == '7d':
        start_date = end_date - timedelta(days=7)
        group_by = 'day'
    elif period == '30d':
        start_date = end_date - timedelta(days=30)
        group_by = 'day'
    elif period == '90d':
        start_date = end_date - timedelta(days=90)
        group_by = 'week'
    elif period == '1y':
        start_date = end_date - timedelta(days=365)
        group_by = 'month'
    else:
        start_date = end_date - timedelta(days=30)
        group_by = 'day'
    
    # Get orders in date range
    orders = Order.objects.filter(
        seller=seller_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )
    
    # Generate daily revenue data
    revenue_data = []
    current_date = start_date
    
    while current_date <= end_date:
        day_orders = orders.filter(created_at__date=current_date)
        day_revenue = day_orders.aggregate(total=Sum('total_amount'))['total']
        day_revenue = day_revenue or 0
        day_orders_count = day_orders.count()
        
        revenue_data.append({
            'date': current_date.isoformat(),
            'revenue': safe_float_from_money(day_revenue),
            'orders': day_orders_count,
            'average_order_value': safe_float_from_money(day_revenue) / day_orders_count if day_orders_count > 0 else 0
        })
        current_date += timedelta(days=1)
    
    # Calculate summary statistics
    revenue_sum = orders.aggregate(total=Sum('total_amount'))['total']
    total_revenue = safe_float_from_money(revenue_sum or 0)
    total_orders = orders.count()
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Get best performing day
    best_day = max(revenue_data, key=lambda x: x['revenue']) if revenue_data else None
    
    return Response({
        'period': period,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'summary': {
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'average_order_value': round(avg_order_value, 2),
            'best_day': best_day
        },
        'daily_data': revenue_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_order_analytics(request):
    """Get seller order analytics and trends"""
    try:
        seller_profile = request.user.seller_profile
    except:
        return Response({'error': 'User is not a seller'}, status=400)
    
    period = request.GET.get('period', '30d')
    
    # Calculate date range
    end_date = timezone.now().date()
    if period == '7d':
        start_date = end_date - timedelta(days=7)
    elif period == '30d':
        start_date = end_date - timedelta(days=30)
    elif period == '90d':
        start_date = end_date - timedelta(days=90)
    else:
        start_date = end_date - timedelta(days=30)
    
    # Get orders in date range
    orders = Order.objects.filter(
        seller=seller_profile,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )
    
    # Order status distribution
    status_distribution = orders.values('status').annotate(
        count=Count('id'),
        revenue=Sum('total_amount')
    ).order_by('-count')
    
    # Popular products in this period
    popular_products = OrderItem.objects.filter(
        order__seller=seller_profile,
        order__created_at__date__gte=start_date,
        order__created_at__date__lte=end_date
    ).values(
        'product__name',
        'product__id'
    ).annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum('total_price'),
        order_count=Count('order', distinct=True)
    ).order_by('-total_revenue')[:10]
    
    # Customer analysis
    customer_analysis = orders.values('user').annotate(
        order_count=Count('id'),
        total_spent=Sum('total_amount')
    ).aggregate(
        unique_customers=Count('user'),
        avg_orders_per_customer=Avg('order_count'),
        avg_customer_value=Avg('total_spent')
    )
    
    # Handle None values in customer analysis
    customer_analysis['avg_orders_per_customer'] = customer_analysis['avg_orders_per_customer'] or 0
    customer_analysis['avg_customer_value'] = customer_analysis['avg_customer_value'] or 0
    
    return Response({
        'period': period,
        'summary': {
            'total_orders': orders.count(),
            'unique_customers': customer_analysis['unique_customers'] or 0,
            'avg_orders_per_customer': round(safe_float_from_money(customer_analysis['avg_orders_per_customer'] or 0), 1),
            'avg_customer_value': round(safe_float_from_money(customer_analysis['avg_customer_value'] or 0), 2)
        },
        'status_distribution': [
            {
                'status': item['status'],
                'count': item['count'],
                'revenue': safe_float_from_money(item['revenue'] or 0)
            }
            for item in status_distribution
        ],
        'popular_products': [
            {
                'product_id': item['product__id'],
                'product_name': item['product__name'],
                'quantity_sold': item['total_quantity'],
                'revenue': safe_float_from_money(item['total_revenue']),
                'order_count': item['order_count']
            }
            for item in popular_products
        ]
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_revenue_targets(request):
    """Update seller revenue targets"""
    try:
        seller_profile = request.user.seller_profile
    except:
        return Response({'error': 'User is not a seller'}, status=400)
    
    monthly_target = request.data.get('monthly_target')
    quarterly_target = request.data.get('quarterly_target')
    annual_target = request.data.get('annual_target')
    
    revenue_tracker, created = SellerRevenueTracker.objects.get_or_create(
        seller=seller_profile
    )
    
    if monthly_target is not None:
        revenue_tracker.monthly_target = monthly_target
    if quarterly_target is not None:
        revenue_tracker.quarterly_target = quarterly_target
    if annual_target is not None:
        revenue_tracker.annual_target = annual_target
    
    revenue_tracker.save()
    
    return Response({
        'message': 'Revenue targets updated successfully',
        'targets': {
            'monthly_target': safe_float_from_money(revenue_tracker.monthly_target),
            'quarterly_target': safe_float_from_money(revenue_tracker.quarterly_target),
            'annual_target': safe_float_from_money(revenue_tracker.annual_target)
        }
    })
