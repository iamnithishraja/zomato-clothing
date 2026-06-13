import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { pickPdfDocument, uploadPdfToR2, type PickedDocument } from '@/utils/documentUploadUtils';
import { isVerificationApproved, resolveVerificationStatus } from '@/utils/verificationUtils';

type DocSlot = 'aadhaar' | 'other';

const VerificationPending = () => {
  const router = useRouter();
  const { user, login, token, logout } = useAuth();
  const [aadhaarDoc, setAadhaarDoc] = useState<PickedDocument | null>(null);
  const [otherDoc, setOtherDoc] = useState<PickedDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const status = useMemo(
    () => (user ? resolveVerificationStatus(user) : 'pending_documents'),
    [user],
  );

  const roleLabel = user?.role === 'Merchant' ? 'seller' : 'delivery partner';
  const canUpload = status === 'pending_documents' || status === 'rejected';
  const isWaiting = status === 'pending_review';

  const handlePick = useCallback(async (slot: DocSlot) => {
    try {
      const doc = await pickPdfDocument();
      if (!doc) return;
      if (slot === 'aadhaar') setAadhaarDoc(doc);
      else setOtherDoc(doc);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not pick document');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user || !token) return;
    if (!aadhaarDoc) {
      Alert.alert('Aadhaar required', 'Please upload your Aadhaar PDF to continue.');
      return;
    }

    try {
      setIsSubmitting(true);
      const role = user.role as 'Merchant' | 'Delivery';

      const aadhaarUrl = await uploadPdfToR2(aadhaarDoc, role);
      const documents: Array<{ documentType: string; url: string; fileName: string }> = [
        { documentType: 'aadhaar', url: aadhaarUrl, fileName: aadhaarDoc.name },
      ];

      if (otherDoc) {
        const otherUrl = await uploadPdfToR2(otherDoc, role);
        documents.push({ documentType: 'other', url: otherUrl, fileName: otherDoc.name });
      }

      const response = await apiClient.post('/api/v1/user/verification/submit', { documents });
      if (response.data.success && response.data.user) {
        await login(response.data.user, token);
        Alert.alert(
          'Documents uploaded',
          `Your documents were submitted successfully. Please wait until verification is complete before ${user.role === 'Merchant' ? 'selling products' : 'delivering orders'}.`,
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit documents');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [aadhaarDoc, otherDoc, login, token, user]);

  const handleRefreshStatus = useCallback(async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const response = await apiClient.get('/api/v1/user/profile');
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        await login(updatedUser, token);
        if (isVerificationApproved(updatedUser)) {
          if (updatedUser.role === 'Merchant') {
            router.replace('/(merchantTabs)/' as any);
          } else if (updatedUser.role === 'Delivery') {
            router.replace('/(deliveryTabs)/' as any);
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not refresh status');
    } finally {
      setIsRefreshing(false);
    }
  }, [login, router, token]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/auth/Auth');
  }, [logout, router]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isWaiting ? 'time-outline' : status === 'rejected' ? 'close-circle-outline' : 'shield-checkmark-outline'}
            size={56}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {isWaiting ? 'Verification in progress' : status === 'rejected' ? 'Verification rejected' : 'Identity verification'}
        </Text>

        <Text style={styles.subtitle}>
          {isWaiting
            ? `Your documents have been uploaded successfully. Our team is reviewing your ${roleLabel} account. You cannot use the app until verification is approved.`
            : status === 'rejected'
              ? `Your verification was rejected.${user.verificationReviewNote ? `\n\nReason: ${user.verificationReviewNote}` : ''}\n\nPlease upload your documents again.`
              : `Upload your Aadhaar and any supporting PDF documents. You cannot ${user.role === 'Merchant' ? 'sell products' : 'deliver orders'} until admin approval.`}
        </Text>

        {canUpload && (
          <View style={styles.uploadSection}>
            <DocUploadCard
              label="Aadhaar (required)"
              description="Upload Aadhaar as PDF"
              fileName={aadhaarDoc?.name}
              onPick={() => handlePick('aadhaar')}
            />
            <DocUploadCard
              label="Other document (optional)"
              description="GST, shop license, driving license, etc."
              fileName={otherDoc?.name}
              onPick={() => handlePick('other')}
            />

            <TouchableOpacity
              style={[styles.submitButton, (!aadhaarDoc || isSubmitting) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!aadhaarDoc || isSubmitting}
            >
              <LinearGradient
                colors={
                  aadhaarDoc && !isSubmitting
                    ? (Colors.gradients.primary as [string, string])
                    : ([Colors.border, Colors.border] as [string, string])
                }
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.submitText}>Submit for verification</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isWaiting ? (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
                <Text style={styles.refreshText}>Check verification status</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        {isWaiting && user.verificationDocuments?.length ? (
          <View style={styles.uploadedList}>
            <Text style={styles.uploadedTitle}>Submitted documents</Text>
            {user.verificationDocuments.map((doc, index) => (
              <View key={`${doc.url}-${index}`} style={styles.uploadedRow}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                <Text style={styles.uploadedName}>
                  {doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Other'} — {doc.fileName || 'document.pdf'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

function DocUploadCard({
  label,
  description,
  fileName,
  onPick,
}: {
  label: string;
  description: string;
  fileName?: string;
  onPick: () => void;
}) {
  return (
    <TouchableOpacity style={styles.docCard} onPress={onPick} activeOpacity={0.85}>
      <View style={styles.docCardHeader}>
        <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
        <View style={styles.docCardText}>
          <Text style={styles.docLabel}>{label}</Text>
          <Text style={styles.docDescription}>{description}</Text>
        </View>
      </View>
      {fileName ? (
        <View style={styles.selectedFile}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={styles.selectedFileName} numberOfLines={1}>{fileName}</Text>
        </View>
      ) : (
        <Text style={styles.tapToUpload}>Tap to select PDF</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 72 : 48,
    paddingBottom: 40,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  uploadSection: {
    gap: 14,
  },
  docCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.background,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  docCardText: {
    flex: 1,
  },
  docLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  docDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tapToUpload: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectedFile: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  uploadedList: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  uploadedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  uploadedName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  refreshText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  logoutButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default VerificationPending;
