from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    results: List[T] = []
    page: Optional[int] = None
    limit: Optional[int] = None
    total_items: Optional[int] = None
    total_pages: Optional[int] = None

class ListResponse(BaseModel, Generic[T]):
    results: List[T] = []

class SingleResponse(BaseModel, Generic[T]):
    result: T