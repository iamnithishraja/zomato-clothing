import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Store } from '@/types/store';

interface ModernStoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // Full width minus margins

const ModernStoreCard: React.FC<ModernStoreCardProps> = ({ store, onPress }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#E5E7EB" />
      );
    }

    return stars;
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Location not specified';
    const words = address.split(' ');
    if (words.length > 4) {
      return words.slice(0, 4).join(' ') + '...';
    }
    return address;
  };


  const handleFavoritePress = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={() => onPress(store)}
      activeOpacity={0.9}
    >
      {/* Main Card Content */}
      <View style={styles.cardContent}>
        {/* Cover Image Section */}
        <View style={styles.imageSection}>
          {store.storeImages && store.storeImages.length > 0 ? (
            <Image
              source={{ uri: store.storeImages[0] }}
              style={styles.storeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="storefront-outline" size={60} color="#9CA3AF" />
            </View>
          )}
          

          {/* Favorite Button */}
          <TouchableOpacity 
            style={styles.favoriteButton} 
            activeOpacity={0.7}
            onPress={handleFavoritePress}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#EF4444" : "#FFFFFF"} 
            />
          </TouchableOpacity>

        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Store Name and Rating Row */}
          <View style={styles.topRow}>
            <Text style={styles.storeName} numberOfLines={1}>
              {store.storeName}
            </Text>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(store.rating.average)}
              </View>
              <Text style={styles.ratingText}>
                {store.rating.average.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({store.rating.totalReviews})
              </Text>
            </View>
          </View>

          {/* Description */}
          {store.description && (
            <Text style={styles.description} numberOfLines={2}>
              {store.description}
            </Text>
          )}

          {/* Bottom Row - Location on Right */}
          <View style={styles.bottomRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {formatAddress(store.address)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageSection: {
    height: 140,
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default ModernStoreCard;