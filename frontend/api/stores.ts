import apiClient from './client';
import type {  StoresResponse, BestSellerStoresResponse } from '@/types/store';

// Get all stores with pagination and filtering
export const getAllStores = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
}): Promise<StoresResponse> => {
  const response = await apiClient.get('/api/v1/store/all', { params });
  return response.data;
};

// Get best seller stores
export const getBestSellerStores = async (limit: number = 4): Promise<BestSellerStoresResponse> => {
  const response = await apiClient.get('/api/v1/store/bestsellers', { 
    params: { limit } 
  });
  return response.data;
};

// Search stores
export const searchStores = async (searchTerm: string, location?: string): Promise<StoresResponse> => {
  const response = await apiClient.get('/api/v1/store/all', {
    params: {
      search: searchTerm,
      location,
      limit: 20
    }
  });
  return response.data;
};
