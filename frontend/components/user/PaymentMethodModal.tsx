import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

type PaymentMethod = 'COD' | 'Online';

interface PaymentMethodModalProps {
  visible: boolean;
  totalAmount: number;
  onSelectPayment: (method: PaymentMethod) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  totalAmount,
  onSelectPayment,
  onClose,
  isProcessing = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('COD');

  const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const paymentMethods = [
    {
      id: 'COD' as PaymentMethod,
      title: 'Cash on Delivery',
      subtitle: 'Pay when you receive your order',
      icon: 'cash-outline',
      color: Colors.success,
      recommended: true,
    },
    {
      id: 'Online' as PaymentMethod,
      title: 'Online Payment',
      subtitle: 'Pay securely with UPI, Card, Net Banking',
      icon: 'card-outline',
      color: Colors.primary,
      recommended: false,
    },
  ];

  const handleContinue = () => {
    onSelectPayment(selectedMethod);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={onClose} disabled={isProcessing}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount to Pay</Text>
              <Text style={styles.amountValue}>₹{formatINR(totalAmount)}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selectedMethod === method.id && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
                disabled={isProcessing}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: method.color + '20' }]}>
                    <Ionicons name={method.icon as any} size={28} color={method.color} />
                  </View>
                  <View style={styles.paymentOptionText}>
                    <View style={styles.titleRow}>
                      <Text style={styles.paymentTitle}>{method.title}</Text>
                      {method.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedMethod === method.id && styles.radioButtonSelected
                ]}>
                  {selectedMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Payment Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                {selectedMethod === 'COD' 
                  ? 'Pay in cash to the delivery partner when you receive your order.'
                  : 'You will be redirected to secure payment gateway to complete your payment.'}
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.continueButton, isProcessing && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={isProcessing ? ['#CCCCCC', '#CCCCCC'] : Colors.gradients.primary as [string, string]}
                style={styles.continueGradient}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator color={Colors.textPrimary} style={{ marginRight: 8 }} />
                    <Text style={styles.continueText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.continueText}>Continue with {selectedMethod === 'COD' ? 'COD' : 'Online Payment'}</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.textPrimary} style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    padding: 20,
  },
  paymentOption: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentOptionText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  recommendedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default PaymentMethodModal;

