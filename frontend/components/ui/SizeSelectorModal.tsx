import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { Product } from '@/types/product';
import { Colors } from '@/constants/colors';

interface SizeSelectorModalProps {
  visible: boolean;
  product: Product | null;
  multiple?: boolean;
  initialSelected?: string[];
  onConfirm: (selected: string[]) => void;
  onClose: () => void;
  title?: string;
}

const SizeSelectorModal: React.FC<SizeSelectorModalProps> = ({
  visible,
  product,
  multiple = true,
  initialSelected = [],
  onConfirm,
  onClose,
  title = 'Select Sizes',
}) => {
  const sizes = useMemo(() => product?.sizes ?? [], [product]);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    // Reset selection when modal opens or product/initialSelected changes
    if (visible) {
      setSelected(initialSelected);
    }
  }, [visible, product, initialSelected.join('|')]);

  const toggle = (size: string) => {
    if (!multiple) {
      setSelected([size]);
      return;
    }
    setSelected(prev => (prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]));
  };

  const handleConfirm = () => {
    if (selected.length === 0 && sizes.length === 1) {
      onConfirm([sizes[0]]);
      return;
    }
    onConfirm(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sizesWrap}>
              {sizes.map((sz) => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeChip, selected.includes(sz) && styles.sizeChipSelected]}
                  onPress={() => toggle(sz)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeLabel, selected.includes(sz) && styles.sizeLabelSelected]}>{sz}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sizesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  sizeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sizeLabelSelected: {
    color: '#000',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default SizeSelectorModal;
