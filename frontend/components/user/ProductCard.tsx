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
const imageWidth = 120;
const detailsWidth = cardWidth - imageWidth;

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN'); // Indian number format
  };

  const formatSizes = (sizes: string[]) => {
    if (!sizes || sizes.length === 0) return [];
    return sizes;
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
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Top Row: Product Name and Favorite Button */}
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
            </View>
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

          {/* Product Description */}
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description || 'Premium quality product'}
          </Text>

          {/* Sizes Row */}
          <View style={styles.sizesContainer}>
            {/* <Text style={styles.sizesLabel}>Sizes</Text> */}
            <View style={styles.sizesRow}>
              {formatSizes(product.sizes).map((size, index) => (
                <View key={index} style={styles.sizeChip}>
                  <Text style={styles.sizeText}>{size}</Text>
                </View>
              ))}
            </View>
          </View>

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
    height: 160,
    overflow: 'hidden',
  },
  imageContainer: {
    width: imageWidth,
    height: 160,
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
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    width: detailsWidth,
    padding: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
    height: 150,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
    maxWidth: detailsWidth - 40,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 22,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 6,
    height: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rupeeSymbol: {
    fontSize: 18,
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
    alignItems: 'flex-start',
    width: detailsWidth,
    marginBottom: 6,
    justifyContent: 'flex-start',
  },
  sizesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    width: '100%',
  },
  sizeChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    marginBottom: 2,
  },
  sizeText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    height: 28,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    maxWidth: detailsWidth * 0.65,
    paddingBottom:5

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
    gap: 3,
    marginLeft: 4,
    minHeight: 28,
    maxHeight: 32,
    justifyContent: 'center',
    marginBottom: 20,
  },
  addToCartText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000FF',
  },
});

export default ProductCard;
