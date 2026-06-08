import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { StoreRating } from '@/types/store';
import {
  normalizeStoreRating,
  formatStoreRatingAverage,
  formatStoreReviewCount,
  hasStoreReviews,
} from '@/utils/storeRatingUtils';

interface StoreRatingDisplayProps {
  rating?: Partial<StoreRating> | null;
  starSize?: number;
  showStars?: boolean;
  compact?: boolean;
  onDark?: boolean;
  textStyle?: TextStyle;
  style?: ViewStyle;
}

const StoreRatingDisplay: React.FC<StoreRatingDisplayProps> = ({
  rating,
  starSize = 12,
  showStars = true,
  compact = false,
  onDark = false,
  textStyle,
  style,
}) => {
  const normalized = normalizeStoreRating(rating);
  const hasReviews = hasStoreReviews(normalized);

  const renderStars = () => {
    const stars = [];
    const value = hasReviews ? normalized.average : 0;
    const fullStars = Math.floor(value);
    const hasHalfStar = hasReviews && value % 1 >= 0.25 && value % 1 < 0.75;
    const roundUp = hasReviews && value % 1 >= 0.75;

    const filled = roundUp ? Math.min(5, fullStars + 1) : fullStars;

    for (let i = 1; i <= 5; i++) {
      let icon: 'star' | 'star-half' | 'star-outline' = 'star-outline';
      if (i <= filled) icon = 'star';
      else if (i === filled + 1 && hasHalfStar) icon = 'star-half';

      stars.push(
        <Ionicons
          key={i}
          name={icon}
          size={starSize}
          color={hasReviews ? '#FFD700' : Colors.textMuted}
        />
      );
    }
    return stars;
  };

  return (
    <View style={[styles.row, style]}>
      {showStars && <View style={styles.stars}>{renderStars()}</View>}
      <Text
        style={[
          styles.text,
          compact && styles.compactText,
          onDark && styles.onDarkText,
          textStyle,
        ]}
      >
        {hasReviews ? formatStoreRatingAverage(normalized.average) : '—'}
        {!compact && (
          <Text style={[styles.muted, onDark && styles.onDarkMuted]}>
            {' '}
            · {formatStoreReviewCount(normalized.totalReviews)}
          </Text>
        )}
      </Text>
      {compact && hasReviews && (
        <Text style={[styles.muted, styles.compactCount, onDark && styles.onDarkMuted]}>
          ({normalized.totalReviews})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  compactText: {
    fontSize: 12,
  },
  muted: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  compactCount: {
    fontSize: 11,
  },
  onDarkText: {
    color: '#FFFFFF',
  },
  onDarkMuted: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});

export default StoreRatingDisplay;
