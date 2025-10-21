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

  // const { selectedCity, currentLocation } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [bestSellerStores, setBestSellerStores] = useState<Store[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // --- Scroll animation values ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScrollY = Animated.diffClamp(scrollY, 0, 300);
  const bannerHeight = 320;

  // --- Load data ---
  const loadData = useCallback(async () => {
    if (hasLoadedData) return;
    try {
      const bestSellerResponse = await apiClient.get('/api/v1/store/bestsellers', {
        params: { limit: 4 },
      });
      if (bestSellerResponse.data.success) {
        setBestSellerStores(bestSellerResponse.data.stores);
      }

      const storesResponse = await apiClient.get('/api/v1/store/all', {
        params: {
          page: 1,
          limit: 20,
          location: selectedLocation?.name,
        },
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

  // --- Refresh handler ---
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasLoadedData(false);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // --- Search handler ---
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      try {
        const storesResponse = await apiClient.get('/api/v1/store/all', {
          params: {
            page: 1,
            limit: 20,
            search: query,
            location: selectedLocation?.name,
          },
        });

        if (storesResponse.data.success) {
          setStores(storesResponse.data.stores);
        }
      } catch (error) {
        console.error('Error searching:', error);
      }
    },
    [selectedLocation]
  );

  // --- Filter handler ---
  const handleFilterChange = useCallback(
    async (filterId: string) => {
      setSelectedFilter(filterId);
      try {
        const response = await apiClient.get('/api/v1/store/all', {
          params: {
            page: 1,
            limit: 20,
            search: searchQuery,
            location: selectedLocation?.name,
          },
        });

        if (response.data.success) {
          setStores(response.data.stores);
        }
      } catch (error) {
        console.error('Error filtering:', error);
      }
    },
    [searchQuery, selectedLocation]
  );

  // --- Store press handler ---
  const handleStorePress = useCallback(
    (store: Store) => {
      router.push({ pathname: '/store/[storeId]', params: { storeId: store._id } });
    },
    [router]
  );

  const handleOrderPress = useCallback(() => {
    console.log('Order now pressed');
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // --- Scroll animations ---
  const bannerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, bannerHeight],
    outputRange: [0, -bannerHeight],
    extrapolate: 'clamp',
  });

  const stickySearchOpacity = clampedScrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyIconsOpacity = clampedScrollY.interpolate({
    inputRange: [50, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Fixed scroll event ---
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: any) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          setIsScrolled(offsetY > 80);
        }, 50);
      },
    }
  );

  const renderStoreCard: ListRenderItem<Store> = useCallback(
    ({ item }) => (
      <View style={styles.storeCardContainer}>
        <ModernStoreCard store={item} onPress={handleStorePress} />
      </View>
    ),
    [handleStorePress]
  );

  const renderHeader = useCallback(
    () => (
      <>
        {/* --- Promotional Banner --- */}
        <Animated.View
          style={[
            styles.bannerContainer,
            { transform: [{ translateY: bannerTranslateY }] },
          ]}
        >
          <PromotionalBanner
            onOrderPress={handleOrderPress}
            selectedLocation={selectedLocation}
            onLocationSelect={setSelectedLocation}
            onSearch={handleSearch}
          />
        </Animated.View>

        {/* --- Category Icons --- */}
        <CategoryIcons showHeader={true} screenType="home" />

        {/* --- Best Seller Carousel --- */}
        <SwipeCarousel stores={bestSellerStores} onStorePress={handleStorePress} />

        {/* --- Filter Buttons --- */}
        <FilterButtons
          selectedFilter={selectedFilter}
          onFilterSelect={handleFilterChange}
          screenType="home"
        />

        {/* --- Stores Section Header --- */}
        <View style={styles.storesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Nearby Stores'}
            </Text>
          </View>
        </View>
      </>
    ),
    [
      selectedLocation,
      handleSearch,
      bestSellerStores,
      handleStorePress,
      selectedFilter,
      handleFilterChange,
      searchQuery,
      handleOrderPress,
      bannerTranslateY,
    ]
  );

  const AnimatedFlatList: any = Animated.createAnimatedComponent(FlatList as any);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- Sticky Search Bar --- */}
      <Animated.View
        style={[
          styles.stickySearchBar,
          {
            paddingTop: Math.max(insets.top, 14),
            opacity: stickySearchOpacity,
          },
        ]}
        pointerEvents={isScrolled ? 'auto' : 'none'}
      >
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search stores and products..."
          initialValue={searchQuery}
          showNavigation={true}
        />
      </Animated.View>

      {/* --- Sticky Category Icons --- */}
      <Animated.View
        style={[
          styles.stickyCategoryIcons,
          { paddingTop: 30, opacity: stickyIconsOpacity },
        ]}
        pointerEvents={isScrolled ? 'auto' : 'none'}
      >
        <CategoryIcons showHeader={false} screenType="home" />
      </Animated.View>

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
    zIndex: 5,
    elevation: 5,
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
    zIndex: 20,
    elevation: 20,
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
    zIndex: 19,
    elevation: 19,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flatListContent: {
    paddingBottom: 100,
    paddingTop: 0,
  },
  storeCardContainer: {},
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
