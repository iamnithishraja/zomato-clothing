import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/colors';

import CategoryIcons from '@/components/user/CategoryIcons';
import SwipeCarousel from '@/components/user/SwipeCarousel';
import FilterButtons from '@/components/user/FilterButtons';
import ModernStoreCard from '@/components/user/ModernStoreCard';
import PromotionalBanner from '@/components/user/PromotionalBanner';

// Import types and API
import type { Store, Location } from '@/types/store';
import type { Product } from '@/types/product';
import { getAllStores, getBestSellerStores } from '@/api/stores';
import { getAllProducts } from '@/api/products';

export default function HomeScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [bestSellerStores, setBestSellerStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      // Load best seller stores
      const bestSellerResponse = await getBestSellerStores(4);
      if (bestSellerResponse.success) {
        setBestSellerStores(bestSellerResponse.stores);
      }

      // Load all stores
      const storesResponse = await getAllStores({
        page: 1,
        limit: 20,
        location: selectedLocation?.name,
      });
      
      if (storesResponse.success) {
        setStores(storesResponse.stores);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load stores. Please try again.');
    }
  }, [selectedLocation]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    try {
      // Search both stores and products
      const [storesResponse, productsResponse] = await Promise.all([
        getAllStores({
          page: 1,
          limit: 20,
          search: query,
          location: selectedLocation?.name,
        }),
        getAllProducts({
          page: 1,
          limit: 20,
          search: query,
        })
      ]);
      
      if (storesResponse.success) {
        setStores(storesResponse.stores);
      }
      
      if (productsResponse.success) {
        setProducts(productsResponse.products);
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  }, [selectedLocation]);

  // Handle filter change
  const handleFilterChange = useCallback(async (filterId: string) => {
    setSelectedFilter(filterId);
    try {
      const response = await getAllStores({
        page: 1,
        limit: 20,
        search: searchQuery,
        location: selectedLocation?.name,
      });
      
      if (response.success) {
        setStores(response.stores);
      }
    } catch (error) {
      console.error('Error filtering:', error);
    }
  }, [searchQuery, selectedLocation]);

  // Handle category press
  const handleCategoryPress = useCallback((subcategory: string) => {
    // Search for products in this subcategory
    handleSearch(subcategory);
  }, [handleSearch]);

  // Handle store press
  const handleStorePress = useCallback((store: Store) => {
    // Navigate to store details screen - implement navigation later
    console.log('Store pressed:', store);
  }, []);

  // Load data on mount and when location changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderStoreCard = ({ item }: { item: Store }) => (
    <ModernStoreCard store={item} onPress={handleStorePress} />
  );

  const renderHeader = () => (
    <>
      {/* Promotional Banner with Location and Search */}
      <PromotionalBanner 
        onOrderPress={() => console.log('Order now pressed')}
        selectedLocation={selectedLocation}
        onLocationSelect={setSelectedLocation}
        onSearch={handleSearch}
      />

      {/* Category Icons */}
      <CategoryIcons onCategoryPress={handleCategoryPress} />

      {/* Best Seller Carousel */}
      <SwipeCarousel
        stores={bestSellerStores}
        onStorePress={handleStorePress}
      />

      {/* Filter Buttons */}
      <FilterButtons
        selectedFilter={selectedFilter}
        onFilterSelect={handleFilterChange}
      />

      {/* Stores Section Header */}
      <View style={styles.storesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Nearby Stores'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {stores.length} stores found
            {products.length > 0 && ` • ${products.length} products found`}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <FlatList
        data={stores}
        renderItem={renderStoreCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flatListContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storesSection: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

