import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Store } from '@/types/store';
import StoreCarouselCard from './StoreCarouselCard';

interface BestSellerCarouselProps {
  stores: Store[];
  onStorePress: (store: Store) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32;
const cardSpacing = 16;

const BestSellerCarousel: React.FC<BestSellerCarouselProps> = ({
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
            x: nextIndex * (cardWidth + cardSpacing),
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
    const index = Math.round(contentOffsetX / (cardWidth + cardSpacing));
    setCurrentIndex(index);
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
      >
        {stores.map((store, index) => (
          <View key={store._id} style={[styles.storeCard, { width: cardWidth }]}>
            <StoreCarouselCard store={store} onPress={onStorePress} />
          </View>
        ))}
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
    marginTop: 24,
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
  storeCard: {
    marginRight: cardSpacing,
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

export default BestSellerCarousel;
