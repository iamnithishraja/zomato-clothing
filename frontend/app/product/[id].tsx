import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Product } from '@/types/product';
import apiClient from '@/api/client';

const { width: screenWidth } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCharacteristics, setShowCharacteristics] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const imageScrollViewRef = useRef<ScrollView>(null);

  // Load product details
  const loadProduct = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      Alert.alert('Error', 'Product ID not found');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/v1/product/${id}`);
      
      if (response.data.success) {
        console.log('Product data received:', response.data.product);
        console.log('Store data:', response.data.product.storeId);
        setProduct(response.data.product);
      } else {
        Alert.alert('Error', 'Product not found');
        router.back();
      }
    } catch (error: any) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  // Handle image scroll
  const handleImageScroll = useCallback((event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 40));
    setCurrentImageIndex(slideIndex);
  }, []);


  // Handle size selection
  const handleSizeSelection = useCallback((size: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size];
      }
    });
  }, []);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (selectedSizes.length === 0) {
      Alert.alert('Size Required', 'Please select at least one size before adding to cart');
      return;
    }
    
    if (product && product.availableQuantity <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }
    
    Alert.alert(
      'Added to Cart',
      `${product?.name} (${selectedSizes.join(', ')}) has been added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => console.log('Navigate to cart') }
      ]
    );
  }, [selectedSizes, product]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  // Handle view all
  const handleViewAll = useCallback(() => {
    Alert.alert('View All', 'View all functionality will be implemented soon');
  }, []);

  // Load product on mount
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Render error state
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
            <Text style={styles.errorTitle}>Product Not Found</Text>
            <Text style={styles.errorSubtitle}>The product you&apos;re looking for doesn&apos;t exist</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {product?.name || 'Product Details'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.heartButton} 
              onPress={handleFavoriteToggle}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={28} 
                color={isFavorite ? Colors.error : "#000"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Product Images Carousel */}
          <View style={styles.imageSection}>
            {product.images && product.images.length > 0 ? (
              <ScrollView
                ref={imageScrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageScroll}
                style={styles.imageScrollView}
                contentContainerStyle={styles.imageScrollContent}
              >
                {product.images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={{ uri: image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.imageContainer}>
                <View style={styles.placeholderImage}>
                  <Ionicons name="shirt-outline" size={80} color={Colors.textSecondary} />
                </View>
              </View>
            )}
            
            {/* Pagination Dots */}
            {product.images && product.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {product.images.map((_, index) => (
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

          {/* Product Information */}
          <View style={styles.productInfo}>
            {/* Product Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionText}>
                {product.description || 'Premium quality product with excellent craftsmanship and attention to detail.'}
              </Text>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{formatPrice(product.price)}</Text>
            </View>

            {/* Seller Info */}
            <View style={styles.sellerInfo}>
              <View style={styles.sellerLeft}>
                <View style={styles.sellerAvatar}>
                  {product.storeId?.storeImages && product.storeId.storeImages.length > 0 ? (
                    <Image
                      source={{ uri: product.storeId.storeImages[0] }}
                      style={styles.sellerAvatarImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('Image load error:', error);
                      }}
                      onLoad={() => {
                        console.log('Store image loaded successfully');
                      }}
                    />
                  ) : (
                    <Text style={styles.sellerInitial}>
                      {product.storeId?.storeName?.charAt(0) || 'S'}
                    </Text>
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>
                    {product.storeId?.storeName || 'Store Name'}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.ratingText}>4.7</Text>
              </View>
            </View>

            {/* Size Selection */}
            <View style={styles.sizeSection}>
              <View style={styles.sizeHeader}>
                <Text style={styles.sizeLabel}>Size</Text>
                <View style={styles.stockIndicator}>
                  <Ionicons 
                    name={product.availableQuantity > 0 ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={product.availableQuantity > 0 ? Colors.success : Colors.error} 
                  />
                  <Text style={[
                    styles.stockText,
                    { color: product.availableQuantity > 0 ? Colors.success : Colors.error }
                  ]}>
                    {product.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
              </View>
              <View style={styles.sizeButtons}>
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      selectedSizes.includes(size) && styles.sizeButtonSelected,
                      product.availableQuantity <= 0 && styles.sizeButtonDisabled
                    ]}
                    onPress={() => handleSizeSelection(size)}
                    activeOpacity={0.7}
                    disabled={product.availableQuantity <= 0}
                  >
                    <Text style={[
                      styles.sizeButtonText,
                      selectedSizes.includes(size) && styles.sizeButtonTextSelected,
                      product.availableQuantity <= 0 && styles.sizeButtonTextDisabled
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>


            {/* Characteristics */}
            <TouchableOpacity 
              style={styles.characteristicsSection}
              onPress={() => setShowCharacteristics(!showCharacteristics)}
              activeOpacity={0.7}
            >
              <Text style={styles.characteristicsTitle}>Product Details</Text>
              <Ionicons 
                name={showCharacteristics ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>

            {showCharacteristics && (
              <View style={styles.characteristicsContent}>
                {product.specifications && (
                  <>
                    {product.specifications.material && (
                      <View style={styles.characteristicItem}>
                        <Text style={styles.characteristicLabel}>Material:</Text>
                        <Text style={styles.characteristicValue}>{product.specifications.material}</Text>
                      </View>
                    )}
                    {product.specifications.fit && (
                      <View style={styles.characteristicItem}>
                        <Text style={styles.characteristicLabel}>Fit:</Text>
                        <Text style={styles.characteristicValue}>{product.specifications.fit}</Text>
                      </View>
                    )}
                    {product.specifications.pattern && (
                      <View style={styles.characteristicItem}>
                        <Text style={styles.characteristicLabel}>Pattern:</Text>
                        <Text style={styles.characteristicValue}>{product.specifications.pattern}</Text>
                      </View>
                    )}
                  </>
                )}
                {product.season && (
                  <View style={styles.characteristicItem}>
                    <Text style={styles.characteristicLabel}>Season:</Text>
                    <Text style={styles.characteristicValue}>{product.season}</Text>
                  </View>
                )}
                <View style={styles.characteristicItem}>
                  <Text style={styles.characteristicLabel}>Available Quantity:</Text>
                  <Text style={styles.characteristicValue}>{product.availableQuantity}</Text>
                </View>
              </View>
            )}

          </View>
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={styles.floatingButtons}>
          <TouchableOpacity 
            style={styles.viewAllButton} 
            onPress={handleViewAll}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={20} color="#000" />
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.addToCartButton,
              product.availableQuantity <= 0 && styles.addToCartButtonDisabled
            ]} 
            onPress={handleAddToCart}
            activeOpacity={0.8}
            disabled={product.availableQuantity <= 0}
          >
            <Ionicons 
              name={product.availableQuantity > 0 ? "add" : "close"} 
              size={20} 
              color="#000" 
            />
            <Text style={styles.addToCartButtonText}>
              {product.availableQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        </View>
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
  backButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
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
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heartButton: {
    width: 52,
    height: 52,
    paddingTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageSection: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  imageScrollView: {
    height: screenWidth * 0.8,
  },
  imageScrollContent: {
    alignItems: 'center',
  },
  imageContainer: {
    width: screenWidth - 40,
    height: screenWidth * 0.8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
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
    backgroundColor: Colors.textPrimary,
  },
  productInfo: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  sellerInitial: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 32,
  },
  priceContainer: {
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sizeSection: {
    marginBottom: 24,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sizeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minWidth: 40,
    alignItems: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sizeButtonTextSelected: {
    color: Colors.textInverse,
  },
  sizeButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  sizeButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  characteristicsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  characteristicsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  characteristicsContent: {
    paddingVertical: 16,
  },
  characteristicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  characteristicLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  characteristicValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  viewAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  viewAllButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
});
