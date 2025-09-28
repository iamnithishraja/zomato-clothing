import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Store } from '@/types/store';

interface ModernStoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

// Removed unused screenWidth variable

const ModernStoreCard: React.FC<ModernStoreCardProps> = ({ store, onPress }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  // Debug: Log store data to see what's available
  console.log('Store data:', {
    storeName: store.storeName,
    description: store.description,
    merchantName: store.merchantId?.name,
    address: store.address
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={18} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={18} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={18} color="#E0E0E0" />
      );
    }

    return stars;
  };

  const formatAddress = (address: string) => {
    const words = address.split(' ');
    if (words.length > 3) {
      return words.slice(0, 3).join(' ') + '...';
    }
    return address;
  };

  const handleFavoritePress = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(store)}
      activeOpacity={0.9}
    >
      {/* Main Card Content */}
      <View style={styles.cardContent}>
        {/* Image Section - 70% of card height */}
        <View style={styles.imageSection}>
          {store.storeImages && store.storeImages.length > 0 ? (
            <Image
              source={{ uri: store.storeImages[0] }}
              style={styles.storeImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#f8f9fa', '#e9ecef']}
              style={styles.placeholderImage}
            >
              <Ionicons name="storefront-outline" size={50} color="#6c757d" />
            </LinearGradient>
          )}
          
          {/* Dark Overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageGradient}
          />
          
          {/* Store Name and Description Overlay */}
          <View style={styles.storeInfoOverlay}>
            <View style={styles.storeNameContainer}>
              <Text style={styles.storeNameText} numberOfLines={1}>
                {store.storeName}
              </Text>
            </View>
            <Text style={styles.storeSubtitleText} numberOfLines={1}>
              {store.description && store.description.trim() ? store.description : ''}
            </Text>
          </View>
        </View>

        {/* Bottom White Section - 30% of card height */}
        <View style={styles.bottomSection}>
          <View style={styles.infoRow}>
            {/* Rating */}
            <View style={styles.infoItem}>
              <View style={styles.starsContainer}>
                {renderStars(store.rating.average)}
              </View>
              <Text style={styles.ratingText}>
                {store.rating.average.toFixed(1)}
              </Text>
            </View>

            {/* Distance */}
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.distanceText}>
                {formatAddress(store.address)}
              </Text>
            </View>

            {/* Favorite */}
            <TouchableOpacity 
              style={styles.favoriteButton} 
              activeOpacity={0.7}
              onPress={handleFavoritePress}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#EF4444" : "#6B7280"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16, // Use margins instead of padding
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    flex: 1,
  },
  imageSection: {
    height: 160, // Reduced from 200 to 160
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80, // Reduced from 100 to 80
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  storeInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  storeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeIcon: {
    marginRight: 8,
  },
  storeNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  storeSubtitleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  bottomSection: {
    height: 50, // Reduced from 80 to 60
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10, // Reduced from 12 to 10
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ModernStoreCard;
