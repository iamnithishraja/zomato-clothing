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
    'Shirts': 'https://cdn-icons-png.flaticon.com/128/3046/3046982.png',
    'T-Shirts': 'https://cdn-icons-png.flaticon.com/128/1867/1867565.png',
    'Tops': 'https://cdn-icons-png.flaticon.com/128/1983/1983486.png',
    'Hoodies': 'https://cdn-icons-png.flaticon.com/128/5258/5258076.png',
    'Sweatshirts': 'https://cdn-icons-png.flaticon.com/128/5980/5980981.png',
    
    // Bottoms
    'Pants': 'https://cdn-icons-png.flaticon.com/128/776/776623.png',
    'Jeans': 'https://cdn-icons-png.flaticon.com/128/2122/2122621.png',
    'Shorts': 'https://cdn-icons-png.flaticon.com/128/3345/3345385.png',
    'Leggings': 'https://cdn-icons-png.flaticon.com/128/10805/10805502.png',
    'Skirts': 'https://cdn-icons-png.flaticon.com/128/2161/2161241.png',
    
    // Outerwear
    'Jackets': 'https://cdn-icons-png.flaticon.com/128/2806/2806051.png',
    'Blazers': 'https://cdn-icons-png.flaticon.com/128/2589/2589797.png',
    'Coats': 'https://cdn-icons-png.flaticon.com/128/2390/2390061.png',
    'Suits': 'https://cdn-icons-png.flaticon.com/128/3074/3074252.png',
    
    // Dresses & Ethnic
    'Dresses': 'https://cdn-icons-png.flaticon.com/128/2682/2682178.png',
    'Sarees': 'https://cdn-icons-png.flaticon.com/128/17981/17981822.png',
    'Kurtas': 'https://cdn-icons-png.flaticon.com/128/9992/9992462.png',
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
              activeOpacity={0.7}
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
    paddingHorizontal: 8,
  },
  lastItem: {
    marginRight: 0,
  },
  iconContainer: {
    width: 64,
    height: 64,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: 40,
    height: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default CategoryIcons;