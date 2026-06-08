import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import {
  AddressFormData,
  EMPTY_ADDRESS_FORM,
  formatAddress,
  parseAddressString,
  validateAddressForm,
} from '@/utils/addressUtils';

interface ManualAddressScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (formattedAddress: string, form: AddressFormData) => void | Promise<void>;
  title?: string;
  initialAddress?: string;
  initialForm?: AddressFormData;
  isSaving?: boolean;
  showLocationActions?: boolean;
  onUseCurrentLocation?: () => void | Promise<void>;
  onPickOnMap?: () => void;
  isLoadingLocation?: boolean;
}

const ManualAddressScreen: React.FC<ManualAddressScreenProps> = ({
  visible,
  onClose,
  onSave,
  title = 'Enter Address',
  initialAddress,
  initialForm,
  isSaving = false,
  showLocationActions = true,
  onUseCurrentLocation,
  onPickOnMap,
  isLoadingLocation = false,
}) => {
  const [form, setForm] = useState<AddressFormData>({ ...EMPTY_ADDRESS_FORM });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialForm) {
        setForm({ ...initialForm });
      } else {
        setForm(initialAddress ? parseAddressString(initialAddress) : { ...EMPTY_ADDRESS_FORM });
      }
      setError(null);
    }
  }, [visible, initialAddress, initialForm]);

  const updateField = (field: keyof AddressFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    const validationError = validateAddressForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    await onSave(formatAddress(form), form);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showLocationActions && (onUseCurrentLocation || onPickOnMap) && (
              <View style={styles.quickActions}>
                {onUseCurrentLocation && (
                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={onUseCurrentLocation}
                    disabled={isLoadingLocation || isSaving}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="locate" size={18} color={Colors.primary} />
                    <Text style={styles.quickActionText}>
                      {isLoadingLocation ? 'Getting location...' : 'Use current location'}
                    </Text>
                  </TouchableOpacity>
                )}
                {onPickOnMap && (
                  <TouchableOpacity style={styles.quickAction} onPress={onPickOnMap} disabled={isSaving} activeOpacity={0.8}>
                    <Ionicons name="map" size={18} color={Colors.primary} />
                    <Text style={styles.quickActionText}>Pick on map</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.sectionLabel}>Address details</Text>

            <Field label="House / Flat / Building *" value={form.houseFlat} onChangeText={(v) => updateField('houseFlat', v)} placeholder="e.g. 12B, Green Apartments" />
            <Field label="Street / Area / Road *" value={form.streetArea} onChangeText={(v) => updateField('streetArea', v)} placeholder="e.g. MG Road, Koramangala" />
            <Field label="Landmark (optional)" value={form.landmark} onChangeText={(v) => updateField('landmark', v)} placeholder="e.g. Near City Mall" />

            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="City *" value={form.city} onChangeText={(v) => updateField('city', v)} placeholder="City" />
              </View>
              <View style={styles.half}>
                <Field label="State *" value={form.state} onChangeText={(v) => updateField('state', v)} placeholder="State" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Pincode *" value={form.pincode} onChangeText={(v) => updateField('pincode', v.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" keyboardType="number-pad" />
              </View>
              <View style={styles.half}>
                <Field label="Country" value={form.country} onChangeText={(v) => updateField('country', v)} placeholder="Country" />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewText}>{formatAddress(form) || 'Your address will appear here'}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving} activeOpacity={0.85}>
              <LinearGradient colors={Colors.gradients.primary as [string, string]} style={styles.saveGradient}>
                {isSaving ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.textPrimary} />
                    <Text style={styles.saveText}>Save Address</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  quickActions: { gap: 10, marginBottom: 20 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  quickActionText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  errorText: { color: Colors.error, fontSize: 14, marginBottom: 12, fontWeight: '500' },
  previewBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  previewText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  saveButton: { borderRadius: 14, overflow: 'hidden' },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
});

export default ManualAddressScreen;
