import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import ProductCard from '@/components/user/ProductCard';
import { useFavorites } from '@/hooks/useFavorites';
import apiClient from '@/api/client';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isLoading, loadFavorites, removeFromFavorites } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load favorite products
  const loadFavoriteProducts = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v1/favorite/user', {
        params: {
          page: 1,
          limit: 50,
        }
      });

      if (response.data.success) {
        setFavoriteProducts(response.data.favorites.map((fav: FavoriteItem) => fav.product));
      }
    } catch (error) {
      console.error('Error loading favorite products:', error);
      Alert.alert('Error', 'Failed to load favorites');
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadFavorites(), loadFavoriteProducts()]);
    setIsRefreshing(false);
  }, [loadFavorites, loadFavoriteProducts]);

  // Handle product press
  const handleProductPress = useCallback((product: any) => {
    router.push(`/product/${product._id}`);
  }, [router]);

  // Handle remove from favorites
  const handleRemoveFavorite = useCallback(async (productId: string) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this product from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromFavorites(productId);
            if (success) {
              setFavoriteProducts(prev => prev.filter(p => p._id !== productId));
            }
          }
        }
      ]
    );
  }, [removeFromFavorites]);

  // Load data on mount
  useEffect(() => {
    loadFavoriteProducts();
  }, [loadFavoriteProducts]);

  // Render product item
  const renderProductItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.productItemContainer}>
      <ProductCard product={item} onPress={handleProductPress} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item._id)}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  ), [handleProductPress, handleRemoveFavorite]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={80} color={Colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start exploring products and add them to your favorites to see them here!
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.7}
      >
        <Text style={styles.exploreButtonText}>Explore Products</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  // Render loading state
  const renderLoadingState = useCallback(() => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading favorites...</Text>
    </View>
  ), []);

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
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'items'}
          </Text>
        </LinearGradient>

        {/* Content */}
        {isLoading ? (
          renderLoadingState()
        ) : (
          <FlatList
            data={favoriteProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
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
        )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  flatListContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  productItemContainer: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 16,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
