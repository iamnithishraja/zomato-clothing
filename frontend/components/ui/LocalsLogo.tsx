import React from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LOCALS_LOGO } from '@/constants/branding';

type LocalsLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

const LocalsLogo: React.FC<LocalsLogoProps> = ({ size = 120, style, imageStyle }) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
        },
        style,
      ]}
    >
      <Image
        source={LOCALS_LOGO}
        style={[{ width: size, height: size }, imageStyle]}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={0}
        accessibilityLabel="Locals logo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default LocalsLogo;
