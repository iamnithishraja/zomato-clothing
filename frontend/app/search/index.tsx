import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import ProductCard from '@/components/user/ProductCard';
import ModernStoreCard from '@/components/user/ModernStoreCard';
import FilterModal, { FilterOptions } from '@/components/user/FilterModal';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';
import apiClient from '@/api/client';

type SearchMode = 'all' | 'stores' | 'products';

export default function SearchScreen() {
  const router = useRouter();
  const { query } = useLocalSearchParams();
  const { checkMultipleFavorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('all');
  const [searchResults, setSearchResults] = useState<{
    stores: Store[];
    products: Product[];
  }>({ stores: [], products: [] });
  const [filteredResults, setFilteredResults] = useState<{
    stores: Store[];
    products: Product[];
  }>({ stores: [], products: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    priceRange: { min: 0, max: 10000 },
    categories: [],
    sizes: [],
    brands: [],
    sortBy: 'newest',
    inStock: false,
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fast regex-based search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ stores: [], products: [] });
      setFilteredResults({ stores: [], products: [] });
      return;
    }

    try {
      const searchRegex = new RegExp(query.trim(), 'i');
      
      // Search stores and products in parallel
      const [storesResponse, productsResponse] = await Promise.all([
        apiClient.get('/api/v1/store/all', {
          params: {
            page: 1,
            limit: 50,
            search: query.trim(),
          }
        }),
        apiClient.get('/api/v1/product/all', {
          params: {
            page: 1,
            limit: 50,
            search: query.trim(),
          }
        })
      ]);

      let stores: Store[] = [];
      let products: Product[] = [];

      if (storesResponse.data.success) {
        stores = storesResponse.data.stores.filter((store: Store) => 
          searchRegex.test(store.storeName) || 
          searchRegex.test(store.description) ||
          searchRegex.test(store.address)
        );
      }

      if (productsResponse.data.success) {
        products = productsResponse.data.products.filter((product: Product) =>
          searchRegex.test(product.name) ||
          searchRegex.test(product.description) ||
          searchRegex.test(product.category) ||
          searchRegex.test(product.subcategory)
        );
      }

      setSearchResults({ stores, products });
      setFilteredResults({ stores, products });
      
      // Check favorites for all products
      if (products.length > 0) {
        const productIds = products.map(p => p._id);
        checkMultipleFavorites(productIds);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    }
  }, [checkMultipleFavorites]);

  // Handle URL query on mount
  useEffect(() => {
    if (query && typeof query === 'string') {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query, performSearch]);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300) as any; // 300ms debounce
    } else {
      setSearchResults({ stores: [], products: [] });
      setFilteredResults({ stores: [], products: [] });
    }
  }, [performSearch]);

  // Handle product press
  const handleProductPress = (product: Product) => {
    router.push(`/product/${product._id}` as any);
  };

  // Handle store press
  const handleStorePress = (store: Store) => {
    router.push(`/store/${store._id}` as any);
  };

  // Handle search submit
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  }, [searchQuery, performSearch]);

  // Handle filter press
  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  // Handle filter apply
  const handleFilterApply = useCallback((filters: FilterOptions) => {
    setActiveFilters(filters);
    let filtered = [...searchResults.products];

    // Apply price filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange.min && 
      product.price <= filters.priceRange.max
    );

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      );
    }

    // Apply size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter(product => 
        product.sizes.some(size => filters.sizes.includes(size))
      );
    }

    // Apply in stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.availableQuantity > 0);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    setFilteredResults({ ...searchResults, products: filtered });
  }, [searchResults]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (searchQuery.trim()) {
      await performSearch(searchQuery.trim());
    }
    setIsRefreshing(false);
  }, [searchQuery, performSearch]);

  // Get current results based on search mode
  const getCurrentResults = useCallback(() => {
    if (searchMode === 'all') {
      return [...filteredResults.stores, ...filteredResults.products];
    } else if (searchMode === 'stores') {
      return filteredResults.stores;
    } else {
      return filteredResults.products;
    }
  }, [searchMode, filteredResults]);

  // Get total count
  const getTotalCount = useCallback(() => {
    return filteredResults.stores.length + filteredResults.products.length;
  }, [filteredResults.stores.length, filteredResults.products.length]);

  // Render store item
  const renderStoreItem: ListRenderItem<Store> = ({ item }) => (
    <ModernStoreCard store={item} onPress={handleStorePress} />
  );

  // Render product item
  const renderProductItem: ListRenderItem<Product> = ({ item }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  );

  // Render mixed item (for 'all' mode)
  const renderMixedItem: ListRenderItem<Store | Product> = ({ item }) => {
    if ('storeName' in item) {
      return <ModernStoreCard store={item as Store} onPress={handleStorePress} />;
    } else {
      return <ProductCard product={item as Product} onPress={handleProductPress} />;
    }
  };

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'No results found' : 'Start searching'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery.trim() 
          ? `No ${searchMode === 'all' ? 'items' : searchMode} found for "${searchQuery}"`
          : 'Search for stores and products'
        }
      </Text>
    </View>
  ), [searchQuery, searchMode]);

  const currentResults = getCurrentResults();

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.primary} 
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Search</Text>
            {searchQuery.trim() && (
              <Text style={styles.headerSubtitle}>
                {getTotalCount()} result{getTotalCount() !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilterPress}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={24} color="#000" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Search Input */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stores and products..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              onSubmitEditing={handleSearchSubmit}
              autoFocus={!query}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults({ stores: [], products: [] });
                  setFilteredResults({ stores: [], products: [] });
                }}
                style={styles.clearInputButton}
              >
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Mode Toggle - Always visible */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, searchMode === 'all' && styles.toggleButtonActive]}
            onPress={() => setSearchMode('all')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="grid-outline" 
              size={18} 
              color={searchMode === 'all' ? Colors.background : Colors.textSecondary} 
            />
            <Text style={[styles.toggleText, searchMode === 'all' && styles.toggleTextActive]}>
              All ({filteredResults.stores.length + filteredResults.products.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, searchMode === 'stores' && styles.toggleButtonActive]}
            onPress={() => setSearchMode('stores')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="storefront" 
              size={18} 
              color={searchMode === 'stores' ? Colors.background : Colors.textSecondary} 
            />
            <Text style={[styles.toggleText, searchMode === 'stores' && styles.toggleTextActive]}>
              Stores ({filteredResults.stores.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, searchMode === 'products' && styles.toggleButtonActive]}
            onPress={() => setSearchMode('products')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="shirt" 
              size={18} 
              color={searchMode === 'products' ? Colors.background : Colors.textSecondary} 
            />
            <Text style={[styles.toggleText, searchMode === 'products' && styles.toggleTextActive]}>
              Products ({filteredResults.products.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <FlatList
          data={currentResults as any}
          renderItem={searchMode === 'all' ? renderMixedItem as any : 
                     searchMode === 'stores' ? renderStoreItem as any : renderProductItem as any}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={handleFilterApply}
          initialFilters={activeFilters}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearInputButton: {
    padding: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  toggleTextActive: {
    color: Colors.background,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});
