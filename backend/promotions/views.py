from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import PromoCode, FeaturedProduct
from .serializers import PromoCodeSerializer, FeaturedProductSerializer

# Create your views here.

class PromoCodeViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    permission_classes = [IsAuthenticated]

class FeaturedProductViewSet(viewsets.ModelViewSet):
    queryset = FeaturedProduct.objects.filter(is_active=True)
    serializer_class = FeaturedProductSerializer
    permission_classes = [IsAuthenticated]

class ValidatePromoCodeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        code = request.data.get('code')
        try:
            promo = PromoCode.objects.get(code=code)
            if promo.is_valid():
                return Response({'valid': True, 'discount': promo.discount_value})
            else:
                return Response({'valid': False, 'message': 'Promo code expired or invalid'})
        except PromoCode.DoesNotExist:
            return Response({'valid': False, 'message': 'Promo code not found'})
