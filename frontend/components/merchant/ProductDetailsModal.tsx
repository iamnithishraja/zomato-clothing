import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Removed unused screenHeight since we're using full screen now

interface ProductSpecifications {
  material?: string;
  fit?: string;
  pattern?: string;
}

interface ProductDetails {
  subcategory?: string;
  specifications?: ProductSpecifications;
  season?: string;
  isActive: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (details: ProductDetails) => void;
  initialData?: ProductDetails;
  category?: string;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  category = 'Men'
}) => {
  const [details, setDetails] = useState<ProductDetails>({
    subcategory: '',
    specifications: {
      material: '',
      fit: '',
      pattern: ''
    },
    season: '',
    isActive: true,
    isNewArrival: false,
    isBestSeller: false,
    ...initialData
  });

  // Removed unused fadeAnim

  // Category-based subcategories
  const getSubcategories = useCallback((cat: string) => {
    const subcategoryMap: { [key: string]: string[] } = {
      'Men': ['Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Jackets', 'Suits', 'Hoodies', 'Sweatshirts', 'Sweaters', 'Cardigans', 'Blazers', 'Coats', 'Underwear', 'Activewear', 'Ethnic Wear'],
      'Women': ['Dresses', 'Tops', 'Sarees', 'Kurtas', 'Skirts', 'Leggings', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Jackets', 'Hoodies', 'Sweatshirts', 'Sweaters', 'Cardigans', 'Blazers', 'Coats', 'Underwear', 'Sleepwear', 'Activewear', 'Swimwear', 'Ethnic Wear'],
      'Kids': ['Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Dresses', 'Tops', 'Skirts', 'Leggings', 'Hoodies', 'Sweatshirts', 'Sweaters', 'Cardigans', 'Jackets', 'Coats', 'Activewear', 'Swimwear', 'Ethnic Wear'],
      'Unisex': ['Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Jackets', 'Hoodies', 'Sweatshirts', 'Sweaters', 'Cardigans', 'Blazers', 'Coats', 'Activewear', 'Ethnic Wear']
    };
    return subcategoryMap[cat] || [];
  }, []);

  const subcategories = useMemo(() => getSubcategories(category), [category, getSubcategories]);

  const materials = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim', 'Leather', 'Synthetic'];
  const fits = ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'];
  const patterns = ['Solid', 'Striped', 'Printed', 'Checkered', 'Floral'];
  const seasons = ['Summer', 'Winter', 'Monsoon', 'All Season'];

  const handleSelect = useCallback((field: string, value: string) => {
    if (field.startsWith('specifications.')) {
      const specField = field.split('.')[1];
      setDetails(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value
        }
      }));
    } else {
      setDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleToggle = useCallback((field: keyof ProductDetails) => {
    setDetails(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(details);
    onClose();
  }, [details, onSave, onClose]);

  const handleClose = useCallback(() => {
    // Check if user has made any changes
    const hasChanges = !!(
      details.subcategory ||
      details.specifications?.material ||
      details.specifications?.fit ||
      details.specifications?.pattern ||
      details.season ||
      !details.isActive ||
      details.isNewArrival ||
      details.isBestSeller
    );

    if (hasChanges) {
      // User has made changes, just close (data will be saved to parent state)
      onClose();
    } else {
      // No changes made, safe to close
      onClose();
    }
  }, [details, onClose]);

  const renderSelectionGrid = (items: string[], selectedValue: string, onSelect: (value: string) => void, label: string) => (
    <View style={styles.selectionContainer}>
      <Text style={styles.selectionLabel}>{label}</Text>
      <View style={styles.selectionGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.selectionOption,
              selectedValue === item && styles.selectionOptionSelected
            ]}
            onPress={() => onSelect(item)}
          >
            <Text style={[
              styles.selectionOptionText,
              selectedValue === item && styles.selectionOptionTextSelected
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderToggleSwitch = (label: string, value: boolean, onToggle: () => void, icon: string) => (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleLabelContainer}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}
        onPress={onToggle}
      >
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={Colors.primary} 
          translucent={false}
        />
        
        {/* Header */}
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Details</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.helpText}>
                Add detailed information about your product to help customers make better decisions. All fields are optional.
              </Text>
            </View>
            {/* Subcategory */}
            {renderSelectionGrid(
              subcategories,
              details.subcategory || '',
              (value) => handleSelect('subcategory', value),
              'Subcategory'
            )}

            {/* Material */}
            {renderSelectionGrid(
              materials,
              details.specifications?.material || '',
              (value) => handleSelect('specifications.material', value),
              'Material'
            )}

            {/* Fit */}
            {renderSelectionGrid(
              fits,
              details.specifications?.fit || '',
              (value) => handleSelect('specifications.fit', value),
              'Fit'
            )}

            {/* Pattern */}
            {renderSelectionGrid(
              patterns,
              details.specifications?.pattern || '',
              (value) => handleSelect('specifications.pattern', value),
              'Pattern'
            )}

            {/* Season */}
            {renderSelectionGrid(
              seasons,
              details.season || '',
              (value) => handleSelect('season', value),
              'Season'
            )}

            {/* Toggle Switches */}
            <View style={styles.togglesContainer}>
              <Text style={styles.togglesTitle}>Product Status</Text>
              
              {renderToggleSwitch(
                'Active Product',
                details.isActive,
                () => handleToggle('isActive'),
                'checkmark-circle'
              )}

              {renderToggleSwitch(
                'New Arrival',
                details.isNewArrival,
                () => handleToggle('isNewArrival'),
                'sparkles'
              )}

              {renderToggleSwitch(
                'Best Seller',
                details.isBestSeller,
                () => handleToggle('isBestSeller'),
                'star'
              )}
             </View>
           </ScrollView>
       </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  selectionContainer: {
    marginBottom: 24,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  selectionOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  selectionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  selectionOptionTextSelected: {
    color: Colors.textPrimary,
  },
  togglesContainer: {
    marginTop: 8,
  },
  togglesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});

export default ProductDetailsModal;
