import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="drill/[id]" />
      <Stack.Screen name="category/[id]" />
    </Stack>
  );
}
