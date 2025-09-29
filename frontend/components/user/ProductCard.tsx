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
import { Colors } from '@/constants/colors';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // Two cards per row with margins

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatSizes = (sizes: string[]) => {
    if (!sizes || sizes.length === 0) return 'No sizes';
    return sizes.slice(0, 3).join(', ') + (sizes.length > 3 ? '...' : '');
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={() => onPress(product)}
      activeOpacity={0.9}
    >
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
            <Ionicons name="shirt-outline" size={40} color="#6c757d" />
          </View>
        )}
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>

        {/* Product Description */}
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description || 'Premium quality product'}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatPrice(product.price)}
          </Text>
        </View>

        {/* Sizes */}
        <View style={styles.sizesContainer}>
          <Text style={styles.sizesLabel}>Sizes</Text>
          <Text style={styles.sizesText} numberOfLines={1}>
            {formatSizes(product.sizes)}
          </Text>
        </View>

        {/* Available Quantity */}
        <View style={styles.quantityContainer}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.quantityText}>
            {product.availableQuantity} available
          </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
  },
  sizesContainer: {
    marginBottom: 6,
  },
  sizesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  sizesText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
});

export default ProductCard;

