from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response
from collections import OrderedDict


class ProductPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class for products with enhanced metadata
    that works with infinite scroll frontend implementation.
    """
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        """
        Return paginated response with metadata needed for infinite scroll.
        """
        return Response(OrderedDict([
            ('results', data),
            ('count', self.page.paginator.count),
            ('current_page', self.page.number),
            ('total_pages', self.page.paginator.num_pages),
            ('has_next', self.page.has_next()),
            ('has_previous', self.page.has_previous()),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
        ]))


class ProductCursorPagination(CursorPagination):
    """
    Cursor-based pagination for better performance with large datasets
    and real-time data consistency.
    """
    page_size = 20
    ordering = '-created_at'  # Most recent products first
    cursor_query_param = 'cursor'
    page_size_query_param = 'limit'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return cursor-paginated response with metadata.
        """
        return Response(OrderedDict([
            ('results', data),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('has_next', self.get_next_link() is not None),
            ('has_previous', self.get_previous_link() is not None),
        ]))


class SearchResultsPagination(PageNumberPagination):
    """
    Special pagination for search results with relevance scoring.
    """
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 50  # Smaller max for search results
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('results', data),
            ('count', self.page.paginator.count),
            ('current_page', self.page.number),
            ('total_pages', self.page.paginator.num_pages),
            ('has_next', self.page.has_next()),
            ('has_previous', self.page.has_previous()),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('search_metadata', {
                'total_results': self.page.paginator.count,
                'page_results': len(data),
                'is_search': True,
            })
        ]))