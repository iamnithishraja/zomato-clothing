import React, { useMemo, useState, useRef } from 'react';
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
import type { ImageSourcePropType } from 'react-native';

interface CategoryIconsProps {
  onCategoryPress?: (subcategory: string) => void; // Made optional since we'll use navigation
  showHeader?: boolean; // Whether to show the header
  screenType?: 'home' | 'category'; // Screen type to determine behavior
  selectedSubcategory?: string; // For category screen: highlight selected
  headerTitle?: string; // Custom header title
  subcategories?: string[]; // Optional whitelist of subcategories to display
  showSeeAll?: boolean; // Control See All button visibility
  noMargin?: boolean; // Remove top margin when true
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

// Local category art for the common items; fall back to remote icons for everything else
const LOCAL_CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  Jeans: { uri: 'https://ik.imagekit.io/fhi2xkjg1/locals/jeans.png' },
  Shirts: { uri: 'https://ik.imagekit.io/fhi2xkjg1/locals/shirt.png' },
  Shorts: { uri: 'https://ik.imagekit.io/fhi2xkjg1/locals/shorts.png' },
  'T-Shirts': { uri: 'https://ik.imagekit.io/fhi2xkjg1/locals/tshirt.png' },
  Pants: { uri: 'https://ik.imagekit.io/fhi2xkjg1/locals/pants.png' },
  
};

const remote = (uri: string): ImageSourcePropType => ({ uri });

// Image mapping for subcategories with fashion category images
export const getImageForSubcategory = (subcategory: string): ImageSourcePropType => {
  const imageMap: { [key: string]: ImageSourcePropType } = {
    // Tops & Shirts
    Shirts: LOCAL_CATEGORY_IMAGES.Shirts,
    'T-Shirts': LOCAL_CATEGORY_IMAGES['T-Shirts'],
    Tops: remote('https://cdn-icons-png.flaticon.com/128/1983/1983486.png'),
    Hoodies: remote('https://cdn-icons-png.flaticon.com/128/5258/5258076.png'),
    Sweatshirts: remote('https://cdn-icons-png.flaticon.com/128/5980/5980981.png'),
    Sweaters: remote('https://cdn-icons-png.flaticon.com/128/5258/5258076.png'),
    Cardigans: remote('https://cdn-icons-png.flaticon.com/128/5258/5258076.png'),
    
    // Bottoms
    Pants: LOCAL_CATEGORY_IMAGES.Pants,
    Jeans: LOCAL_CATEGORY_IMAGES.Jeans,
    Shorts: LOCAL_CATEGORY_IMAGES.Shorts,
    Leggings: remote('https://cdn-icons-png.flaticon.com/128/10805/10805502.png'),
    Skirts: remote('https://cdn-icons-png.flaticon.com/128/2161/2161241.png'),
    
    // Outerwear
    Jackets: remote('https://cdn-icons-png.flaticon.com/128/2806/2806051.png'),
    Blazers: remote('https://cdn-icons-png.flaticon.com/128/2589/2589797.png'),
    Coats: remote('https://cdn-icons-png.flaticon.com/128/2390/2390061.png'),
    Suits: remote('https://cdn-icons-png.flaticon.com/128/3074/3074252.png'),
    
    // Dresses & Ethnic
    Dresses: remote('https://cdn-icons-png.flaticon.com/128/2682/2682178.png'),
    Sarees: remote('https://cdn-icons-png.flaticon.com/128/17981/17981822.png'),
    Kurtas: remote('https://cdn-icons-png.flaticon.com/128/9992/9992462.png'),
    
    // Additional categories
    Underwear: remote('https://cdn-icons-png.flaticon.com/128/13434/13434972.png'),
    Sleepwear: remote('https://cdn-icons-png.flaticon.com/128/13434/13434972.png'),
    Activewear: remote('https://cdn-icons-png.flaticon.com/128/13434/13434972.png'),
    Swimwear: remote('https://cdn-icons-png.flaticon.com/128/13434/13434972.png'),
    'Ethnic Wear': remote('https://cdn-icons-png.flaticon.com/128/9992/9992462.png'),
  };
  
  return imageMap[subcategory] || remote('https://cdn-icons-png.flaticon.com/128/13434/13434972.png');
};

const CategoryIcons: React.FC<CategoryIconsProps> = ({ 
  onCategoryPress, 
  showHeader = true, 
  screenType = 'home',
  selectedSubcategory,
  headerTitle,
  subcategories,
  showSeeAll = true,
  noMargin = false,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const navigatingRef = useRef(false);
  
  // Get subcategories based on user gender
  const DEFAULT_SUBCATEGORIES = getAllSubcategories(user?.gender);
  const SUBCATEGORIES = useMemo(() => {
    if (subcategories && subcategories.length > 0) {
      // Keep order as provided, but ensure unique
      return Array.from(new Set(subcategories));
    }
    return DEFAULT_SUBCATEGORIES;
  }, [subcategories, DEFAULT_SUBCATEGORIES]);

  const handleCategoryPress = (subcategory: string) => {
    console.log(`Category button pressed: ${subcategory}`);
    
    if (screenType === 'category' && onCategoryPress) {
      // On category screen, use the callback to update the same screen
      onCategoryPress(subcategory);
    } else {
      // On home screen, navigate to category screen
      try {
        if (navigatingRef.current) {
          return;
        }
        navigatingRef.current = true;
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
        // Release lock shortly after to avoid rapid double navigations
        setTimeout(() => {
          navigatingRef.current = false;
        }, 800);
      } catch (error) {
        console.error(`Error navigating to category ${subcategory}:`, error);
        navigatingRef.current = false;
      }
    }
  };
  const modalItems: GridItem[] = useMemo(() => (
    SUBCATEGORIES.map((sc) => ({ key: sc, label: sc, iconSource: getImageForSubcategory(sc) }))
  ), [SUBCATEGORIES]);

  const handleSelectFromModal = (item: GridItem) => {
    // Close modal first to prevent state updates during navigation transition
    setModalVisible(false);
    // Navigate on next tick to ensure modal state commits before routing
    setTimeout(() => handleCategoryPress(item.label), 0);
  };

  return (
    <View style={[styles.container, noMargin && { marginTop: 0 }]}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>{headerTitle || 'Shop by Category'}</Text>
          {showSeeAll && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(true)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
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
                  source={getImageForSubcategory(subcategory)}
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
    marginTop: 14,
    zIndex: 10, // Ensure category icons are above other elements
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
    width: 68,
    height: 68,
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