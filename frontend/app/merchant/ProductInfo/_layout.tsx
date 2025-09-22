import { Stack } from 'expo-router';

export default function ProductInfoLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{
          title: 'Product Info',
          headerShown: false, // We're using custom header in the component
        }} 
      />
    </Stack>
  );
}
