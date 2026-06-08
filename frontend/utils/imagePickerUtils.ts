import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedImageAsset = ImagePicker.ImagePickerAsset;

const IMAGE_MEDIA_TYPES: ImagePicker.MediaType[] = ['images'];

export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow photo library access to upload images.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

export async function pickImagesFromLibrary(options?: {
  multiple?: boolean;
  limit?: number;
}): Promise<PickedImageAsset[] | null> {
  const allowed = await requestMediaLibraryPermission();
  if (!allowed) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: IMAGE_MEDIA_TYPES,
      allowsMultipleSelection: options?.multiple ?? false,
      quality: 0.85,
      selectionLimit: options?.limit ?? 1,
      exif: false,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    return result.assets;
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert(
      'Unable to Open Gallery',
      'Image picker failed to open. If this keeps happening, rebuild the app after installing native dependencies (expo-file-system).',
      [{ text: 'OK' }]
    );
    return null;
  }
}

export async function pickSingleImageFromLibrary(): Promise<PickedImageAsset | null> {
  const assets = await pickImagesFromLibrary({ multiple: false, limit: 1 });
  return assets?.[0] ?? null;
}
