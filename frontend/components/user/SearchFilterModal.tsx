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
import { 
  SearchFilters, 
  DEFAULT_SEARCH_FILTERS,
  PRODUCT_CATEGORIES,
  PRODUCT_SUBCATEGORIES,
  getUniqueSubcategories,
  PRODUCT_SIZES,
  PRODUCT_MATERIALS,
  PRODUCT_FITS,
  PRODUCT_PATTERNS,
  PRODUCT_SEASONS,
  SORT_OPTIONS,
  PRICE_RANGES
} from '@/types/filters';

interface SearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export default function SearchFilterModal({ visible, onClose, onApply, initialFilters }: SearchFilterModalProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handlePriceRangeSelect = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      productFilters: {
        ...prev.productFilters,
        priceRange: { min, max }
      }
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      productFilters: {
        ...prev.productFilters,
        category: prev.productFilters.category?.includes(category)
          ? prev.productFilters.category.filter(c => c !== category)
          : [...(prev.productFilters.category || []), category]
      }
    }));
  };

  const handleSubcategoryToggle = (subcategory: string) => {
    setFilters(prev => ({
      ...prev,
      productFilters: {
        ...prev.productFilters,
        subcategory: prev.productFilters.subcategory?.includes(subcategory)
          ? prev.productFilters.subcategory.filter(s => s !== subcategory)
          : [...(prev.productFilters.subcategory || []), subcategory]
      }
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFilters(prev => ({
      ...prev,
      productFilters: {
        ...prev.productFilters,
        sizes: prev.productFilters.sizes?.includes(size)
          ? prev.productFilters.sizes.filter(s => s !== size)
          : [...(prev.productFilters.sizes || []), size]
      }
    }));
  };

  const handleMaterialToggle = (material: string) => {
    setFilters(prev => ({
      ...prev,
      productFilters: {
        ...prev.productFilters,
        materials: prev.productFilters.materials?.includes(material)
          ? prev.productFilters.materials.filter(m => m !== material)
          : [...(prev.productFilters.materials || []), material]
      }
    }));
  };

  const handleSortChange = (sortBy: SearchFilters['productFilters']['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      productFilters: { ...prev.productFilters, sortBy }
    }));
  };

  const handleInStockToggle = () => {
    setFilters(prev => ({
      ...prev,
      productFilters: { ...prev.productFilters, inStock: !prev.productFilters.inStock }
    }));
  };

  const handleNewArrivalToggle = () => {
    setFilters(prev => ({
      ...prev,
      productFilters: { ...prev.productFilters, isNewArrival: !prev.productFilters.isNewArrival }
    }));
  };

  const handleBestSellerToggle = () => {
    setFilters(prev => ({
      ...prev,
      productFilters: { ...prev.productFilters, isBestSeller: !prev.productFilters.isBestSeller }
    }));
  };

  const handleFavoritesOnlyToggle = () => {
    setFilters(prev => ({
      ...prev,
      userFilters: { ...prev.userFilters, favoritesOnly: !prev.userFilters.favoritesOnly }
    }));
  };

  const handleRecentlyViewedToggle = () => {
    setFilters(prev => ({
      ...prev,
      userFilters: { ...prev.userFilters, recentlyViewed: !prev.userFilters.recentlyViewed }
    }));
  };

  const handleStoreRatingChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      storeFilters: {
        ...prev.storeFilters,
        storeRating: { min, max }
      }
    }));
  };

  const handleSearchInToggle = (searchType: 'products' | 'stores' | 'both') => {
    setFilters(prev => ({
      ...prev,
      searchFilters: {
        ...prev.searchFilters,
        searchIn: prev.searchFilters.searchIn.includes(searchType)
          ? prev.searchFilters.searchIn.filter(s => s !== searchType)
          : [...prev.searchFilters.searchIn, searchType]
      }
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_SEARCH_FILTERS);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    const { productFilters, storeFilters, userFilters, searchFilters } = filters;
    
    // Product filters
    if (productFilters.priceRange.min > 0 || productFilters.priceRange.max < 10000) count++;
    if (productFilters.category && productFilters.category.length > 0) count++;
    if (productFilters.subcategory && productFilters.subcategory.length > 0) count++;
    if (productFilters.sizes && productFilters.sizes.length > 0) count++;
    if (productFilters.materials && productFilters.materials.length > 0) count++;
    if (productFilters.inStock) count++;
    if (productFilters.isNewArrival) count++;
    if (productFilters.isBestSeller) count++;
    if (productFilters.sortBy !== 'newest') count++;
    
    // Store filters
    if (storeFilters.storeRating && (storeFilters.storeRating.min > 0 || storeFilters.storeRating.max < 5)) count++;
    if (storeFilters.storeName) count++;
    if (storeFilters.storeLocation) count++;
    
    // User filters
    if (userFilters.favoritesOnly) count++;
    if (userFilters.recentlyViewed) count++;
    
    // Search filters
    if (searchFilters.searchIn.length !== 1 || !searchFilters.searchIn.includes('products')) count++;
    if (searchFilters.includeInactive) count++;
    
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

  const renderCheckbox = (label: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color={Colors.background} />
        )}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
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
            <Text style={styles.headerTitle}>Search Filters</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search Scope */}
            {renderFilterSection('Search In', (
              <View style={styles.chipContainer}>
                {renderChip(
                  'Products',
                  filters.searchFilters.searchIn.includes('products'),
                  () => handleSearchInToggle('products')
                )}
                {renderChip(
                  'Stores',
                  filters.searchFilters.searchIn.includes('stores'),
                  () => handleSearchInToggle('stores')
                )}
                {renderChip(
                  'Both',
                  filters.searchFilters.searchIn.includes('both'),
                  () => handleSearchInToggle('both')
                )}
              </View>
            ))}

            {/* Sort By */}
            {renderFilterSection('Sort By', (
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      filters.productFilters.sortBy === option.key && styles.sortOptionSelected
                    ]}
                    onPress={() => handleSortChange(option.key as SearchFilters['productFilters']['sortBy'])}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      filters.productFilters.sortBy === option.key && styles.sortOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {filters.productFilters.sortBy === option.key && (
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
                    filters.productFilters.priceRange.min === range.min && filters.productFilters.priceRange.max === range.max,
                    () => handlePriceRangeSelect(range.min, range.max)
                  )
                ))}
              </View>
            ))}

            {/* Categories */}
            {renderFilterSection('Categories', (
              <View style={styles.chipContainer}>
                {PRODUCT_CATEGORIES.map(category => (
                  renderChip(
                    category,
                    filters.productFilters.category?.includes(category) || false,
                    () => handleCategoryToggle(category)
                  )
                ))}
              </View>
            ))}

            {/* Subcategories */}
            {renderFilterSection('Subcategories', (
              <View style={styles.chipContainer}>
                {getUniqueSubcategories().map(subcategory => (
                  renderChip(
                    subcategory,
                    filters.productFilters.subcategory?.includes(subcategory) || false,
                    () => handleSubcategoryToggle(subcategory)
                  )
                ))}
              </View>
            ))}

            {/* Sizes */}
            {renderFilterSection('Sizes', (
              <View style={styles.chipContainer}>
                {PRODUCT_SIZES.map(size => (
                  renderChip(
                    size,
                    filters.productFilters.sizes?.includes(size) || false,
                    () => handleSizeToggle(size)
                  )
                ))}
              </View>
            ))}

            {/* Materials */}
            {renderFilterSection('Materials', (
              <View style={styles.chipContainer}>
                {PRODUCT_MATERIALS.map(material => (
                  renderChip(
                    material,
                    filters.productFilters.materials?.includes(material) || false,
                    () => handleMaterialToggle(material)
                  )
                ))}
              </View>
            ))}

            {/* Store Rating */}
            {renderFilterSection('Store Rating', (
              <View style={styles.chipContainer}>
                {[
                  { label: 'Any Rating', min: 0, max: 5 },
                  { label: '4+ Stars', min: 4, max: 5 },
                  { label: '3+ Stars', min: 3, max: 5 },
                  { label: '2+ Stars', min: 2, max: 5 },
                ].map(range => (
                  renderChip(
                    range.label,
                    filters.storeFilters.storeRating?.min === range.min && filters.storeFilters.storeRating?.max === range.max,
                    () => handleStoreRatingChange(range.min, range.max)
                  )
                ))}
              </View>
            ))}

            {/* Product Status */}
            {renderFilterSection('Product Status', (
              <View style={styles.checkboxContainer}>
                {renderCheckbox('In Stock Only', filters.productFilters.inStock || false, handleInStockToggle)}
                {renderCheckbox('New Arrivals', filters.productFilters.isNewArrival || false, handleNewArrivalToggle)}
                {renderCheckbox('Best Sellers', filters.productFilters.isBestSeller || false, handleBestSellerToggle)}
              </View>
            ))}

            {/* User Preferences */}
            {renderFilterSection('Your Preferences', (
              <View style={styles.checkboxContainer}>
                {renderCheckbox('Favorites Only', filters.userFilters.favoritesOnly || false, handleFavoritesOnlyToggle)}
                {renderCheckbox('Recently Viewed', filters.userFilters.recentlyViewed || false, handleRecentlyViewedToggle)}
              </View>
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
    gap: 12,
  },
  checkboxRow: {
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
