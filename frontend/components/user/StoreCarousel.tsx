import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Store } from '@/types/store';

interface StoreCarouselProps {
  stores: Store[];
  onStorePress: (store: Store) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardSpacing = 12;
const leftCardWidth = screenWidth * 0.1; // 20%
const centerCardWidth = screenWidth * 0.7; // 50%
const rightCardWidth = screenWidth * 0.1; // 20%

const StoreCarousel: React.FC<StoreCarouselProps> = ({
  stores,
  onStorePress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (stores.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % stores.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (centerCardWidth + cardSpacing),
            animated: true,
          });
          return nextIndex;
        });
      }, 3000); // Auto-scroll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [stores.length]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (centerCardWidth + cardSpacing));
    setCurrentIndex(index);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color={Colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color={Colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color={Colors.border} />
      );
    }

    return stars;
  };

  const renderCard = (store: Store, index: number, isCenter: boolean) => {
    const cardWidth = isCenter ? centerCardWidth : (isCenter ? leftCardWidth : rightCardWidth);
    
    return (
      <TouchableOpacity
        key={store._id}
        style={[
          styles.card,
          { width: cardWidth },
          isCenter && styles.centerCard
        ]}
        onPress={() => onStorePress(store)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {store.storeImages && store.storeImages.length > 0 ? (
            <Image
              source={{ uri: store.storeImages[0] }}
              style={styles.storeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="storefront-outline" size={isCenter ? 32 : 24} color={Colors.textSecondary} />
            </View>
          )}
          
          {isCenter && store.rating.average > 4.5 && (
            <View style={styles.bestSellerBadge}>
              <Text style={styles.bestSellerText}>Best Seller</Text>
            </View>
          )}
        </View>

        {isCenter && (
          <View style={styles.centerContent}>
            <View style={styles.topContent}>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: store.isActive ? Colors.success : Colors.error }
                ]} />
                <Text style={styles.statusText}>
                  {store.isActive ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </View>
            
            <View style={styles.bottomContent}>
              <Text style={styles.storeName} numberOfLines={2}>
                {store.storeName}
              </Text>
              
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {renderStars(store.rating.average)}
                </View>
                <Text style={styles.ratingText}>
                  {store.rating.average.toFixed(1)} ({store.rating.totalReviews})
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
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
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        decelerationRate="fast"
        snapToInterval={centerCardWidth + cardSpacing}
        snapToAlignment="center"
      >
        {stores.map((store, index) => {
          const isCenter = index === currentIndex;
          return renderCard(store, index, isCenter);
        })}
      </ScrollView>

      {stores.length > 1 && (
        <View style={styles.pagination}>
          {stores.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.activeDot
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  card: {
    marginRight: cardSpacing,
    borderRadius: 16,
    backgroundColor: Colors.background,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    height: 200,
  },
  centerCard: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
  bestSellerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestSellerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  topContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomContent: {
    alignItems: 'flex-start',
  },
  storeName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.background,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: Colors.background,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.background,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
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

export default StoreCarousel;
