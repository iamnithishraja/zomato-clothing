import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';
import type { StoreReviewsResponse } from '@/types/storeReview';
import StoreReviewCard from '@/components/user/StoreReviewCard';
import StoreRatingDisplay from '@/components/user/StoreRatingDisplay';

const PAGE_SIZE = 15;

export default function StoreReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reviews, setReviews] = useState<StoreReviewsResponse['reviews']>([]);
  const [rating, setRating] = useState<StoreReviewsResponse['rating'] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(
    async (pageNum: number, append = false) => {
      if (!id || typeof id !== 'string') return;

      try {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);

        const response = await apiClient.get<StoreReviewsResponse>(
          `/api/v1/stores/${id}/reviews?page=${pageNum}&limit=${PAGE_SIZE}`
        );

        if (response.data.success) {
          setRating(response.data.rating);
          setReviews((prev) =>
            append ? [...prev, ...response.data.reviews] : response.data.reviews
          );
          setHasMore(response.data.pagination.hasNextPage);
          setPage(pageNum);
        }
      } catch (error) {
        console.error('Error loading store reviews:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews(1);
  };

  if (!id || typeof id !== 'string') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Store Reviews</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading && reviews.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summary}>
            <StoreRatingDisplay rating={rating} starSize={18} />
            {rating && (
              <Text style={styles.summarySub}>
                Based on {rating.totalReviews} customer review{rating.totalReviews === 1 ? '' : 's'}
              </Text>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySub}>
                Be the first to review this store after your order is delivered.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {reviews.map((review) => (
                <StoreReviewCard key={review._id} review={review} style={styles.listCard} />
              ))}
            </View>
          )}

          {hasMore && (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={() => loadReviews(page + 1, true)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.loadMoreText}>Load more reviews</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summary: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    gap: 6,
  },
  summarySub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  list: {
    gap: 12,
  },
  listCard: {
    marginBottom: 0,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
