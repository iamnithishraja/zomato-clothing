import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface ProductData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  price: string;
  sizes: string[];
  quantity: string;
  material: string;
  isFeatured: boolean;
}

interface FormErrors {
  name?: string;
  category?: string;
  subcategory?: string;
  price?: string;
  quantity?: string;
  images?: string;
}

const CreateProduct = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [productData, setProductData] = useState<ProductData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    images: [],
    price: '',
    sizes: [],
    quantity: '',
    material: 'Mixed',
    isFeatured: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [errors, setErrors] = useState<FormErrors>({});

  const categories = ['Men', 'Women', 'Kids'];
  const subcategories = {
    Men: ['Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Shoes', 'Accessories'],
    Women: ['Dresses', 'Tops', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Shoes', 'Accessories'],
    Kids: ['Kids Wear', 'T-Shirts', 'Pants', 'Dresses', 'Shoes', 'Accessories'],
  };
  const materials = ['Cotton', 'Polyester', 'Silk', 'Denim', 'Leather', 'Mixed'];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Validation function
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!productData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (productData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    }

    if (!productData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!productData.subcategory) {
      newErrors.subcategory = 'Please select a subcategory';
    }

    if (!productData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!productData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(productData.quantity)) || Number(productData.quantity) < 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    if (productData.images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }

    return newErrors;
  }, [productData]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const validationErrors = validateForm();
    return Object.keys(validationErrors).length === 0;
  }, [validateForm]);

  const handleInputChange = useCallback((field: keyof ProductData, value: string | string[] | boolean) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const handleCategorySelect = useCallback((category: string) => {
    setProductData(prev => ({
      ...prev,
      category,
      subcategory: '' // Reset subcategory when category changes
    }));

    if (errors.category) {
      setErrors(prev => ({ ...prev, category: undefined }));
    }
  }, [errors.category]);

  const handleSubcategorySelect = useCallback((subcategory: string) => {
    setProductData(prev => ({
      ...prev,
      subcategory
    }));

    if (errors.subcategory) {
      setErrors(prev => ({ ...prev, subcategory: undefined }));
    }
  }, [errors.subcategory]);

  const handleSizeToggle = useCallback((size: string) => {
    setProductData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  }, []);

  const handleImageAdd = useCallback(() => {
    // For now, we'll add a placeholder image URL
    // In a real app, you'd implement image picker functionality
    const placeholderImage = 'https://via.placeholder.com/300x300?text=Product+Image';
    setProductData(prev => ({
      ...prev,
      images: [...prev.images, placeholderImage]
    }));

    if (errors.images) {
      setErrors(prev => ({ ...prev, images: undefined }));
    }
  }, [errors.images]);

  const handleImageRemove = useCallback((index: number) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate form
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      // Animate button press
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const submitData = {
        ...productData,
        price: Number(productData.price),
        quantity: Number(productData.quantity),
      };


      const response = await apiClient.post('/api/v1/product/create', submitData);

      if (response.data.success) {
        Alert.alert(
          'Success!',
          'Product created successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create product. Please try again.');
      }
    } catch (error: any) {
      console.error('Product creation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create product. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, isLoading, fadeAnim, productData, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Product</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Form Content */}
          <View style={styles.formContent}>
            {/* Product Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <View style={[
                styles.inputWrapper,
                errors.name && styles.inputWrapperError
              ]}>
                <Ionicons 
                  name="shirt-outline" 
                  size={20} 
                  color={productData.name ? Colors.buttonPrimary : Colors.textMuted} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={productData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter product name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Product Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={productData.description ? Colors.buttonPrimary : Colors.textMuted} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={productData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Describe your product"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={[
                styles.selectionContainer,
                errors.category && styles.selectionContainerError
              ]}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.selectionOption,
                      productData.category === category && styles.selectionOptionSelected,
                      errors.category && styles.selectionOptionError
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text style={[
                      styles.selectionOptionText,
                      productData.category === category && styles.selectionOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
            </View>

            {/* Subcategory Selection */}
            {productData.category && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Subcategory *</Text>
                <View style={[
                  styles.selectionContainer,
                  errors.subcategory && styles.selectionContainerError
                ]}>
                  {subcategories[productData.category as keyof typeof subcategories]?.map((subcategory) => (
                    <TouchableOpacity
                      key={subcategory}
                      style={[
                        styles.selectionOption,
                        productData.subcategory === subcategory && styles.selectionOptionSelected,
                        errors.subcategory && styles.selectionOptionError
                      ]}
                      onPress={() => handleSubcategorySelect(subcategory)}
                    >
                      <Text style={[
                        styles.selectionOptionText,
                        productData.subcategory === subcategory && styles.selectionOptionTextSelected
                      ]}>
                        {subcategory}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.subcategory && (
                  <Text style={styles.errorText}>{errors.subcategory}</Text>
                )}
              </View>
            )}

            {/* Price and Quantity Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.price && styles.inputWrapperError
                ]}>
                  <Ionicons 
                    name="cash-outline" 
                    size={20} 
                    color={productData.price ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={productData.price}
                    onChangeText={(value) => handleInputChange('price', value)}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                {errors.price && (
                  <Text style={styles.errorText}>{errors.price}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.quantity && styles.inputWrapperError
                ]}>
                  <Ionicons 
                    name="layers-outline" 
                    size={20} 
                    color={productData.quantity ? Colors.buttonPrimary : Colors.textMuted} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={productData.quantity}
                    onChangeText={(value) => handleInputChange('quantity', value)}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                {errors.quantity && (
                  <Text style={styles.errorText}>{errors.quantity}</Text>
                )}
              </View>
            </View>

            {/* Material Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Material</Text>
              <View style={styles.selectionContainer}>
                {materials.map((material) => (
                  <TouchableOpacity
                    key={material}
                    style={[
                      styles.selectionOption,
                      productData.material === material && styles.selectionOptionSelected
                    ]}
                    onPress={() => handleInputChange('material', material)}
                  >
                    <Text style={[
                      styles.selectionOptionText,
                      productData.material === material && styles.selectionOptionTextSelected
                    ]}>
                      {material}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sizes Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Available Sizes</Text>
              <View style={styles.selectionContainer}>
                {availableSizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.selectionOption,
                      productData.sizes.includes(size) && styles.selectionOptionSelected
                    ]}
                    onPress={() => handleSizeToggle(size)}
                  >
                    <Text style={[
                      styles.selectionOptionText,
                      productData.sizes.includes(size) && styles.selectionOptionTextSelected
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Images */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Product Images *</Text>
              <View style={styles.imagesContainer}>
                {productData.images.map((image, index) => (
                  <View key={index} style={styles.imageItem}>
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image" size={24} color={Colors.textSecondary} />
                    </View>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleImageRemove(index)}
                    >
                      <Ionicons name="close" size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleImageAdd}
                >
                  <Ionicons name="add" size={24} color={Colors.textPrimary} />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              </View>
              {errors.images && (
                <Text style={styles.errorText}>{errors.images}</Text>
              )}
            </View>

            {/* Featured Toggle */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.featuredToggle}
                onPress={() => handleInputChange('isFeatured', !productData.isFeatured)}
              >
                <View style={[
                  styles.toggleSwitch,
                  productData.isFeatured && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    productData.isFeatured && styles.toggleThumbActive
                  ]} />
                </View>
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>Featured Product</Text>
                  <Text style={styles.toggleDescription}>
                    Make this product stand out in search results
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!isFormValid || isLoading) && styles.submitButtonDisabled
                ]} 
                onPress={handleSubmit}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isFormValid ? Colors.gradients.primary as [string, string] : [Colors.border, Colors.border] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons 
                      name={isLoading ? "hourglass-outline" : "checkmark-circle-outline"} 
                      size={24} 
                      color={isFormValid ? Colors.textPrimary : Colors.textMuted}
                      style={styles.buttonIcon}
                    />
                    <Text style={[
                      styles.submitButtonText,
                      !isFormValid && styles.submitButtonTextDisabled
                    ]}>
                      {isLoading ? "Creating Product..." : "Create Product"}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  formContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    shadowColor: Colors.error,
    shadowOpacity: 0.3,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionContainerError: {
    // Add error styling if needed
  },
  selectionOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  selectionOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  selectionOptionError: {
    borderColor: Colors.error,
  },
  selectionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  selectionOptionTextSelected: {
    color: Colors.textPrimary,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    position: 'relative',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.textPrimary,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleContent: {
    marginLeft: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  submitButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1.0,
  },
  submitButtonTextDisabled: {
    color: Colors.textPrimary,
    opacity: 0.7,
  },
});

export default CreateProduct;
