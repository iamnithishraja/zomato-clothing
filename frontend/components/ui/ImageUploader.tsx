import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import apiClient from '../../api/client';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  title?: string;
  subtitle?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  style?: any;
}


// Utility function to map file extension to MIME type
const getMimeType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'm4v': 'video/x-m4v',
    'webm': 'video/webm',
  };
  return mimeTypes[extension || ''] || 'image/jpeg';
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  title = "Images",
  subtitle,
  required = false,
  error,
  disabled = false,
  style,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images!',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  }, []);

  // Test authentication
  const testAuth = useCallback(async () => {
    try {
      console.log('Testing authentication...');
      const response = await apiClient.get('/api/v1/user/profile');
      console.log('Auth test response:', response.data);
      return true;
    } catch (error: any) {
      console.error('Auth test failed:', error.response?.data || error.message);
      return false;
    }
  }, []);

  // Upload single image
  const uploadImage = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    setUploadingIndex(images.length);

    try {
      // Test authentication first
      const isAuthValid = await testAuth();
      if (!isAuthValid) {
        Alert.alert('Authentication Error', 'Please log in again to upload images.');
        return;
      }

      // Prepare file data
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      const fileType = getMimeType(fileName);
      
      console.log('Uploading image:', { fileType, fileName, assetUri: asset.uri, originalType: asset.type });
      
      // Get upload URL from backend
      const uploadResponse = await apiClient.post('/api/v1/upload/url', {
        fileType,
        fileName,
        role: 'Merchant',
        isPermanent: true,
      });

      console.log('Upload URL response:', uploadResponse.data);

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = uploadResponse.data;

      // Upload file to R2
      console.log('Uploading to R2:', uploadUrl);
      
      // Convert asset to blob for upload
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': fileType,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Add to images array
      onImagesChange([...images, publicUrl]);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid request. Please check your image format.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to upload images.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        console.error('Server error response:', { status, data });
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your internet connection.';
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        console.error('Other error:', error.message);
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadingIndex(null);
    }
  }, [images, onImagesChange, testAuth]);

  // Upload multiple images
  const uploadMultipleImages = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
    setIsUploading(true);

    try {
      // Test authentication first
      const isAuthValid = await testAuth();
      if (!isAuthValid) {
        Alert.alert('Authentication Error', 'Please log in again to upload images.');
        return;
      }

      // Prepare files for batch upload
      const files = assets.map(asset => {
        const fileName = asset.fileName || `image_${Date.now()}_${Math.random()}.jpg`;
        return {
          fileType: getMimeType(fileName),
          fileName,
        };
      });

      // Get upload URLs from backend
      const uploadResponse = await apiClient.post('/api/v1/upload/urls', {
        files,
        role: 'Merchant',
      });

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Failed to get upload URLs');
      }

      const { results } = uploadResponse.data;
      const newImageUrls: string[] = [];

      // Upload each file
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.error) {
          console.error(`Upload failed for ${result.fileName}:`, result.error);
          continue;
        }

        setUploadingIndex(images.length + newImageUrls.length);

        try {
          // Convert asset to blob for upload
          const response = await fetch(assets[i].uri);
          const blob = await response.blob();
          
          const uploadResult = await fetch(result.uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: {
              'Content-Type': result.fileType,
            },
          });

          if (uploadResult.ok) {
            newImageUrls.push(result.publicUrl);
          } else {
            console.error(`Failed to upload ${result.fileName}`);
          }
        } catch (error) {
          console.error(`Error uploading ${result.fileName}:`, error);
        }
      }

      // Add all successful uploads to images array
      if (newImageUrls.length > 0) {
        onImagesChange([...images, ...newImageUrls]);
      }

      if (newImageUrls.length < assets.length) {
        Alert.alert(
          'Partial Upload',
          `Successfully uploaded ${newImageUrls.length} of ${assets.length} images.`
        );
      }

    } catch (error: any) {
      console.error('Error uploading images:', error);
      
      let errorMessage = 'Failed to upload images. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid request. Please check your image formats.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to upload images.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        console.error('Server error response:', { status, data });
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
        console.error('Network error:', error.request);
      } else {
        console.error('Other error:', error.message);
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadingIndex(null);
    }
  }, [images, onImagesChange, testAuth]);

  // Pick single image
  const pickImage = useCallback(async () => {
    if (disabled || isUploading) return;
    
    if (images.length >= maxImages) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only upload up to ${maxImages} images.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [images.length, maxImages, disabled, isUploading, requestPermissions, uploadImage]);

  // Pick multiple images
  const pickMultipleImages = useCallback(async () => {
    if (disabled || isUploading) return;
    
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only upload up to ${maxImages} images.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        await uploadMultipleImages(result.assets);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  }, [images.length, maxImages, disabled, isUploading, requestPermissions, uploadMultipleImages]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    if (disabled || isUploading) return;
    
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange, disabled, isUploading]);

  // Show image picker options
  const showImagePickerOptions = useCallback(() => {
    if (disabled || isUploading) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only upload up to ${maxImages} images.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Select Images',
      'Choose how you want to add images',
      [
        { text: 'Single Image', onPress: pickImage },
        { text: 'Multiple Images', onPress: pickMultipleImages },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [disabled, isUploading, maxImages, images.length, pickImage, pickMultipleImages]);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {title}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Images Container */}
      <View style={styles.imagesContainer}>
        {/* Existing Images Row */}
        {images.length > 0 && (
          <View style={styles.imagesRow}>
            {images.map((imageUrl, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                {uploadingIndex === index && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.textPrimary} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                  disabled={disabled || isUploading}
                >
                  <Ionicons name="close" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <TouchableOpacity
            style={[
              styles.addButton,
              (disabled || isUploading) && styles.addButtonDisabled
            ]}
            onPress={showImagePickerOptions}
            disabled={disabled || isUploading}
          >
            {isUploading && uploadingIndex === null ? (
              <ActivityIndicator size="small" color={Colors.textMuted} />
            ) : (
              <>
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={disabled ? Colors.textMuted : Colors.textPrimary} 
                />
                <Text style={[
                  styles.addButtonText,
                  disabled && styles.addButtonTextDisabled
                ]}>
                  {images.length === 0 ? 'Add Images' : 'Add More'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Upload Progress */}
      {isUploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.progressText}>Uploading images...</Text>
        </View>
      )}

      {/* Image Count and Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.countText}>
          {images.length} / {maxImages} images
        </Text>
        {images.length > 0 && (
          <Text style={styles.statusText}>
            {images.length === 1 ? '1 image uploaded' : `${images.length} images uploaded`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  required: {
    color: Colors.error,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  imagesContainer: {
    gap: 12,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  imageItem: {
    position: 'relative',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    width: 90,
    height: 90,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 4,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  addButtonTextDisabled: {
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statusText: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 2,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default ImageUploader;
