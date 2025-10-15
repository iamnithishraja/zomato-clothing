import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, StatusBar, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import CategoryIcons from '@/components/user/CategoryIcons';
import SpecificationFilters, { SpecificationFilters as SpecType } from '@/components/user/SpecificationFilters';
import FilterButtons from '@/components/user/FilterButtons';
import ProductCard from '@/components/user/ProductCard';
import apiClient from '@/api/client';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';

const { width } = Dimensions.get('window');

export default function StoreDetailsScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('all');
  const [filters, setFilters] = useState<SpecType>({ materials: [], fits: [], patterns: [], seasons: [] });

  const storeSubcategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: Product) => p.subcategory && set.add(p.subcategory));
    return Array.from(set);
  }, [products]);

  const carouselExpanded = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleCarousel = useCallback(() => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    Animated.timing(carouselExpanded, {
      toValue,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, carouselExpanded]);

  const carouselHeight = carouselExpanded.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const loadStore = useCallback(async () => {
    if (!storeId) return;
    const res = await apiClient.get(`/api/v1/store/${storeId}`);
    if (res.data?.success) setStore(res.data.store);
  }, [storeId]);

  const loadProducts = useCallback(async (pageNum: number, replace = false) => {
    if (!storeId || loadingPage) return;
    setLoadingPage(true);
    const res = await apiClient.get('/api/v1/product', {
      params: {
        page: pageNum,
        limit: 20,
        storeId,
        // Map specification filters to API expected params if needed
        materials: filters.materials,
        fits: filters.fits,
        patterns: filters.patterns,
        seasons: filters.seasons,
      },
    });
    if (res.data?.success) {
      const list: Product[] = res.data.products || [];
      setHasMore(list.length === 20);
      setProducts((prev) => (replace ? list : [...prev, ...list]));
    }
    setLoadingPage(false);
  }, [storeId, filters, loadingPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([loadStore(), loadProducts(1, true)]);
    setIsRefreshing(false);
  }, [loadStore, loadProducts]);

  const handleEndReached = useCallback(() => {
    if (loadingPage || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadProducts(next);
  }, [page, loadProducts, loadingPage, hasMore]);

  const handleFilterChange = useCallback((id: string) => {
    setSelectedFilter(id);
    setPage(1);
    loadProducts(1, true);
  }, [loadProducts]);

  const handleSpecChange = useCallback((next: SpecType) => {
    setFilters(next);
    setPage(1);
    loadProducts(1, true);
  }, [loadProducts]);

  const header = useMemo(() => (
    <View style={{ paddingTop: insets.top + 8 }}>
      {/* Top Bar with back, avatar+name (no rating pill in header) */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.identityRow}>
          <View style={styles.avatarWrap}>
            {store?.storeImages?.[0] ? (
              <Animated.Image source={{ uri: store.storeImages[0] }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="storefront-outline" size={16} color={Colors.textSecondary} />
              </View>
            )}
          </View>
          <Text style={styles.storeName} numberOfLines={1}>{store?.storeName || 'Store'}</Text>
        </View>
        <View />
      </View>

      {/* Address */}
      {store?.address ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.addressText} numberOfLines={2}>{store.address}</Text>
        </View>
      ) : null}

      {/* Cover carousel removed per requirement */}

      {/* Actions: Call, Directions, Website */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => store?.contact?.phone && (globalThis as any).openURL?.(`tel:${store.contact.phone}`)}>
          <Ionicons name="call" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>CALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => store?.mapLink && (globalThis as any).openURL?.(store.mapLink)}>
          <Ionicons name="map" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>DIR</Text>
        </TouchableOpacity>
        {store?.contact?.website ? (
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => (globalThis as any).openURL?.(store.contact!.website!)}>
            <Ionicons name="globe" size={18} color={Colors.primary} />
            <Text style={styles.actionText}>WEB</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category and filters */}
      <View style={{ paddingHorizontal: 0, paddingTop: 0 }}>
        <CategoryIcons 
          showHeader 
          headerTitle="Products On Store" 
          showSeeAll={false}
          subcategories={storeSubcategories}
          noMargin
          screenType="category" 
        />
      </View>

      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <SpecificationFilters onFilterChange={handleSpecChange} />
      </View>

      <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
        <FilterButtons selectedFilter={selectedFilter} onFilterSelect={handleFilterChange} screenType="category" />
      </View>
    </View>
  ), [insets.top, router, store, carouselHeight, isExpanded, selectedFilter, handleFilterChange, handleSpecChange]);

  useEffect(() => {
    handleRefresh();
  }, [storeId]);

  const handleProductPress = useCallback((product: Product) => {
    router.push(`/product/${product._id}`);
  }, [router]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 80 }}
        onEndReachedThreshold={0.4}
        onEndReached={handleEndReached}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  navBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  identityRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarWrap: { width: 30, height: 30, borderRadius: 15, overflow: 'hidden', backgroundColor: '#F2F3F5' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storeName: { flexShrink: 1, textAlign: 'left', fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#111' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 6 },
  addressText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  carouselContainer: { width, overflow: 'hidden' },
  carouselItem: { width: width - 24, height: '100%', marginHorizontal: 12, borderRadius: 16, overflow: 'hidden' },
  carouselImage: { width: '100%', height: '100%' },
  carouselToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 8 },
  toggleText: { fontSize: 13, color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  actionText: { fontSize: 13, color: '#000', fontWeight: '700', textAlign: 'center' },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  currency: { fontSize: 14, color: Colors.textPrimary, marginRight: 2 },
  price: { fontSize: 18, color: Colors.textPrimary, fontWeight: '600' },
  productDesc: { fontSize: 13, color: Colors.textSecondary },
  productImageWrap: { width: 112 },
});
