import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  InteractionManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { PRODUCT_SUBCATEGORIES } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';
import CategoryGridModal, { GridItem } from '@/components/ui/CategoryGridModal';

interface CategoryIconsProps {
  onCategoryPress?: (subcategory: string) => void; // Made optional since we'll use navigation
  showHeader?: boolean; // Whether to show the "Shop by Category" header
  screenType?: 'home' | 'category'; // Screen type to determine behavior
  selectedSubcategory?: string; // For category screen: highlight selected
}

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 32 - 32) / 5; // 5 items per row with gaps

// Get all subcategories from PRODUCT_SUBCATEGORIES with gender-based ordering
const getAllSubcategories = (userGender?: 'Male' | 'Female' | 'Other') => {
  const allSubcategories: string[] = [];
  Object.values(PRODUCT_SUBCATEGORIES).forEach(subcategories => {
    allSubcategories.push(...subcategories);
  });
  // Remove duplicates
  const uniqueSubcategories = [...new Set(allSubcategories)];
  
  // If user has gender preference, prioritize gender-based categories first
  if (userGender && userGender !== 'Other') {
    // Map user gender to product category
    const genderToCategory: { [key: string]: keyof typeof PRODUCT_SUBCATEGORIES } = {
      'Male': 'Men',
      'Female': 'Women'
    };
    
    const categoryKey = genderToCategory[userGender];
    if (categoryKey) {
      const genderCategories = PRODUCT_SUBCATEGORIES[categoryKey] || [];
      const otherCategories = uniqueSubcategories.filter(cat => !(genderCategories as readonly string[]).includes(cat));
      
      // Return gender categories first, then others in alphabetical order
      return [...genderCategories, ...otherCategories.sort()];
    }
  }
  
  // If no gender preference, return all in alphabetical order
  return uniqueSubcategories.sort();
};

// Image mapping for subcategories with fashion category images
export const getImageForSubcategory = (subcategory: string): string => {
  const imageMap: { [key: string]: string } = {
    // Tops & Shirts
    'Shirts': 'https://cdn-icons-png.flaticon.com/128/3046/3046982.png',
    'T-Shirts': 'https://cdn-icons-png.flaticon.com/128/1867/1867565.png',
    'Tops': 'https://cdn-icons-png.flaticon.com/128/1983/1983486.png',
    'Hoodies': 'https://cdn-icons-png.flaticon.com/128/5258/5258076.png',
    'Sweatshirts': 'https://cdn-icons-png.flaticon.com/128/5980/5980981.png',
    'Sweaters': 'https://cdn-icons-png.flaticon.com/128/5258/5258076.png',
    'Cardigans': 'https://cdn-icons-png.flaticon.com/128/5258/5258076.png',
    
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
    
    // Additional categories
    'Underwear': 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png',
    'Sleepwear': 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png',
    'Activewear': 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png',
    'Swimwear': 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png',
    'Ethnic Wear': 'https://cdn-icons-png.flaticon.com/128/9992/9992462.png',
  };
  
  return imageMap[subcategory] || 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png';
};

const CategoryIcons: React.FC<CategoryIconsProps> = ({ 
  onCategoryPress, 
  showHeader = true, 
  screenType = 'home',
  selectedSubcategory,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Get subcategories based on user gender
  const SUBCATEGORIES = getAllSubcategories(user?.gender);

  const handleCategoryPress = (subcategory: string) => {
    console.log(`Category button pressed: ${subcategory}`);
    
    if (screenType === 'category' && onCategoryPress) {
      // On category screen, use the callback to update the same screen
      onCategoryPress(subcategory);
    } else {
      // On home screen, navigate to category screen
      try {
        let categorySlug = subcategory.toLowerCase().replace(/\s+/g, '-');
        
        // Handle special cases
        if (subcategory === 'T-Shirts') {
          categorySlug = 't-shirts';
        }
        
        console.log(`Navigating to category: ${categorySlug} (from subcategory: ${subcategory})`);
        // Defer navigation until after current interactions to avoid state updates during insertion
        InteractionManager.runAfterInteractions(() => {
          router.push(`/category/${categorySlug}` as any);
        });
        
        // Call the optional callback if provided (but don't wait for it)
        if (onCategoryPress) {
          onCategoryPress(subcategory);
        }
      } catch (error) {
        console.error(`Error navigating to category ${subcategory}:`, error);
      }
    }
  };
  const modalItems: GridItem[] = useMemo(() => (
    SUBCATEGORIES.map((sc) => ({ key: sc, label: sc, iconUri: getImageForSubcategory(sc) }))
  ), [SUBCATEGORIES]);

  const handleSelectFromModal = (item: GridItem) => {
    // Close modal first to prevent state updates during navigation transition
    setModalVisible(false);
    // Navigate on next tick to ensure modal state commits before routing
    setTimeout(() => handleCategoryPress(item.label), 0);
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Shop by Category</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(true)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {SUBCATEGORIES.map((subcategory, index) => {
          const isSelected = screenType === 'category' && selectedSubcategory === subcategory;
          return (
            <TouchableOpacity
              key={subcategory}
              style={[
                styles.categoryItem,
                { width: itemWidth },
                index === SUBCATEGORIES.length - 1 && styles.lastItem
              ]}
              onPress={() => handleCategoryPress(subcategory)}
              activeOpacity={0.6}
              delayPressIn={0}
              delayPressOut={0}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={{ uri: getImageForSubcategory(subcategory) }}
                  style={styles.categoryImage}
                  resizeMode="contain"
                  onError={() => console.log(`Failed to load image for ${subcategory}`)}
                  defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png' }}
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {subcategory}
              </Text>
              {isSelected && <View style={styles.selectedUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <CategoryGridModal
        visible={modalVisible}
        title="Categories"
        items={modalItems}
        onSelect={handleSelectFromModal}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10, // Ensure category icons are above other elements
    elevation: 10, // For Android
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
    paddingVertical: 8, // Add vertical padding for better touch area
    minHeight: 100, // Ensure minimum touch area
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
  selectedUnderline: {
    height: 3,
    width: 28,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    alignSelf: 'center',
    marginTop: 6,
  },
});

export default CategoryIcons;