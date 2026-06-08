import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';
import type { RateStoreResponse } from '@/types/storeReview';

interface StoreRatingModalProps {
  visible: boolean;
  orderId: string;
  storeName?: string;
  onClose: () => void;
  onLater?: () => void;
  onSuccess?: (response?: RateStoreResponse) => void;
}

const StoreRatingModal: React.FC<StoreRatingModalProps> = ({
  visible,
  orderId,
  storeName,
  onClose,
  onLater,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setReview('');
    }
  }, [visible, orderId]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post<RateStoreResponse>('/api/v1/stores/rate', {
        orderId,
        rating,
        review: review.trim() || undefined,
      });

      if (response.data.success) {
        onSuccess?.(response.data);
        onClose();
        Alert.alert('Thank you!', 'Your store review has been submitted.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit review';
      if (message.toLowerCase().includes('already rated')) {
        onSuccess?.();
        onClose();
        Alert.alert('Already reviewed', 'You have already submitted a review for this order.');
        return;
      }
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLater = () => {
    if (submitting) return;
    onLater?.();
    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleLater}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate Your Experience</Text>
            <TouchableOpacity
              onPress={handleLater}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={submitting}
            >
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {storeName
              ? `How was your shopping experience at ${storeName}?`
              : 'Share your overall experience with this store — packaging, service, and satisfaction.'}
          </Text>

          <Text style={styles.fieldLabel}>Your rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
                accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FFD700' : Colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Write a review (optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Packaging, delivery, service, or anything else you'd like to share…"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />
          <Text style={styles.charCount}>{review.length}/1000</Text>

          <TouchableOpacity
            style={[styles.submitButton, (submitting || rating === 0) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            <LinearGradient
              colors={rating === 0 ? ['#CCCCCC', '#CCCCCC'] : (Colors.gradients.primary as [string, string])}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={Colors.textPrimary} />
                  <Text style={styles.submitText}>Submit Review</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleLater}
            disabled={submitting}
          >
            <Text style={styles.laterText}>Later</Text>
          </TouchableOpacity>

          <Text style={styles.laterHint}>
            You can rate anytime from your order details. We won&apos;t remind you again here.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  reviewInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  laterText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  laterHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});

export default StoreRatingModal;
