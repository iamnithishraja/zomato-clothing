import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { COUNTRIES, Country } from '@/constants/country';

interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  initialQuery?: string;
}

const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);

  const filteredCountries = useMemo(() => {
    const searchQuery = query.trim().toLowerCase();
    if (!searchQuery) return COUNTRIES;
    
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery) ||
        country.dialCode.toLowerCase().includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery)
    );
  }, [query]);

  const handleSelect = (country: Country) => {
    onSelect(country);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.overlay} onPress={onClose} />
        
        <View style={styles.modal}>
          <LinearGradient
            colors={Colors.gradients.background as [string, string]}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <View style={styles.grabber} />
              <Text style={styles.title}>Choose your country</Text>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search country"
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.countryItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.dialCode}>{item.dialCode}</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </LinearGradient>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: 12,
    opacity: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  flag: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    marginLeft: 12,
  },
  dialCode: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 40,
  },
});

export default CountryPickerModal;

