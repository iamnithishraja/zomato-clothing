import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { 
  PRODUCT_MATERIALS, 
  PRODUCT_FITS, 
  PRODUCT_PATTERNS, 
  PRODUCT_SEASONS 
} from '@/types/product';

interface SpecificationFiltersProps {
  onFilterChange: (filters: SpecificationFilters) => void;
  initialFilters?: SpecificationFilters;
}

export interface SpecificationFilters {
  materials: string[];
  fits: string[];
  patterns: string[];
  seasons: string[];
}

const SpecificationFilters: React.FC<SpecificationFiltersProps> = ({
  onFilterChange,
  initialFilters = { materials: [], fits: [], patterns: [], seasons: [] }
}) => {
  const [selectedFilters, setSelectedFilters] = useState<SpecificationFilters>(initialFilters);

  const handleFilterToggle = (category: keyof SpecificationFilters, value: string) => {
    const newFilters = { ...selectedFilters };
    const currentFilters = newFilters[category];
    
    if (currentFilters.includes(value)) {
      newFilters[category] = currentFilters.filter(item => item !== value);
    } else {
      newFilters[category] = [...currentFilters, value];
    }
    
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Combine all filter options into one array with category info and category-like icons
  const allFilterOptions = [
    ...PRODUCT_MATERIALS.map(item => ({ value: item, category: 'materials' as keyof SpecificationFilters, icon: 'layers-outline' })),
    ...PRODUCT_FITS.map(item => ({ value: item, category: 'fits' as keyof SpecificationFilters, icon: 'resize-outline' })),
    ...PRODUCT_PATTERNS.map(item => ({ value: item, category: 'patterns' as keyof SpecificationFilters, icon: 'color-palette-outline' })),
    ...PRODUCT_SEASONS.map(item => ({ value: item, category: 'seasons' as keyof SpecificationFilters, icon: 'sunny-outline' })),
  ];

  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {allFilterOptions.map((option, index) => {
          const isSelected = selectedFilters[option.category].includes(option.value);
          return (
            <TouchableOpacity
              key={`${option.category}-${option.value}-${index}`}
              style={[
                styles.modernChip,
                isSelected && styles.modernChipSelected
              ]}
              onPress={() => handleFilterToggle(option.category, option.value)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={option.icon as any} 
                size={16} 
                color={isSelected ? Colors.background : Colors.textSecondary} 
                style={styles.chipIcon}
              />
              <Text style={[
                styles.modernChipText,
                isSelected && styles.modernChipTextSelected
              ]}>
                {option.value}
              </Text>
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark" size={12} color={Colors.background} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearChip}
            onPress={() => {
              const emptyFilters = { materials: [], fits: [], patterns: [], seasons: [] };
              setSelectedFilters(emptyFilters);
              onFilterChange(emptyFilters);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={16} color={Colors.error} />
            <Text style={styles.clearChipText}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: 0,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 0,
  },
  modernChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 48,
  },
  modernChipSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ scale: 1.05 }],
    borderColor: Colors.primary,
  },
  chipIcon: {
    marginRight: 8,
  },
  modernChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  modernChipTextSelected: {
    color: Colors.background,
    fontWeight: '700',
  },
  selectedIndicator: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 0,
    marginLeft: 10,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 40,
  },
  clearChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
});

export default SpecificationFilters;
