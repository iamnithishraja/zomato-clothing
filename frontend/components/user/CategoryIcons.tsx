import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { PRODUCT_SUBCATEGORIES } from '@/types/product';

interface CategoryIconsProps {
  onCategoryPress: (subcategory: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 32 - 32) / 5; // 5 items per row with gaps

// Get all subcategories from PRODUCT_SUBCATEGORIES
const getAllSubcategories = () => {
  const allSubcategories: string[] = [];
  Object.values(PRODUCT_SUBCATEGORIES).forEach(subcategories => {
    allSubcategories.push(...subcategories);
  });
  // Remove duplicates and sort
  return [...new Set(allSubcategories)].sort();
};

const SUBCATEGORIES = getAllSubcategories();

// Icon mapping for subcategories with valid Ionicons related to fashion and clothing
const getIconForSubcategory = (subcategory: string): string => {
  const iconMap: { [key: string]: string } = {
    'Shirts': 'shirt-outline',
    'T-Shirts': 'shirt-outline',
    'Pants': 'body-outline',
    'Jeans': 'body-outline',
    'Shorts': 'body-outline',
    'Jackets': 'jacket-outline',
    'Suits': 'business-outline',
    'Dresses': 'woman-outline',
    'Tops': 'shirt-outline',
    'Sarees': 'sparkles-outline',
    'Kurtas': 'shirt-outline',
    'Skirts': 'woman-outline',
    'Leggings': 'body-outline',
    'Hoodies': 'shirt-outline',
    'Sweatshirts': 'shirt-outline',
    'Sweaters': 'shirt-outline',
    'Cardigans': 'shirt-outline',
    'Blazers': 'business-outline',
    'Coats': 'jacket-outline',
    'Underwear': 'body-outline',
    'Sleepwear': 'bed-outline',
    'Activewear': 'barbell-outline',
    'Swimwear': 'water-outline',
    'Ethnic Wear': 'sparkles-outline',
  };
  return iconMap[subcategory] || 'shirt-outline';
};

const CategoryIcons: React.FC<CategoryIconsProps> = ({ onCategoryPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop by Category</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {SUBCATEGORIES.map((subcategory, index) => {
          return (
            <TouchableOpacity
              key={subcategory}
              style={[
                styles.categoryItem,
                { width: itemWidth },
                index === SUBCATEGORIES.length - 1 && styles.lastItem
              ]}
              onPress={() => onCategoryPress(subcategory)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={getIconForSubcategory(subcategory) as any} 
                  size={28} 
                  color={Colors.primary} 
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {subcategory}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  lastItem: {
    marginRight: 0,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
});

export default CategoryIcons;
