import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export type GridItem = {
  key: string;
  label: string;
  iconUri?: string; // use existing mapping when available
  iconName?: string; // Ionicons name fallback
};

interface CategoryGridModalProps {
  visible: boolean;
  title: string;
  items: GridItem[];
  onSelect: (item: GridItem) => void;
  onClose: () => void;
}

const { height, width } = Dimensions.get('window');

const CategoryGridModal: React.FC<CategoryGridModalProps> = ({ visible, title, items, onSelect, onClose }) => {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      {/* Transparent backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <FlatList
          data={items}
          keyExtractor={(it) => it.key}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tile} onPress={() => onSelect(item)} activeOpacity={0.7}>
              {item.iconUri ? (
                <Image source={{ uri: item.iconUri }} style={styles.tileIcon} resizeMode="contain" />
              ) : item.iconName ? (
                <View style={[styles.tileIcon, styles.iconCircle]}>
                  <Ionicons name={item.iconName as any} size={22} color={Colors.textPrimary} />
                </View>
              ) : (
                <View style={[styles.tileIcon, styles.iconFallback]} />
              )}
              <Text style={styles.tileLabel} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

const SHEET_HEIGHT = Math.floor(height * 0.7);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent', // no dim
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  tile: {
    width: (width - 16 - 16) / 3,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tileIcon: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  iconCircle: {
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallback: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  tileLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default CategoryGridModal;
