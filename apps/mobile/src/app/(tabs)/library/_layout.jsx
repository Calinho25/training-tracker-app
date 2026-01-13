import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-drill" />
      <Stack.Screen name="create-category" />
    </Stack>
  );
}
