import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Store } from '@/types/store';

interface SwipeCarouselProps {
  stores: Store[];
  onStorePress: (store: Store) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.9; // More width
const cardSpacing = 20;

const SwipeCarousel: React.FC<SwipeCarouselProps> = ({
  stores,
  onStorePress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateToIndex = useCallback((index: number, direction: 'left' | 'right') => {
    const targetTranslateX = direction === 'right' ? -cardWidth - cardSpacing : cardWidth + cardSpacing;
    
    // Animate current card out
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetTranslateX,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset position and animate new card in
      setCurrentIndex(index);
      translateX.setValue(direction === 'right' ? cardWidth + cardSpacing : -cardWidth - cardSpacing);
      
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [translateX, scale, opacity]);

  const goToNext = useCallback(() => {
    if (currentIndex < stores.length - 1) {
      const nextIndex = currentIndex + 1;
      animateToIndex(nextIndex, 'right');
    } else {
      // Loop back to first
      animateToIndex(0, 'right');
    }
  }, [currentIndex, stores.length, animateToIndex]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      animateToIndex(prevIndex, 'left');
    } else {
      // Loop to last
      animateToIndex(stores.length - 1, 'left');
    }
  }, [currentIndex, stores.length, animateToIndex]);

  useEffect(() => {
    if (stores.length > 1) {
      const interval = setInterval(() => {
        goToNext();
      }, 2500); // Reduced from 4000 to 2500 milliseconds

      return () => clearInterval(interval);
    }
  }, [stores.length, goToNext]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, vx } = gestureState;
      
      if (Math.abs(dx) > 100 || Math.abs(vx) > 0.5) {
        if (dx > 0) {
          // Swipe right - go to previous
          goToPrevious();
        } else {
          // Swipe left - go to next
          goToNext();
        }
      } else {
        // Snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color={Colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={Colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color={Colors.border} />
      );
    }

    return stars;
  };

  const renderCard = (store: Store) => {
    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX },
              { scale },
            ],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onStorePress(store)}
          activeOpacity={0.9}
        >
          {/* Full Image Background */}
          <View style={styles.imageContainer}>
            {store.storeImages && store.storeImages.length > 0 ? (
              <Image
                source={{ uri: store.storeImages[0] }}
                style={styles.storeImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="storefront-outline" size={48} color={Colors.textSecondary} />
              </View>
            )}
            
            {/* Gradient Overlay for Text Readability */}
            <View style={styles.gradientOverlay} />
            
            {/* Top Left Badge - Best Seller */}
            <View style={styles.topBadges}>
              <View style={styles.bestSellerBadge}>
                <Ionicons name="trophy" size={10} color={Colors.background} />
                <Text style={styles.bestSellerText}>Best Seller</Text>
              </View>
            </View>

            {/* Text Overlay - Bottom Left */}
            <View style={styles.textOverlay}>
              {/* Store Name with Background */}
              <View style={styles.storeNameContainer}>
                <Text style={styles.storeName} numberOfLines={2}>
                  {store.storeName}
                </Text>
              </View>

              {/* Rating with Background */}
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBackground}>
                  <View style={styles.starsContainer}>
                    {renderStars(store.rating.average)}
                  </View>
                  <Text style={styles.ratingText}>
                    {store.rating.average.toFixed(1)} ({store.rating.totalReviews})
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (stores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Best Sellers</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No stores available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Best Sellers</Text>
        <View style={styles.headerRight}>
          {/* Navigation Dots - moved to top right */}
          <View style={styles.pagination}>
            {stores.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.activeDot
                ]}
                onPress={() => {
                  if (index > currentIndex) {
                    animateToIndex(index, 'right');
                  } else if (index < currentIndex) {
                    animateToIndex(index, 'left');
                  }
                }}
              />
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        {renderCard(stores[currentIndex])}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  carouselContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  card: {
    width: cardWidth,
    height: 180,
    position: 'absolute',
  },
  cardContent: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  topBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.background,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.background,
    textTransform: 'uppercase',
  },
  bestSellerBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bestSellerText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.background,
    textTransform: 'uppercase',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 16,
  },
  storeNameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.background,
    textAlign: 'left',
  },
  descriptionContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  storeDescription: {
    fontSize: 11,
    color: Colors.background,
    lineHeight: 14,
    textAlign: 'left',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationText: {
    fontSize: 10,
    color: Colors.background,
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});

export default SwipeCarousel;
