import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
// Import removed as it's not used in this component

interface FilterOption {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

interface FilterButtonsProps {
  selectedFilter: string | null;
  onFilterSelect: (filterId: string) => void;
  filterType?: 'product' | 'search';
  screenType?: 'home' | 'category'; // Screen type to determine which filters to show
}

const PRODUCT_FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'men', name: 'Men', icon: 'man-outline' },
  { id: 'women', name: 'Women', icon: 'woman-outline' },
  { id: 'kids', name: 'Kids', icon: 'people-outline' },
  { id: 'unisex', name: 'Unisex', icon: 'people-outline' },
  { id: 'new', name: 'New Arrivals', icon: 'sparkles-outline' },
  { id: 'bestseller', name: 'Best Sellers', icon: 'star-outline' },
  { id: 'instock', name: 'In Stock', icon: 'checkmark-circle-outline' },
];

// Limited filter options for category screen - only gender-based filters
const CATEGORY_FILTER_OPTIONS: FilterOption[] = [
  { id: 'men', name: 'Men', icon: 'man-outline' },
  { id: 'women', name: 'Women', icon: 'woman-outline' },
  { id: 'kids', name: 'Kids', icon: 'people-outline' },
  { id: 'unisex', name: 'Unisex', icon: 'people-outline' },
  { id: 'new', name: 'New Arrivals', icon: 'sparkles-outline' },
];

const SEARCH_FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', name: 'All', icon: 'search-outline' },
  { id: 'products', name: 'Products', icon: 'cube-outline' },
  { id: 'stores', name: 'Stores', icon: 'storefront-outline' },
  { id: 'favorites', name: 'Favorites', icon: 'heart-outline' },
  { id: 'recent', name: 'Recent', icon: 'time-outline' },
  { id: 'new', name: 'New Arrivals', icon: 'sparkles-outline' },
  { id: 'bestseller', name: 'Best Sellers', icon: 'star-outline' },
];

const FilterButtons: React.FC<FilterButtonsProps> = ({
  selectedFilter,
  onFilterSelect,
  filterType = 'product',
  screenType = 'home',
}) => {
  let filterOptions: FilterOption[];
  
  if (filterType === 'search') {
    filterOptions = SEARCH_FILTER_OPTIONS;
  } else if (screenType === 'category') {
    filterOptions = CATEGORY_FILTER_OPTIONS;
  } else {
    filterOptions = PRODUCT_FILTER_OPTIONS;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterButton,
              selectedFilter === option.id && styles.selectedFilterButton
            ]}
            onPress={() => onFilterSelect(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              {option.icon && (
                <Ionicons
                  name={option.icon as any}
                  size={16}
                  color={selectedFilter === option.id ? Colors.background : Colors.textPrimary}
                  style={styles.buttonIcon}
                />
              )}
              <Text
                style={[
                  styles.buttonText,
                  selectedFilter === option.id && styles.selectedButtonText
                ]}
              >
                {option.name}
              </Text>
              {option.count && (
                <View style={[
                  styles.countBadge,
                  selectedFilter === option.id && styles.selectedCountBadge
                ]}>
                  <Text style={[
                    styles.countText,
                    selectedFilter === option.id && styles.selectedCountText
                  ]}>
                    {option.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingRight: 16,
  },
  filterButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonIcon: {
    marginRight: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectedButtonText: {
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedCountBadge: {
    backgroundColor: Colors.background,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectedCountText: {
    color: Colors.textPrimary,
  },
});

export default FilterButtons;
