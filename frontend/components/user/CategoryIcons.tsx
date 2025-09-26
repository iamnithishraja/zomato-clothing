import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
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

// Image mapping for subcategories with fashion category images
const getImageForSubcategory = (subcategory: string): string => {
  const imageMap: { [key: string]: string } = {
    // Tops & Shirts
    'Shirts': 'https://cdn-icons-png.flaticon.com/128/17071/17071121.png',
    'T-Shirts': 'https://cdn-icons-png.flaticon.com/128/3746/3746120.png',
    'Tops': 'https://cdn-icons-png.flaticon.com/128/2093/2093836.png',
    'Hoodies': 'https://cdn-icons-png.flaticon.com/128/2390/2390076.png',
    'Sweatshirts': 'https://cdn-icons-png.flaticon.com/128/5257/5257953.png',
    
    // Bottoms
    'Pants': 'https://cdn-icons-png.flaticon.com/128/2806/2806131.png',
    'Jeans': 'https://cdn-icons-png.flaticon.com/128/5258/5258257.png',
    'Shorts': 'https://cdn-icons-png.flaticon.com/128/2236/2236900.png',
    'Leggings': 'https://cdn-icons-png.flaticon.com/128/10805/10805477.png',
    'Skirts': 'https://cdn-icons-png.flaticon.com/128/7443/7443405.png',
    
    // Outerwear
    'Jackets': 'https://cdn-icons-png.flaticon.com/128/5170/5170753.png',
    'Blazers': 'https://cdn-icons-png.flaticon.com/128/2806/2806149.png',
    'Coats': 'https://cdn-icons-png.flaticon.com/128/5756/5756849.png',
    'Suits': 'https://cdn-icons-png.flaticon.com/128/8518/8518506.png',
    
    // Dresses & Ethnic
    'Dresses': 'https://cdn-icons-png.flaticon.com/128/9292/9292065.png',
    'Sarees': 'https://cdn-icons-png.flaticon.com/128/16432/16432966.png',
    'Kurtas': 'https://cdn-icons-png.flaticon.com/128/9989/9989821.png',
  };
  
  return imageMap[subcategory] || 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png';
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
                <Image
                  source={{ uri: getImageForSubcategory(subcategory) }}
                  style={styles.categoryImage}
                  resizeMode="contain"
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
    marginTop: 14,
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
    color: Colors.textPrimary,
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
    padding: 8,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    tintColor: Colors.primary, // This will apply your brand color to the images
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