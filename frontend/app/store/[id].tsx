import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import ProductCard from '@/components/user/ProductCard';
import { useFavorites } from '@/hooks/useFavorites';
import type { Store } from '@/types/store';
import type { Product } from '@/types/product';
import apiClient from '@/api/client';

const { width: screenWidth } = Dimensions.get('window');

export default function StoreDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { checkMultipleFavorites } = useFavorites();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentImageIndex] = useState(0);

  // Load store details and products
  const loadStoreData = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      Alert.alert('Error', 'Store ID not found');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      
      // Get store details and products in parallel
      const [storeResponse, productsResponse] = await Promise.all([
        apiClient.get(`/api/v1/store/${id}`),
        apiClient.get('/api/v1/product/all', {
          params: {
            page: 1,
            limit: 20,
            storeId: id,
          }
        })
      ]);

      if (storeResponse.data.success) {
        setStore(storeResponse.data.store);
      } else {
        Alert.alert('Error', 'Store not found');
        router.back();
        return;
      }

      if (productsResponse.data.success) {
        const productsData = productsResponse.data.products || [];
        setProducts(productsData);
        
        // Check favorites for all products
        if (productsData.length > 0) {
          const productIds = productsData.map((p: Product) => p._id);
          checkMultipleFavorites(productIds);
        }
      }

    } catch (error: any) {
      console.error('Error loading store data:', error);
      Alert.alert('Error', 'Failed to load store details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, router, checkMultipleFavorites]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStoreData();
    setIsRefreshing(false);
  }, [loadStoreData]);

  // Handle product press
  const handleProductPress = useCallback((product: Product) => {
    router.push(`/product/${product._id}`);
  }, [router]);

  // Handle call store
  const handleCallStore = useCallback(() => {
    if (store?.contact?.phone) {
      Linking.openURL(`tel:${store.contact.phone}`);
    } else {
      Alert.alert('No Phone', 'Phone number not available for this store');
    }
  }, [store]);

  // Handle open map
  const handleOpenMap = useCallback(() => {
    if (store?.mapLink) {
      Linking.openURL(store.mapLink);
    } else {
      Alert.alert('No Map Link', 'Map link not available for this store');
    }
  }, [store]);

  // Handle visit website
  const handleVisitWebsite = useCallback(() => {
    if (store?.contact?.website) {
      Linking.openURL(store.contact.website);
    } else {
      Alert.alert('No Website', 'Website not available for this store');
    }
  }, [store]);

  // Load data on mount
  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading store details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Render error state
  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContent}>
            <Ionicons name="storefront-outline" size={64} color={Colors.error} />
            <Text style={styles.errorTitle}>Store Not Found</Text>
            <Text style={styles.errorSubtitle}>The store you&apos;re looking for doesn&apos;t exist</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const getWorkingDaysText = () => {
    if (!store.workingDays) return 'Hours not available';
    
    const days = Object.entries(store.workingDays)
      .filter(([_, isOpen]) => isOpen)
      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1));
    
    return days.length > 0 ? `Open ${days.join(', ')}` : 'Hours not available';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.headerBackButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {store.storeName}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={() => Alert.alert('Share', 'Share functionality coming soon')}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Store Images */}
          {store.storeImages && store.storeImages.length > 0 && (
            <View style={styles.imageSection}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
                contentContainerStyle={styles.imageScrollContent}
              >
                {store.storeImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={{ uri: image }}
                      style={styles.storeImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              {store.storeImages.length > 1 && (
                <View style={styles.paginationContainer}>
                  {store.storeImages.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentImageIndex && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Store Info */}
          <View style={styles.storeInfo}>
            <View style={styles.storeHeader}>
              <View style={styles.storeTitleContainer}>
                <Text style={styles.storeName}>{store.storeName}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>
                    {formatRating(store.rating?.average || 0)} ({store.rating?.totalReviews || 0} reviews)
                  </Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: store.isActive ? Colors.success : Colors.error }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: store.isActive ? Colors.success : Colors.error }
                ]}>
                  {store.isActive ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            {store.description && (
              <Text style={styles.storeDescription}>{store.description}</Text>
            )}

            {/* Contact Info */}
            <View style={styles.contactSection}>
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{store.address}</Text>
              </View>
              
              <View style={styles.contactItem}>
                <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{getWorkingDaysText()}</Text>
              </View>

              {store.contact?.phone && (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.contactText}>{store.contact.phone}</Text>
                </View>
              )}

              {store.contact?.email && (
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.contactText}>{store.contact.email}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleCallStore}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleOpenMap}
                activeOpacity={0.7}
              >
                <Ionicons name="map" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
              
              {store.contact?.website && (
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleVisitWebsite}
                  activeOpacity={0.7}
                >
                  <Ionicons name="globe" size={20} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Products Section */}
          <View style={styles.productsSection}>
            <View style={styles.productsHeader}>
              <Text style={styles.productsTitle}>Products ({products.length})</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push(`/category/${store.storeName.toLowerCase().replace(/\s+/g, '-')}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllButtonText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {products.length > 0 ? (
              <View style={styles.productsGrid}>
                {products.slice(0, 6).map((product) => (
                  <View key={product._id} style={styles.productItem}>
                    <ProductCard product={product} onPress={handleProductPress} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noProductsContainer}>
                <Ionicons name="shirt-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.noProductsText}>No products available yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
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
  headerBackButton: {
    width: 52,
    height: 52,
    paddingTop: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  shareButton: {
    width: 52,
    height: 52,
    paddingTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageSection: {
    backgroundColor: Colors.background,
  },
  imageScrollView: {
    height: screenWidth * 0.6,
  },
  imageScrollContent: {
    alignItems: 'center',
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth * 0.6,
    backgroundColor: Colors.backgroundSecondary,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  storeInfo: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  storeTitleContainer: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  storeDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  contactSection: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  productsSection: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productItem: {
    width: '48%',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProductsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
