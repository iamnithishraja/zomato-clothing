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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import type { Store } from '@/types/store';

interface StoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // Full width with margins

const StoreCard: React.FC<StoreCardProps> = ({ store, onPress }) => {
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
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#E0E0E0" />
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

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={() => onPress(store)}
      activeOpacity={0.98}
    >
      <View style={styles.imageContainer}>
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
            <Ionicons name="storefront-outline" size={32} color="#6c757d" />
          </LinearGradient>
        )}
        
        {/* Gradient overlay for better text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        
        {/* Store status badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: store.isActive ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusBadgeText}>
            {store.isActive ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>

        {/* Rating badge */}
        {store.rating.average >= 4.0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.ratingBadgeText}>
              {store.rating.average.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Store name overlay */}
        <View style={styles.storeNameOverlay}>
          <Text style={styles.storeNameText} numberOfLines={1}>
            {store.storeName}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.leftContent}>
            <Text style={styles.storeDescription} numberOfLines={2}>
              {store.description || 'Premium fashion & lifestyle collection'}
            </Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {renderStars(store.rating.average)}
                </View>
                <Text style={styles.ratingText}>
                  ({store.rating.totalReviews})
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#374151" />
              <Text style={styles.locationText} numberOfLines={1}>
                {formatAddress(store.address)}
              </Text>
            </View>
          </View>

          <View style={styles.rightContent}>
            <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={24} color="#374151" />
            </TouchableOpacity>
            
            <View style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageContainer: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  storeNameOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  storeNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  content: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  storeDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
  },
  favoriteButton: {
    width: 46,
    height: 46,
    
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StoreCard;
