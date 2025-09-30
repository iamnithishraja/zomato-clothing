import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import ProductCard from '@/components/user/ProductCard';
import ModernStoreCard from '@/components/user/ModernStoreCard';
import SearchBar from '@/components/user/SearchBar';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';
import apiClient from '@/api/client';

export default function SearchScreen() {
  const router = useRouter();
  const { query } = useLocalSearchParams();
  const { checkMultipleFavorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    stores: Store[];
    products: Product[];
  }>({ stores: [], products: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Unified search function for both products and stores
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ stores: [], products: [] });
      return;
    }

    setIsLoading(true);
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
      
      // Check favorites for all products
      if (products.length > 0) {
        const productIds = products.map(p => p._id);
        checkMultipleFavorites(productIds);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (searchQuery.trim()) {
      await performSearch(searchQuery.trim());
    }
    setIsRefreshing(false);
  }, [searchQuery, performSearch]);

  // Get combined results (stores first, then products)
  const getCombinedResults = useCallback(() => {
    return [...searchResults.stores, ...searchResults.products];
  }, [searchResults]);

  // Get total count
  const getTotalCount = useCallback(() => {
    return searchResults.stores.length + searchResults.products.length;
  }, [searchResults.stores.length, searchResults.products.length]);

  // Render mixed item (stores and products combined)
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
          ? `No items found for "${searchQuery}"`
          : 'Search for stores and products'
        }
      </Text>
    </View>
  ), [searchQuery]);

  const combinedResults = getCombinedResults();

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
          
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search stores and products..."
            initialValue={searchQuery}
            autoFocus={!query}
            showNavigation={false}
          />
        </View>

        {/* Results Summary */}
        {searchQuery.trim() && (
          <View style={styles.resultsSummary}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {isLoading ? 'Searching...' : `${getTotalCount()} results for "${searchQuery}"`}
              </Text>
              {isLoading && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.loadingIndicator} />
              )}
            </View>
            {getTotalCount() > 0 && !isLoading && (
              <Text style={styles.resultsBreakdown}>
                {searchResults.stores.length} stores • {searchResults.products.length} products
              </Text>
            )}
          </View>
        )}

        {/* Results */}
        <FlatList
          data={combinedResults as any}
          renderItem={renderMixedItem as any}
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
  headerSpacer: {
    width: 40,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsBreakdown: {
    fontSize: 14,
    color: Colors.textSecondary,
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
