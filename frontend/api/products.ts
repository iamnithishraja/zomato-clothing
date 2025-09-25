import apiClient from './client';
import type {  ProductsResponse } from '@/types/product';

// Get all products with pagination and filtering
export const getAllProducts = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}): Promise<ProductsResponse> => {
  const response = await apiClient.get('/api/v1/product/all', { params });
  return response.data;
};

// Get products by store ID
export const getProductsByStore = async (
  storeId: string,
  params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
  }
): Promise<ProductsResponse> => {
  const response = await apiClient.get(`/api/v1/product/store/${storeId}`, { params });
  return response.data;
};

// Search products
export const searchProducts = async (
  searchTerm: string,
  filters?: {
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<ProductsResponse> => {
  const response = await apiClient.get('/api/v1/product/all', {
    params: {
      search: searchTerm,
      ...filters,
      limit: 20
    }
  });
  return response.data;
};

// Get products by category
export const getProductsByCategory = async (
  category: string,
  subcategory?: string
): Promise<ProductsResponse> => {
  const response = await apiClient.get('/api/v1/product/all', {
    params: {
      category,
      subcategory,
      limit: 20
    }
  });
  return response.data;
};
