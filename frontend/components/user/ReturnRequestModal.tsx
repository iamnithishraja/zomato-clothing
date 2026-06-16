import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import apiClient from '@/api/client';
import { RETURN_REASONS, type ReturnReason } from '@/types/return';

interface ReturnRequestModalProps {
  visible: boolean;
  orderId: string;
  paymentMethod: 'COD' | 'Online';
  onClose: () => void;
  onSuccess: () => void;
}

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  visible,
  orderId,
  paymentMethod,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [notes, setNotes] = useState('');
  const [refundUpiId, setRefundUpiId] = useState('');
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setReason(null);
    setNotes('');
    setRefundUpiId('');
    setShowReasonPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Required', 'Please select a return reason.');
      return;
    }

    if (paymentMethod === 'COD' && !refundUpiId.trim()) {
      Alert.alert('Required', 'Refund UPI ID is required for Cash on Delivery orders.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/api/v1/returns', {
        orderId,
        reason,
        notes: notes.trim() || undefined,
        refundUpiId: refundUpiId.trim() || undefined,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Your return request has been submitted.');
        resetForm();
        onSuccess();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Request Return</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.hint}>
              You can request a return within 48 hours of delivery. The merchant will review your request.
            </Text>

            <Text style={styles.label}>Return Reason *</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowReasonPicker(!showReasonPicker)}>
              <Text style={[styles.dropdownText, !reason && styles.placeholder]}>
                {reason || 'Select a reason'}
              </Text>
              <Ionicons name={showReasonPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showReasonPicker && (
              <View style={styles.reasonList}>
                {RETURN_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonItem, reason === r && styles.reasonItemActive]}
                    onPress={() => {
                      setReason(r);
                      setShowReasonPicker(false);
                    }}
                  >
                    <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add any details about the issue..."
              placeholderTextColor={Colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={styles.label}>
              Refund UPI ID {paymentMethod === 'COD' ? '*' : '(optional)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. name@upi"
              placeholderTextColor={Colors.textSecondary}
              value={refundUpiId}
              onChangeText={setRefundUpiId}
              autoCapitalize="none"
            />
            {paymentMethod === 'COD' && (
              <Text style={styles.upiHint}>Required for COD orders so the merchant can refund you via UPI.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.submitGradient}>
              {submitting ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="return-down-back-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.submitText}>Submit Return Request</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  reasonList: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reasonItemActive: {
    backgroundColor: Colors.primary + '20',
  },
  reasonText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  reasonTextActive: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  textArea: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 88,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  upiHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.7,
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
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default ReturnRequestModal;
