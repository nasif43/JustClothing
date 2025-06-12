from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Product, Category, Collection
from .serializers import ProductSerializer, CategorySerializer, CollectionSerializer

# Create your views here.

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.filter(is_active=True)
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ProductSearchView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        query = request.GET.get('q', '')
        products = Product.objects.filter(name__icontains=query, is_active=True)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
