import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Product } from '@/types/product';
import { useFavorites } from '@/hooks/useFavorites';
import { Colors } from '@/constants/colors';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 20; // Reduced margins for wider card
const imageWidth = 140; // Increased image size
const cardHeight = imageWidth + 60; // Same height maintained

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const router = useRouter();
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN');
  };

  const formatSizes = (sizes: string[]) => {
    if (!sizes || sizes.length === 0) return [];
    return sizes;
  };

  const handleFavoritePress = async () => {
    await toggleFavorite(product._id);
  };

  const handleAddToCart = () => {
    router.push({
      pathname: '/(tabs)/cart',
      params: {
        productId: product._id,
        productName: product.name,
        productPrice: product.price.toString(),
        productImage: product.images?.[0] || '',
        storeId: product.storeId._id,
        storeName: product.storeId.storeName || 'Store'
      }
    });
  };

  // Check if product is available
  const isAvailable = product.isActive && product.availableQuantity > 0;

  return (
    <TouchableOpacity 
      style={[styles.container, { width: cardWidth, height: cardHeight }]}
      onPress={() => onPress(product)}
      activeOpacity={0.95}
    >
      {/* Availability Indicator */}
      <View style={styles.availabilityIndicator}>
        <View style={[
          styles.availabilityIconContainer, 
          { backgroundColor: isAvailable ? '#10B981' : '#EF4444' }
        ]}>
          <Ionicons 
            name={isAvailable ? "checkmark" : "close"} 
            size={10} 
            color="#FFFFFF" 
          />
        </View>
        
        {/* Discount Indicator */}
        {product.isOnSale && product.discountPercentage && (
          <View style={styles.discountIndicator}>
            <Ionicons name="pricetag" size={12} color="#EF4444" />
            <Text style={styles.discountIndicatorText}>{product.discountPercentage}% OFF</Text>
          </View>
        )}
      </View>
      
      <View style={styles.mainLayout}>
        {/* Left Section: Product Details */}
        <View style={styles.detailsSection}>
          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Price */}
        <View style={styles.priceRow}>
          {product.isOnSale && product.discountPercentage ? (
            <View style={styles.discountedPriceContainer}>
              {/* Both prices in same row */}
              <View style={styles.bothPricesRow}>
                {/* Original Price (Strikethrough) */}
                <View style={styles.originalPriceRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.originalPrice}>{formatPrice(product.price / (1 - product.discountPercentage / 100))}</Text>
                </View>
                {/* Discounted Price (Blue) */}
                <View style={styles.discountedPriceRow}>
                  <Text style={styles.currencySymbolBlue}>₹</Text>
                  <Text style={styles.discountedPrice}>{formatPrice(product.price)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.regularPriceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
            </View>
          )}
        </View>

          {/* Description */}
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description || 'Premium quality product'}
          </Text>

          {/* Sizes */}
          {formatSizes(product.sizes).length > 0 && (
            <Text style={styles.sizesText}>
              Sizes: {formatSizes(product.sizes).join(', ')}
            </Text>
          )}

          {/* Favorites Button */}
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={(e) => {
              e.stopPropagation();
              handleFavoritePress();
            }}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons 
              name={isFavorite(product._id) ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorite(product._id) ? "#EF4444" : "#000000"} 
            />
          </TouchableOpacity>
        </View>

        {/* Right Section: Product Image with Add to Cart */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {/* Image */}
            <View style={styles.imageWrapper}>
              {product.images && product.images.length > 0 ? (
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="shirt-outline" size={32} color="#9CA3AF" />
                </View>
              )}
            </View>
            
            {/* Add to Cart Button */}
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              activeOpacity={0.85}
            >
              <View style={styles.addToCartContent}>
                <Text style={styles.addToCartText}>ADD</Text>
                <View style={styles.addIconContainer}>
                  <Ionicons name="add" size={16} color="#000000" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 0.3,
    borderColor: '#E5E7EB',
    height: 180,
    position: 'relative',
  },
  availabilityIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  discountIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 2,
  },
  discountIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
  },
  mainLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
    padding: 12,
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  imageSection: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 20, // Increased from 18
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 24, // Increased line height
    marginBottom: 6,
    marginTop: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  currencySymbol: {
    fontSize: 14, // Increased from 16
    // fontWeight: '600', // Remove bold
    color: '#000000',
    marginRight: 2,
    fontWeight: '400', // Normal font
  },
  price: {
    fontSize: 18, // Increased from 18
    // fontWeight: '600', // Remove bold
    color: '#000000',
    fontWeight: '400', // Normal font
  },
  productDescription: {
    fontSize: 16, // Increased from 14
    color: Colors.textPrimary,  
    lineHeight: 20, // Increased line height
    marginBottom: 8,
    fontWeight: '400',
  },
  sizesText: {
    fontSize: 15, // Increased from 13
    color: Colors.textSecondary,
    fontWeight: '400',
    marginBottom: 10,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  imageContainer: {
    width: imageWidth,
    height: imageWidth,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: imageWidth,
    height: imageWidth,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: -12, // slightly overlaps below the image card for "attached" feel
    left: '50%',
    transform: [{ translateX: -(imageWidth * 0.4) }], // center the button under the image
    width: imageWidth * 0.8, // 80% of image width
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  addToCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontSize: 16, // Increased from 14
    fontWeight: '700',
    color: '#000000',
    marginRight: 4,
    letterSpacing: 0.5,
  },
  addIconContainer: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  // Discount styles
  discountedPriceContainer: {
    gap: 2,
  },
  bothPricesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    // fontWeight: '600', // Remove bold
    color: '#000000',
    textDecorationLine: 'line-through',
    fontWeight: '400', // Normal font
  },
  discountedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountedPrice: {
    fontSize: 18,
    // fontWeight: '600', // Remove bold
    color: '#000000', // Blue color
    fontWeight: '400', // Normal font
  },
  currencySymbolBlue: {
    fontSize: 18,
    // fontWeight: '600', // Remove bold
    color: '#000000', // Blue color
    marginRight: 2,
    fontWeight: '400', // Normal font
  },
  regularPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProductCard;