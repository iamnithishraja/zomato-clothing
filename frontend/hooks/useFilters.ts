import { useState, useCallback } from 'react';
import { 
  ProductFilters, 
  SearchFilters, 
  DEFAULT_PRODUCT_FILTERS, 
  DEFAULT_SEARCH_FILTERS,
  FilterAction 
} from '@/types/filters';

// Hook for managing product filters
export const useProductFilters = (initialFilters?: ProductFilters) => {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters || DEFAULT_PRODUCT_FILTERS);

  const updateFilters = useCallback((updates: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_PRODUCT_FILTERS);
  }, []);

  const applyFilterAction = useCallback((action: FilterAction) => {
    switch (action.type) {
      case 'SET_PRODUCT_FILTERS':
        setFilters(action.payload);
        break;
      case 'RESET_PRODUCT_FILTERS':
        setFilters(DEFAULT_PRODUCT_FILTERS);
        break;
      case 'UPDATE_PRICE_RANGE':
        setFilters(prev => ({ ...prev, priceRange: action.payload }));
        break;
      case 'TOGGLE_CATEGORY':
        setFilters(prev => ({
          ...prev,
          category: prev.category?.includes(action.payload)
            ? prev.category.filter(c => c !== action.payload)
            : [...(prev.category || []), action.payload]
        }));
        break;
      case 'TOGGLE_SUBCATEGORY':
        setFilters(prev => ({
          ...prev,
          subcategory: prev.subcategory?.includes(action.payload)
            ? prev.subcategory.filter(s => s !== action.payload)
            : [...(prev.subcategory || []), action.payload]
        }));
        break;
      case 'TOGGLE_SIZE':
        setFilters(prev => ({
          ...prev,
          sizes: prev.sizes?.includes(action.payload)
            ? prev.sizes.filter(s => s !== action.payload)
            : [...(prev.sizes || []), action.payload]
        }));
        break;
      case 'TOGGLE_MATERIAL':
        setFilters(prev => ({
          ...prev,
          materials: prev.materials?.includes(action.payload)
            ? prev.materials.filter(m => m !== action.payload)
            : [...(prev.materials || []), action.payload]
        }));
        break;
      case 'TOGGLE_FIT':
        setFilters(prev => ({
          ...prev,
          fits: prev.fits?.includes(action.payload)
            ? prev.fits.filter(f => f !== action.payload)
            : [...(prev.fits || []), action.payload]
        }));
        break;
      case 'TOGGLE_PATTERN':
        setFilters(prev => ({
          ...prev,
          patterns: prev.patterns?.includes(action.payload)
            ? prev.patterns.filter(p => p !== action.payload)
            : [...(prev.patterns || []), action.payload]
        }));
        break;
      case 'TOGGLE_SEASON':
        setFilters(prev => ({
          ...prev,
          seasons: prev.seasons?.includes(action.payload)
            ? prev.seasons.filter(s => s !== action.payload)
            : [...(prev.seasons || []), action.payload]
        }));
        break;
      case 'SET_SORT_BY':
        setFilters(prev => ({ ...prev, sortBy: action.payload }));
        break;
      case 'TOGGLE_IN_STOCK':
        setFilters(prev => ({ ...prev, inStock: !prev.inStock }));
        break;
      case 'TOGGLE_NEW_ARRIVAL':
        setFilters(prev => ({ ...prev, isNewArrival: !prev.isNewArrival }));
        break;
      case 'TOGGLE_BEST_SELLER':
        setFilters(prev => ({ ...prev, isBestSeller: !prev.isBestSeller }));
        break;
      case 'TOGGLE_ON_SALE':
        setFilters(prev => ({ ...prev, isOnSale: !prev.isOnSale }));
        break;
      default:
        break;
    }
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.category && filters.category.length > 0) count++;
    if (filters.subcategory && filters.subcategory.length > 0) count++;
    if (filters.sizes && filters.sizes.length > 0) count++;
    if (filters.materials && filters.materials.length > 0) count++;
    if (filters.fits && filters.fits.length > 0) count++;
    if (filters.patterns && filters.patterns.length > 0) count++;
    if (filters.seasons && filters.seasons.length > 0) count++;
    if (filters.inStock) count++;
    if (filters.isNewArrival) count++;
    if (filters.isBestSeller) count++;
    if (filters.isOnSale) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    applyFilterAction,
    getActiveFiltersCount,
  };
};

// Hook for managing search filters
export const useSearchFilters = (initialFilters?: SearchFilters) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || DEFAULT_SEARCH_FILTERS);

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updateProductFilters = useCallback((updates: Partial<ProductFilters>) => {
    setFilters(prev => ({
      ...prev,
      productFilters: { ...prev.productFilters, ...updates }
    }));
  }, []);

  const updateStoreFilters = useCallback((updates: Partial<SearchFilters['storeFilters']>) => {
    setFilters(prev => ({
      ...prev,
      storeFilters: { ...prev.storeFilters, ...updates }
    }));
  }, []);

  const updateUserFilters = useCallback((updates: Partial<SearchFilters['userFilters']>) => {
    setFilters(prev => ({
      ...prev,
      userFilters: { ...prev.userFilters, ...updates }
    }));
  }, []);

  const updateSearchFilters = useCallback((updates: Partial<SearchFilters['searchFilters']>) => {
    setFilters(prev => ({
      ...prev,
      searchFilters: { ...prev.searchFilters, ...updates }
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_SEARCH_FILTERS);
  }, []);

  const applyFilterAction = useCallback((action: FilterAction) => {
    switch (action.type) {
      case 'SET_SEARCH_FILTERS':
        setFilters(action.payload);
        break;
      case 'RESET_SEARCH_FILTERS':
        setFilters(DEFAULT_SEARCH_FILTERS);
        break;
      case 'SET_SEARCH_QUERY':
        setFilters(prev => ({
          ...prev,
          searchFilters: { ...prev.searchFilters, searchQuery: action.payload }
        }));
        break;
      case 'SET_SEARCH_IN':
        setFilters(prev => ({
          ...prev,
          searchFilters: { ...prev.searchFilters, searchIn: action.payload }
        }));
        break;
      case 'TOGGLE_FAVORITES_ONLY':
        setFilters(prev => ({
          ...prev,
          userFilters: { ...prev.userFilters, favoritesOnly: !prev.userFilters.favoritesOnly }
        }));
        break;
      case 'TOGGLE_RECENTLY_VIEWED':
        setFilters(prev => ({
          ...prev,
          userFilters: { ...prev.userFilters, recentlyViewed: !prev.userFilters.recentlyViewed }
        }));
        break;
      default:
        // Delegate product filter actions to product filters
        setFilters(prev => ({
          ...prev,
          productFilters: { ...prev.productFilters }
        }));
        break;
    }
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    const { productFilters, storeFilters, userFilters, searchFilters } = filters;
    
    // Product filters
    if (productFilters.priceRange.min > 0 || productFilters.priceRange.max < 10000) count++;
    if (productFilters.category && productFilters.category.length > 0) count++;
    if (productFilters.subcategory && productFilters.subcategory.length > 0) count++;
    if (productFilters.sizes && productFilters.sizes.length > 0) count++;
    if (productFilters.materials && productFilters.materials.length > 0) count++;
    if (productFilters.inStock) count++;
    if (productFilters.isNewArrival) count++;
    if (productFilters.isBestSeller) count++;
    if (productFilters.sortBy !== 'newest') count++;
    
    // Store filters
    if (storeFilters.storeRating && (storeFilters.storeRating.min > 0 || storeFilters.storeRating.max < 5)) count++;
    if (storeFilters.storeName) count++;
    if (storeFilters.storeLocation) count++;
    
    // User filters
    if (userFilters.favoritesOnly) count++;
    if (userFilters.recentlyViewed) count++;
    
    // Search filters
    if (searchFilters.searchIn.length !== 1 || !searchFilters.searchIn.includes('products')) count++;
    if (searchFilters.includeInactive) count++;
    
    return count;
  }, [filters]);

  return {
    filters,
    updateFilters,
    updateProductFilters,
    updateStoreFilters,
    updateUserFilters,
    updateSearchFilters,
    resetFilters,
    applyFilterAction,
    getActiveFiltersCount,
  };
};
