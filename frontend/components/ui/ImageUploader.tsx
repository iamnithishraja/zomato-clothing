import React, { useState, useCallback, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator,
  Platform
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "@/constants/colors";
import apiClient from "../../api/client";
  
type Props = {
  label: string;
  multiple?: boolean;
  existingUrls?: string[];
  onUploaded: (urls: string[]) => void;
  fullWidth?: boolean;
  squareSize?: number;
  aspectRatio?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
  fileNamePrefix?: string;
  maxImages?: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

type Item = { 
  key: string; 
  uri: string; 
  uploading?: boolean; 
  remote?: boolean;
  error?: boolean;
  deleting?: boolean;
};

// const { width: screenWidth } = Dimensions.get('window');

const ImageUploader = ({ 
  label, 
  multiple = false, 
  existingUrls = [], 
  onUploaded, 
  fullWidth = false, 
  squareSize = 100, 
  aspectRatio = 16 / 9, 
  mediaTypes = ImagePicker.MediaTypeOptions.Images, 
  fileNamePrefix,
  maxImages = 10,
  required = false,
  error,
  disabled = false
}: Props) => {
  const [items, setItems] = useState<Item[]>(
    existingUrls.map((u, i) => ({ key: `${i}-${u}`, uri: u, uploading: false, remote: true }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUrlsUpdate, setPendingUrlsUpdate] = useState<string[] | null>(null);

  // Handle pending URLs update
  useEffect(() => {
    if (pendingUrlsUpdate !== null) {
      onUploaded(pendingUrlsUpdate);
      setPendingUrlsUpdate(null);
    }
  }, [pendingUrlsUpdate, onUploaded]);

  // Sync items when existingUrls prop changes (e.g., when editing existing entity)
  useEffect(() => {
    setItems((prev) => {
      const prevRemote = prev.filter(it => it.remote && !it.uploading && !it.error).map(it => it.uri);
      const isSame = prevRemote.length === existingUrls.length && prevRemote.every((u, idx) => u === existingUrls[idx]);
      if (isSame) return prev;
      return existingUrls.map((u, i) => ({ key: `${i}-${u}`, uri: u, uploading: false, remote: true }));
    });
  }, [existingUrls]);

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

  // Upload single image
  const uploadImage = useCallback(async (asset: ImagePicker.ImagePickerAsset, optimisticKey: string) => {
    try {
      let fileName = deriveFileName(asset.fileName ?? undefined, asset.uri ?? undefined, asset.mimeType ?? undefined);
      if (fileNamePrefix && !fileName.toLowerCase().includes(fileNamePrefix.toLowerCase())) {
        fileName = `${fileNamePrefix}${fileName}`;
      }
      const fileType = asset.mimeType || guessMimeTypeFromName(fileName);
      
      console.log('Uploading image:', { fileType, fileName, assetUri: asset.uri });
      
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

      // Update item with successful upload
      setItems((prev) => {
        const newItems = prev.map((it) => 
          it.key === optimisticKey 
            ? { key: optimisticKey, uri: publicUrl, uploading: false, remote: true, error: false }
            : it
        );
        
        return newItems;
      });
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Mark item as error
      setItems((prev) => prev.map((it) => 
        it.key === optimisticKey 
          ? { ...it, uploading: false, error: true }
          : it
      ));
      
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid image format. Please try a different image.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to upload images.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = 'Upload failed. Please try a different image or check your connection.';
      }
      
      Alert.alert('Upload Error', errorMessage);
    }
  }, [fileNamePrefix]);

  const handlePick = useCallback(async () => {
    if (disabled || isUploading) return;
    
    if (items.length >= maxImages) {
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
        mediaTypes,
        allowsMultipleSelection: multiple,
        quality: 0.8,
        selectionLimit: multiple ? Math.min(maxImages - items.length, 10) : 1,
        base64: false,
      });

      if (result.canceled) return;

      const assets = multiple ? result.assets : [result.assets[0]];

      // Optimistically add placeholders
      const optimisticItems: Item[] = assets.map((a) => ({ 
        key: `${a.assetId || a.uri}-${Date.now()}-${Math.random()}`, 
        uri: a.uri, 
        uploading: true,
        error: false
      }));
      
      setItems((prev) => (multiple ? [...prev, ...optimisticItems] : [...optimisticItems]));
      setIsUploading(true);

      // Upload all images sequentially to avoid race conditions
      for (let i = 0; i < assets.length; i++) {
        await uploadImage(assets[i], optimisticItems[i].key);
      }

      // Update parent with all remote URLs after all uploads are complete
      setItems((prev) => {
        const remoteUrls = prev.filter(item => item.remote && !item.error).map(item => item.uri);
        setPendingUrlsUpdate(remoteUrls);
        return prev;
      });

    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, items.length, maxImages, requestPermissions, uploadImage, multiple, mediaTypes]);

  // Delete file from R2 storage
  const deleteFileFromR2 = useCallback(async (fileUrl: string) => {
    try {
      console.log('Deleting file from R2:', fileUrl);
      
      const response = await apiClient.delete('/api/v1/upload/file', {
        data: { fileUrl }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete file');
      }

      console.log('File deleted successfully from R2');
      return true;
    } catch (error: any) {
      console.error('Error deleting file from R2:', error);
      
      let errorMessage = 'Failed to delete file from storage.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid request.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to delete this file.';
        } else if (status === 404) {
          errorMessage = 'File not found.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Delete Error', errorMessage);
      return false;
    }
  }, []);

  const handleRemove = useCallback(async (idx: number) => {
    if (disabled || isUploading) return;
    
    const item = items[idx];
    if (!item) return;

    try {
      // Mark item as deleting immediately for visual feedback
      setItems((prev) => prev.map((it, i) => 
        i === idx ? { ...it, deleting: true } : it
      ));

      // If it's a remote file, delete from R2 first
      if (item.remote && !item.error) {
        const deleted = await deleteFileFromR2(item.uri);
        if (!deleted) {
          // Reset deleting state if deletion failed
          setItems((prev) => prev.map((it, i) => 
            i === idx ? { ...it, deleting: false } : it
          ));
          return; // Don't remove from UI if deletion failed
        }
      }

      // Remove from UI after successful deletion
      setItems((prev) => {
        const newItems = prev.filter((_, i) => i !== idx);
        const remoteUrls = newItems.filter(item => item.remote && !item.error).map(item => item.uri);
        setPendingUrlsUpdate(remoteUrls);
        return newItems;
      });
    } catch (error) {
      console.error('Error removing item:', error);
      // Reset deleting state on error
      setItems((prev) => prev.map((it, i) => 
        i === idx ? { ...it, deleting: false } : it
      ));
      Alert.alert('Error', 'Failed to remove image. Please try again.');
    }
  }, [disabled, isUploading, items, deleteFileFromR2]);

  const handleRetry = useCallback((idx: number) => {
    const item = items[idx];
    if (item && item.error) {
      // Remove the error item and let user pick again
      setItems((prev) => {
        const newItems = prev.filter((_, i) => i !== idx);
        const remoteUrls = newItems.filter(item => item.remote && !item.error).map(item => item.uri);
        setPendingUrlsUpdate(remoteUrls);
        return newItems;
      });
    }
  }, [items]);

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <Text style={styles.countText}>
          {items.filter(item => !item.error).length} / {maxImages}
        </Text>
      </View>

      {/* Images Grid */}
      <View style={[fullWidth ? styles.list : styles.grid]}>
        {items.map((item, i) => (
          <View key={item.key} style={styles.imageContainer}>
            <View 
              style={[
                fullWidth ? styles.fullWrapper : styles.thumbWrapper, 
                fullWidth && { aspectRatio },
                item.uploading && styles.uploadingWrapper,
                item.error && styles.errorWrapper,
                item.deleting && styles.deletingWrapper
              ]}
            > 
              {isVideo(item.uri) ? (
                <VideoPreview uri={item.uri} style={fullWidth ? styles.fullImage : styles.thumb} />
              ) : (
                <Image source={{ uri: item.uri }} style={fullWidth ? styles.fullImage : styles.thumb} />
              )}
              
              {/* Uploading Overlay */}
              {item.uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                  <Text style={styles.uploadText}>Uploading...</Text>
                </View>
              )}
              
              {/* Deleting Overlay */}
              {item.deleting && (
                <View style={styles.deletingOverlay}>
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                  <Text style={styles.deletingText}>Deleting...</Text>
                </View>
              )}
              
              {/* Error Overlay */}
              {item.error && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="alert-circle" size={24} color={Colors.error} />
                  <Text style={styles.errorText}>Failed</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => handleRetry(i)}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Remove Button - Outside the image container */}
            {!item.uploading && !item.deleting && (
              <TouchableOpacity 
                style={styles.removeBtn} 
                onPress={() => handleRemove(i)}
                disabled={disabled || isUploading || item.deleting}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {/* Add Button */}
        {(multiple || items.length === 0) && items.length < maxImages && (
          <TouchableOpacity 
            style={[
              fullWidth ? styles.fullAddWrapper : styles.addWrapper, 
              fullWidth && { aspectRatio },
              (disabled || isUploading) && styles.addButtonDisabled
            ]} 
            onPress={handlePick}
            disabled={disabled || isUploading}
          >
            <View style={[fullWidth ? styles.fullAddCard : styles.addCard]}>
              {isUploading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="add" size={24} color={Colors.primary} />
                  <Text style={styles.addText}>
                    {items.length === 0 ? 'Add Images' : 'Add More'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      {/* Upload Progress */}
      {isUploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.progressText}>Uploading images...</Text>
        </View>
      )}
    </View>
  );
};

const deriveFileName = (fileName?: string, uri?: string, mimeType?: string) => {
  // If original name provided (usually includes extension), use it
  if (fileName) return fileName;

  // Try to infer from URI (often contains extension)
  if (uri) {
    const parts = uri.split("/");
    const last = parts[parts.length - 1] || "";
    if (last && last.includes(".")) return last;
  }

  // Fallback: build a sensible name using mimeType to ensure correct extension
  const timestamp = Date.now();
  const ext = extensionFromMimeType(mimeType) || "jpg";
  return `upload_${timestamp}.${ext}`;
};

const guessMimeTypeFromName = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "tiff":
    case "tif":
      return "image/tiff";
    case "svg":
      return "image/svg+xml";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    case "webm":
      return "video/webm";
    case "avi":
      return "video/avi";
    default:
      return "image/jpeg"; // Default to JPEG for unknown extensions
  }
};

const extensionFromMimeType = (mime?: string) => {
  if (!mime) return undefined;
  switch (mime.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/bmp":
      return "bmp";
    case "image/tiff":
      return "tiff";
    case "image/svg+xml":
      return "svg";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/x-m4v":
      return "m4v";
    case "video/webm":
      return "webm";
    case "video/avi":
      return "avi";
    default:
      return "jpg"; // Default to jpg for unknown types
  }
};

// const uriToBlob = async (uri: string): Promise<Blob> => {
//   const res = await fetch(uri);
//   const blob = await res.blob();
//   return blob;
// };

const isVideo = (uri: string) => {
  const lower = uri.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.m4v') || lower.endsWith('.webm');
};

const VideoPreview = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  return <VideoView style={style} player={player} contentFit="cover" />;
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  required: {
    color: Colors.error,
  },
  countText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  list: {
    gap: 12,
  },
  imageContainer: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
  },
  thumbWrapper: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadingWrapper: {
    opacity: 0.8,
  },
  errorWrapper: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  deletingWrapper: {
    opacity: 0.6,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  uploadText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  deletingText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  retryButton: {
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    borderRadius: 12,
    backgroundColor: Colors.error,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 10,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  addWrapper: { 
    width: 100, 
    height: 100, 
    borderRadius: 16, 
    overflow: "hidden" 
  },
  addCard: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: 16, 
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.backgroundSecondary,
  },
  fullAddWrapper: { 
    width: "100%", 
    borderRadius: 16, 
    overflow: "hidden" 
  },
  fullAddCard: { 
    alignItems: "center", 
    justifyContent: "center", 
    height: 120, 
    borderRadius: 16, 
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.backgroundSecondary,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default ImageUploader;