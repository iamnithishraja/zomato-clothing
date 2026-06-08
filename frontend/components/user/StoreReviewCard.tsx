import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { StoreReviewItem } from '@/types/storeReview';

interface StoreReviewCardProps {
  review: StoreReviewItem;
  style?: ViewStyle;
  compact?: boolean;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const StoreReviewCard: React.FC<StoreReviewCardProps> = ({ review, style, compact }) => {
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={styles.header}>
        <Text style={styles.userName} numberOfLines={1}>
          {review.userName}
        </Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= review.rating ? 'star' : 'star-outline'}
              size={compact ? 12 : 14}
              color="#FFD700"
            />
          ))}
        </View>
      </View>
      {review.review ? (
        <Text style={styles.reviewText} numberOfLines={compact ? 4 : undefined}>
          {review.review}
        </Text>
      ) : (
        <Text style={styles.noComment}>No written feedback</Text>
      )}
      <Text style={styles.reviewDate}>{formatDate(review.ratedAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: {
    width: 280,
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    marginBottom: 8,
  },
  noComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

export default StoreReviewCard;
