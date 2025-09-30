import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { COUNTRIES, Country } from '@/constants/country';

interface CountryDropdownProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  visible: boolean;
  onClose: () => void;
  inputPosition: { x: number; y: number; width: number; height: number };
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({
  selectedCountry,
  onSelect,
  visible,
  onClose,
  inputPosition,
}) => {
  const [searchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES.slice(0, 10); // Show first 10 countries by default
    
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
    ).slice(0, 10);
  }, [searchQuery]);

  const handleSelect = (country: Country) => {
    onSelect(country);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.dropdown,
            {
              top: inputPosition.y + inputPosition.height + 5,
              left: inputPosition.x,
              width: inputPosition.width,
            },
          ]}
        >
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryItem,
                  selectedCountry.code === item.code && styles.selectedCountry,
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialCode}>{item.dialCode}</Text>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 200,
    zIndex: 1000,
  },
  list: {
    maxHeight: 200,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  selectedCountry: {
    backgroundColor: Colors.backgroundSecondary,
  },
  flag: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dialCode: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default CountryDropdown;
