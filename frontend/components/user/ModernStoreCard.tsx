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

interface ModernStoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // Full width with margins

const ModernStoreCard: React.FC<ModernStoreCardProps> = ({ store, onPress }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#E0E0E0" />
      );
    }

    return stars;
  };

  const formatAddress = (address: string) => {
    const words = address.split(' ');
    if (words.length > 4) {
      return words.slice(0, 4).join(' ') + '...';
    }
    return address;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={() => onPress(store)}
      activeOpacity={0.95}
    >
      {/* Main Card Content */}
      <View style={styles.cardContent}>
        {/* Image Section */}
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
              <Ionicons name="storefront-outline" size={36} color="#6c757d" />
            </LinearGradient>
          )}
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
          
          {/* Top Badges */}
          <View style={styles.topBadges}>
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: store.isActive ? '#10B981' : '#EF4444' }
            ]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {store.isActive ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>

            {/* Rating Badge */}
            {store.rating.average >= 4.0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingBadgeText}>
                  {store.rating.average.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Store Name Overlay */}
          <View style={styles.storeNameOverlay}>
            <Text style={styles.storeNameText} numberOfLines={2}>
              {store.storeName}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.mainContent}>
            <Text style={styles.storeDescription} numberOfLines={2}>
              {store.description || 'Premium fashion & lifestyle collection'}
            </Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {renderStars(store.rating.average)}
                </View>
                <Text style={styles.ratingText}>
                  {store.rating.average.toFixed(1)} ({store.rating.totalReviews})
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {formatAddress(store.address)}
              </Text>
            </View>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.visitButton} activeOpacity={0.8}>
              <Text style={styles.visitButtonText}>Visit</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  cardContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageSection: {
    height: 120,
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
  topBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  contentSection: {
    padding: 12,
  },
  mainContent: {
    marginBottom: 12,
  },
  storeDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: '500',
  },
  detailsRow: {
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  visitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background,
  },
});

export default ModernStoreCard;
