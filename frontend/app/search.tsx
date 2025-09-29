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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import ProductCard from '@/components/user/ProductCard';
import ModernStoreCard from '@/components/user/ModernStoreCard';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';
import apiClient from '@/api/client';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 5;

type SearchMode = 'stores' | 'products';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('stores');
  const [searchResults, setSearchResults] = useState<{
    stores: Store[];
    products: Product[];
  }>({ stores: [], products: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Load search history from AsyncStorage
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Save search history to AsyncStorage
  const saveSearchHistory = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, MAX_HISTORY_ITEMS);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);

  // Clear search history
  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  // Fast regex-based search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ stores: [], products: [] });
      setShowHistory(true);
      return;
    }

    setIsLoading(true);
    setShowHistory(false);

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
      
      // Save to search history
      await saveSearchHistory(query.trim());
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [saveSearchHistory]);

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
      setShowHistory(true);
    }
  }, [performSearch]);


  // Handle product press
  const handleProductPress = (product: Product) => {
    router.push(`/product/${product._id}`);
  };

  // Handle store press
  const handleStorePress = (store: Store) => {
    // Navigate to store products page
    router.push(`/category/${store.storeName.toLowerCase().replace(/\s+/g, '-')}`);
  };

  // Handle history item press
  const handleHistoryPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Render search history
  const renderSearchHistory = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent Searches</Text>
        {searchHistory.length > 0 && (
          <TouchableOpacity onPress={clearSearchHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      {searchHistory.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.historyItem}
          onPress={() => handleHistoryPress(item)}
        >
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.historyText}>{item}</Text>
          <Ionicons name="arrow-up" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render store item
  const renderStoreItem = ({ item }: { item: Store }) => (
    <ModernStoreCard store={item} onPress={handleStorePress} />
  );

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  );

  // Render search results
  const renderSearchResults = () => {
    const currentResults = searchMode === 'stores' ? searchResults.stores : searchResults.products;
    const totalResults = searchResults.stores.length + searchResults.products.length;

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (searchQuery.trim() && currentResults.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.noResultsTitle}>No {searchMode} found</Text>
          <Text style={styles.noResultsText}>
            Try searching for different keywords or switch to {searchMode === 'stores' ? 'products' : 'stores'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {searchQuery.trim() ? `Found ${currentResults.length} ${searchMode}` : ''}
          </Text>
          {totalResults > 0 && (
            <Text style={styles.resultsSubtitle}>
              {searchResults.stores.length} stores • {searchResults.products.length} products
            </Text>
          )}
        </View>

        {searchMode === 'stores' ? (
          <FlatList
            data={searchResults.stores}
            keyExtractor={(item) => item._id}
            renderItem={renderStoreItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          <FlatList
            data={searchResults.products}
            keyExtractor={(item) => item._id}
            renderItem={renderProductItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${searchMode}...`}
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults({ stores: [], products: [] });
                  setShowHistory(true);
                }}
                style={styles.clearInputButton}
              >
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Toggle Button */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, searchMode === 'stores' && styles.toggleButtonActive]}
              onPress={() => setSearchMode('stores')}
              activeOpacity={0.7}
            >
              <Ionicons name="storefront" size={16} color={searchMode === 'stores' ? Colors.background : Colors.textSecondary} />
              <Text style={[styles.toggleText, searchMode === 'stores' && styles.toggleTextActive]}>Stores</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, searchMode === 'products' && styles.toggleButtonActive]}
              onPress={() => setSearchMode('products')}
              activeOpacity={0.7}
            >
              <Ionicons name="shirt" size={16} color={searchMode === 'products' ? Colors.background : Colors.textSecondary} />
              <Text style={[styles.toggleText, searchMode === 'products' && styles.toggleTextActive]}>Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {showHistory && searchHistory.length > 0 ? renderSearchHistory() : renderSearchResults()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  clearInputButton: {
    padding: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.background,
  },
  historyContainer: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultsList: {
    paddingBottom: 20,
  },
});
