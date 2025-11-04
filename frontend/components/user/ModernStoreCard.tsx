import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Store } from '@/types/store';

interface ModernStoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ModernStoreCard: React.FC<ModernStoreCardProps> = ({ store, onPress }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Get image array (ensure at least one element)
  const storeImages = store.storeImages && store.storeImages.length > 0 
    ? store.storeImages 
    : [];

  // Handle image scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const imageWidth = SCREEN_WIDTH - 32; // Account for card padding
    const index = Math.round(contentOffsetX / imageWidth);
    setCurrentImageIndex(index);
    
    // Reset auto-scroll timer when user manually scrolls
    resetAutoScroll();
  };

  // Auto-scroll to next image
  const scrollToNextImage = () => {
    if (storeImages.length <= 1) return;

    const nextIndex = (currentImageIndex + 1) % storeImages.length;
    const imageWidth = SCREEN_WIDTH - 32;
    
    scrollViewRef.current?.scrollTo({
      x: nextIndex * imageWidth,
      animated: true,
    });
    
    setCurrentImageIndex(nextIndex);
  };

  // Reset auto-scroll timer
  const resetAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
    
    if (storeImages.length > 1) {
      autoScrollTimer.current = setInterval(() => {
        scrollToNextImage();
      }, 5000); // 5 seconds
    }
  };

  // Setup auto-scroll
  useEffect(() => {
    if (storeImages.length > 1) {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
      
      autoScrollTimer.current = setInterval(() => {
        scrollToNextImage();
      }, 5000);
    }

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeImages.length, currentImageIndex]);

  return (
    <View style={styles.container}>
      {/* Image Slider Section - Separate from card click */}
      <View style={styles.imageSection}>
        {storeImages.length > 0 ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={resetAutoScroll}
              onScrollEndDrag={resetAutoScroll}
              style={styles.imageScrollView}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH - 32}
              snapToAlignment="start"
              bounces={false}
            >
              {storeImages.map((imageUri, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUri }}
                  style={styles.storeImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Image Dots Indicator */}
            {storeImages.length > 1 && (
              <View style={styles.dotsContainer} pointerEvents="none">
                {storeImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentImageIndex === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="storefront-outline" size={60} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Card Content - Clickable */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => onPress(store)}
        activeOpacity={0.9}
      >

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

          {/* Bottom Row - Location from Left */}
          <View style={styles.bottomRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {store.address || 'Location not specified'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  cardContent: {
    backgroundColor: 'transparent',
  },
  imageSection: {
    height: 140,
    position: 'relative',
    zIndex: 10,
  },
  imageScrollView: {
    height: 140,
  },
  storeImage: {
    width: SCREEN_WIDTH - 32,
    height: 140,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 20,
    borderRadius: 3,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
});

export default ModernStoreCard;