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
import FilterModal from '@/components/user/FilterModal';
import type { ProductFilters } from '@/types/filters';
import SearchBar from '@/components/user/SearchBar';
// Removed legacy header filters in favor of Stores + Best Sellers structure
import CategoryIcons from '@/components/user/CategoryIcons';
import FilterButtons from '@/components/user/FilterButtons';
import ModernStoreCard from '@/components/user/ModernStoreCard';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';
import apiClient from '@/api/client';
import CartBar from '@/components/user/CartBar';

export default function CategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const { checkMultipleFavorites, isFavorite, toggleFavorite, isLoading: favLoading } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ProductFilters>({
    priceRange: { min: 0, max: 10000 },
    category: [],
    subcategory: [],
    sizes: [],
    materials: [],
    fits: [],
    patterns: [],
    seasons: [],
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
    isOnSale: false,
    inStock: false,
    sortBy: 'newest',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecification, setSelectedSpecification] = useState<{ value: string; category: string } | null>(null);

  // Compute featured best sellers subset (random/featured from products of this category)
  const bestSellerProducts = useMemo(() => {
    const base = (filteredProducts && filteredProducts.length > 0) ? filteredProducts : products;
    if (!base || base.length === 0) return [] as Product[];
    const pool = [...base];
    // Simple shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(12, pool.length));
  }, [products, filteredProducts]);

  // Helper function to convert category slug to subcategory name
  const convertCategorySlug = useCallback((categorySlug: string) => {
    let converted = categorySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Handle special cases
    if (converted === 'T Shirts') {
      converted = 'T-Shirts';
    }
    
    return converted;
  }, []);

  // Convert category slug to subcategory name - memoized to prevent multiple conversions
  const subcategoryName = useMemo(() => {
    // Use selectedCategory if it's set (from category selection), otherwise use URL parameter
    const categoryToUse = selectedCategory || category;
    
    if (!categoryToUse || typeof categoryToUse !== 'string') return '';
    
    return convertCategorySlug(categoryToUse);
  }, [selectedCategory, category, convertCategorySlug]);

  // Note: Avoid setting state on mount from URL to prevent updates during insertion

  // Apply filters based on selected filter
  const applyFilters = useCallback((filterId: string) => {
    let filtered = [...products];

    switch (filterId) {
      case 'men':
        filtered = filtered.filter(product => product.category === 'Men');
        break;
      case 'women':
        filtered = filtered.filter(product => product.category === 'Women');
        break;
      case 'kids':
        filtered = filtered.filter(product => product.category === 'Kids');
        break;
      case 'unisex':
        filtered = filtered.filter(product => product.category === 'Unisex');
        break;
      case 'new':
        // Filter for new arrivals (products created in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(product => 
          new Date(product.createdAt) > thirtyDaysAgo
        );
        break;
      default:
        // No additional filtering - show all products for the subcategory
        break;
    }

    setFilteredProducts(filtered);
  }, [products]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Filter products based on search query
    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.subcategory.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products]);


  // Handle filter selection from FilterButtons
  const handleFilterSelect = useCallback((filterId: string) => {
    setSelectedFilter(filterId);
    // Apply filter logic here
    applyFilters(filterId);
  }, [applyFilters]);

  // Load products for the category
  const loadProducts = useCallback(async () => {
    if (!subcategoryName) {
      console.error('No subcategory name available');
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    
    try {
      setProductsLoading(true);
      
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
          const productIds = productsData.map((p: Product) => p._id);
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
      setProductsLoading(false);
    }
  }, [subcategoryName, checkMultipleFavorites]);

  // Load stores that sell this subcategory via search endpoint
  const loadStores = useCallback(async () => {
    if (!subcategoryName) {
      setStores([]);
      setStoresLoading(false);
      return;
    }
    try {
      setStoresLoading(true);
      const response = await apiClient.get('/api/v1/store/search', {
        params: { q: subcategoryName, page: 1, limit: 20, _t: Date.now() },
      });
      if (response.data?.success) {
        // API returns stores as array of { store, matchedSubcategory }
        const items = (response.data.stores || []).map((s: any) => s.store || s);
        // sort by rating average desc
        const sorted = items.sort((a: any, b: any) => (b?.rating?.average || 0) - (a?.rating?.average || 0));
        setStores(sorted);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error('Error loading stores:', err);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, [subcategoryName]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadProducts(), loadStores()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadProducts, loadStores]);

  // Handle product press
  const handleProductPress = useCallback((product: Product) => {
    router.push(`/product/${product._id}`);
  }, [router]);

  // Handle filter press
  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  // Handle filter apply
  const handleFilterApply = useCallback((filters: ProductFilters) => {
    setActiveFilters(filters);
    
    let filtered = [...products];

    // Apply price filter
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
      );
    }

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(product => 
        filters.category!.includes(product.category)
      );
    }

    // Apply subcategory filter
    if (filters.subcategory && filters.subcategory.length > 0) {
      filtered = filtered.filter(product => 
        filters.subcategory!.includes(product.subcategory)
      );
    }

    // Apply size filter
    if (filters.sizes && filters.sizes.length > 0) {
      filtered = filtered.filter(product => 
        product.sizes.some(size => filters.sizes!.includes(size))
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
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    setFilteredProducts(filtered);
  }, [products]);

  // Apply filters when products, selectedFilter, or search query changes
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.subcategory.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply specification filter
      if (selectedSpecification) {
        switch (selectedSpecification.category) {
          case 'materials':
            filtered = filtered.filter(product =>
              product.specifications?.material === selectedSpecification.value
            );
            break;
          case 'fits':
            filtered = filtered.filter(product =>
              product.specifications?.fit === selectedSpecification.value
            );
            break;
          case 'patterns':
            filtered = filtered.filter(product =>
              product.specifications?.pattern === selectedSpecification.value
            );
            break;
          case 'seasons':
            filtered = filtered.filter(product =>
              product.season === selectedSpecification.value
            );
            break;
        }
      }
      
      // Apply category filter if selected
      if (selectedFilter) {
        switch (selectedFilter) {
          case 'men':
            filtered = filtered.filter(product => product.category === 'Men');
            break;
          case 'women':
            filtered = filtered.filter(product => product.category === 'Women');
            break;
          case 'kids':
            filtered = filtered.filter(product => product.category === 'Kids');
            break;
          case 'unisex':
            filtered = filtered.filter(product => product.category === 'Unisex');
            break;
          case 'new':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filtered = filtered.filter(product => 
              new Date(product.createdAt) > thirtyDaysAgo
            );
            break;
        }
      }
      
      setFilteredProducts(filtered);
    }
  }, [products, selectedFilter, searchQuery, selectedSpecification]);

  // Load products when subcategory changes (either from URL or category selection)
  useEffect(() => {
    if (subcategoryName) {
      loadProducts();
      loadStores();
    }
  }, [subcategoryName, loadProducts, loadStores]);

  // Use the same subcategory name for display
  const formattedCategoryName = subcategoryName || 'Category';

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard 
      product={item} 
      onPress={handleProductPress} 
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      favoritesLoading={favLoading}
    />
  ), [handleProductPress, isFavorite, toggleFavorite, favLoading]);

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
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {selectedCategory || formattedCategoryName}
          </Text>
          {/* <Text style={styles.headerSubtitle}>
            Explore {filteredProducts.length} products
          </Text> */}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={handleFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  ), [selectedCategory, formattedCategoryName, handleFilterPress, router, filteredProducts.length]);

  const renderListHeader = useCallback(() => (
    <View style={styles.listHeaderContainer}>
      {/* Category Filters Section - Quick Categories */}
      <View style={styles.categoryFiltersSection}>
        <View style={styles.categoryFiltersContainer}>
          <FilterButtons
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            filterType="product"
            screenType="category"
          />
        </View>
      </View>

      {/* Category Icons Section */}
      <View style={styles.specificationsSection}>
        <View style={styles.filtersContainer}>
          <CategoryIcons
            showHeader={false}
            screenType="category"
            selectedSubcategory={selectedCategory}
            onCategoryPress={(sc: string) => setSelectedCategory(sc)}
          />
        </View>
      </View>

      {/* Stores Section */}
      <View style={styles.sectionHeader}>
        <Ionicons name="storefront-outline" size={18} color={Colors.buttonPrimary} />
        <Text style={styles.sectionTitle}>Stores selling {formattedCategoryName}</Text>
      </View>
      <View style={styles.storesGrid}>
        {storesLoading && (
          <Text style={styles.loadingInline}>Loading stores...</Text>
        )}
        {!storesLoading && stores.length === 0 && (
          <Text style={styles.emptyInline}>No stores found for this category</Text>
        )}
        {!storesLoading && stores.length > 0 && (
          <>
            {stores.map((store) => (
              <View key={String(store._id)} style={styles.storeCardWrapper}>
                <ModernStoreCard
                  store={store as any}
                  onPress={(s) => router.push(`/store/${s._id}?subcategory=${encodeURIComponent(selectedCategory || formattedCategoryName)}` as any)}
                />
              </View>
            ))}
          </>
        )}
      </View>

      {/* Best Sellers Section Title */}
      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Ionicons name="flame-outline" size={20} color={Colors.buttonPrimary} />
        <Text style={styles.sectionTitle}>Best Selling {formattedCategoryName}</Text>
      </View>
    </View>
  ), [stores, storesLoading, formattedCategoryName, router, selectedFilter, selectedCategory]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.primary} 
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        {/* Sticky SearchBar - stays visible while list scrolls */}
        <View style={styles.searchBarSticky}>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search products in this category..."
            initialValue={searchQuery}
            showNavigation={false}
          />
        </View>
        
        <FlatList
          data={bestSellerProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={1}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              progressBackgroundColor={Colors.background}
            />
          }
          ListEmptyComponent={productsLoading ? renderLoadingState : renderEmptyState}
        />
        <CartBar />

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
    justifyContent: 'space-evenly',
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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
  filterButton: {
    width: 52,
    height: 52,
    paddingTop: 12,
  },
  flatListContent: {
    paddingBottom: 120, // Extra padding for tab bar and CartBar
  },
  listHeaderContainer: {
    backgroundColor: Colors.background,
    paddingBottom: 8,
  },
  searchBarContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  searchBarSticky: {
    backgroundColor: Colors.background,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  specificationsSection: {
    backgroundColor: Colors.background,
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storesGrid: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  storeCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  storesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  storeCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  storeImageWrap: {
    height: 90,
    backgroundColor: Colors.backgroundSecondary,
  },
  storeImageBg: {
    flex: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  storeImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfoBox: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingInline: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyInline: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filtersContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 2,
  },
  categoryFiltersSection: {
    backgroundColor: Colors.background,
    paddingTop: 4,
  },
  categoryFiltersContainer: {
    paddingTop: 2,
    backgroundColor: Colors.background,
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
