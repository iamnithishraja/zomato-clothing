import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
// import { useLocation } from '@/contexts/LocationContext';

import CategoryIcons from '@/components/user/CategoryIcons';
import SwipeCarousel from '@/components/user/SwipeCarousel';
import FilterButtons from '@/components/user/FilterButtons';
import ModernStoreCard from '@/components/user/ModernStoreCard';
import PromotionalBanner from '@/components/user/PromotionalBanner';
import SearchBar from '@/components/user/SearchBar';

// Import types and API client
import type { Store, Location } from '@/types/store';
import apiClient from '@/api/client';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Location context available if needed
  // const { selectedCity, currentLocation } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [bestSellerStores, setBestSellerStores] = useState<Store[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Scroll/animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerHeight = 320; // PromotionalBanner visual height
  const categoryIconsHeight = 160; // Height of category icons section within header
  const triggerPoint = bannerHeight + categoryIconsHeight; // When sticky elements should appear
  const loadData = useCallback(async () => {
    if (hasLoadedData) {
      console.log('Data already loaded, skipping...');
      return;
    }
    
    try {
      console.log('Loading initial store data...');
      
      // Load best seller stores
      const bestSellerResponse = await apiClient.get('/api/v1/store/bestsellers', {
        params: { limit: 4 }
      });
      if (bestSellerResponse.data.success) {
        setBestSellerStores(bestSellerResponse.data.stores);
      }

      // Load all stores
      const storesResponse = await apiClient.get('/api/v1/store/all', {
        params: {
          page: 1,
          limit: 20,
          location: selectedLocation?.name,
        }
      });
      
      if (storesResponse.data.success) {
        setStores(storesResponse.data.stores);
      }
      
      setHasLoadedData(true);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load stores. Please try again.');
    }
  }, [selectedLocation, hasLoadedData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasLoadedData(false); // Reset flag to allow reload
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    try {
      // Only search stores for now (products will be handled by category screens)
      const storesResponse = await apiClient.get('/api/v1/store/all', {
        params: {
          page: 1,
          limit: 20,
          search: query,
          location: selectedLocation?.name,
        }
      });
      
      if (storesResponse.data.success) {
        setStores(storesResponse.data.stores);
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  }, [selectedLocation]);

  // Handle filter change
  const handleFilterChange = useCallback(async (filterId: string) => {
    setSelectedFilter(filterId);
    try {
      const response = await apiClient.get('/api/v1/store/all', {
        params: {
          page: 1,
          limit: 20,
          search: searchQuery,
          location: selectedLocation?.name,
        }
      });
      
      if (response.data.success) {
        setStores(response.data.stores);
      }
    } catch (error) {
      console.error('Error filtering:', error);
    }
  }, [searchQuery, selectedLocation]);


  // Handle store press
  const handleStorePress = useCallback((store: Store) => {
    router.push({ pathname: '/store/[storeId]', params: { storeId: store._id } });
  }, [router]);

  // Handle order press
  const handleOrderPress = useCallback(() => {
    console.log('Order now pressed');
  }, []);

  // Load data only once on mount
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once

  // Simplified animated values
  const bannerTranslateY = scrollY.interpolate({
    inputRange: [0, bannerHeight],
    outputRange: [0, -bannerHeight],
    extrapolate: 'clamp',
  });

  // Sticky elements - simple opacity and translate
  const stickySearchOpacity = scrollY.interpolate({
    inputRange: [triggerPoint - 50, triggerPoint],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const stickyIconsOpacity = scrollY.interpolate({
    inputRange: [triggerPoint - 50, triggerPoint],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // State to track if sticky elements should be interactive
  const [isScrolledPastTrigger, setIsScrolledPastTrigger] = useState(false);

  // Handle scroll event
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const shouldBeInteractive = offsetY > triggerPoint - 50;
        if (shouldBeInteractive !== isScrolledPastTrigger) {
          setIsScrolledPastTrigger(shouldBeInteractive);
        }
      }
    }
  );

  const renderStoreCard: ListRenderItem<Store> = useCallback(({ item }) => (
    <View style={styles.storeCardContainer}>
      <ModernStoreCard store={item} onPress={handleStorePress} />
    </View>
  ), [handleStorePress]);

  const renderHeader = useCallback(() => (
    <>
      {/* Promotional Banner (covers status bar) */}
      <Animated.View
        style={[
          styles.bannerContainer,
          { transform: [{ translateY: bannerTranslateY }] }
        ]}
      >
        <PromotionalBanner
          onOrderPress={handleOrderPress}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
          onSearch={handleSearch}
        />
      </Animated.View>

      {/* Category Icons - after banner within list header */}
      <CategoryIcons
        showHeader={true}
        screenType="home"
      />

      {/* Best Seller Carousel */}
      <SwipeCarousel
        stores={bestSellerStores}
        onStorePress={handleStorePress}
      />

      {/* Filter Buttons */}
      <FilterButtons
        selectedFilter={selectedFilter}
        onFilterSelect={handleFilterChange}
        screenType="home"
      />

      {/* Stores Section Header */}
      <View style={styles.storesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Nearby Stores'}
          </Text>
        </View>
      </View>
    </>
  ), [selectedLocation, handleSearch, bestSellerStores, handleStorePress, selectedFilter, handleFilterChange, searchQuery, handleOrderPress, bannerTranslateY]);

  // Animated FlatList to support native onScroll driver
  const AnimatedFlatList: any = Animated.createAnimatedComponent(FlatList as any);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky Search Bar */}
      <Animated.View
        style={[
          styles.stickySearchBar,
          {
            paddingTop: Math.max(insets.top, 14),
            opacity: stickySearchOpacity,
          }
        ]}
        pointerEvents={isScrolledPastTrigger ? "auto" : "none"}
      >
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search stores and products..."
          initialValue={searchQuery}
          showNavigation={true}
        />
      </Animated.View>

      {/* Sticky Category Icons */}
      <Animated.View
        style={[
          styles.stickyCategoryIcons,
          {
            paddingTop: 30,
            opacity: stickyIconsOpacity,
          }
        ]}
        pointerEvents={isScrolledPastTrigger ? "auto" : "none"}
      >
        <CategoryIcons showHeader={false} screenType="home" />
      </Animated.View>

      {/* Touch blocker to ensure banner components get priority when not scrolled */}
      {!isScrolledPastTrigger && (
        <View style={styles.touchBlocker} pointerEvents="box-none" />
      )}

      <AnimatedFlatList
        data={stores}
        renderItem={renderStoreCard}
        keyExtractor={(item: Store) => item._id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
  bannerContainer: {
    zIndex: 15,
    elevation: 15,
  },
  stickySearchBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stickyCategoryIcons: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    zIndex: 9,
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flatListContent: {
    paddingBottom: 100, // Extra padding for tab bar
    paddingTop: 0, // Initial view: banner handles top spacing
  },
  storeCardContainer: {
    // Remove padding - let the card handle its own margins
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
  touchBlocker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400, // Cover the banner and category area
    zIndex: 1,
    elevation: 1,
  },
});