from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination: page_size=20, max=100."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "status": "success",
                "data": data,
                "meta": {
                    "page": self.page.number,
                    "per_page": self.get_page_size(self.request),
                    "total": self.page.paginator.count,
                    "total_pages": self.page.paginator.num_pages,
                },
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "required": ["status", "data", "meta"],
            "properties": {
                "status": {"type": "string", "example": "success"},
                "data": schema,
                "meta": {
                    "type": "object",
                    "properties": {
                        "page": {"type": "integer", "example": 1},
                        "per_page": {"type": "integer", "example": 20},
                        "total": {"type": "integer", "example": 150},
                        "total_pages": {"type": "integer", "example": 8},
                    },
                },
            },
        }
