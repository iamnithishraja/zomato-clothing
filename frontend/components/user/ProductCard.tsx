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
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40; // Full width minus margins

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN'); // Indian number format
  };

  const formatSizes = (sizes: string[]) => {
    if (!sizes || sizes.length === 0) return 'No sizes';
    return sizes.join(', '); // Show all sizes without truncation
  };

  const handleFavoritePress = () => {
    setIsFavorite(!isFavorite);
  };

  const handleAddToCart = () => {
    // Add to cart functionality
    console.log('Add to cart:', product.name);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      {/* Horizontal Layout */}
      <View style={styles.horizontalLayout}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
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
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color="#EF4444" 
            />
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Top Row: Product Name and Sizes */}
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
            </View>
            <View style={styles.sizesContainer}>
              <Text style={styles.sizesLabel}>Sizes</Text>
              <Text style={styles.sizesText} numberOfLines={2}>
                {formatSizes(product.sizes)}
              </Text>
            </View>
          </View>

          {/* Product Description */}
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description || 'Premium quality product'}
          </Text>

          {/* Price with Rupee Symbol */}
          <View style={styles.priceContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.price}>
              {formatPrice(product.price)}
            </Text>
          </View>

          {/* Bottom Row: Available Quantity and Add to Cart */}
          <View style={styles.bottomRow}>
            <View style={styles.quantityContainer}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.quantityText}>
                {product.availableQuantity} available
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#000000FF" />
              <Text style={styles.addToCartText}>Add</Text>
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
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  horizontalLayout: {
    flexDirection: 'row',
    height: 150,
  },
  imageContainer: {
    width: 120,
    height: 150,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 20,
  },
  productDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EF4444',
    marginRight: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  sizesContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
    justifyContent: 'center',
  },
  sizesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  sizesText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'right',
    lineHeight: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  quantityText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
    minHeight: 28,
    justifyContent: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000FF',
  },
});

export default ProductCard;
