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
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

interface SpecificationIconsProps {
  onSpecificationPress?: (specification: string, category: string) => void;
  showHeader?: boolean;
  screenType?: 'category';
}

// Get specification categories and their items
const SPECIFICATION_CATEGORIES = {
  materials: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Leather'],
  fits: ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'],
  patterns: ['Solid', 'Striped', 'Printed', 'Checkered'],
  seasons: ['Summer', 'Winter', 'Monsoon', 'All Season']
};

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 32 - 32) / 5; // 5 items per row with gaps

// Get all specifications with their category info
const getAllSpecifications = () => {
  const allSpecs: { value: string, category: string, icon: string }[] = [];

  // Materials
  SPECIFICATION_CATEGORIES.materials.forEach(material => {
    allSpecs.push({
      value: material,
      category: 'materials',
      icon: getIconForSpecification(material, 'materials')
    });
  });

  // Fits
  SPECIFICATION_CATEGORIES.fits.forEach(fit => {
    allSpecs.push({
      value: fit,
      category: 'fits',
      icon: getIconForSpecification(fit, 'fits')
    });
  });

  // Patterns
  SPECIFICATION_CATEGORIES.patterns.forEach(pattern => {
    allSpecs.push({
      value: pattern,
      category: 'patterns',
      icon: getIconForSpecification(pattern, 'patterns')
    });
  });

  // Seasons
  SPECIFICATION_CATEGORIES.seasons.forEach(season => {
    allSpecs.push({
      value: season,
      category: 'seasons',
      icon: getIconForSpecification(season, 'seasons')
    });
  });

  return allSpecs;
};

// Icon mapping for specifications using Flaticon URLs like the original CategoryIcons
const getIconForSpecification = (spec: string, category: string): string => {
  const iconMap: { [key: string]: string } = {
    // Materials
    'Cotton': 'https://cdn-icons-png.flaticon.com/128/3046/3046982.png',
    'Polyester': 'https://cdn-icons-png.flaticon.com/128/1983/1983486.png',
    'Silk': 'https://cdn-icons-png.flaticon.com/128/3046/3046982.png',
    'Wool': 'https://cdn-icons-png.flaticon.com/128/5258/5258076.png',
    'Linen': 'https://cdn-icons-png.flaticon.com/128/3046/3046982.png',
    'Leather': 'https://cdn-icons-png.flaticon.com/128/2806/2806051.png',

    // Fits
    'Slim Fit': 'https://cdn-icons-png.flaticon.com/128/776/776623.png',
    'Regular Fit': 'https://cdn-icons-png.flaticon.com/128/776/776623.png',
    'Loose Fit': 'https://cdn-icons-png.flaticon.com/128/3345/3345385.png',
    'Oversized': 'https://cdn-icons-png.flaticon.com/128/3345/3345385.png',

    // Patterns
    'Solid': 'https://cdn-icons-png.flaticon.com/128/1867/1867565.png',
    'Striped': 'https://cdn-icons-png.flaticon.com/128/1867/1867565.png',
    'Printed': 'https://cdn-icons-png.flaticon.com/128/1867/1867565.png',
    'Checkered': 'https://cdn-icons-png.flaticon.com/128/1867/1867565.png',

    // Seasons
    'Summer': 'https://cdn-icons-png.flaticon.com/128/869/869869.png',
    'Winter': 'https://cdn-icons-png.flaticon.com/128/642/642102.png',
    'Monsoon': 'https://cdn-icons-png.flaticon.com/128/1146/1146869.png',
    'All Season': 'https://cdn-icons-png.flaticon.com/128/869/869869.png',
  };

  return iconMap[spec] || 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png';
};

const SpecificationIcons: React.FC<SpecificationIconsProps> = ({
  onSpecificationPress,
  showHeader = false,
  screenType = 'category'
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const SPECIFICATIONS = getAllSpecifications();

  const handleSpecificationPress = (spec: string, category: string) => {
    console.log(`Specification pressed: ${spec} (${category})`);

    if (screenType === 'category' && onSpecificationPress) {
      onSpecificationPress(spec, category);
    }
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Filter by Specifications</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {SPECIFICATIONS.map((spec, index) => {
          return (
            <TouchableOpacity
              key={`${spec.category}-${spec.value}-${index}`}
              style={[
                styles.specificationItem,
                { width: itemWidth },
                index === SPECIFICATIONS.length - 1 && styles.lastItem
              ]}
              onPress={() => handleSpecificationPress(spec.value, spec.category)}
              activeOpacity={0.6}
              delayPressIn={0}
              delayPressOut={0}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={{ uri: spec.icon }}
                  style={styles.specificationImage}
                  resizeMode="contain"
                  onError={() => console.log(`Failed to load image for ${spec.value}`)}
                  defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/128/13434/13434972.png' }}
                />
              </View>
              <Text style={styles.specificationName} numberOfLines={2}>
                {spec.value}
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
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,

  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  specificationItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 100,
  },
  lastItem: {
    marginRight: 0,
  },
  iconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specificationImage: {
    width: 40,
    height: 40,
  },
  specificationName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 0,
  },
});

export default SpecificationIcons;
