import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';
import type { StoreReviewsResponse } from '@/types/storeReview';
import StoreReviewCard from '@/components/user/StoreReviewCard';
import StoreRatingDisplay from '@/components/user/StoreRatingDisplay';
import type { StoreRating } from '@/types/store';

interface StoreReviewsPreviewProps {
  storeId: string;
  storeRating?: StoreRating | null;
}

const PREVIEW_LIMIT = 10;

const StoreReviewsPreview: React.FC<StoreReviewsPreviewProps> = ({ storeId, storeRating }) => {
  const router = useRouter();
  const [reviews, setReviews] = useState<StoreReviewsResponse['reviews']>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<StoreReviewsResponse>(
        `/api/v1/stores/${storeId}/reviews?page=1&limit=${PREVIEW_LIMIT}`
      );
      if (response.data.success) {
        setReviews(response.data.reviews);
        setTotalReviews(response.data.pagination.totalReviews);
      }
    } catch (error) {
      console.error('Error loading store review preview:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleViewAll = () => {
    router.push(`/store/reviews/${storeId}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <StoreRatingDisplay rating={storeRating} starSize={14} />
        </View>
        {totalReviews > 0 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {reviews.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-outline" size={28} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No store reviews yet</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {reviews.map((review) => (
            <StoreReviewCard key={review._id} review={review} compact />
          ))}
        </ScrollView>
      )}

      {totalReviews > PREVIEW_LIMIT && (
        <TouchableOpacity style={styles.viewAllFooter} onPress={handleViewAll}>
          <Text style={styles.viewAllFooterText}>
            View all {totalReviews} reviews
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  viewAllFooter: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  viewAllFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default StoreReviewsPreview;
