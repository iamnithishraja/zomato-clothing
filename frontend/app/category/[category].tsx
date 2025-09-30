import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import ProductCard from '@/components/user/ProductCard';
import FilterModal, { FilterOptions } from '@/components/user/FilterModal';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/types/product';
import apiClient from '@/api/client';

export default function CategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const { checkMultipleFavorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Convert category slug to subcategory name - memoized to prevent multiple conversions
  const subcategoryName = useMemo(() => {
    if (!category || typeof category !== 'string') return '';
    
    let converted = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Handle special cases
    if (converted === 'T Shirts') {
      converted = 'T-Shirts';
    }
    
    // Category conversion completed
    return converted;
  }, [category]);

  // Load products for the category
  const loadProducts = useCallback(async () => {
    if (!subcategoryName) {
      console.error('No subcategory name available');
      setProducts([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.get('/api/v1/product/subcategory', {
        params: {
          page: 1,
          limit: 50,
          subcategory: subcategoryName,
          _t: Date.now(), // Add timestamp to bypass cache
        }
      });
      
      // API response received
      
      if (response.data.success) {
        const productsData = response.data.products || [];
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Check favorites for all products
        if (productsData.length > 0) {
          const productIds = productsData.map(p => p._id);
          checkMultipleFavorites(productIds);
        }
        
        console.log(`Loaded ${productsData.length} products for subcategory: ${subcategoryName}`);
      } else {
        console.log('API returned success: false');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      Alert.alert(
        'Error', 
        `Failed to load products for ${subcategoryName}. Please check your connection and try again.`
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [subcategoryName, checkMultipleFavorites]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
  }, [loadProducts]);

  // Handle product press
  const handleProductPress = useCallback((product: Product) => {
    router.push(`/product/${product._id}`);
  }, [router]);

  // Handle filter press
  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  // Handle filter apply
  const handleFilterApply = useCallback((filters: FilterOptions) => {
    setActiveFilters(filters);
    
    let filtered = [...products];

    // Apply price filter
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category) || 
        filters.categories.includes(product.subcategory)
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

    setFilteredProducts(filtered);
  }, [products]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Use the same subcategory name for display
  const formattedCategoryName = subcategoryName || 'Category';

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="shirt-outline" size={80} color={Colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        No products available in this category yet.{'\n'}
        Check back later for new arrivals!
      </Text>
    </View>
  ), []);

  const renderLoadingState = useCallback(() => (
    <View style={styles.loadingState}>
      <View style={styles.loadingIconContainer}>
        <Ionicons name="refresh" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.loadingText}>Loading products...</Text>
    </View>
  ), []);

  const renderHeader = useCallback(() => (
    <LinearGradient
      colors={Colors.gradients.primary as [string, string]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {formattedCategoryName}
          </Text>
          {/* <Text style={styles.headerSubtitle}>
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </Text> */}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={handleFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  ), [formattedCategoryName, handleFilterPress, router]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.primary} 
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={1}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              progressBackgroundColor={Colors.background}
            />
          }
          ListEmptyComponent={isLoading ? renderLoadingState : renderEmptyState}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },  
  backButton: {
    width: 52,
    height: 52,
    paddingTop: 12,

  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterButton: {
    width: 52,
    height: 52,
    paddingTop: 12,
  },
  flatListContent: {
    paddingTop: 20,
    paddingBottom: 120, // Extra padding for tab bar
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
