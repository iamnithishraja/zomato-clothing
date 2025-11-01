import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  discountPercentage?: number;
  isOnSale?: boolean;
  sizes: string[];
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  const formatPrice = (price: number) => {
    return Math.round(price).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.card}>
      {/* Left Side - Product Image */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="shirt-outline" size={32} color={Colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Middle - Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.priceContainer}>
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
              <View style={styles.regularPriceContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description || 'No description available'}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
          <View style={styles.quantityBadge}>
            <Ionicons name="cube-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.quantityText}>{product.quantity}</Text>
          </View>
        </View>

        {product.sizes && product.sizes.length > 0 && (
          <View style={styles.sizesContainer}>
            <Ionicons name="resize-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.sizesText}>{product.sizes.join(', ')}</Text>
          </View>
        )}

        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.dateText}>{formatDate(product.createdAt)}</Text>
        </View>
      </View>

      {/* Right Side - Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 10,
    minHeight: 60,
    width: '100%',
  },
  imageContainer: {
    width: 85,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary,
    marginRight: 16,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    paddingRight: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  productDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  quantityText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sizesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  sizesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.background,
  },
  deleteButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.background,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'line-through',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  discountedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB', // Blue color
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  currencySymbolBlue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB', // Blue color
    marginRight: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  regularPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProductCard;
