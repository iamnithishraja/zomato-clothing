import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search fashion, brands, styles...",
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSearch = () => {
    onSearch(searchQuery.trim());
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    // Real-time search with debouncing effect
    if (text.length > 2) {
      onSearch(text.trim());
    } else if (text.length === 0) {
      onSearch('');
    }
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.searchInputContainer,
          {
            borderColor,
            shadowOpacity,
          }
        ]}
      >
        <View style={styles.searchIconContainer}>
          <Ionicons 
            name="search-outline" 
            size={22} 
            color={isFocused ? Colors.primary : Colors.textSecondary} 
          />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={Colors.primary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              onSearch('');
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.clearIconContainer}>
              <Ionicons name="close" size={16} color={Colors.background} />
            </View>
          </TouchableOpacity>
        )}
        {searchQuery.length > 2 && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: -5,
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1.5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 52,
  },
  searchIconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 8,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  clearButton: {
    marginRight: 8,
  },
  clearIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default SearchBar;
