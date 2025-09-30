import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export interface FilterOptions {
  priceRange: {
    min: number;
    max: number;
  };
  categories: string[];
  sizes: string[];
  brands: string[];
  sortBy: 'price_low' | 'price_high' | 'newest' | 'oldest' | 'rating' | 'popularity';
  inStock: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1000', min: 500, max: 1000 },
  { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
  { label: '₹2000 - ₹5000', min: 2000, max: 5000 },
  { label: 'Above ₹5000', min: 5000, max: 10000 },
];

const SORT_OPTIONS = [
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'popularity', label: 'Most Popular' },
];

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'];

const COMMON_BRANDS = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour', 'New Balance', 'Converse', 'Vans'];

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: 0, max: 10000 },
    categories: [],
    sizes: [],
    brands: [],
    sortBy: 'newest',
    inStock: false,
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handlePriceRangeSelect = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max }
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleBrandToggle = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }));
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleInStockToggle = () => {
    setFilters(prev => ({ ...prev, inStock: !prev.inStock }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      priceRange: { min: 0, max: 10000 },
      categories: [],
      sizes: [],
      brands: [],
      sortBy: 'newest',
      inStock: false,
    };
    setFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.categories.length > 0) count++;
    if (filters.sizes.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.inStock) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderChip = (label: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            {renderFilterSection('Sort By', (
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.key && styles.sortOptionSelected
                    ]}
                    onPress={() => handleSortChange(option.key as FilterOptions['sortBy'])}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      filters.sortBy === option.key && styles.sortOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {filters.sortBy === option.key && (
                      <Ionicons name="checkmark" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Price Range */}
            {renderFilterSection('Price Range', (
              <View style={styles.chipContainer}>
                {PRICE_RANGES.map(range => (
                  renderChip(
                    range.label,
                    filters.priceRange.min === range.min && filters.priceRange.max === range.max,
                    () => handlePriceRangeSelect(range.min, range.max)
                  )
                ))}
              </View>
            ))}

            {/* Categories */}
            {renderFilterSection('Categories', (
              <View style={styles.chipContainer}>
                {['T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Shoes', 'Accessories'].map(category => (
                  renderChip(
                    category,
                    filters.categories.includes(category),
                    () => handleCategoryToggle(category)
                  )
                ))}
              </View>
            ))}

            {/* Sizes */}
            {renderFilterSection('Sizes', (
              <View style={styles.chipContainer}>
                {COMMON_SIZES.map(size => (
                  renderChip(
                    size,
                    filters.sizes.includes(size),
                    () => handleSizeToggle(size)
                  )
                ))}
              </View>
            ))}

            {/* Brands */}
            {renderFilterSection('Brands', (
              <View style={styles.chipContainer}>
                {COMMON_BRANDS.map(brand => (
                  renderChip(
                    brand,
                    filters.brands.includes(brand),
                    () => handleBrandToggle(brand)
                  )
                ))}
              </View>
            ))}

            {/* In Stock */}
            {renderFilterSection('Availability', (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={handleInStockToggle}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, filters.inStock && styles.checkboxSelected]}>
                  {filters.inStock && (
                    <Ionicons name="checkmark" size={16} color={Colors.background} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>In Stock Only</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
              </Text>
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  sortOptionSelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sortOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerInfo: {
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});
