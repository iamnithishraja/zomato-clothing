import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FavoriteItem {
  _id: string;
  product: any;
  createdAt: string;
}

type UseFavoritesOptions = {
  autoLoad?: boolean;
};

export const useFavorites = (options: UseFavoritesOptions = {}) => {
  const { autoLoad = true } = options;
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if product is in favorites
  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  // Add product to favorites
  const addToFavorites = useCallback(async (productId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to favorites');
      return false;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/v1/favorite/add', {
        productId
      });

      if (response.data.success) {
        setFavorites(prev => [...prev, productId]);
        return true;
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add to favorites');
        return false;
      }
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      if (error.response?.status === 409) {
        Alert.alert('Already in Favorites', 'This product is already in your favorites');
      } else {
        Alert.alert('Error', 'Failed to add to favorites');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Remove product from favorites
  const removeFromFavorites = useCallback(async (productId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to manage favorites');
      return false;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.delete(`/api/v1/favorite/remove/${productId}`);

      if (response.data.success) {
        setFavorites(prev => prev.filter(id => id !== productId));
        return true;
      } else {
        Alert.alert('Error', response.data.message || 'Failed to remove from favorites');
        return false;
      }
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (productId: string) => {
    if (isFavorite(productId)) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // Load user's favorites
  const loadFavorites = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/v1/favorite/user');
      
      if (response.data.success) {
        const favoriteIds = response.data.favorites.map((fav: FavoriteItem) => fav.product._id);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check favorite status for multiple products
  const checkMultipleFavorites = useCallback(async (productIds: string[]) => {
    if (!user || productIds.length === 0) return;

    try {
      const response = await apiClient.post('/api/v1/favorite/status/multiple', {
        productIds
      });

      if (response.data.success) {
        const favoriteIds = response.data.favorites
          .filter((fav: any) => fav.isFavorite)
          .map((fav: any) => fav.productId);
        setFavorites(prev => [...new Set([...prev, ...favoriteIds])]);
      }
    } catch (error) {
      console.error('Error checking multiple favorites:', error);
    }
  }, [user]);

  // Load favorites on mount (can be disabled with autoLoad)
  useEffect(() => {
    if (!autoLoad) return;
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, autoLoad]); // Only depend on user and autoLoad

  return {
    favorites,
    isLoading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    loadFavorites,
    checkMultipleFavorites,
  };
};
