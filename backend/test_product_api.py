#!/usr/bin/env python
import requests
import json

def test_product_api():
    base_url = 'http://localhost:8000/api/v1/products'
    
    print("🔍 Testing Product API...")
    
    # Test product list endpoint
    print("\n📋 Testing Product List Endpoint...")
    list_response = requests.get(f'{base_url}/')
    print(f"List Status: {list_response.status_code}")
    
    if list_response.status_code == 200:
        list_data = list_response.json()
        # Handle paginated response
        products = list_data.get('results', list_data) if isinstance(list_data, dict) else list_data
        
        if products and len(products) > 0:
            first_product = products[0]
            print(f"\n📦 Stock fields in list endpoint:")
            stock_fields = {k: v for k, v in first_product.items() if any(term in k.lower() for term in ['stock', 'track', 'inventory', 'available'])}
            for key, value in stock_fields.items():
                print(f"  {key}: {value}")
        else:
            print("No products found in list")
    else:
        print(f"List Error: {list_response.text}")
    
    # Test product detail endpoint
    print("\n📄 Testing Product Detail Endpoint...")
    response = requests.get(f'{base_url}/1/')
    print(f"Detail Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n📦 Stock-related fields in detail:")
        stock_fields = {k: v for k, v in data.items() if any(term in k.lower() for term in ['stock', 'track', 'inventory', 'available'])}
        for key, value in stock_fields.items():
            print(f"  {key}: {value}")
    else:
        print(f"Detail Error: {response.text}")

if __name__ == '__main__':
    test_product_api() 