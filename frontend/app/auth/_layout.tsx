import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="Auth" options={{ headerShown: false }} />
      <Stack.Screen name="OtpScreen" options={{ headerShown: false }} />
      <Stack.Screen name="ProfileCompletion" options={{ headerShown: false }} />
      <Stack.Screen name="country" options={{ headerShown: false }} />
    </Stack>
  );
}
